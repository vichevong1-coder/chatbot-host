"""
Central configuration loaded from .env file.
All tuneable parameters live here — never hardcoded in individual modules.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # VLM — provider selection
    vlm_provider: str = Field(default="ollama", alias="VLM_PROVIDER")
    vlm_model: str = Field(default="gemma4:31b", alias="VLM_MODEL")

    # Gemini (legacy / optional)
    gemini_api_key: str = Field(default="", alias="GEMINI_API_KEY")

    # Ollama
    ollama_api_key: str = Field(default="", alias="OLLAMA_API_KEY")
    ollama_base_url: str = Field(default="https://ollama.com", alias="OLLAMA_BASE_URL")

    # VLM behaviour
    log_vlm_io: bool = Field(default=True, alias="LOG_VLM_IO")               # log prompt + raw response
    vlm_disable_thinking: bool = Field(default=False, alias="VLM_DISABLE_THINKING")  # send think:false to Ollama
    use_layout_regions: bool = Field(default=False, alias="USE_LAYOUT_REGIONS")  # expose regions in response
    vlm_seed: int = Field(default=42, alias="VLM_SEED")   # fixed seed for reproducibility

    # Image processing
    max_image_long_side: int = Field(default=2000, alias="MAX_IMAGE_LONG_SIDE")

    # Confidence thresholds
    ocr_confidence_threshold: float = Field(default=0.70, alias="OCR_CONFIDENCE_THRESHOLD")
    vlm_confidence_threshold: float = Field(default=0.75, alias="VLM_CONFIDENCE_THRESHOLD")
    low_confidence_threshold: float = Field(default=0.60, alias="LOW_CONFIDENCE_THRESHOLD")

    # Layout / OCR
    layout_lang: str = Field(default="en", alias="LAYOUT_LANG")
    enable_khmer: bool = Field(default=False, alias="ENABLE_KHMER")

    # API server
    app_host: str = Field(default="0.0.0.0", alias="APP_HOST")
    app_port: int = Field(default=8000, alias="APP_PORT")
    debug: bool = Field(default=False, alias="DEBUG")

    @property
    def ocr_langs(self) -> list[str]:
        langs = ["en"]
        if self.enable_khmer:
            langs.append("km")
        return langs


settings = Settings()
