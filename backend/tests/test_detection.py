from services.detection import risk_from_confidence


def test_risk_from_confidence_thresholds():
    assert risk_from_confidence(0.0) == "low"
    assert risk_from_confidence(0.44) == "low"
    assert risk_from_confidence(0.45) == "medium"
    assert risk_from_confidence(0.74) == "medium"
    assert risk_from_confidence(0.75) == "high"
    assert risk_from_confidence(1.0) == "high"


# TODO Persona A: test con audios reales vs sinteticos generados con MiniMax
