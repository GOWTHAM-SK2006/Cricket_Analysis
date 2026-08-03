from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import chat, recommendation, health
from app.utils.logger import logger, RequestLoggingMiddleware

app = FastAPI(
    title=settings.APP_NAME,
    description="Enterprise AI Cricket Coach Microservice for Cullinan Performance Index (CPI) Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Logging Middleware
app.add_middleware(RequestLoggingMiddleware)

# Include API Routers
app.include_router(chat.router)
app.include_router(recommendation.router)
app.include_router(health.router)

@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting {settings.APP_NAME} in {settings.APP_ENV} mode...")
    logger.info(f"Groq Model configured: {settings.GROQ_MODEL}")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info(f"Shutting down {settings.APP_NAME}...")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=(settings.APP_ENV == "development")
    )
