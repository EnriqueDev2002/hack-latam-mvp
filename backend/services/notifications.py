import os
from typing import Literal

import httpx

ZAVU_API_KEY = os.getenv("ZAVU_API_KEY", "")
ZAVU_BASE_URL = "https://api.zavu.dev"


async def send_via_zavu(
    phone: str, message: str, channel: Literal["whatsapp", "sms"] = "whatsapp"
) -> bool:
    """Envia alerta al contacto de confianza via Zavu.

    TODO Persona A: confirmar shape del request segun docs de Zavu.
    Fallback a SMS si WhatsApp falla.
    """
    if not ZAVU_API_KEY:
        return False
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            f"{ZAVU_BASE_URL}/messages",
            headers={"Authorization": f"Bearer {ZAVU_API_KEY}"},
            json={"to": phone, "channel": channel, "body": message},
        )
        return resp.status_code < 300
