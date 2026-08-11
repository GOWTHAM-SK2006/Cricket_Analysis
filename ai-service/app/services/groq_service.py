import json
import httpx
from typing import List, Dict, Any
from fastapi import HTTPException, status
from app.config import settings
from app.utils.logger import logger

OPENROUTER_MODELS_CASCADE = [
    "openrouter/auto",
    "google/gemini-2.0-flash-lite-001:free",
    "stepfun/step-3.5-mini:free",
    "qwen/qwen-2.5-coder-32b-instruct:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "deepseek/deepseek-r1:free"
]

class GroqService:
    def __init__(self):
        pass

    def _get_api_key(self) -> str:
        key = settings.OPENROUTER_API_KEY
        if not key or key.startswith("YOUR_"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="OpenRouter API Key is not configured. Please set OPENROUTER_API_KEY in environment/settings."
            )
        return key

    async def generate_chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.1,
        max_tokens: int = 500
    ) -> str:
        """Send chat messages strictly via OpenRouter API."""
        api_key = self._get_api_key()
        url = "https://openrouter.ai/api/v1/chat/completions"

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "CPI Cricket Analytics"
        }

        models_to_try = list(OPENROUTER_MODELS_CASCADE)
        if settings.OPENROUTER_MODEL and settings.OPENROUTER_MODEL not in models_to_try:
            models_to_try.insert(0, settings.OPENROUTER_MODEL)

        last_error = None
        for model in models_to_try:
            payload = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens
            }
            try:
                logger.info(f"Calling OpenRouter API model: {model}")
                async with httpx.AsyncClient(timeout=15.0) as client:
                    response = await client.post(url, headers=headers, json=payload)
                    response.raise_for_status()
                    data = response.json()

                choices = data.get("choices", [])
                if choices and len(choices) > 0:
                    reply = choices[0].get("message", {}).get("content", "")
                    if reply and reply.strip():
                        return reply.strip()
            except Exception as e:
                logger.warning(f"OpenRouter model {model} failed: {str(e)}. Trying next OpenRouter model...")
                last_error = e

        logger.error(f"All OpenRouter models failed. Last error: {str(last_error)}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OpenRouter API Error: {str(last_error)}"
        )

    async def generate_structured_json(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.1
    ) -> Dict[str, Any]:
        """Request structured JSON object strictly via OpenRouter API."""
        api_key = self._get_api_key()
        url = "https://openrouter.ai/api/v1/chat/completions"

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "CPI Cricket Analytics"
        }

        adjusted_messages = list(messages)
        has_json_instruction = any("json" in msg.get("content", "").lower() for msg in adjusted_messages)
        if not has_json_instruction:
            adjusted_messages.append({
                "role": "system",
                "content": "You must output a valid JSON object."
            })

        models_to_try = list(OPENROUTER_MODELS_CASCADE)
        last_error = None
        for model in models_to_try:
            payload = {
                "model": model,
                "messages": adjusted_messages,
                "temperature": temperature,
                "response_format": {"type": "json_object"}
            }
            try:
                logger.info(f"Calling OpenRouter model {model} for structured JSON...")
                async with httpx.AsyncClient(timeout=15.0) as client:
                    response = await client.post(url, headers=headers, json=payload)
                    response.raise_for_status()
                    data = response.json()

                choices = data.get("choices", [])
                if choices and len(choices) > 0:
                    text_content = choices[0].get("message", {}).get("content", "")
                    if text_content:
                        return json.loads(text_content)
            except Exception as e:
                logger.warning(f"OpenRouter JSON model {model} failed: {str(e)}. Trying next OpenRouter model...")
                last_error = e

        logger.error(f"Structured JSON Error across OpenRouter models: {str(last_error)}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OpenRouter Structured JSON Error: {str(last_error)}"
        )

groq_service = GroqService()
