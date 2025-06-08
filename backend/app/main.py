from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import logging
import time
from .routers import auth, feedback, users, analytics
from .core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="VerbatimAI API",
    description="API for analyzing and managing small business customer feedback",
    version="0.1.0",
    # Disable automatic redirect for trailing slashes
    redirect_slashes=False,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # Log request details
    logger.info(f"Request: {request.method} {request.url.path}")
    
    # Log authorization header (masked)
    auth_header = request.headers.get('Authorization')
    if auth_header:
        # Mask the token value for security
        if auth_header.startswith('Bearer '):
            logger.info(f"Authorization: Bearer [TOKEN]")
        else:
            logger.info(f"Authorization header present but not in Bearer format")
    else:
        logger.info("No Authorization header")
    
    # Process the request
    response = await call_next(request)
    
    # Log response
    process_time = time.time() - start_time
    logger.info(f"Response: {response.status_code} ({process_time:.2f}s)")
    
    return response

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(feedback.router, prefix="/api/feedback", tags=["feedback"], include_in_schema=True)
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])

@app.get("/api/health", tags=["health"])
async def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "project": settings.PROJECT_NAME
    }