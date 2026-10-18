import sqlite3
import json
import os
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional

from app.core.config import settings

DB_FILE = Path(settings.DATABASE_URL.replace("sqlite:///", ""))


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_FILE))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Observations table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS observations (
        id TEXT PRIMARY KEY,
        image_filename TEXT NOT NULL,
        annotated_filename TEXT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        location_name TEXT,
        location_source TEXT DEFAULT 'unverified',
        total_objects INTEGER DEFAULT 0,
        detected_classes_json TEXT DEFAULT '{}',
        detections_detail_json TEXT DEFAULT '[]',
        quality_score REAL DEFAULT 1.0,
        is_blurry INTEGER DEFAULT 0,
        blur_variance REAL DEFAULT 0.0,
        hazard_score REAL DEFAULT 0.0,
        explainability_notes TEXT,
        verification_status TEXT DEFAULT 'pending',
        created_at TEXT NOT NULL
    );
    """)

    # Hotspots table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS hotspots (
        id TEXT PRIMARY KEY,
        cluster_id INTEGER,
        centroid_lat REAL NOT NULL,
        centroid_lon REAL NOT NULL,
        location_name TEXT,
        observation_count INTEGER DEFAULT 1,
        total_waste_count INTEGER DEFAULT 0,
        hotspot_priority_index REAL DEFAULT 0.0,
        priority_level TEXT DEFAULT 'medium',
        dominant_category TEXT,
        category_distribution_json TEXT DEFAULT '{}',
        radius_meters REAL DEFAULT 200.0,
        explanation TEXT,
        last_observed_at TEXT,
        updated_at TEXT NOT NULL
    );
    """)

    # Citizen Reports table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS citizen_reports (
        id TEXT PRIMARY KEY,
        reporter_name TEXT,
        contact_email TEXT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        location_name TEXT,
        image_filename TEXT NOT NULL,
        description TEXT,
        waste_estimate TEXT,
        observation_id TEXT,
        status TEXT DEFAULT 'submitted',
        admin_notes TEXT,
        image_hash TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (observation_id) REFERENCES observations (id)
    );
    """)

    # Cleanup Activities table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS cleanup_activities (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        location_name TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        event_date TEXT NOT NULL,
        organizer TEXT,
        volunteers_count INTEGER DEFAULT 0,
        before_image TEXT,
        after_image TEXT,
        before_observation_id TEXT,
        after_observation_id TEXT,
        before_count INTEGER DEFAULT 0,
        after_count INTEGER DEFAULT 0,
        reduction_pct REAL DEFAULT 0.0,
        verified_weight_kg REAL DEFAULT 0.0,
        status TEXT DEFAULT 'completed',
        notes TEXT,
        created_at TEXT NOT NULL
    );
    """)

    # Audit Logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        actor TEXT DEFAULT 'system',
        details_json TEXT DEFAULT '{}',
        timestamp TEXT NOT NULL
    );
    """)

    # Create Indexes for fast geospatial queries and date filtering
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_obs_lat_lon ON observations(latitude, longitude);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_obs_created ON observations(created_at);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_obs_status ON observations(verification_status);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_hotspots_lat_lon ON hotspots(centroid_lat, centroid_lon);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_reports_created ON citizen_reports(created_at);")

    conn.commit()
    conn.close()


def log_audit(action: str, entity_type: str, entity_id: str, actor: str = "system", details: dict = None):
    try:
        conn = get_db_connection()
        conn.execute(
            "INSERT INTO audit_logs (action, entity_type, entity_id, actor, details_json, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
            (action, entity_type, entity_id, actor, json.dumps(details or {}), datetime.utcnow().isoformat())
        )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error logging audit: {e}")
