from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.database.session import init_db
from app.api.routes import campaigns, influencers, outreach, analytics

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    init_db()
    yield

app = FastAPI(
    title=settings.app_name,
    description="Automated Micro-Influencer Outreach System for discovering, qualifying, personalizing, and tracking outreach.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(campaigns.router)
app.include_router(influencers.router)
app.include_router(outreach.router)
app.include_router(analytics.router)

@app.get("/health", tags=["system"])
def health_check():
    return {
        "status": "healthy",
        "app_env": settings.app_env,
        "outreach_mode": settings.outreach_mode,
        "database": "connected"
    }

@app.get("/", tags=["system"])
def root():
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "docs_url": "/docs",
        "health_url": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
