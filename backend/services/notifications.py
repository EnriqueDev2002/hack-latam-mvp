import logging
import os
from typing import Literal

import httpx

logger = logging.getLogger(__name__)

ZAVU_API_KEY = os.getenv("ZAVU_API_KEY", "").strip()
ZAVU_BASE_URL = "https://api.zavu.dev/v1"

Channel = Literal["whatsapp", "sms"]


async def _send_one(client: httpx.AsyncClient, phone: str, message: str, channel: Channel) -> bool:
    """Single attempt at one channel. Returns True on 2xx, False otherwise."""
    try:
        resp = await client.post(
            f"{ZAVU_BASE_URL}/messages",
            headers={
                "Authorization": f"Bearer {ZAVU_API_KEY}",
                "Content-Type": "application/json",
            },
            json={"to": phone, "channel": channel, "text": message},
        )
        if resp.status_code < 300:
            try:
                msg = resp.json().get("message", {})
                msg_id = msg.get("id", "?")
                status = msg.get("status", "?")
            except Exception:
                msg_id = status = "?"
            logger.info(
                "zavu queued channel=%s phone=%s http=%s message.id=%s message.status=%s",
                channel, phone, resp.status_code, msg_id, status,
            )
            return True
        logger.warning(
            "zavu failed channel=%s status=%s body=%s",
            channel, resp.status_code, resp.text[:300],
        )
        return False
    except Exception as exc:
        logger.warning("zavu request error channel=%s: %s", channel, exc)
        return False


async def send_alert(phone: str, message: str) -> tuple[bool, Channel | None]:
    """Try SMS first (works without WABA), fall back to WhatsApp if available."""
    if not ZAVU_API_KEY:
        logger.warning("ZAVU_API_KEY not configured")
        return False, None
    async with httpx.AsyncClient(timeout=10.0) as client:
        if await _send_one(client, phone, message, "sms"):
            return True, "sms"
        if await _send_one(client, phone, message, "whatsapp"):
            return True, "whatsapp"
    return False, None
