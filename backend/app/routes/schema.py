from fastapi import APIRouter, HTTPException, status
from typing import Optional

from app.models.schemas import APIResponse, DatabaseSchema
from app.utils.db_utils import get_schema_info, resolve_db_path

router = APIRouter(prefix="/api/schema", tags=["Database Schema"])


@router.get(
    "",
    response_model=APIResponse,
    summary="Get full database schema",
    description="Inspects tables, columns, primary keys, foreign keys, row counts, and sample records."
)
async def get_full_schema(db_path: Optional[str] = None):
    try:
        resolved = resolve_db_path(db_path)
        schema: DatabaseSchema = get_schema_info(resolved)
        return APIResponse(
            success=True,
            message=f"Schema reflected for {schema.database_name} with {schema.total_tables} tables.",
            data=schema.model_dump()
        )
    except FileNotFoundError as fnf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(fnf))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Schema inspection failed: {str(exc)}")


@router.get(
    "/tables",
    response_model=APIResponse,
    summary="List database table names"
)
async def list_tables(db_path: Optional[str] = None):
    try:
        resolved = resolve_db_path(db_path)
        schema = get_schema_info(resolved)
        tables = [t.table_name for t in schema.tables]
        return APIResponse(success=True, message="Tables listed", data=tables)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))
