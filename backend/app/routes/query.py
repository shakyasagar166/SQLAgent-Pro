from fastapi import APIRouter, HTTPException, status
from typing import Optional

from app.models.schemas import (
    APIResponse,
    QueryRequest,
    QueryResponse,
    RawQueryRequest,
    ExecutionResult,
)
from app.services.sql_agent import SQLAgent
from app.utils.db_utils import execute_query_safe, resolve_db_path

router = APIRouter(prefix="/api/query", tags=["Text-to-SQL Query Engine"])

agent = SQLAgent()

PRESET_BUSINESS_QUERIES = [
    {
        "id": "top-products",
        "category": "Sales & Revenue",
        "question": "What are the top 5 best selling products by total revenue?",
        "description": "Aggregates revenue and units sold per product."
    },
    {
        "id": "country-spending",
        "category": "Geographic Analytics",
        "question": "Show total revenue, order count, and average order value by customer country.",
        "description": "Ranks customer countries by spending power."
    },
    {
        "id": "tier-distribution",
        "category": "Customer Intelligence",
        "question": "Break down customer count, total orders, and total revenue across membership tiers.",
        "description": "Compares Platinum, Gold, Silver, and Bronze member performance."
    },
    {
        "id": "category-ratings",
        "category": "Catalog Insights",
        "question": "Which product categories have the highest average customer ratings?",
        "description": "Evaluates customer satisfaction by category."
    },
    {
        "id": "recent-transactions",
        "category": "Operations",
        "question": "Show the 10 most recent customer orders with customer name, status, and amount.",
        "description": "Tracks order fulfillment pipeline."
    }
]


@router.post(
    "/generate",
    response_model=APIResponse,
    summary="Translate Natural Language to SQL & Execute",
    description="Uses LLM to synthesize SQL query from plain English question, validates safety, executes read-only query, and returns results with charts and business insights."
)
async def generate_and_run_sql(payload: QueryRequest):
    if len(payload.question.strip()) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question is too short. Please provide a clear question."
        )

    try:
        response: QueryResponse = agent.process_query(payload)
        return APIResponse(
            success=True,
            message="Query translated and executed successfully.",
            data=response.model_dump()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Query agent error: {str(exc)}"
        )


@router.post(
    "/execute-raw",
    response_model=APIResponse,
    summary="Execute validated raw SQL query",
    description="Allows users to edit and execute raw SELECT queries with read-only sandbox safety checks."
)
async def execute_raw_sql(payload: RawQueryRequest):
    try:
        db_path = resolve_db_path(payload.database_path)
        result: ExecutionResult = execute_query_safe(db_path, payload.sql)
        return APIResponse(
            success=True,
            message=f"Executed query in {result.execution_time_ms}ms ({result.row_count} rows).",
            data=result.model_dump()
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Execution error: {str(exc)}")


@router.get(
    "/presets",
    response_model=APIResponse,
    summary="Get preset natural language queries",
    description="Returns pre-configured questions for 1-click test drive."
)
async def get_presets():
    return APIResponse(
        success=True,
        message="Preset queries loaded.",
        data=PRESET_BUSINESS_QUERIES
    )
