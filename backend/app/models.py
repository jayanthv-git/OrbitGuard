"""Validated request and response models for the OrbitGuard service."""

from typing import Literal
from pydantic import BaseModel, Field, ConfigDict


class TelemetrySample(BaseModel):
    model_config = ConfigDict(extra="forbid")

    timestamp: float = Field(gt=0)
    time_string: str | None = None
    met_string: str | None = None
    event_id: str | None = Field(default=None, max_length=96)
    imu_w_mag: float = Field(ge=0, le=1000)
    solar_current: float = Field(ge=0, le=1000)
    mag_b_mag: float = Field(ge=0, le=10000)
    panel_temp: float = Field(ge=-273.15, le=1000)
    imu_z_score: float | None = Field(default=None, ge=0, le=10000)
    solar_z_score: float | None = Field(default=None, ge=0, le=10000)
    mag_z_score: float | None = Field(default=None, ge=0, le=10000)
    temp_z_score: float | None = Field(default=None, ge=0, le=10000)


class TelemetryBatch(BaseModel):
    samples: list[TelemetrySample] = Field(min_length=1, max_length=500)


class DiagnosisRequest(BaseModel):
    event_id: str = Field(min_length=1, max_length=96)
    samples: list[TelemetrySample] = Field(min_length=1, max_length=1000)
    event_start_index: int = Field(default=0, ge=0)
    correlation_window_ms: float = Field(default=1500, gt=0, le=30000)


class MissionSettings(BaseModel):
    update_rate_hz: int = Field(default=5, ge=1, le=20)
    imu_threshold_z: float = Field(default=3.2, gt=0, le=100)
    solar_threshold_z: float = Field(default=2.8, gt=0, le=100)
    mag_threshold_z: float = Field(default=3.0, gt=0, le=100)
    temp_threshold_z: float = Field(default=3.0, gt=0, le=100)
    correlation_window_ms: float = Field(default=1500, gt=0, le=30000)


class ImpactCommand(BaseModel):
    severity: Literal["MEDIUM", "HIGH"] = "HIGH"


class GlitchCommand(BaseModel):
    sensor: Literal["imu", "solar", "mag"] = "imu"
