from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("Starting ChessForgeAI Backend")
    print("Backend started successfully")
    
    yield
    
    # Shutdown
    print("Shutting down ChessForgeAI Backend")


# Create FastAPI app
app = FastAPI(
    title="ChessForgeAI Backend",
    version="1.0.0",
    description="Advanced chess analysis platform with AI-powered insights",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "ChessForgeAI Backend API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "message": "Backend is running"
    }


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Global HTTP exception handler"""
    print(f"HTTP exception occurred: {exc.status_code} - {exc.detail}")
    return {"error": exc.detail, "status_code": exc.status_code}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
