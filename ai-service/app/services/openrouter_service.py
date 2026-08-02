import json
import httpx
from typing import List, Dict, Any, AsyncGenerator
from fastapi import HTTPException, status
from openai import AsyncOpenAI
from app.config import settings
from app.utils.logger import logger

class OpenRouterService:
    def __init__(self):
        if not settings.OPENROUTER_API_KEY:
            logger.error("OPENROUTER_API_KEY is not set in environment variables!")
            
        self.client = AsyncOpenAI(
            api_key=settings.OPENROUTER_API_KEY or "dummy-key-for-init",
            base_url=settings.OPENROUTER_BASE_URL,
            default_headers={
                "HTTP-Referer": "https://cpi-cricket.com",
                "X-Title": "CPI Cricket Performance Analytics"
            },
            timeout=settings.REQUEST_TIMEOUT
        )

    def _verify_api_key(self):
        if not settings.OPENROUTER_API_KEY or settings.OPENROUTER_API_KEY.startswith("YOUR_"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="OpenRouter API Key is missing or invalid in server configuration."
            )

    async def generate_chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> str:
        """Send chat messages to OpenRouter model and return assistant text response."""
        self._verify_api_key()
        
        try:
            logger.info(f"Calling OpenRouter model: {settings.OPENROUTER_MODEL}")
            response = await self.client.chat.completions.create(
                model=settings.OPENROUTER_MODEL,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            if response.choices and len(response.choices) > 0:
                reply = response.choices[0].message.content
                return reply or "I'm sorry, I couldn't generate a response."
            
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Empty completion response received from AI model provider."
            )

        except httpx.TimeoutException:
            logger.error("OpenRouter API request timed out.")
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="AI Service request timed out. Please try again."
            )
        except httpx.HTTPStatusError as err:
            logger.error(f"OpenRouter HTTP Error: {err.response.status_code} - {err.response.text}")
            if err.response.status_code == 429:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="OpenRouter API rate limit exceeded. Please try again later."
                )
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"OpenRouter API Error: {err.response.text}"
            )
        except Exception as e:
            logger.error(f"OpenRouter Request Failure: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"AI Completion Service Error: {str(e)}"
            )

    async def generate_structured_json(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.3
    ) -> Dict[str, Any]:
        """Request JSON object from OpenRouter model."""
        self._verify_api_key()
        
        try:
            logger.info(f"Calling OpenRouter model for JSON recommendation output...")
            response = await self.client.chat.completions.create(
                model=settings.OPENROUTER_MODEL,
                messages=messages,
                temperature=temperature,
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            return json.loads(content)
        except json.JSONDecodeError as err:
            logger.error(f"JSON parsing error from LLM response: {str(err)}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to parse structured JSON from AI provider."
            )
        except Exception as e:
            logger.error(f"OpenRouter JSON Request Error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"AI Structured Recommendation Error: {str(e)}"
            )

openrouter_service = OpenRouterService()
