import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
ANNOTATED_DIR = BASE_DIR / "uploads" / "annotated"
ML_DIR = BASE_DIR / "ml"
MODEL_DIR = ML_DIR / "models"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
ANNOTATED_DIR.mkdir(parents=True, exist_ok=True)
MODEL_DIR.mkdir(parents=True, exist_ok=True)


class Settings(BaseSettings):
    APP_NAME: str = "AquaTrace AI - Marine Plastic Intelligence"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'marine_pollution.db'}")

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "aquatrace_marine_dev_secret_key_2026_9876543210")
    ADMIN_API_KEY: str = os.getenv("ADMIN_API_KEY", "marine_admin_secure_key_2026")

    # Directories
    BASE_DIR: Path = BASE_DIR
    UPLOAD_DIR: Path = UPLOAD_DIR
    ANNOTATED_DIR: Path = ANNOTATED_DIR
    MODEL_DIR: Path = MODEL_DIR

    # AI Detection
    YOLO_MODEL_NAME: str = os.getenv("YOLO_MODEL_NAME", "yolov8n.pt")
    DEFAULT_CONF_THRESHOLD: float = 0.28
    DEFAULT_IOU_THRESHOLD: float = 0.45
    MAX_IMAGE_SIZE_BYTES: int = 15 * 1024 * 1024  # 15 MB
    BLUR_THRESHOLD_LAPLACIAN: float = 65.0

    # Geospatial Clustering
    DBSCAN_EPS_KM: float = 2.5
    DBSCAN_MIN_SAMPLES: int = 2

    # Environmental Drift
    COPERNICUS_API_KEY: str = os.getenv("COPERNICUS_API_KEY", "")
    USE_ENVIRONMENTAL_FALLBACK: bool = True

    model_config = {
        "env_file": ".env",
        "extra": "allow"
    }


settings = Settings()
