"""Application settings, loaded once from the environment.

Every provider key is optional: a missing key must degrade a check to
"not_checked", never crash a request.
"""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

APP_DIR = Path(__file__).resolve().parent
BACKEND_DIR = APP_DIR.parent
REPO_ROOT = BACKEND_DIR.parent
DATA_DIR = APP_DIR / "data"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=REPO_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    max_apk_mb: int = 100
    report_ttl_seconds: int = 3600
    report_store_max_entries: int = 500
    cors_origins: str = "http://localhost:5173"

    zip_max_member_mb: int = 10
    zip_max_total_mb: int = 50
    zip_max_entries: int = 2000

    virustotal_api_key: str = ""
    safe_browsing_api_key: str = ""
    urlhaus_auth_key: str = ""

    intel_db_path: str = "intel.db"

    whatsapp_verify_token: str = ""
    whatsapp_app_secret: str = ""
    whatsapp_access_token: str = ""
    whatsapp_phone_number_id: str = ""

    enable_llm_category_hint: bool = False
    enable_dex_strings: bool = False

    @property
    def max_apk_bytes(self) -> int:
        return self.max_apk_mb * 1024 * 1024

    @property
    def zip_max_member_bytes(self) -> int:
        return self.zip_max_member_mb * 1024 * 1024

    @property
    def zip_max_total_bytes(self) -> int:
        return self.zip_max_total_mb * 1024 * 1024

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def intel_db_file(self) -> Path:
        path = Path(self.intel_db_path)
        return path if path.is_absolute() else REPO_ROOT / path


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()