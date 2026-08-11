import json
import httpx
from typing import List, Dict, Any
from fastapi import HTTPException, status
from app.config import settings
from app.utils.logger import logger

FAST_OPENROUTER_MODELS = [
    "meta-llama/llama-3.1-8b-instruct:free",
    "google/gemini-2.0-flash-lite-001:free",
    "qwen/qwen-2.5-coder-32b-instruct:free",
    "mistralai/mistral-7b-instruct:free",
    "deepseek/deepseek-r1:free"
]

class GroqService:
    def __init__(self):
        pass

    async def generate_chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.1,
        max_tokens: int = 500
    ) -> str:
        """Generate ultra-fast chat completion using Groq LPU primary or OpenRouter fast models."""
        
        # 1. Try Groq LPU (Sub-second speed ~0.2s - 0.5s) if GROQ_API_KEY is available
        groq_key = settings.GROQ_API_KEY
        if groq_key and groq_key.startswith("gsk_"):
            try:
                logger.info("Attempting ultra-fast Groq LPU completion...")
                headers = {
                    "Authorization": f"Bearer {groq_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": settings.GROQ_MODEL or "llama-3.1-8b-instant",
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens
                }
                async with httpx.AsyncClient(timeout=6.0) as client:
                    resp = await client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        reply = data["choices"][0]["message"]["content"]
                        if reply and reply.strip():
                            logger.info("Groq LPU generated response in sub-second speed!")
                            return reply.strip()
            except Exception as e:
                logger.warning(f"Groq LPU primary failed: {str(e)}. Falling back to OpenRouter fast models...")

        # 2. Try OpenRouter Fast Models with tight 6s timeout
        openrouter_key = settings.OPENROUTER_API_KEY or groq_key
        if not openrouter_key or openrouter_key.startswith("YOUR_"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI API Key is not configured in settings."
            )

        models_to_try = list(FAST_OPENROUTER_MODELS)
        if settings.OPENROUTER_MODEL and settings.OPENROUTER_MODEL not in models_to_try:
            models_to_try.insert(0, settings.OPENROUTER_MODEL)

        headers = {
            "Authorization": f"Bearer {openrouter_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "CPI Cricket Analytics"
        }

        last_error = None
        for model in models_to_try:
            payload = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens
            }
            try:
                logger.info(f"Calling OpenRouter fast model: {model}")
                async with httpx.AsyncClient(timeout=6.0) as client:
                    response = await client.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
                    response.raise_for_status()
                    data = response.json()

                choices = data.get("choices", [])
                if choices and len(choices) > 0:
                    reply = choices[0].get("message", {}).get("content", "")
                    if reply and reply.strip():
                        return reply.strip()
            except Exception as e:
                logger.warning(f"OpenRouter model {model} failed or timed out: {str(e)}. Trying next fast model...")
                last_error = e

        logger.error(f"All AI fast models failed. Last error: {str(last_error)}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI Service Error: {str(last_error)}"
        )

    async def generate_structured_json(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.1
    ) -> Dict[str, Any]:
        """Request structured JSON object from Groq LPU or OpenRouter fast models."""
        groq_key = settings.GROQ_API_KEY
        adjusted_messages = list(messages)
        has_json_instruction = any("json" in msg.get("content", "").lower() for msg in adjusted_messages)
        if not has_json_instruction:
            adjusted_messages.append({
                "role": "system",
                "content": "You must output a valid JSON object."
            })

        if groq_key and groq_key.startswith("gsk_"):
            try:
                logger.info("Attempting Groq LPU structured JSON...")
                headers = {
                    "Authorization": f"Bearer {groq_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": "llama-3.3-70b-versatile",
                    "messages": adjusted_messages,
                    "temperature": temperature,
                    "response_format": {"type": "json_object"}
                }
                async with httpx.AsyncClient(timeout=8.0) as client:
                    resp = await client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        text_content = data["choices"][0]["message"]["content"]
                        if text_content:
                            return json.loads(text_content)
            except Exception as e:
                logger.warning(f"Groq LPU JSON failed: {str(e)}. Falling back to OpenRouter...")

        openrouter_key = settings.OPENROUTER_API_KEY or groq_key
        headers = {
            "Authorization": f"Bearer {openrouter_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "CPI Cricket Analytics"
        }

        models_to_try = list(FAST_OPENROUTER_MODELS)
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
                async with httpx.AsyncClient(timeout=7.0) as client:
                    response = await client.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
                    response.raise_for_status()
                    data = response.json()

                choices = data.get("choices", [])
                if choices and len(choices) > 0:
                    text_content = choices[0].get("message", {}).get("content", "")
                    if text_content:
                        return json.loads(text_content)
            except Exception as e:
                logger.warning(f"OpenRouter JSON model {model} failed: {str(e)}. Trying next...")
                last_error = e

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Structured JSON Error: {str(last_error)}"
        )

groq_service = GroqService()
