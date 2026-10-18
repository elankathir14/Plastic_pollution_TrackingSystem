# ======================================================================
# AQUATRACE AI - PRODUCTION DOCKERFILE FOR RENDER / CLOUD
# Multi-stage optimized for PyTorch + YOLOv8 + OpenCV + FastAPI
# ======================================================================

FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8000

# Install required Linux shared libraries for OpenCV and PyTorch
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency specifications and install Python packages
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --upgrade pip && \
    pip install -r /app/backend/requirements.txt

# Pre-cache YOLOv8n weights into the Docker layer to eliminate startup download lag
RUN python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"

# Copy backend code, ML configuration, and assets
COPY backend/ /app/backend/
COPY ml/ /app/ml/

# Create uploads storage directories
RUN mkdir -p /app/uploads/annotated /app/ml/models

WORKDIR /app/backend

# Initialize SQLite schema and seed coastal monitoring records
RUN python -c "import sys; sys.path.insert(0, '.'); from app.database.seed_data import seed_sample_data; seed_sample_data()"

EXPOSE 8000

# Start FastAPI server on dynamic cloud port
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
