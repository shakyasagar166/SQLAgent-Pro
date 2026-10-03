import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Table, 
  Key, 
  ChevronDown, 
  ChevronRight, 
  Hash, 
  Search, 
  RefreshCw,
  Eye,
  X
} from 'lucide-react';

export default function SchemaViewer({ onSelectTable, onRefreshSchema }) {
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTables, setExpandedTables] = useState({});
  const [activeSampleTable, setActiveSampleTable] = useState(null);

  const fetchSchema = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/schema');
      const json = await res.json();
      if (json.data) {
        setSchema(json.data);
        // Expand first 2 tables by default
        const initExpanded = {};
        if (json.data.tables) {
          json.data.tables.slice(0, 2).forEach(t => {
            initExpanded[t.table_name] = true;
          });
        }
        setExpandedTables(initExpanded);
      }
    } catch (e) {
      console.error("Failed to load schema", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchema();
  }, []);

  const toggleTable = (tableName) => {
    setExpandedTables(prev => ({
      ...prev,
      [tableName]: !prev[tableName]
    }));
  };

  const filteredTables = schema?.tables?.filter(tbl => 
    tbl.table_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tbl.columns.some(col => col.name.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  return (
    <div className="glass-panel-sql rounded-2xl p-5 flex flex-col h-full transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Database Schema</h2>
            <p className="text-[11px] text-slate-400">
              {schema ? `${schema.total_tables} Tables • ${schema.total_rows} Rows` : 'Loading...'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchSchema}
          disabled={loading}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Refresh schema"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter tables or columns..."
          className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
        />
      </div>

      {/* Table List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[500px]">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Loading database schema...
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            No matching tables or columns found.
          </div>
        ) : (
          filteredTables.map((tbl) => {
            const isExpanded = !!expandedTables[tbl.table_name];
            return (
              <div 
                key={tbl.table_name}
                className="rounded-xl border border-white/5 bg-slate-900/50 overflow-hidden transition-all duration-200"
              >
                {/* Table Header Bar */}
                <div 
                  onClick={() => toggleTable(tbl.table_name)}
                  className="px-3 py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/60 select-none"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <Table className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-xs font-semibold text-slate-200">
                      {tbl.table_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {tbl.row_count} rows
                    </span>
                    {tbl.sample_rows && tbl.sample_rows.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSampleTable(tbl);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50"
                        title="View sample record"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Columns List (When Expanded) */}
                {isExpanded && (
                  <div className="px-3 pb-2.5 pt-1 border-t border-white/5 space-y-1 bg-slate-950/40">
                    {tbl.columns.map((col) => (
                      <div 
                        key={col.name}
                        className="flex items-center justify-between text-[11px] py-1 px-1.5 rounded hover:bg-slate-800/40"
                      >
                        <div className="flex items-center gap-1.5 font-mono">
                          {col.is_primary_key ? (
                            <Key className="w-3 h-3 text-amber-400 flex-shrink-0" />
                          ) : (
                            <span className="w-3 h-3 text-slate-600 inline-block text-center">•</span>
                          )}
                          <span className={col.is_primary_key ? "text-amber-200 font-bold" : "text-slate-300"}>
                            {col.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {col.data_type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Sample Row Modal */}
      {activeSampleTable && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel-sql rounded-2xl max-w-lg w-full p-6 space-y-4 border border-white/20">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  Sample Record: <span className="font-mono text-cyan-300">{activeSampleTable.table_name}</span>
                </h3>
              </div>
              <button
                onClick={() => setActiveSampleTable(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto">
              <pre className="text-xs font-mono p-4 rounded-xl bg-slate-950 text-slate-300 border border-white/5 overflow-x-auto">
                {JSON.stringify(activeSampleTable.sample_rows, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
