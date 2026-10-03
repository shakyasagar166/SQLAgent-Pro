import os
from pathlib import Path


DEFAULT_PROMPT_TEMPLATE = """You are a Principal Database Architect and SQL Optimization Expert.
Generate an optimal SQLite query to answer the user's question based on the provided schema.

DATABASE SCHEMA:
{database_schema}

USER QUESTION:
{user_question}

OUTPUT FORMAT:
Return ONLY valid JSON matching this schema without markdown code fences:
{{
  "generated_sql": "SELECT ...",
  "sql_explanation": "Explanation of query logic, joins, filters.",
  "business_insights": "Executive interpretation of the result.",
  "suggested_visualization": {{
    "chart_type": "bar | line | pie | none",
    "x_axis": "column_name",
    "y_axis": "column_name",
    "title": "Chart Title"
  }},
  "follow_up_questions": [
    "Follow up question 1",
    "Follow up question 2"
  ],
  "query_optimization_tips": "Index or performance tips."
}}
"""


class PromptService:
    """Service to load, cache, and format SQL generation prompts."""

    def __init__(self, prompt_file_path: str = None):
        self.prompt_file_path = prompt_file_path or self._resolve_prompt_path()
        self._cached_template = None

    def _resolve_prompt_path(self) -> str:
        current_dir = Path(__file__).resolve().parent
        candidates = [
            current_dir.parent.parent.parent / "prompts" / "sql_generation.txt",
            current_dir.parent.parent / "prompts" / "sql_generation.txt",
            Path.cwd() / "prompts" / "sql_generation.txt",
            Path.cwd() / "SQLAgent-Pro" / "prompts" / "sql_generation.txt",
        ]
        for p in candidates:
            if p.exists() and p.is_file():
                return str(p)
        return ""

    def get_template(self) -> str:
        if self._cached_template:
            return self._cached_template

        if self.prompt_file_path and os.path.exists(self.prompt_file_path):
            try:
                with open(self.prompt_file_path, "r", encoding="utf-8") as f:
                    self._cached_template = f.read()
                    return self._cached_template
            except Exception:
                pass

        self._cached_template = DEFAULT_PROMPT_TEMPLATE
        return self._cached_template

    def build_prompt(self, database_schema_text: str, user_question: str) -> str:
        template = self.get_template()
        prompt = template.replace("{database_schema}", database_schema_text.strip())
        prompt = prompt.replace("{user_question}", user_question.strip())
        return prompt
