import asyncio
from abc import ABC, abstractmethod
from typing import Any

import google.generativeai as genai
from pydantic import BaseModel
import structlog

from app.core.config import settings

logger = structlog.get_logger(__name__)

# Configure Gemini SDK once at module load
genai.configure(api_key=settings.GEMINI_API_KEY)


class BaseProvider(ABC):
    """
    Abstract interface for AI Model Providers (Gemini, OpenAI, etc.).
    """
    @abstractmethod
    async def generate_structured(self, prompt: str, system_prompt: str) -> dict[str, Any]:
        """
        Generate a structured JSON response.

        Returns:
            dict containing keys:
              - text: str (raw response text)
              - token_usage: dict containing prompt_tokens, completion_tokens, total_tokens
        """
        ...


class GeminiProvider(BaseProvider):
    """
    Google Gemini implementation of the Provider interface.
    """
    def __init__(self, model_name: str = settings.GEMINI_MODEL):
        self.model_name = model_name

    async def generate_structured(self, prompt: str, system_prompt: str) -> dict[str, Any]:
        """Async generation wrapper around Gemini's synchronous SDK."""
        # Note: In a production app, we would cache the GenerativeModel instantiation
        # or handle it more efficiently, but instantiating it per call is fine for now
        # since it's just local client configuration.
        model = genai.GenerativeModel(
            model_name=self.model_name,
            system_instruction=system_prompt,
            generation_config=genai.GenerationConfig(
                temperature=0.1,
                response_mime_type="application/json",
            ),
        )

        loop = asyncio.get_running_loop()
        response = await loop.run_in_executor(
            None,
            lambda: model.generate_content(prompt),
        )

        # Parse usage metadata
        usage = {}
        if hasattr(response, "usage_metadata") and response.usage_metadata:
            usage = {
                "prompt_tokens": response.usage_metadata.prompt_token_count,
                "completion_tokens": response.usage_metadata.candidates_token_count,
                "total_tokens": response.usage_metadata.total_token_count,
            }

        return {
            "text": response.text,
            "token_usage": usage,
            "provider_used": f"gemini-{self.model_name}"
        }
