import json
import httpx
from typing import List, Dict, Any
from fastapi import HTTPException, status
from app.config import settings
from app.utils.logger import logger

class GroqService:
    def __init__(self):
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"

    def _get_api_key(self) -> str:
        key = settings.GROQ_API_KEY
        if not key or key.startswith("YOUR_"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Groq API Key is not configured. Please set GROQ_API_KEY in your environment/settings."
            )
        return key

    def _get_model(self) -> str:
        return settings.GROQ_MODEL or "llama-3.3-70b-versatile"

    async def generate_chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> str:
        """Send chat messages to Groq API via OpenAI-compatible REST endpoint."""
        api_key = self._get_api_key()
        model = self._get_model()

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }

        try:
            logger.info(f"Calling Groq API model: {model}")
            async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT) as client:
                response = await client.post(self.base_url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()

            choices = data.get("choices", [])
            if choices and len(choices) > 0:
                reply = choices[0].get("message", {}).get("content", "")
                return reply.strip() or "I'm sorry, I couldn't generate a response."

            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Empty completion response received from Groq API provider."
            )

        except httpx.TimeoutException:
            logger.error("Groq API request timed out.")
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="AI Service request timed out. Please try again."
            )
        except httpx.HTTPStatusError as err:
            logger.error(f"Groq API HTTP Error: {err.response.status_code} - {err.response.text}")
            if err.response.status_code == 429:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Groq API rate limit exceeded. Please try again later."
                )
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Groq API Error: {err.response.text}"
            )
        except Exception as e:
            logger.error(f"Groq Request Failure: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Groq AI Service Error: {str(e)}"
            )

    async def generate_structured_json(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2
    ) -> Dict[str, Any]:
        """Request structured JSON object from Groq API."""
        api_key = self._get_api_key()
        model = self._get_model()

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        # For json_object format, the system message or user message must contain the word "JSON"
        adjusted_messages = list(messages)
        has_json_instruction = any("json" in msg.get("content", "").lower() for msg in adjusted_messages)
        if not has_json_instruction:
            adjusted_messages.append({
                "role": "system",
                "content": "You must output a valid JSON object."
            })

        payload = {
            "model": model,
            "messages": adjusted_messages,
            "temperature": temperature,
            "response_format": {"type": "json_object"}
        }

        try:
            logger.info(f"Calling Groq API model {model} for structured JSON...")
            async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT) as client:
                response = await client.post(self.base_url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()

            choices = data.get("choices", [])
            if choices and len(choices) > 0:
                text_content = choices[0].get("message", {}).get("content", "")
                return json.loads(text_content)

            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Empty response received from Groq API provider."
            )

        except json.JSONDecodeError as err:
            logger.error(f"JSON parsing error from Groq response: {str(err)}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to parse structured JSON from Groq AI provider."
            )
        except Exception as e:
            logger.error(f"Groq JSON Request Failure: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Groq Recommendation Error: {str(e)}"
            )

groq_service = GroqService()
