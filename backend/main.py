import logging
import os
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.endpoints import router as api_router
from app.core.config import settings
from app.database.db import init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("aquatrace.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize SQLite schema and ensure upload directories
    logger.info("Initializing database schema...")
    init_db()
    try:
        from app.database.seed_data import seed_sample_data
        seed_sample_data()
    except Exception as e:
        logger.warning(f"Seed data initialization: {e}")
    logger.info("Database initialized successfully.")
    yield
    logger.info("Application shutting down.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="AI-Powered Marine Plastic Pollution Tracking, Trajectory Prediction & Smart Cleanup Platform.",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits local frontend development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static directories for uploaded and annotated images
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")

# Include API routes under prefix
app.include_router(api_router, prefix=settings.API_PREFIX)


# Serve built frontend if dist directory exists (for all-in-one Render deployment)
frontend_dist = settings.BASE_DIR / "frontend" / "dist"
if frontend_dist.exists():
    logger.info(f"Serving built frontend from {frontend_dist}")
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")
else:
    @app.get("/")
    async def root():
        return {
            "platform": settings.APP_NAME,
            "version": settings.VERSION,
            "tagline": "Detect. Track. Predict. Protect Our Oceans.",
            "api_docs": "/docs",
            "health": f"{settings.API_PREFIX}/health"
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
