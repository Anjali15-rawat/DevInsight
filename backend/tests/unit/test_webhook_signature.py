"""Unit tests for webhook signature verification."""
import hashlib
import hmac
import pytest
from app.github.webhook_parser import verify_webhook_signature
from app.core.exceptions import WebhookSignatureError


SECRET = "test-webhook-secret"
PAYLOAD = b'{"action": "opened", "pull_request": {}}'


def _make_signature(payload: bytes, secret: str) -> str:
    sig = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    return f"sha256={sig}"


def test_valid_signature_passes():
    sig = _make_signature(PAYLOAD, SECRET)
    # Should not raise
    import unittest.mock
    with unittest.mock.patch("app.github.webhook_parser.settings") as mock_settings:
        mock_settings.GITHUB_WEBHOOK_SECRET = SECRET
        verify_webhook_signature(PAYLOAD, sig)


def test_missing_signature_raises():
    import unittest.mock
    with unittest.mock.patch("app.github.webhook_parser.settings") as mock_settings:
        mock_settings.GITHUB_WEBHOOK_SECRET = SECRET
        with pytest.raises(WebhookSignatureError):
            verify_webhook_signature(PAYLOAD, None)


def test_wrong_signature_raises():
    import unittest.mock
    with unittest.mock.patch("app.github.webhook_parser.settings") as mock_settings:
        mock_settings.GITHUB_WEBHOOK_SECRET = SECRET
        with pytest.raises(WebhookSignatureError):
            verify_webhook_signature(PAYLOAD, "sha256=wrongsignature")


def test_missing_sha256_prefix_raises():
    import unittest.mock
    with unittest.mock.patch("app.github.webhook_parser.settings") as mock_settings:
        mock_settings.GITHUB_WEBHOOK_SECRET = SECRET
        with pytest.raises(WebhookSignatureError):
            verify_webhook_signature(PAYLOAD, "invalidsig")
