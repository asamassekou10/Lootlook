"""
LootLook API - Main Entry Point

"Snap it. Price it. Loot it."

FastAPI application that provides item identification and pricing
using AI vision and market data.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import scan


settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    print(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    if settings.GEMINI_API_KEY:
        print("Gemini API key configured")
    else:
        print("Gemini API key not set - using mock service")

    if settings.SERPAPI_KEY:
        print("SerpAPI key configured")
    else:
        print("SerpAPI key not set - using mock service")

    yield

    # Shutdown
    print("Shutting down LootLook API")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Turn your phone camera into a real-time value scanner. "
                "Photograph items to instantly unlock their market price and details.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(scan.router, prefix="/api/v1")


@app.get("/", tags=["root"])
async def root() -> dict[str, str]:
    """Root endpoint - API info."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "tagline": "Snap it. Price it. Loot it.",
        "docs": "/docs",
    }


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
