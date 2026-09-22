"""
File: orchestrator/app/services/llm/manager.py
Description: Central LLM Gateway & Management Service.
             Provides tiered model routing, provider registration, automatic fallback cascading,
             and error isolation.
"""

import os
import logging
from typing import Optional, Dict, Any, List

from app.services.llm.base import BaseLLMProvider, LLMResponse, ModelTier
from app.services.llm.providers.gemini_provider import GeminiProvider
from app.services.llm.providers.openai_provider import OpenAIProvider
from app.services.llm.providers.mock_provider import MockLLMProvider
from app.services.llm.providers.ollama_provider import OllamaProvider
from app.core.config import settings

logger = logging.getLogger("orchestrator.llm.manager")


class LLMManager:
    """
    Central Gateway managing all LLM interactions in the Socratic Orchestrator.
    Decouples core business/pedagogical logic from specific AI vendors.
    """
    def __init__(self):
        self._providers: Dict[str, BaseLLMProvider] = {}
        self.primary_provider_name: str = getattr(settings, "LLM_PRIMARY_PROVIDER", "gemini").lower()
        self.fallback_provider_name: Optional[str] = getattr(settings, "LLM_FALLBACK_PROVIDER", "ollama")

        self._initialize_default_providers()

    def _initialize_default_providers(self):
        """Initializes default available provider adapters."""
        # 1. Gemini Provider (Primary Cloud)
        try:
            gemini = GeminiProvider()
            self.register_provider("gemini", gemini)
        except Exception as e:
            logger.warning(f"Could not initialize GeminiProvider: {e}")

        # 2. Local Ollama Provider (Local Fallback: llama3.2:3b)
        try:
            ollama = OllamaProvider()
            self.register_provider("ollama", ollama)
        except Exception as e:
            logger.warning(f"Could not initialize OllamaProvider: {e}")

        # 3. OpenAI / Local Compatible Provider
        try:
            openai_p = OpenAIProvider()
            self.register_provider("openai", openai_p)
        except Exception as e:
            logger.warning(f"Could not initialize OpenAIProvider: {e}")

        # 4. Mock Provider for unit testing / offline safety net
        self.register_provider("mock", MockLLMProvider())


    def register_provider(self, name: str, provider: BaseLLMProvider):
        """Registers a provider adapter instance."""
        self._providers[name.lower()] = provider
        logger.info(f"Registered LLM Provider: [{name.lower()}] (available: {provider.is_available()})")

    def get_provider(self, name: str) -> Optional[BaseLLMProvider]:
        """Retrieves a registered provider by name."""
        return self._providers.get(name.lower())

    def get_registered_providers(self) -> List[str]:
        return list(self._providers.keys())

    def _get_provider_cascade(self, requested_name: Optional[str] = None) -> List[BaseLLMProvider]:
        """Returns the ordered list of provider candidates to try."""
        primary_name = (requested_name or self.primary_provider_name).lower()
        fallback_name = (self.fallback_provider_name or "ollama").lower()
        
        candidates: List[BaseLLMProvider] = []
        # 1. Primary
        if primary_name in self._providers:
            candidates.append(self._providers[primary_name])
        # 2. Fallback (e.g. Ollama)
        if fallback_name in self._providers and fallback_name != primary_name:
            candidates.append(self._providers[fallback_name])
        # 3. Mock safety net
        if "mock" in self._providers and "mock" not in (primary_name, fallback_name):
            candidates.append(self._providers["mock"])
            
        return candidates

    def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        model_tier: ModelTier = ModelTier.DEFAULT,
        provider_name: Optional[str] = None
    ) -> LLMResponse:
        """
        Synchronously generates text using the selected or primary provider,
        cascading to fallback (e.g. Ollama) and mock if errors occur.
        If temperature is None, each provider applies its own configured temperature.
        """
        candidates = self._get_provider_cascade(provider_name)
        if not candidates:
            raise RuntimeError(f"No LLM providers available.")

        last_error = None
        for i, provider in enumerate(candidates):
            if not provider.is_available():
                logger.warning(f"Provider [{provider.name}] is not available. Skipping.")
                continue

            try:
                if i > 0:
                    logger.warning(f"Cascading LLM execution to [{provider.name}].")
                return provider.generate_text(
                    prompt=prompt,
                    system_instruction=system_instruction,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    model_tier=model_tier
                )
            except Exception as e:
                logger.error(f"Provider [{provider.name}] execution error: {e}")
                last_error = e

        if last_error:
            raise last_error
        raise RuntimeError("All candidate LLM providers failed or were unavailable.")

    async def generate_text_async(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        model_tier: ModelTier = ModelTier.DEFAULT,
        provider_name: Optional[str] = None
    ) -> LLMResponse:
        """
        Asynchronously generates text with cascading fallback support.
        If temperature is None, each provider applies its own configured temperature.
        """
        candidates = self._get_provider_cascade(provider_name)
        if not candidates:
            raise RuntimeError(f"No LLM providers available.")

        last_error = None
        for i, provider in enumerate(candidates):
            if not provider.is_available():
                logger.warning(f"Provider [{provider.name}] is not available. Skipping.")
                continue

            try:
                if i > 0:
                    logger.warning(f"Cascading async LLM execution to [{provider.name}].")
                return await provider.generate_text_async(
                    prompt=prompt,
                    system_instruction=system_instruction,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    model_tier=model_tier
                )
            except Exception as e:
                logger.error(f"Provider [{provider.name}] async execution error: {e}")
                last_error = e

        if last_error:
            raise last_error
        raise RuntimeError("All candidate LLM providers failed or were unavailable.")



# Global Singleton Gateway
llm_service = LLMManager()
