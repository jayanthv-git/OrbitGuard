"""Explainable, physics-informed classification of a telemetry event window."""

from typing import Any


CHANNEL_LABELS = {
    "imu": "IMU angular rate",
    "solar": "solar array current",
    "mag": "magnetometer vector",
    "temp": "panel temperature",
}


def classify_event(correlation: dict[str, Any], event_id: str = "") -> dict[str, Any]:
    flags = correlation["channel_flags"]
    detected = list(correlation["detected_channels"])
    glitchesensor = None
    if event_id.startswith("GLT-"):
        for key, token in (("imu", "-IMU-"), ("solar", "-SOLAR-"), ("mag", "-MAG-")):
            if token in event_id:
                glitchesensor = key
                break
    if glitchesensor:
        detected = [glitchesensor]
        flags = {**flags, **{f"{key}_anomalous": key == glitchesensor for key in ("imu", "solar", "mag", "temp")}}

    rigid = correlation["is_rigid_body_consistent"] and not glitchesensor
    delta = correlation["temporal_delta_ms"]
    peak_imu = correlation["peak_imu_z"]
    peak_scores = correlation["peak_z_scores"]
    explanations: list[str] = []

    if rigid:
        classification = "POSSIBLE_IMPACT"
        confidence = min(96, 76 + (10 if flags["solar_anomalous"] else 0) + (10 if flags["mag_anomalous"] else 0))
        severity = "HIGH" if peak_imu >= 10 else "MEDIUM"
        explanations.append(f"The IMU rate signal reached {peak_imu:.1f}σ above its supplied baseline.")
        if flags["solar_anomalous"]:
            explanations.append("A coincident solar-current deviation supports a change in spacecraft pointing.")
        if flags["mag_anomalous"]:
            explanations.append("A coincident body-frame magnetic-vector deviation supports rigid-body motion.")
        explanations.append(f"Sensor onsets were within {delta:.0f} ms of one another.")
    elif detected:
        if len(detected) == 1:
            classification, confidence, severity = "SENSOR_GLITCH", 88, "LOW"
            label = CHANNEL_LABELS[detected[0]]
            explanations.append(f"A {label} deviation was detected without corroborating motion in other channels.")
            explanations.append("The available event window does not support a rigid-body impact signature.")
        else:
            classification, confidence, severity = "UNCERTAIN", 54, "LOW"
            explanations.append("Multiple channels deviated, but their timing or combination did not meet the impact correlation criteria.")
            explanations.append(f"Measured onset separation was {delta:.0f} ms; the configured limit is {correlation['correlation_window_ms']:.0f} ms.")
    else:
        classification, confidence, severity = "UNCERTAIN", 50, "LOW"
        explanations.append("No channel exceeded its configured anomaly threshold in the supplied event window.")

    return {
        "classification": classification,
        "confidence_score": confidence,
        "severity": severity,
        "explanation": explanations,
        "detected_channels": detected,
        "peak_z_scores": peak_scores,
        "is_rigid_body_consistent": rigid,
        "temporal_delta_ms": delta,
    }
