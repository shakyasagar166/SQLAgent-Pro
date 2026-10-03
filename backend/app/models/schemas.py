from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field
from datetime import datetime, timezone


class TableColumn(BaseModel):
    name: str
    data_type: str
    is_primary_key: bool = False
    not_null: bool = False
    default_value: Optional[str] = None


class TableSchema(BaseModel):
    table_name: str
    columns: List[TableColumn] = Field(default_factory=list)
    row_count: int = 0
    sample_rows: List[Dict[str, Any]] = Field(default_factory=list)


class DatabaseSchema(BaseModel):
    database_name: str
    tables: List[TableSchema] = Field(default_factory=list)
    total_tables: int = 0
    total_rows: int = 0


class ExecutionResult(BaseModel):
    columns: List[str] = Field(default_factory=list)
    rows: List[Dict[str, Any]] = Field(default_factory=list)
    row_count: int = 0
    execution_time_ms: float = 0.0
    is_truncated: bool = False


class ChartSuggestion(BaseModel):
    chart_type: str = "none"  # "bar" | "line" | "pie" | "none"
    x_axis: Optional[str] = None
    y_axis: Optional[str] = None
    title: Optional[str] = None


class QueryResponse(BaseModel):
    question: str
    generated_sql: str
    sql_explanation: str
    execution_result: Optional[ExecutionResult] = None
    business_insights: str
    suggested_visualization: Optional[ChartSuggestion] = None
    follow_up_questions: List[str] = Field(default_factory=list)
    query_optimization_tips: Optional[str] = None
    error: Optional[str] = None
    executed_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class QueryRequest(BaseModel):
    question: str = Field(min_length=3, description="Natural language question to convert to SQL")
    database_path: Optional[str] = None
    provider: Optional[str] = None
    execute_query: bool = True


class RawQueryRequest(BaseModel):
    sql: str = Field(min_length=6, description="SQL query to execute directly")
    database_path: Optional[str] = None


class APIResponse(BaseModel):
    success: bool = True
    message: str = "Success"
    data: Optional[Any] = None
    error: Optional[str] = None
