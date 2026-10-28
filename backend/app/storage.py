"""Small SQLite persistence layer; no external database service is required."""

import json
import os
import sqlite3
import threading
from pathlib import Path
from typing import Any

from app.models import MissionSettings, TelemetrySample


DEFAULT_SETTINGS = MissionSettings().model_dump()


class Store:
    def __init__(self, path: str | None = None):
        configured = path or os.getenv("ORBITGUARD_DB_PATH")
        self.path = Path(configured) if configured else Path(__file__).resolve().parents[1] / "data" / "orbitguard.sqlite3"
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.RLock()
        self._initialize()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path, timeout=10)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA journal_mode=WAL")
        connection.execute("PRAGMA foreign_keys=ON")
        return connection

    def _initialize(self) -> None:
        with self._lock, self._connect() as db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS telemetry (
                    timestamp REAL PRIMARY KEY,
                    event_id TEXT,
                    payload TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS telemetry_event_id_idx ON telemetry(event_id);
                CREATE TABLE IF NOT EXISTS diagnoses (
                    event_id TEXT PRIMARY KEY,
                    timestamp REAL NOT NULL,
                    classification TEXT NOT NULL,
                    payload TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS diagnoses_timestamp_idx ON diagnoses(timestamp DESC);
                CREATE TABLE IF NOT EXISTS settings (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    payload TEXT NOT NULL
                );
            """)
            db.execute(
                "INSERT OR IGNORE INTO settings (id, payload) VALUES (1, ?)",
                (json.dumps(DEFAULT_SETTINGS),),
            )

    @staticmethod
    def _sample_payload(sample: TelemetrySample) -> str:
        return json.dumps(sample.model_dump(), separators=(",", ":"))

    def save_samples(self, samples: list[TelemetrySample]) -> int:
        with self._lock, self._connect() as db:
            db.executemany(
                "INSERT OR REPLACE INTO telemetry(timestamp, event_id, payload) VALUES (?, ?, ?)",
                [(s.timestamp, s.event_id, self._sample_payload(s)) for s in samples],
            )
        return len(samples)

    def latest_sample(self) -> dict[str, Any] | None:
        with self._lock, self._connect() as db:
            row = db.execute("SELECT payload FROM telemetry ORDER BY timestamp DESC LIMIT 1").fetchone()
        return json.loads(row["payload"]) if row else None

    def list_samples(self, limit: int = 200, before: float | None = None) -> list[dict[str, Any]]:
        with self._lock, self._connect() as db:
            if before is None:
                rows = db.execute(
                    "SELECT payload FROM telemetry ORDER BY timestamp DESC LIMIT ?", (limit,)
                ).fetchall()
            else:
                rows = db.execute(
                    "SELECT payload FROM telemetry WHERE timestamp < ? ORDER BY timestamp DESC LIMIT ?",
                    (before, limit),
                ).fetchall()
        return [json.loads(row["payload"]) for row in reversed(rows)]

    def save_diagnosis(self, event_id: str, timestamp: float, payload: dict[str, Any]) -> None:
        with self._lock, self._connect() as db:
            db.execute(
                "INSERT INTO diagnoses(event_id, timestamp, classification, payload) VALUES (?, ?, ?, ?) "
                "ON CONFLICT(event_id) DO UPDATE SET timestamp=excluded.timestamp, "
                "classification=excluded.classification, payload=excluded.payload",
                (event_id, timestamp, payload["diagnosis"]["classification"], json.dumps(payload)),
            )

    def get_diagnosis(self, event_id: str) -> dict[str, Any] | None:
        with self._lock, self._connect() as db:
            row = db.execute("SELECT payload FROM diagnoses WHERE event_id = ?", (event_id,)).fetchone()
        return json.loads(row["payload"]) if row else None

    def list_diagnoses(self, limit: int = 100) -> list[dict[str, Any]]:
        with self._lock, self._connect() as db:
            rows = db.execute("SELECT payload FROM diagnoses ORDER BY timestamp DESC LIMIT ?", (limit,)).fetchall()
        return [json.loads(row["payload"]) for row in rows]

    def clear_diagnoses(self) -> int:
        with self._lock, self._connect() as db:
            cursor = db.execute("DELETE FROM diagnoses")
        return cursor.rowcount

    def get_settings(self) -> dict[str, Any]:
        with self._lock, self._connect() as db:
            row = db.execute("SELECT payload FROM settings WHERE id = 1").fetchone()
        return json.loads(row["payload"])

    def save_settings(self, settings: MissionSettings) -> dict[str, Any]:
        payload = settings.model_dump()
        with self._lock, self._connect() as db:
            db.execute("UPDATE settings SET payload = ? WHERE id = 1", (json.dumps(payload),))
        return payload

    def counts(self) -> dict[str, int]:
        with self._lock, self._connect() as db:
            samples = db.execute("SELECT COUNT(*) AS n FROM telemetry").fetchone()["n"]
            diagnoses = db.execute("SELECT COUNT(*) AS n FROM diagnoses").fetchone()["n"]
        return {"telemetry_samples": samples, "diagnoses": diagnoses}


store = Store()
