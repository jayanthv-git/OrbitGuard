"""Cross-sensor event-window analysis for the simulated CubeSat telemetry."""

from typing import Any


THRESHOLDS = {"imu": 3.2, "solar": 2.8, "mag": 3.0, "temp": 3.2}


def _z(sample: dict[str, Any], channel: str) -> float:
    supplied = sample.get(f"{channel}_z_score")
    if supplied is not None:
        return float(supplied)

    # Fallbacks support direct API clients that do not send the simulator's
    # adaptive score. Solar and IMU remain useful; geomagnetic magnitude alone
    # is deliberately assigned a broad tolerance because it varies by orbit.
    baselines = {
        "imu": (0.035, 0.02),
        "solar": (2.44, 0.02),
        "mag": (41.5, 5.0),
        "temp": (46.8, 0.15),
    }
    mean, sigma = baselines[channel]
    return abs(float(sample[f"{'panel_temp' if channel == 'temp' else 'mag_b_mag' if channel == 'mag' else 'solar_current' if channel == 'solar' else 'imu_w_mag'}"]) - mean) / sigma


def evaluate_correlation(
    samples: list[dict[str, Any]],
    correlation_window_ms: float = 1500,
    thresholds: dict[str, float] | None = None,
) -> dict[str, Any]:
    limits = {**THRESHOLDS, **(thresholds or {})}
    channels = ("imu", "solar", "mag", "temp")
    first_onset: dict[str, float] = {}
    peaks = {channel: 0.0 for channel in channels}
    for sample in samples:
        timestamp = float(sample["timestamp"])
        for channel in channels:
            score = _z(sample, channel)
            peaks[channel] = max(peaks[channel], score)
            if score >= limits[channel]:
                first_onset.setdefault(channel, timestamp)

    detected = {channel: channel in first_onset for channel in channels}
    if first_onset:
        # Frontend timestamps are milliseconds since epoch. Direct clients may
        # send seconds; normalize only when the values look like epoch seconds.
        times = list(first_onset.values())
        delta = max(times) - min(times)
        timestamp = float(samples[0]["timestamp"])
        delta_t_ms = delta if abs(timestamp) >= 100_000_000_000 else delta * 1000
    else:
        delta_t_ms = 0.0

    rigid_body = (
        detected["imu"]
        and (detected["solar"] or detected["mag"])
        and delta_t_ms <= correlation_window_ms
    )
    return {
        "detected_channels": [channel for channel in channels if detected[channel]],
        "channel_flags": {f"{channel}_anomalous": detected[channel] for channel in channels},
        "onset_timestamps": first_onset,
        "temporal_delta_ms": round(delta_t_ms, 1),
        "correlation_window_ms": correlation_window_ms,
        "is_rigid_body_consistent": rigid_body,
        "peak_z_scores": {channel: round(value, 2) for channel, value in peaks.items()},
        "peak_imu_z": round(peaks["imu"], 2),
        "peak_solar_deviation": round(
            max((abs(s["solar_current"] - 2.44) for s in samples), default=0.0), 4
        ),
    }
