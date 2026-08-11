import json
import httpx
from typing import List, Dict, Any
from fastapi import HTTPException, status
from app.config import settings
from app.utils.logger import logger

# Fastest free OpenRouter models (ordered by speed - fastest first)
OPENROUTER_FAST_MODELS = [
    "google/gemini-2.0-flash-lite-001:free",
    "meta-llama/llama-3.1-8b-instruct:free",
    "mistralai/mistral-7b-instruct:free",
    "qwen/qwen-2.5-coder-32b-instruct:free",
]

# Reusable HTTP client with connection pooling for speed
_http_client = None

def _get_client() -> httpx.AsyncClient:
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(
            timeout=httpx.Timeout(10.0, connect=3.0),
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
        )
    return _http_client

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

    def _get_headers(self, api_key: str) -> dict:
        return {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "CPI Cricket Analytics"
        }

    async def generate_chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.1,
        max_tokens: int = 400
    ) -> str:
        """Send chat messages via OpenRouter API with fast model cascade."""
        api_key = self._get_api_key()
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = self._get_headers(api_key)
        client = _get_client()

        models_to_try = list(OPENROUTER_FAST_MODELS)
        configured = settings.OPENROUTER_MODEL
        if configured and configured not in models_to_try and configured != "openrouter/auto":
            models_to_try.insert(0, configured)

        last_error = None
        for model in models_to_try:
            payload = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens
            }
            try:
                logger.info(f"OpenRouter -> {model}")
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()

                choices = data.get("choices", [])
                if choices and len(choices) > 0:
                    reply = choices[0].get("message", {}).get("content", "")
                    if reply and reply.strip():
                        return reply.strip()
            except Exception as e:
                logger.warning(f"OpenRouter {model} failed: {e}")
                last_error = e

        logger.error(f"All OpenRouter models failed. Last: {last_error}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OpenRouter API Error: {str(last_error)}"
        )

    async def generate_structured_json(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.1
    ) -> Dict[str, Any]:
        """Request structured JSON via OpenRouter API."""
        api_key = self._get_api_key()
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = self._get_headers(api_key)
        client = _get_client()

        adjusted_messages = list(messages)
        has_json_instruction = any("json" in msg.get("content", "").lower() for msg in adjusted_messages)
        if not has_json_instruction:
            adjusted_messages.append({
                "role": "system",
                "content": "You must output a valid JSON object."
            })

        models_to_try = list(OPENROUTER_FAST_MODELS)
        last_error = None
        for model in models_to_try:
            payload = {
                "model": model,
                "messages": adjusted_messages,
                "temperature": temperature,
                "response_format": {"type": "json_object"}
            }
            try:
                logger.info(f"OpenRouter JSON -> {model}")
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()

                choices = data.get("choices", [])
                if choices and len(choices) > 0:
                    text_content = choices[0].get("message", {}).get("content", "")
                    if text_content:
                        return json.loads(text_content)
            except Exception as e:
                logger.warning(f"OpenRouter JSON {model} failed: {e}")
                last_error = e

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OpenRouter Structured JSON Error: {str(last_error)}"
        )

groq_service = GroqService()
