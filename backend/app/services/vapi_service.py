from vapi import Vapi
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class VapiService:
    """Service for making outbound calls via Vapi."""

    def __init__(self):
        self.client = Vapi(token=settings.VAPI_API_KEY)
        self.phone_number_id = settings.VAPI_PHONE_NUMBER_ID

    def make_reminder_call(
        self,
        phone_number: str,
        reminder_title: str,
        reminder_message: str
    ) -> dict:
        """
        Initiate outbound call with reminder message.

        Args:
            phone_number: Customer phone number in E.164 format (+1234567890)
            reminder_title: Title of the reminder
            reminder_message: Full reminder message to speak

        Returns:
            dict: {"success": bool, "call_id": str, "error": str}
        """
        try:
            # Create transient assistant for this call
            response = self.client.calls.create(
                phone_number_id=self.phone_number_id,
                customer={
                    "number": phone_number
                },
                assistant={
                    "firstMessage": f"Hello! This is your reminder about {reminder_title}. {reminder_message}",
                    "model": {
                        "provider": "openai",
                        "model": "gpt-3.5-turbo",
                        "messages": [{
                            "role": "system",
                            "content": "You are a reminder assistant. After delivering the reminder, say goodbye and end the call."
                        }]
                    },
                    "voice": {
                        "provider": "11labs",
                        "voiceId": "21m00Tcm4TlvDq8ikWAM"
                    },
                    "endCallMessage": "Goodbye! Have a great day."
                }
            )

            logger.info(f"Vapi call created: {response.id}")
            return {"success": True, "call_id": response.id}

        except Exception as e:
            logger.error(f"Vapi call failed: {e}")
            return {"success": False, "error": str(e)}
