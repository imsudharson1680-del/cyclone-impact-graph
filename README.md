# Cyclone Impact Graph

**Cascading Infrastructure Failure & Pre-Landfall Decision Intelligence**

Team:
- Sudharson A
- Mohamed Muthakeen A
- Monisha

Track 5 — Cyclone Impact & Infrastructure Vulnerability

## What this project demonstrates

Cyclone Impact Graph is a hackathon MVP that models critical infrastructure as an interconnected dependency graph. A simulated cyclone creates hazard exposure; the user can select an infrastructure asset and simulate its failure. The application then propagates the failure through dependency relationships, estimates affected services, and ranks intervention priorities.

The prototype deliberately distinguishes:
- DEMO/SIMULATED hazard values
- infrastructure dependency relationships
- calculated prototype risk scores
- AI/explanation as a future/optional layer

It does **not** claim to replace official cyclone forecasting or emergency-management systems.

## Core flow

Cyclone → Wind/Rain/Surge → Hazard Exposure → Infrastructure Graph → Failure Simulation → Cascading Impact → Priority Intervention

## Features

- Interactive coastal-region map
- Simulated cyclone track and hazard radius
- Infrastructure layers: substations, roads/bridges, hospitals, shelters
- Asset risk scoring
- Dependency graph visualization
- "Simulate Failure" cascade engine
- Impacted infrastructure and services
- Priority intervention ranking
- Scenario comparison
- Event log
- Explainable calculation panel
- Responsive dashboard

## Run

### Simplest method

Open:

`frontend/index.html`

in a browser with internet access. The map uses Leaflet from a CDN.

### Optional Python backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
python app.py
```

Then open `http://127.0.0.1:8000`.

The frontend is also designed to work as a static demo if the backend is unavailable.

## Important demo note

The infrastructure and hazard values in this MVP are **illustrative simulation data**. Before claiming operational use, replace them with validated authoritative datasets, calibrated hazard models, and emergency-management review.

## Suggested 3-minute demo

1. Open Dashboard.
2. Click "Run Cyclone Scenario".
3. Select `Substation A`.
4. Click `Simulate Failure`.
5. Show the dependency chain.
6. Show affected hospital/shelter/road.
7. Open Priority Intervention.
8. Explain that the system moves from hazard mapping to cascading-impact decision support.

## Proposed future integrations

- Google Earth Engine environmental layers
- Official meteorological feeds
- Authoritative infrastructure datasets
- Validated storm-surge/flood models
- Google Gemini multimodal explanation layer
- Google Cloud deployment
- Post-event validation against historical cyclone events
