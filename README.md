# AquaTrace AI — Marine Plastic Pollution Tracking, Trajectory Prediction & Smart Cleanup Intelligence Platform

**Tagline:** *Detect. Track. Predict. Protect Our Oceans.*

---

## 🌊 Overview

**AquaTrace AI** is an end-to-end, full-stack, AI-powered marine environmental intelligence platform engineered to combat coastal and oceanic plastic pollution. Built for single developers, conservation authorities, research institutions, and cleanup fleets, AquaTrace AI unites **computer vision neural object detection**, **geospatial DBSCAN clustering**, **Lagrangian oceanographic drift trajectory prediction**, and **2-opt TSP route optimization** into a unified, high-performance web dashboard.

---

## 🏗️ System Architecture

```
                                  +----------------------------------------------------+
                                  |            Modern Marine Web UI (Vite)             |
                                  |    React 18 + TypeScript + Tailwind CSS + Lucide   |
                                  |    Leaflet GIS Dark Maps + Recharts Data Viz       |
                                  |       English & தமிழ் (Tamil) Localization         |
                                  +-------------------------+--------------------------+
                                                            |
                                                     REST APIs / JSON
                                                            |
                                  +-------------------------v--------------------------+
                                  |            FastAPI Backend Engine (Python)         |
                                  +----+--------------------+--------------------+-----+
                                       |                    |                    |
        +------------------------------+                    |                    +------------------------------+
        |                                                   |                                                   |
+-------v-------------------------+       +-----------------v-------------------+       +-----------------------v-------------------+
|  AI Computer Vision Engine      |       |  Geospatial Hotspot Engine          |       |  Environmental Drift Simulation           |
|  - Ultralytics YOLOv8 Inference |       |  - DBSCAN Spatial Density Cluster   |       |  - Lagrangian Advection-Diffusion Model   |
|  - Laplacian Focal Blur Checks  |       |  - Haversine Distance Metric        |       |  - 3% Wind Leeway Surface Drag            |
|  - EXIF GPS Coordinate Parser   |       |  - Multi-factor HPI Scoring Formula |       |  - 24h / 72h / 7-Day Forecast Horizons    |
|  - Explainable AI (XAI) Factors |       |  - Recency Decay (14-day half-life) |       |  - Probabilistic Coastal Beaching Risk    |
+---------------------------------+       +-------------------------------------+       +-------------------------------------------+
        |                                                   |                                                   |
        +------------------------------+                    |                    +------------------------------+
                                       |                    |                    |
                                  +----v--------------------v--------------------v-----+
                                  |          Spatial SQLite / PostGIS Database         |
                                  |  Observations • Hotspots • Reports • Cleanups      |
                                  +----------------------------------------------------+
```

---

## 🚀 Key Features

### 1. AI Computer Vision Engine
- **Pretrained YOLOv8 Object Detection**: Identifies 7 core marine litter classes (`plastic_bottle`, `plastic_bag`, `food_container`, `fishing_gear`, `beverage_can`, `plastic_fragment`, and `other_marine_litter`).
- **Image Quality Diagnostics**: Computes OpenCV Laplacian focal blur variance ($\sigma^2 < 65$ flags blurred coastal shots), illumination checks (underexposed/overexposed glints), and aspect ratio validation.
- **EXIF Metadata Harvester**: Automatically extracts camera make/model, original capture timestamp, and hardware GPS coordinates.
- **Explainable AI (XAI)**: Displays model latency, candidate count, dominant hazard drivers, and transparent model limitation disclaimers.
- **Annotated Visualizer**: Generates and downloads high-visibility annotated images with color-coded bounding boxes and confidence badges.

### 2. Interactive Geospatial GIS Map
- **Leaflet Dark-themed Map**: Centered on coastal waters with high-contrast CartoDB Dark Matter tiles.
- **Dynamic Cluster Layers**: Observation markers with item-count badges alongside semi-transparent DBSCAN hotspot circles colored by priority severity (Critical: Red, High: Orange, Medium: Cyan, Low: Emerald).
- **Rich Popups**: Inspection thumbnails, GPS sources (`exif_gps`, `manual_picker`), timestamps, and debris breakdowns.

### 3. Hotspot Priority Index (HPI) Engine
- **DBSCAN Density Clustering**: Groups geographically proximate observations (`eps = 2.5 km`, `min_samples = 2`).
- **Documented Mathematical Scoring Formula**:
  $$\text{HPI} = \min\left(100, \; 7.5 \cdot \ln(1 + N_{\text{waste}}) + 25 \cdot e^{-\frac{0.693 \cdot \Delta t}{14}} + 25 \cdot \frac{W_{\text{hazard}}}{2.0} + \min(15, 3.5 \cdot N_{\text{obs}})\right)$$
- **Zero Hallucination Guarantee**: Distinguishes confirmed ground observations from inferred risk; provides transparent English/Tamil diagnostic justifications.

### 4. Environmental Plastic Drift & Risk Prediction
- **Lagrangian Trajectory Physics**:
  $$\vec{v}_{\text{drift}} = \vec{v}_{\text{current}} + \beta \cdot \vec{v}_{\text{wind}} + \vec{\epsilon}$$
  where $\beta = 0.03$ represents wind leeway surface drag on floating polymers.
- **Forecast Horizons**: 24 hours, 72 hours, and 7 days.
- **Live Environmental Provider Interface**: Connects to Open-Meteo Open Marine API with automatic fallback to Coromandel Coast / Bay of Bengal hydrodynamic climatology.
- **Uncertainty Cone & Beaching Risk**: Generates expanding spatial uncertainty cones and calculates coastal landing/beaching probabilities.

### 5. Smart Cleanup Decision Support & 2-Opt TSP Routing
- **Decision Matrix**: Prioritizes targets based on waste volume, toxic polymer hazard, and drift risk.
- **Traveling Salesperson Problem (TSP) Solver**: Solves shortest visitation sequence for cleanup vessels starting and ending at a base harbor using a nearest-neighbor heuristic improved by 2-opt local search.
- **Operational Gear Recommendations**: Customizes equipment lists (e.g. line cutters for ghost gear, micro-sieves for fragments, puncture gloves).

### 6. Before-and-After Cleanup Impact Studio
- **Dual Neural Inference**: Analyzes pre-remediation and post-remediation photographs through identical YOLO pipelines.
- **Impact Metrics**: Computes absolute item reduction, percentage improvement, and physical waste collected (kg).
- **Celebratory Milestone**: Triggers dynamic canvas confetti animations upon achieving $\ge 70\%$ debris reduction.

### 7. Citizen Coastal Reporting & Admin Verification Queue
- **Public Submission Portal**: Allows citizens and fishermen to submit geotagged photos with description and waste estimate.
- **Duplicate Detection**: Computes SHA-256 hashes of incoming images to flag identical reports submitted nearby.
- **Field Officer Queue**: Administrative dashboard to approve (`verified`), reject, or flag (`investigating`) reports with an immutable audit log.

### 8. Multilingual Support
- Seamless one-click header localization between **English** and **தமிழ் (Tamil)** across all metrics, navigation, alerts, and tooltips.

---

## 💻 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Leaflet, Recharts, Canvas Confetti |
| **Backend** | Python 3.11, FastAPI, Uvicorn, Pydantic v2, Python-Multipart |
| **Computer Vision** | Ultralytics YOLOv8, PyTorch, OpenCV (Headless), Pillow |
| **Geospatial & ML** | Scikit-Learn (DBSCAN), NumPy, SciPy, Geopy (Haversine/Great-Circle) |
| **Database** | SQLite with Haversine spatial indexes (PostGIS compatible) |
| **Testing** | Pytest, FastAPI TestClient, Vite Build Pipeline |

---

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js LTS (v20+) & npm

### Quickstart (Windows Solo Developer)
Simply double-click or run:
```powershell
.\scripts\run_app.bat
# or in PowerShell:
.\scripts\run_app.ps1
```

### Manual Step-by-Step Setup

#### 1. Backend Setup
```bash
# From workspace root:
cd backend
python -m pip install -r requirements.txt

# Run initial database seeder (seeds verified coastal monitoring data)
python -c "import sys; sys.path.insert(0, '.'); from app.database.seed_data import seed_sample_data; seed_sample_data()"

# Start FastAPI server:
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API documentation is now live at: `http://127.0.0.1:8000/docs`.

#### 2. Frontend Setup
```bash
# In a separate terminal:
cd frontend
npm install
npm run dev
```
The web dashboard is now live at: `http://localhost:5173/`.

---

## 🧪 Automated Testing

Run the automated test suite covering AI inference diagnostics, DBSCAN clustering, HPI formulas, Lagrangian drift, TSP route planning, and API endpoints:
```bash
pytest backend/app/tests/test_api.py -v
```

To verify the production frontend build:
```bash
cd frontend
npm run build
```

---

## 📂 Project Structure

```
Plastic_pollution_TrackingSystem/
│
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   │   └── detector.py            # YOLOv8 marine detection & blur checks
│   │   ├── api/
│   │   │   └── endpoints.py           # REST endpoints
│   │   ├── core/
│   │   │   └── config.py              # Settings & directory configuration
│   │   ├── database/
│   │   │   ├── db.py                  # Schema & SQLite connection
│   │   │   └── seed_data.py           # Sample coastal observation seeder
│   │   ├── geospatial/
│   │   │   ├── drift_predictor.py     # Lagrangian drift physics & Open-Meteo
│   │   │   └── hotspot_engine.py      # DBSCAN clustering & HPI scoring
│   │   ├── schemas/
│   │   │   └── detection.py           # Pydantic request/response schemas
│   │   ├── services/
│   │   │   ├── cleanup_optimizer.py   # 2-opt TSP route solver
│   │   │   └── impact_analysis.py     # Before/after comparative engine
│   │   └── tests/
│   │       └── test_api.py            # Automated Pytest suite
│   ├── main.py                        # FastAPI entrypoint
│   └── requirements.txt               # Backend dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx             # Navigation header & language switch
│   │   │   └── Toast.tsx              # Toast notification system
│   │   ├── locales/
│   │   │   └── translations.ts        # English & Tamil dictionaries
│   │   ├── pages/
│   │   │   ├── AdminPage.tsx          # Field officer verification queue
│   │   │   ├── AnalyticsPage.tsx      # Repository explorer & CSV export
│   │   │   ├── BeforeAfterPage.tsx    # Cleanup impact analysis studio
│   │   │   ├── CitizenReportPage.tsx  # Citizen submission portal
│   │   │   ├── CleanupPage.tsx        # Smart cleanup route planner
│   │   │   ├── DashboardPage.tsx      # 10 core metrics dashboard & charts
│   │   │   ├── DetectionPage.tsx      # AI upload & explainable AI drawer
│   │   │   ├── HotspotsPage.tsx       # DBSCAN hotspots & HPI formula
│   │   │   ├── LandingPage.tsx        # Hero presentation & 4 pillars
│   │   │   ├── MapPage.tsx            # Leaflet interactive GIS dark map
│   │   │   ├── PredictionPage.tsx     # Drift trajectory & risk simulator
│   │   │   └── SettingsPage.tsx       # Diagnostics & model status
│   │   ├── services/
│   │   │   └── api.ts                 # Typed fetch client
│   │   ├── types/
│   │   │   └── index.ts               # TypeScript data definitions
│   │   ├── App.tsx                    # Root router & layout
│   │   ├── index.css                  # Marine styling & Leaflet overrides
│   │   └── main.tsx                   # React DOM root
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── ml/
│   └── model_config/
│       └── marine_classes.json        # Taxonomy, hazard weights & translations
│
├── scripts/
│   ├── run_app.bat                    # Windows Batch one-click launcher
│   └── run_app.ps1                    # PowerShell launcher
│
├── .env.example                       # Documented environment templates
├── .gitignore
└── README.md
```

---

## 📜 Ethical & Scientific Integrity Considerations

1. **No Hallucinated Detections**: AquaTrace AI never fabricates bounding boxes, confidence values, or coordinates.
2. **Explainable AI (XAI)**: All inferences present focal quality metrics, Laplacian variance, and model boundary conditions (e.g. sub-surface glint limitations).
3. **Citizen Data Privacy**: Public reports do not publish private reporter contact info; duplicate hashes are computed locally via SHA-256.
4. **Physical Verification**: Image count differentials are explicitly labeled as computer vision estimations, with physical collected weight (kg) recognized as the ground truth.

---

## 📄 License & Attribution
- Built with **Ultralytics YOLOv8** (AGPL-3.0 / Enterprise).
- Open ocean weather provided via **Open-Meteo Marine API** (CC BY 4.0).
- OpenStreetMap and CARTO Dark Matter cartography.
