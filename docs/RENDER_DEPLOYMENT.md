# Step-by-Step Render Deployment Guide for AquaTrace AI

This guide walks you through deploying **AquaTrace AI** onto **[Render.com](https://render.com/)**.

---

## 🚀 Method 1: One-Click Blueprint Deployment (Recommended)

Render Blueprints read the [`render.yaml`](../render.yaml) file in your repository and automatically sets up both your Backend (Web Service) and Frontend (Static Site) with all environment variables linked!

### Step 1: Push Code to GitHub
Open PowerShell or Terminal in your project root and push to a new GitHub repository:

```bash
git init
git add .
git commit -m "Initial commit of AquaTrace AI Platform"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

### Step 2: Deploy on Render
1. Go to **[dashboard.render.com](https://dashboard.render.com/)** and log in (or sign up with GitHub).
2. Click **New +** in the top navigation bar.
3. Select **Blueprint**.
4. Connect your GitHub account and choose your **`Plastic_pollution_TrackingSystem`** repository.
5. Render will automatically detect `render.yaml` and show:
   - **`aquatrace-backend`**: Docker Web Service running FastAPI + YOLOv8 + SQLite with 1GB persistent storage.
   - **`aquatrace-frontend`**: High-speed Static Site hosting React + Leaflet + Tailwind.
6. Click **Apply**.
7. Render will build both services. Within 3–4 minutes:
   - Your backend will be live at `https://aquatrace-backend.onrender.com`
   - Your frontend will be live at `https://aquatrace-frontend.onrender.com`

---

## 🛠️ Method 2: Manual Setup on Render (Step-by-Step)

If you prefer to configure the services manually on Render:

### Part A: Deploy the Backend Web Service
1. On Render Dashboard, click **New +** → **Web Service**.
2. Select your GitHub repository.
3. Choose **Docker** as the Runtime:
   - **Name**: `aquatrace-backend`
   - **Region**: Oregon (or nearest to you)
   - **Branch**: `main`
   - **Dockerfile Path**: `./Dockerfile`
   - **Instance Type**:
     - *Free*: 512 MB RAM (good for light testing; may sleep after 15 min of inactivity).
     - *Starter* ($7/mo): 1 GB RAM (recommended for continuous YOLO neural inference).
4. Add **Environment Variables**:
   - `ENVIRONMENT` = `production`
   - `ALLOWED_ORIGINS` = `*`
   - `DEFAULT_CONFIDENCE_THRESHOLD` = `0.28`
   - `USE_ENVIRONMENTAL_FALLBACK` = `true`
5. *(Optional but Recommended)* Add a **Disk**:
   - Go to the **Disks** tab under your Web Service.
   - Click **Add Disk** → Name: `uploads-data`, Mount Path: `/app/uploads`, Size: `1 GB`.
6. Click **Create Web Service**.
7. Copy your backend URL (e.g., `https://aquatrace-backend.onrender.com`).

---

### Part B: Deploy the Frontend Static Site
1. On Render Dashboard, click **New +** → **Static Site**.
2. Select your GitHub repository.
3. Configure the build:
   - **Name**: `aquatrace-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add **Environment Variable**:
   - `VITE_API_URL` = `https://aquatrace-backend.onrender.com` *(paste your backend URL from Part A)*
5. Add **Redirects / Rewrites**:
   - In the **Redirects/Rewrites** section of your Static Site settings:
     - Type: `Rewrite`
     - Source: `/*`
     - Destination: `/index.html`
   *(This ensures client-side tabs and routing work smoothly on refresh)*.
6. Click **Create Static Site**.

---

## 🔍 Verification After Deployment

Once both services show **"Live"**:
1. Open your Frontend URL: `https://aquatrace-frontend.onrender.com`.
2. Check the green beacon in the header — it should display **"YOLOv8 Online"**.
3. Go to **AI Detection** tab and upload a test coastal photo to confirm neural bounding boxes render.
4. Go to **Pollution Map** and verify that Leaflet pins and DBSCAN hotspot circles display.
5. Access Backend Swagger Docs at: `https://aquatrace-backend.onrender.com/docs`.

---

## 💡 Tips for Render Free Tier

- **Preventing Sleep**: Free web services sleep after 15 minutes of inactivity. You can use free monitoring tools like [UptimeRobot](https://uptimerobot.com/) or [Cron-Job.org](https://cron-job.org/) to ping `https://aquatrace-backend.onrender.com/api/health` every 10 minutes to keep it awake!
- **Memory Consumption**: Our Docker container pre-downloads `yolov8n.pt` and runs headless OpenCV, keeping resting memory under ~350MB, fitting comfortably within Render's free tier.
