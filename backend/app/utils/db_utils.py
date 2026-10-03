import os
import re
import time
import sqlite3
from pathlib import Path
from typing import Dict, Any, List, Tuple
from app.models.schemas import DatabaseSchema, TableSchema, TableColumn, ExecutionResult


def resolve_db_path(custom_path: str = None) -> str:
    """Locate SQLite database file relative to project root or custom path."""
    if custom_path and os.path.exists(custom_path):
        return custom_path

    env_path = os.getenv("DATABASE_PATH")
    if env_path and os.path.exists(env_path):
        return env_path

    # Candidate paths across directory structures
    current_dir = Path(__file__).resolve().parent
    candidates = [
        current_dir.parent.parent.parent / "data" / "sample_database.db",
        current_dir.parent.parent / "data" / "sample_database.db",
        Path.cwd() / "data" / "sample_database.db",
        Path.cwd() / "SQLAgent-Pro" / "data" / "sample_database.db",
    ]

    for cand in candidates:
        if cand.exists() and cand.is_file():
            return str(cand)

    return str(candidates[0])


def get_schema_info(db_path: str = None) -> DatabaseSchema:
    """Inspect SQLite database and return structured schema information."""
    resolved = resolve_db_path(db_path)
    if not os.path.exists(resolved):
        raise FileNotFoundError(f"Database file not found at: {resolved}")

    conn = sqlite3.connect(resolved)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Get list of tables (excluding sqlite internal tables)
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    table_names = [row["name"] for row in cursor.fetchall()]

    tables_info: List[TableSchema] = []
    total_db_rows = 0

    for tbl in table_names:
        # Get column info
        cursor.execute(f"PRAGMA table_info({tbl});")
        col_rows = cursor.fetchall()
        columns: List[TableColumn] = []
        for c in col_rows:
            columns.append(TableColumn(
                name=c["name"],
                data_type=c["type"] or "TEXT",
                is_primary_key=bool(c["pk"]),
                not_null=bool(c["notnull"]),
                default_value=str(c["dflt_value"]) if c["dflt_value"] is not None else None,
            ))

        # Get row count
        cursor.execute(f"SELECT COUNT(*) as cnt FROM {tbl};")
        count_res = cursor.fetchone()
        row_count = count_res["cnt"] if count_res else 0
        total_db_rows += row_count

        # Get 2 sample rows
        cursor.execute(f"SELECT * FROM {tbl} LIMIT 2;")
        sample_rows_raw = cursor.fetchall()
        sample_rows = [dict(r) for r in sample_rows_raw]

        tables_info.append(TableSchema(
            table_name=tbl,
            columns=columns,
            row_count=row_count,
            sample_rows=sample_rows
        ))

    conn.close()

    return DatabaseSchema(
        database_name=os.path.basename(resolved),
        tables=tables_info,
        total_tables=len(tables_info),
        total_rows=total_db_rows
    )


def format_schema_for_prompt(schema: DatabaseSchema) -> str:
    """Format structured schema into an LLM-friendly textual representation."""
    lines = [f"Database: {schema.database_name} ({schema.total_tables} tables)"]
    for tbl in schema.tables:
        col_desc = []
        for col in tbl.columns:
            pk = " [PRIMARY KEY]" if col.is_primary_key else ""
            nn = " [NOT NULL]" if col.not_null else ""
            col_desc.append(f"  - {col.name} ({col.data_type}){pk}{nn}")
        
        lines.append(f"\nTable: {tbl.table_name} ({tbl.row_count} rows)")
        lines.extend(col_desc)
        if tbl.sample_rows:
            lines.append("  Sample Record:")
            lines.append(f"    {tbl.sample_rows[0]}")

    return "\n".join(lines)


# Blacklist of dangerous write or destructive SQL statements
DESTRUCTIVE_KEYWORDS = [
    r"\bDROP\b",
    r"\bDELETE\b",
    r"\bUPDATE\b",
    r"\bINSERT\b",
    r"\bALTER\b",
    r"\bTRUNCATE\b",
    r"\bCREATE\b",
    r"\bREPLACE\b",
    r"\bATTACH\b",
    r"\bDETACH\b",
    r"\bPRAGMA\s+writable_schema\b",
]


def validate_sql_safety(sql: str) -> Tuple[bool, str]:
    """Ensure the SQL query is strictly read-only and safe to execute."""
    sanitized = sql.strip()
    if not sanitized:
        return False, "Query is empty."

    # Remove comments and strings to avoid false triggers
    cleaned = re.sub(r"--.*$", "", sanitized, flags=re.MULTILINE)
    cleaned = re.sub(r"/\*.*?\*/", "", cleaned, flags=re.DOTALL)

    for pattern in DESTRUCTIVE_KEYWORDS:
        if re.search(pattern, cleaned, re.IGNORECASE):
            match = re.search(pattern, cleaned, re.IGNORECASE).group(0)
            return False, f"Destructive operation '{match.upper()}' is forbidden. SQLAgent Pro is read-only."

    # Query must start with SELECT or WITH
    first_word = cleaned.split()[0].upper() if cleaned.split() else ""
    if first_word not in ("SELECT", "WITH", "EXPLAIN"):
        return False, f"Query must begin with SELECT or WITH (got: '{first_word}')."

    return True, ""


def execute_query_safe(db_path: str, sql: str, max_rows: int = 100) -> ExecutionResult:
    """Execute a validated SQL query against the SQLite database."""
    is_safe, error_msg = validate_sql_safety(sql)
    if not is_safe:
        raise ValueError(error_msg)

    resolved = resolve_db_path(db_path)
    if not os.path.exists(resolved):
        raise FileNotFoundError(f"Database not found at {resolved}")

    # Enforce safe read-only URI connection
    conn = sqlite3.connect(f"file:{resolved}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    start_time = time.perf_counter()
    try:
        cursor.execute(sql)
        columns = [desc[0] for desc in cursor.description] if cursor.description else []
        rows_raw = cursor.fetchmany(max_rows + 1)
        execution_time = (time.perf_counter() - start_time) * 1000

        is_truncated = len(rows_raw) > max_rows
        rows = [dict(r) for r in rows_raw[:max_rows]]

        return ExecutionResult(
            columns=columns,
            rows=rows,
            row_count=len(rows),
            execution_time_ms=round(execution_time, 2),
            is_truncated=is_truncated
        )
    finally:
        conn.close()
