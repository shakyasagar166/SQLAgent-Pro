"""Routes package exports."""
from app.routes.schema import router as schema_router
from app.routes.query import router as query_router

__all__ = ["schema_router", "query_router"]
