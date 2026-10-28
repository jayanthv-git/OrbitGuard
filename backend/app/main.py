"""ORBITGUARD API: telemetry ingestion, diagnosis, archive, settings and stream."""

import os
from typing import Any

from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.detection.correlator import evaluate_correlation
from app.diagnosis.classifier import classify_event
from app.models import DiagnosisRequest, MissionSettings, TelemetryBatch
from app.storage import store


class StreamHub:
    def __init__(self) -> None:
        self.clients: set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.clients.add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self.clients.discard(websocket)

    async def publish(self, payload: dict[str, Any]) -> None:
        stale: list[WebSocket] = []
        for client in tuple(self.clients):
            try:
                await client.send_json(payload)
            except Exception:
                stale.append(client)
        for client in stale:
            self.disconnect(client)


hub = StreamHub()
allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "ORBITGUARD_CORS_ORIGINS",
        "http://localhost:4173,http://127.0.0.1:4173,http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

app = FastAPI(
    title="ORBITGUARD Impact Intelligence API",
    description="Local telemetry ingest, persistent event archive, and physics-informed diagnosis for the OrbitGuard prototype.",
    version="1.1.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.get("/health", tags=["service"])
def health() -> dict[str, Any]:
    counts = store.counts()
    return {
        "status": "ONLINE",
        "service": "orbitguard-api",
        "version": app.version,
        "satellite_id": "OG-SAT-01",
        "environment": "SIMULATION",
        **counts,
    }


@app.get("/api/mission/state", tags=["mission"])
def mission_state() -> dict[str, Any]:
    return {
        "satellite_id": "OG-SAT-01",
        "environment": "SIMULATION",
        "latest_telemetry": store.latest_sample(),
        "counts": store.counts(),
        "settings": store.get_settings(),
    }


@app.post("/api/telemetry/batch", tags=["telemetry"])
async def ingest_telemetry(batch: TelemetryBatch) -> dict[str, Any]:
    samples = batch.samples
    accepted = store.save_samples(samples)
    latest = samples[-1].model_dump()
    await hub.publish({
        "type": "telemetry.batch",
        "satellite_id": "OG-SAT-01",
        "environment": "SIMULATION",
        "samples": [sample.model_dump() for sample in samples],
    })
    return {"accepted": accepted, "latest": latest, "counts": store.counts()}


@app.get("/api/telemetry/latest", tags=["telemetry"])
def latest_telemetry() -> dict[str, Any]:
    sample = store.latest_sample()
    return {"sample": sample}


@app.get("/api/telemetry", tags=["telemetry"])
def telemetry_history(
    limit: int = Query(default=200, ge=1, le=500),
    before: float | None = Query(default=None, gt=0),
) -> dict[str, Any]:
    samples = store.list_samples(limit=limit, before=before)
    return {"samples": samples, "count": len(samples), "limit": limit}


@app.post("/api/diagnose", tags=["diagnosis"])
def diagnose(request: DiagnosisRequest) -> dict[str, Any]:
    samples = [sample.model_dump() for sample in request.samples]
    event_samples = samples[min(request.event_start_index, len(samples) - 1):]
    settings = store.get_settings()
    correlation = evaluate_correlation(
        event_samples,
        correlation_window_ms=request.correlation_window_ms,
        thresholds={
            "imu": settings["imu_threshold_z"],
            "solar": settings["solar_threshold_z"],
            "mag": settings["mag_threshold_z"],
            "temp": settings["temp_threshold_z"],
        },
    )
    diagnosis = classify_event(correlation, event_id=request.event_id)
    result = {
        "event_id": request.event_id,
        "satellite_id": "OG-SAT-01",
        "environment": "SIMULATION",
        "timestamp": event_samples[0]["timestamp"],
        "sample_count": len(samples),
        "analyzed_sample_count": len(event_samples),
        "correlation": correlation,
        "diagnosis": diagnosis,
    }
    store.save_samples(request.samples)
    store.save_diagnosis(request.event_id, float(samples[0]["timestamp"]), result)
    return result


@app.get("/api/events", tags=["events"])
def events(limit: int = Query(default=100, ge=1, le=500)) -> dict[str, Any]:
    results = store.list_diagnoses(limit=limit)
    return {"events": results, "count": len(results), "limit": limit}


@app.get("/api/events/{event_id}", tags=["events"])
def event_detail(event_id: str) -> dict[str, Any]:
    result = store.get_diagnosis(event_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Diagnosis not found")
    return result


@app.delete("/api/events", tags=["events"])
def clear_events() -> dict[str, int]:
    return {"deleted": store.clear_diagnoses()}


@app.get("/api/settings", tags=["settings"])
def get_settings() -> dict[str, Any]:
    return store.get_settings()


@app.put("/api/settings", tags=["settings"])
def update_settings(settings: MissionSettings) -> dict[str, Any]:
    return store.save_settings(settings)


@app.websocket("/api/stream")
async def telemetry_stream(websocket: WebSocket) -> None:
    await hub.connect(websocket)
    await websocket.send_json({"type": "stream.ready", "environment": "SIMULATION"})
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        hub.disconnect(websocket)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True, app_dir="backend")
