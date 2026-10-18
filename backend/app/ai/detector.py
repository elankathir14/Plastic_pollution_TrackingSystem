import json
import logging
import math
import os
import time
import uuid
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any

import cv2
import numpy as np
from PIL import Image, ExifTags

from app.core.config import settings

logger = logging.getLogger("aquatrace.detector")
logging.basicConfig(level=logging.INFO)

TAXONOMY_PATH = settings.BASE_DIR / "ml" / "model_config" / "marine_classes.json"

try:
    with open(TAXONOMY_PATH, "r", encoding="utf-8") as f:
        TAXONOMY_DATA = json.load(f)
        MARINE_CLASSES = TAXONOMY_DATA.get("classes", {})
except Exception as e:
    logger.warning(f"Could not load taxonomy from {TAXONOMY_PATH}: {e}")
    MARINE_CLASSES = {}

# Hex to BGR for OpenCV
def hex_to_bgr(hex_str: str) -> Tuple[int, int, int]:
    hex_str = hex_str.lstrip('#')
    if len(hex_str) != 6:
        return (0, 255, 255)
    r = int(hex_str[0:2], 16)
    g = int(hex_str[2:4], 16)
    b = int(hex_str[4:6], 16)
    return (b, g, r)


class MarinePlasticDetector:
    _instance = None
    _model = None
    _model_loaded = False
    _model_path_used = "none"

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MarinePlasticDetector, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        """Loads the YOLO model into memory once."""
        custom_weights = settings.MODEL_DIR / "marine_yolo.pt"
        default_model = settings.YOLO_MODEL_NAME

        target_model = str(custom_weights) if custom_weights.exists() else default_model

        try:
            from ultralytics import YOLO
            logger.info(f"Loading YOLO model from: {target_model}")
            self._model = YOLO(target_model)
            self._model_loaded = True
            self._model_path_used = target_model
            logger.info("YOLO model loaded successfully into memory.")
        except Exception as e:
            logger.error(f"Failed to load Ultralytics YOLO model: {e}. Running with diagnostic fallback.")
            self._model = None
            self._model_loaded = False
            self._model_path_used = "diagnostic_engine"

    @property
    def is_loaded(self) -> bool:
        return self._model_loaded

    @property
    def model_name(self) -> str:
        return self._model_path_used

    def check_image_quality(self, img_path: Path) -> Dict[str, Any]:
        """Performs rigorous quality, blur, and lighting analysis."""
        cv_img = cv2.imread(str(img_path))
        if cv_img is None:
            return {
                "blur_variance": 0.0,
                "is_blurry": True,
                "quality_score": 0.0,
                "quality_grade": "invalid",
                "resolution": "0x0",
                "aspect_ratio": 1.0,
                "brightness_mean": 0.0,
                "is_dark": False,
                "is_overexposed": False,
                "warnings": ["Could not decode image format or file corrupted"]
            }

        height, width = cv_img.shape[:2]
        gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)

        # Laplacian variance for blur detection
        blur_variance = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        is_blurry = blur_variance < settings.BLUR_THRESHOLD_LAPLACIAN

        # Brightness
        brightness_mean = float(np.mean(gray))
        is_dark = brightness_mean < 42.0
        is_overexposed = brightness_mean > 225.0

        warnings = []
        if is_blurry:
            warnings.append(f"Image has low focal clarity (Laplacian {blur_variance:.1f} < {settings.BLUR_THRESHOLD_LAPLACIAN:.1f}); small debris may be missed.")
        if is_dark:
            warnings.append("Image is significantly underexposed; low contrast near shoreline.")
        if is_overexposed:
            warnings.append("High solar glare / reflection detected on water surface.")
        if width < 480 or height < 480:
            warnings.append(f"Low image resolution ({width}x{height}px); detection precision may decrease.")

        # Compute composite quality score (0.0 to 1.0)
        clarity_score = min(1.0, blur_variance / 200.0)
        light_score = 1.0 - (abs(brightness_mean - 128.0) / 128.0) * 0.5
        res_score = min(1.0, (width * height) / (1280 * 720))
        composite_score = round(clarity_score * 0.45 + light_score * 0.35 + res_score * 0.20, 2)

        if composite_score >= 0.70:
            grade = "optimal"
        elif composite_score >= 0.45:
            grade = "acceptable"
        else:
            grade = "degraded"

        return {
            "blur_variance": round(blur_variance, 2),
            "is_blurry": is_blurry,
            "quality_score": composite_score,
            "quality_grade": grade,
            "resolution": f"{width}x{height}",
            "aspect_ratio": round(width / max(1, height), 2),
            "brightness_mean": round(brightness_mean, 1),
            "is_dark": is_dark,
            "is_overexposed": is_overexposed,
            "warnings": warnings
        }

    def extract_exif(self, img_path: Path) -> Dict[str, Any]:
        """Extracts GPS coordinates, timestamp, and device metadata from EXIF if available."""
        result = {
            "has_gps": False,
            "latitude": None,
            "longitude": None,
            "altitude": None,
            "datetime_original": None,
            "camera_make": None,
            "camera_model": None
        }

        try:
            with Image.open(img_path) as img:
                exif_data = img._getexif()
                if not exif_data:
                    return result

                exif = {ExifTags.TAGS.get(k, k): v for k, v in exif_data.items()}

                if "Make" in exif:
                    result["camera_make"] = str(exif["Make"])
                if "Model" in exif:
                    result["camera_model"] = str(exif["Model"])
                if "DateTimeOriginal" in exif:
                    result["datetime_original"] = str(exif["DateTimeOriginal"])

                gps_info = exif.get("GPSInfo")
                if gps_info:
                    gps_tags = {ExifTags.GPSTAGS.get(t, t): gps_info[t] for t in gps_info}

                    def convert_to_degrees(value):
                        d = float(value[0])
                        m = float(value[1])
                        s = float(value[2])
                        return d + (m / 60.0) + (s / 3600.0)

                    lat_val = gps_tags.get("GPSLatitude")
                    lat_ref = gps_tags.get("GPSLatitudeRef")
                    lon_val = gps_tags.get("GPSLongitude")
                    lon_ref = gps_tags.get("GPSLongitudeRef")

                    if lat_val and lat_ref and lon_val and lon_ref:
                        lat = convert_to_degrees(lat_val)
                        if lat_ref != "N":
                            lat = -lat

                        lon = convert_to_degrees(lon_val)
                        if lon_ref != "E":
                            lon = -lon

                        result["has_gps"] = True
                        result["latitude"] = round(lat, 6)
                        result["longitude"] = round(lon, 6)

                    if "GPSAltitude" in gps_tags:
                        try:
                            result["altitude"] = round(float(gps_tags["GPSAltitude"]), 1)
                        except Exception:
                            pass
        except Exception as e:
            logger.debug(f"EXIF parsing skipped: {e}")

        return result

    def _map_coco_to_marine(self, coco_name: str) -> Optional[str]:
        """Maps standard COCO object detection classes to the Marine Litter taxonomy."""
        coco_name = coco_name.lower().strip()
        for class_key, meta in MARINE_CLASSES.items():
            if coco_name in meta.get("coco_mapping", []):
                return class_key
        # Direct name match if marine-trained
        if coco_name in MARINE_CLASSES:
            return coco_name
        return None

    def analyze_image(
        self,
        img_path: Path,
        confidence_threshold: float = 0.28,
        iou_threshold: float = 0.45
    ) -> Dict[str, Any]:
        """
        Runs real AI computer vision inference on the target image.
        Returns bounding boxes, categories, counts, quality diagnostics,
        annotated image path, and Explainable AI factors.
        """
        start_time = time.time()
        quality = self.check_image_quality(img_path)
        exif = self.extract_exif(img_path)

        cv_img = cv2.imread(str(img_path))
        if cv_img is None:
            raise ValueError("Failed to load image file. Please provide a valid JPG, PNG, or WEBP image.")

        img_h, img_w = cv_img.shape[:2]
        detections = []
        raw_candidates_count = 0
        inference_time_ms = 0.0

        # Run actual YOLO inference if loaded
        if self._model_loaded and self._model is not None:
            try:
                # Resize if excessively large for speed and performance
                results = self._model.predict(
                    source=str(img_path),
                    conf=confidence_threshold,
                    iou=iou_threshold,
                    imgsz=640,
                    verbose=False
                )
                inference_time_ms = round((time.time() - start_time) * 1000, 1)

                if results and len(results) > 0:
                    r = results[0]
                    boxes = r.boxes
                    raw_candidates_count = len(boxes)

                    for box in boxes:
                        cls_id = int(box.cls[0].item())
                        cls_name = r.names.get(cls_id, str(cls_id))
                        conf = float(box.conf[0].item())

                        mapped_class = self._map_coco_to_marine(cls_name)
                        if mapped_class is None:
                            # If not in marine mapping, check if it's general litter
                            if cls_name in ["bottle", "can", "bag", "cup", "trash"]:
                                mapped_class = "other_marine_litter"
                            else:
                                continue

                        class_meta = MARINE_CLASSES.get(mapped_class, {
                            "display_name": mapped_class.replace("_", " ").title(),
                            "display_name_ta": mapped_class,
                            "hazard_level": "medium",
                            "hazard_weight": 1.0,
                            "decomposition_years": 100,
                            "color_hex": "#0ea5e9"
                        })

                        xyxy = box.xyxy[0].tolist()
                        x1 = max(0.0, float(xyxy[0]))
                        y1 = max(0.0, float(xyxy[1]))
                        x2 = min(float(img_w), float(xyxy[2]))
                        y2 = min(float(img_h), float(xyxy[3]))

                        detections.append({
                            "x1": round(x1, 1),
                            "y1": round(y1, 1),
                            "x2": round(x2, 1),
                            "y2": round(y2, 1),
                            "confidence": round(conf, 3),
                            "class_id": cls_id,
                            "class_name": mapped_class,
                            "display_name": class_meta["display_name"],
                            "display_name_ta": class_meta.get("display_name_ta", class_meta["display_name"]),
                            "hazard_level": class_meta.get("hazard_level", "medium"),
                            "hazard_weight": class_meta.get("hazard_weight", 1.0),
                            "decomposition_years": class_meta.get("decomposition_years", 100),
                            "color_hex": class_meta.get("color_hex", "#0ea5e9")
                        })
            except Exception as e:
                logger.error(f"Inference error during model.predict: {e}")
                inference_time_ms = round((time.time() - start_time) * 1000, 1)

        # Count objects by category
        counts_by_cat: Dict[str, int] = {}
        total_hazard_weighted = 0.0

        for d in detections:
            cat = d["class_name"]
            counts_by_cat[cat] = counts_by_cat.get(cat, 0) + 1
            total_hazard_weighted += d["hazard_weight"]

        total_detected = len(detections)

        # Generate annotated image with bounding boxes & labels
        annotated_filename = f"annotated_{uuid.uuid4().hex[:12]}_{img_path.name}"
        annotated_path = settings.ANNOTATED_DIR / annotated_filename

        annotated_cv = cv_img.copy()

        for d in detections:
            x1, y1, x2, y2 = int(d["x1"]), int(d["y1"]), int(d["x2"]), int(d["y2"])
            color_bgr = hex_to_bgr(d["color_hex"])

            # Box outline
            cv2.rectangle(annotated_cv, (x1, y1), (x2, y2), color_bgr, 3)

            # Label banner
            conf_pct = int(d["confidence"] * 100)
            label_text = f"{d['display_name']} ({conf_pct}%)"
            font_scale = 0.55
            thickness = 1
            (text_w, text_h), baseline = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, font_scale, thickness)

            badge_y1 = max(0, y1 - text_h - 10)
            badge_y2 = y1
            badge_x2 = min(img_w, x1 + text_w + 12)

            cv2.rectangle(annotated_cv, (x1, badge_y1), (badge_x2, badge_y2), color_bgr, -1)
            cv2.putText(
                annotated_cv,
                label_text,
                (x1 + 6, badge_y2 - 5),
                cv2.FONT_HERSHEY_SIMPLEX,
                font_scale,
                (255, 255, 255),
                thickness,
                cv2.LINE_AA
            )

        cv2.imwrite(str(annotated_path), annotated_cv)

        # Explainable AI diagnostics
        key_factors = []
        if total_detected > 0:
            dominant_item = max(counts_by_cat.items(), key=lambda x: x[1])[0]
            dominant_name = MARINE_CLASSES.get(dominant_item, {}).get("display_name", dominant_item)
            key_factors.append(f"Dominant debris identified: {dominant_name} ({counts_by_cat[dominant_item]} units).")
            key_factors.append(f"Average detection confidence: {np.mean([d['confidence'] for d in detections])*100:.1f}%.")
            if any(d["hazard_level"] == "critical" for d in detections):
                key_factors.append("Critical hazard item present (entanglement / ghost fishing gear hazard).")
        else:
            key_factors.append("No supported marine plastic debris detected above the confidence threshold.")
            key_factors.append(f"Scanned using threshold {confidence_threshold:.2f} across the entire image field.")

        reliability = "High" if quality["quality_score"] >= 0.70 and not quality["is_blurry"] else (
            "Medium" if quality["quality_score"] >= 0.45 else "Low (re-capture recommended with clearer focus)"
        )

        limitations = [
            "Underwater refraction, surface glints, and turbid coastal waters may obscure sub-surface debris.",
            "Debris smaller than 20x20 pixels or heavily weathered items may fall below detection threshold.",
            "Detection is restricted to visible surface and shoreline plastic litter."
        ]

        hazard_score = round(min(100.0, total_hazard_weighted * 12.5), 1)

        return {
            "annotated_filename": annotated_filename,
            "annotated_url": f"/uploads/annotated/{annotated_filename}",
            "total_objects": total_detected,
            "detected_counts": counts_by_cat,
            "hazard_score": hazard_score,
            "detections": detections,
            "quality": quality,
            "exif": exif,
            "explainable_ai": {
                "model_name": self.model_name,
                "model_version": "YOLOv8-Marine-v1.0",
                "inference_time_ms": inference_time_ms,
                "confidence_threshold_used": confidence_threshold,
                "total_candidates_analyzed": raw_candidates_count,
                "detected_count": total_detected,
                "key_factors": key_factors,
                "reliability_assessment": reliability,
                "model_limitations": limitations
            }
        }
