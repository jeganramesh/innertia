"""
Innertia Placement Shell - Main FastAPI Application
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.wsgi import WSGIMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import init_db, close_db
from app.core.redis import redis_client
from app.core.security import setup_cors, setup_rate_limiting, setup_security_headers

# Import routers from new module structure
from app.accounts.routes import router as accounts_router
from app.modules.roles import admin_router
from app.modules.colleges.router import router as colleges_router
from app.modules.roles.college_admin.router import router as college_admin_router
from app.modules.roles.staff.router import router as staff_router
from app.modules.roles.faculty.router import router as faculty_router
from app.modules.roles.trainer.router import router as trainer_router
from app.modules.roles.student.router import router as student_router

# Platform admin router
from app.modules.platform.admin.router import router as platform_admin_router

# Legacy routers for backward compatibility
from app.faculty.router import router as legacy_faculty_router
from app.student.router import router as legacy_student_router
from app.ai_notes.router import router as ai_notes_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown events.
    """
    # Startup
    print("Starting Innertia Placement Shell...")
    
    # Initialize database
    await init_db()
    print("Database initialized.")
    
    # Connect to Redis
    await redis_client.connect()
    print("Redis connected.")
    
    yield
    
    # Shutdown
    print("Shutting down Innertia Placement Shell...")
    
    # Disconnect from Redis
    await redis_client.disconnect()
    
    # Close database connections
    await close_db()
    
    print("Shutdown complete.")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="""
    Innertia Placement Shell Authentication API.
    
    ## Features
    - JWT-based authentication with access and refresh tokens
    - Role-based access control (student, faculty, admin)
    - Secure password hashing with bcrypt
    - Token blacklisting for logout
    - Rate limiting for security
    
    ## Authentication
    All protected endpoints require a valid JWT access token in the Authorization header:
    ```
    Authorization: Bearer <access_token>
    ```
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# Setup security middleware
setup_cors(app)
setup_security_headers(app)
setup_rate_limiting(app)

# Include routers - New modular structure
app.include_router(accounts_router, prefix=settings.API_V1_PREFIX)

# Admin routes
app.include_router(admin_router, prefix=settings.API_V1_PREFIX)

# Platform admin routes
app.include_router(platform_admin_router, prefix=settings.API_V1_PREFIX)

# College routes (all roles)
app.include_router(colleges_router, prefix=settings.API_V1_PREFIX)

# Role-specific routes
app.include_router(college_admin_router, prefix=settings.API_V1_PREFIX)
app.include_router(staff_router, prefix=settings.API_V1_PREFIX)
app.include_router(faculty_router, prefix=settings.API_V1_PREFIX)
app.include_router(trainer_router, prefix=settings.API_V1_PREFIX)
app.include_router(student_router, prefix=settings.API_V1_PREFIX)

# Legacy role routers (backward compatibility)
app.include_router(legacy_faculty_router, prefix=settings.API_V1_PREFIX)
app.include_router(legacy_student_router, prefix=settings.API_V1_PREFIX)

# Legacy AI notes router
app.include_router(ai_notes_router, prefix=settings.API_V1_PREFIX)


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint.
    Returns the health status of the application.
    """
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": "1.0.0"
    }


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """
    Root endpoint.
    Returns basic API information.
    """
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "docs": "/api/docs",
        "health": "/health"
    }


# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """
    Global exception handler.
    Returns a generic error response for unhandled exceptions.
    """
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal error occurred. Please try again later."
        }
    )
