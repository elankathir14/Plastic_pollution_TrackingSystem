# ======================================================================
# AQUATRACE AI - MULTI-STAGE PRODUCTION DOCKERFILE FOR RENDER
# Builds React Frontend + PyTorch YOLOv8 FastAPI All-in-One Service
# ======================================================================

# ----------------------------------------------------------------------
# STAGE 1: Build Frontend UI
# ----------------------------------------------------------------------
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# ----------------------------------------------------------------------
# STAGE 2: Production Python Backend & All-in-One Server
# ----------------------------------------------------------------------
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# Install Linux shared libraries required for OpenCV and PyTorch
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python backend dependencies
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --upgrade pip && \
    pip install -r /app/backend/requirements.txt

# Pre-cache YOLOv8 weights into Docker image to avoid startup latency
RUN python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"

# Copy backend application and ML taxonomy
COPY backend/ /app/backend/
COPY ml/ /app/ml/

# Copy built frontend from Stage 1 into /app/frontend/dist
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Create storage directories for user uploads and model cache
RUN mkdir -p /app/uploads/annotated /app/ml/models

WORKDIR /app/backend

# Render listens on port 10000 by default (or the $PORT environment variable)
EXPOSE 10000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}"]
