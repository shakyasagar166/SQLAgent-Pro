import logging
from typing import Optional, Dict, Any

from app.models.schemas import (
    QueryRequest,
    QueryResponse,
    ExecutionResult,
    ChartSuggestion,
)
from app.utils.db_utils import (
    get_schema_info,
    format_schema_for_prompt,
    execute_query_safe,
    resolve_db_path,
)
from app.services.llm_service import LLMService

logger = logging.getLogger(__name__)


class SQLAgent:
    """Core autonomous Agent coordinating Text-to-SQL synthesis, safety guards, and execution."""

    def __init__(self, llm_service: Optional[LLMService] = None):
        self.llm_service = llm_service or LLMService()

    def process_query(self, request: QueryRequest) -> QueryResponse:
        db_path = resolve_db_path(request.database_path)

        # 1. Fetch current schema for grounding
        schema = get_schema_info(db_path)
        schema_text = format_schema_for_prompt(schema)

        # 2. Invoke LLM for query synthesis
        llm_output = self.llm_service.generate_sql(
            schema_text=schema_text,
            question=request.question,
            provider_override=request.provider
        )

        generated_sql = llm_output.get("generated_sql", "").strip()
        explanation = llm_output.get("sql_explanation", "Query generated based on relational schema.")
        insights = llm_output.get("business_insights", "Analysis complete.")
        follow_ups = llm_output.get("follow_up_questions", [])
        optimization = llm_output.get("query_optimization_tips")
        
        vis_raw = llm_output.get("suggested_visualization")
        chart_suggestion = None
        if isinstance(vis_raw, dict):
            chart_suggestion = ChartSuggestion(**vis_raw)

        # 3. Execute query safely if requested
        execution_result = None
        error_msg = None

        if request.execute_query and generated_sql:
            try:
                execution_result = execute_query_safe(db_path, generated_sql)
            except Exception as e:
                logger.error(f"SQL execution failed: {e}")
                error_msg = str(e)

        return QueryResponse(
            question=request.question,
            generated_sql=generated_sql,
            sql_explanation=explanation,
            execution_result=execution_result,
            business_insights=insights,
            suggested_visualization=chart_suggestion,
            follow_up_questions=follow_ups,
            query_optimization_tips=optimization,
            error=error_msg
        )
