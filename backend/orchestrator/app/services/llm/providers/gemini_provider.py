"""
File: orchestrator/app/services/llm/providers/gemini_provider.py
Description: Google Gemini Adapter implementing BaseLLMProvider.
"""

import os
import time
import logging
from typing import Optional, Dict, Any
import google.generativeai as genai

from app.services.llm.base import BaseLLMProvider, LLMResponse, ModelTier
from app.core.config import settings

logger = logging.getLogger("orchestrator.llm.gemini")


class GeminiProvider(BaseLLMProvider):
    """
    Adapter for Google Gemini API via google.generativeai SDK.
    """
    def __init__(
        self,
        api_key: Optional[str] = None,
        fast_model: str = "gemini-flash-latest",
        reasoning_model: str = "gemini-flash-latest",
        translation_model: str = "gemini-flash-latest",
        temperature: Optional[float] = None
    ):
        configured_temp = temperature if temperature is not None else getattr(settings, "GEMINI_TEMPERATURE", 0.7)
        super().__init__(name="gemini", default_temperature=configured_temp)
        self.api_key = api_key or getattr(settings, "GEMINI_API_KEY", "") or os.getenv("GEMINI_API_KEY", "")
        self.fast_model_name = fast_model
        self.reasoning_model_name = reasoning_model
        self.translation_model_name = translation_model
        self._configured = False

        if self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                self._configured = True
            except Exception as e:
                logger.warning(f"Failed to configure Gemini SDK: {e}")

    def is_available(self) -> bool:
        return bool(self._configured and self.api_key)

    def _resolve_model_name(self, tier: ModelTier) -> str:
        if tier == ModelTier.FAST:
            return self.fast_model_name
        elif tier == ModelTier.REASONING:
            return self.reasoning_model_name
        elif tier == ModelTier.TRANSLATION:
            return self.translation_model_name
        return self.fast_model_name

    def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        model_tier: ModelTier = ModelTier.DEFAULT
    ) -> LLMResponse:
        if not self.is_available():
            raise RuntimeError("GeminiProvider is not configured with a valid API key.")

        eff_temp = self.default_temperature if temperature is None else temperature
        model_name = self._resolve_model_name(model_tier)
        start_time = time.time()

        kwargs: Dict[str, Any] = {}
        if system_instruction:
            kwargs["system_instruction"] = system_instruction

        model = genai.GenerativeModel(model_name, **kwargs)
        generation_config = genai.types.GenerationConfig(
            temperature=eff_temp,
            max_output_tokens=max_tokens if max_tokens else None
        )

        response = model.generate_content(prompt, generation_config=generation_config)
        latency_ms = (time.time() - start_time) * 1000

        text = response.text.strip() if response and response.text else ""

        # Extract token usage metadata if available
        usage = getattr(response, "usage_metadata", None)
        prompt_tokens = getattr(usage, "prompt_token_count", len(prompt.split())) if usage else len(prompt.split())
        completion_tokens = getattr(usage, "candidates_token_count", len(text.split())) if usage else len(text.split())

        return LLMResponse(
            text=text,
            provider="gemini",
            model_name=model_name,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=prompt_tokens + completion_tokens,
            latency_ms=round(latency_ms, 2),
            raw_metadata={"tier": model_tier.value, "temperature": eff_temp}
        )

    async def generate_text_async(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        model_tier: ModelTier = ModelTier.DEFAULT
    ) -> LLMResponse:
        if not self.is_available():
            raise RuntimeError("GeminiProvider is not configured with a valid API key.")

        eff_temp = self.default_temperature if temperature is None else temperature
        model_name = self._resolve_model_name(model_tier)
        start_time = time.time()

        kwargs: Dict[str, Any] = {}
        if system_instruction:
            kwargs["system_instruction"] = system_instruction

        model = genai.GenerativeModel(model_name, **kwargs)
        generation_config = genai.types.GenerationConfig(
            temperature=eff_temp,
            max_output_tokens=max_tokens if max_tokens else None
        )

        response = await model.generate_content_async(prompt, generation_config=generation_config)
        latency_ms = (time.time() - start_time) * 1000

        text = response.text.strip() if response and response.text else ""

        usage = getattr(response, "usage_metadata", None)
        prompt_tokens = getattr(usage, "prompt_token_count", len(prompt.split())) if usage else len(prompt.split())
        completion_tokens = getattr(usage, "candidates_token_count", len(text.split())) if usage else len(text.split())

        return LLMResponse(
            text=text,
            provider="gemini",
            model_name=model_name,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=prompt_tokens + completion_tokens,
            latency_ms=round(latency_ms, 2),
            raw_metadata={"tier": model_tier.value}
        )
