import os
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from app.routes.schema import router as schema_router
from app.routes.query import router as query_router
from app.utils.db_utils import resolve_db_path, get_schema_info

load_dotenv()

app = FastAPI(
    title="SQLAgent Pro API",
    description="Autonomous Natural Language to SQL AI Agent & Analytics Studio",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Setup
cors_origins_env = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:3000"
)
origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(schema_router)
app.include_router(query_router)


@app.get("/", tags=["General"])
async def root():
    return {
        "project": "SQLAgent Pro",
        "description": "AI-Powered Text-to-SQL Analytics Agent",
        "version": "1.0.0",
        "status": "online",
        "docs": "/docs",
        "endpoints": {
            "schema_inspection": "/api/schema",
            "query_generation": "/api/query/generate",
            "query_presets": "/api/query/presets",
            "health_check": "/health"
        }
    }


@app.get("/health", tags=["General"])
async def health_check():
    provider = os.getenv("LLM_PROVIDER", "gemini")
    has_gemini = bool(os.getenv("GEMINI_API_KEY") and os.getenv("GEMINI_API_KEY") != "your_gemini_api_key_here")
    has_openai = bool(os.getenv("OPENAI_API_KEY") and os.getenv("OPENAI_API_KEY") != "your_openai_api_key_here")
    has_groq = bool(os.getenv("GROQ_API_KEY") and os.getenv("GROQ_API_KEY") != "your_groq_api_key_here")

    # Check database status
    db_connected = False
    table_count = 0
    try:
        resolved_db = resolve_db_path()
        schema = get_schema_info(resolved_db)
        db_connected = True
        table_count = schema.total_tables
    except Exception:
        pass

    return {
        "status": "healthy",
        "database": {
            "connected": db_connected,
            "tables_found": table_count,
            "path": resolve_db_path()
        },
        "configured_provider": provider,
        "keys_configured": {
            "gemini": has_gemini,
            "openai": has_openai,
            "groq": has_groq,
        },
        "mode": "live_llm" if (has_gemini or has_openai or has_groq) else "heuristic_fallback"
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "Internal server error occurred.",
            "error": str(exc),
            "path": request.url.path
        }
    )


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8001))
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
