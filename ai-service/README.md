# Cullinan Performance Index (CPI) - AI Microservice

Enterprise-grade FastAPI microservice acting as an **AI Cricket Coach Assistant** for the Cullinan Performance Index (CPI) platform.

---

## 🚀 Architecture Overview

```
Next.js (Frontend)
       ↓
Spring Boot (Main Backend & Database)
       ↓
FastAPI AI Service (Microservice)
       ↓
Google Gemini API REST Client
       ↓
Gemini 2.5 Flash Lite
```

- **Spring Boot** handles business logic, authentication, PostgreSQL database storage, and assessments.
- **FastAPI AI Microservice** strictly handles AI chat processing, context injection, and structured recommendation analytics.

---

## 🛠️ Tech Stack & Requirements

- **Python 3.12**
- **FastAPI** & **Uvicorn**
- **Pydantic v2** & **Pydantic-Settings**
- **Google Gemini API** (`gemini-2.5-flash-lite`)
- **HTTPX** (Async HTTP Requests)
- **Docker**

---

## ⚙️ Environment Variables

Create a `.env` file in `ai-service/`:

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=gemini-2.5-flash-lite
APP_ENV=development
LOG_LEVEL=INFO
HOST=0.0.0.0
PORT=8000
```

---

## 🏃 Local Installation & Running

### 1. Set up Virtual Environment
```bash
python -m venv venv
# On Windows
venv\Scripts\activate
# On Linux/macOS
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run FastAPI Application
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Access Swagger Documentation:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🐳 Docker Deployment

### Build Image
```bash
docker build -t cpi-ai-service .
```

### Run Container
```bash
docker run -d -p 8000:8000 --env-file .env --name cpi-ai-microservice cpi-ai-service
```

---

## 📡 API Endpoints & Request Examples

### 1. AI Chat Endpoint (`POST /api/v1/chat`)

**Request Payload:**
```json
{
  "sessionId": "abc123session",
  "userRole": "COACH",
  "playerId": 15,
  "message": "How can I improve John's batting under pressure?",
  "context": {
    "playerName": "John",
    "age": 19,
    "role": "Batsman",
    "currentCPI": 74,
    "currentPPI": 80,
    "currentMPI": 68,
    "targetCPI": 90,
    "practiceHistory": [78, 80, 76, 82, 84],
    "matchHistory": [65, 66, 70, 68, 72],
    "coachFeedback": [
      "Good timing",
      "Needs better footwork",
      "Improve strike rotation"
    ]
  }
}
```

**Response Payload:**
```json
{
  "success": true,
  "reply": "Based on John's assessment context (PPI 80 vs MPI 68)...",
  "sessionId": "abc123session",
  "timestamp": "2026-08-02T03:00:00Z"
}
```

---

### 2. Structured Recommendation Engine (`POST /api/v1/recommendation`)

**Request Payload:**
```json
{
  "playerId": 15,
  "userRole": "COACH",
  "context": {
    "playerName": "John",
    "age": 19,
    "role": "Batsman",
    "currentCPI": 74,
    "currentPPI": 80,
    "currentMPI": 68,
    "targetCPI": 90,
    "practiceHistory": [78, 80, 76, 82, 84],
    "matchHistory": [65, 66, 70, 68, 72],
    "coachFeedback": ["Good timing", "Needs better footwork"]
  }
}
```

**Response Payload:**
```json
{
  "success": true,
  "summary": "John demonstrates strong practice discipline (PPI 80) but experiences performance drops in matches (MPI 68).",
  "strengths": ["High net practice intensity", "Good ball timing"],
  "weaknesses": ["Match pressure execution", "Spin response footwork"],
  "improvementAreas": ["Front-foot contact point", "Strike rotation"],
  "top5Drills": [
    {
      "title": "Pressure Range Hitting",
      "category": "Match Scenario",
      "description": "30 balls with target score constraints per over."
    }
  ],
  "trainingFocus": "Match-scenario simulation drills over next 2 weeks.",
  "motivationalMessage": "Focus on transferability from practice to match!",
  "timestamp": "2026-08-02T03:00:00Z"
}
```

---

### 3. Health Check (`GET /api/v1/health`)

**Response Payload:**
```json
{
  "status": "healthy",
  "service": "CPI AI Service",
  "environment": "development",
  "model": "openai/gpt-4o-mini",
  "timestamp": "2026-08-02T03:00:00Z"
}
```
