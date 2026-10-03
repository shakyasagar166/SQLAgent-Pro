import React, { useState } from 'react';
import { 
  Code2, 
  Table2, 
  BarChart3, 
  Lightbulb, 
  Copy, 
  Check, 
  Download, 
  Clock, 
  Layers, 
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

export default function QueryResult({ result, onSelectFollowUp }) {
  const [activeTab, setActiveTab] = useState('data'); // 'data' | 'chart' | 'sql'
  const [copiedSql, setCopiedSql] = useState(false);
  const [tableFilter, setTableFilter] = useState('');

  if (!result) return null;

  const {
    question,
    generated_sql,
    sql_explanation,
    execution_result,
    business_insights,
    suggested_visualization,
    follow_up_questions = [],
    query_optimization_tips,
    error,
    executed_at
  } = result;

  const handleCopySql = () => {
    navigator.clipboard.writeText(generated_sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleExportCSV = () => {
    if (!execution_result?.rows || execution_result.rows.length === 0) return;
    const cols = execution_result.columns;
    const csvRows = [
      cols.join(','),
      ...execution_result.rows.map(row => 
        cols.map(c => `"${(row[c] !== null && row[c] !== undefined ? row[c] : '').toString().replace(/"/g, '""')}"`).join(',')
      )
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SQLAgent_Result_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter rows
  const filteredRows = execution_result?.rows?.filter(r => 
    Object.values(r).some(val => 
      String(val).toLowerCase().includes(tableFilter.toLowerCase())
    )
  ) || [];

  // Chart rendering helpers
  const renderChart = () => {
    if (!execution_result?.rows || execution_result.rows.length === 0) {
      return <div className="text-center py-10 text-xs text-slate-500">No data points to chart.</div>;
    }

    const xAxisKey = suggested_visualization?.x_axis || execution_result.columns[0];
    const yAxisKey = suggested_visualization?.y_axis || execution_result.columns[1] || execution_result.columns[0];

    const chartData = execution_result.rows.slice(0, 10);
    const maxVal = Math.max(...chartData.map(d => Number(d[yAxisKey]) || 0), 1);

    return (
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span>{suggested_visualization?.title || `${yAxisKey} by ${xAxisKey}`}</span>
          </h4>
          <span className="text-[11px] text-slate-400 font-mono">
            Metric: {yAxisKey}
          </span>
        </div>

        {/* Visual Bar Chart */}
        <div className="space-y-3 pt-2">
          {chartData.map((item, idx) => {
            const label = String(item[xAxisKey] || `Item ${idx + 1}`);
            const val = Number(item[yAxisKey]) || 0;
            const percentage = Math.min(100, Math.max(8, (val / maxVal) * 100));

            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-300 truncate max-w-xs">{label}</span>
                  <span className="text-cyan-400 font-mono font-bold">
                    {typeof val === 'number' && !Number.isInteger(val) ? val.toFixed(2) : val}
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-white/5">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-700"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="glass-panel-sql rounded-2xl p-6 sm:p-7 space-y-6 transition-all duration-300 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Query Executed
            </span>
            {execution_result && (
              <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-slate-500" />
                {execution_result.execution_time_ms} ms
              </span>
            )}
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">
            "{question}"
          </h3>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('data')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'data' ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Table2 className="w-3.5 h-3.5 inline mr-1" />
            Table ({execution_result?.row_count || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chart')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'chart' ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 inline mr-1" />
            Chart
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sql')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'sql' ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 inline mr-1" />
            SQL Code
          </button>
        </div>
      </div>

      {/* Error Alert (if query failed) */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Tab 1: Interactive Data Table */}
      {activeTab === 'data' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <input
              type="text"
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              placeholder="Search in table..."
              className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 w-60"
            />
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs border border-white/10 hover:border-cyan-500/30 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="rounded-xl border border-white/10 overflow-x-auto max-h-96">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-900/90 sticky top-0 border-b border-white/10 text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  {execution_result?.columns?.map((col) => (
                    <th key={col} className="py-2.5 px-3.5 font-mono">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={execution_result?.columns?.length || 1} className="py-8 text-center text-slate-500">
                      No rows returned.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors">
                      {execution_result.columns.map((col) => (
                        <td key={col} className="py-2 px-3.5 text-slate-200">
                          {row[col] !== null && row[col] !== undefined ? String(row[col]) : <span className="text-slate-600">NULL</span>}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Visual Chart */}
      {activeTab === 'chart' && (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5">
          {renderChart()}
        </div>
      )}

      {/* Tab 3: Generated SQL Code */}
      {activeTab === 'sql' && (
        <div className="space-y-3">
          <div className="relative">
            <pre className="p-4 rounded-xl bg-slate-950 border border-white/10 text-cyan-300 font-mono text-xs overflow-x-auto leading-relaxed">
              {generated_sql}
            </pre>
            <button
              type="button"
              onClick={handleCopySql}
              className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-white/10 flex items-center gap-1 transition-all"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5 text-xs text-slate-300 space-y-1.5">
            <span className="font-bold text-white block">Query Explanation:</span>
            <p className="whitespace-pre-line leading-relaxed text-slate-400">
              {sql_explanation}
            </p>
          </div>
        </div>
      )}

      {/* Business Takeaways Card */}
      {business_insights && (
        <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 space-y-1.5">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-cyan-200 uppercase tracking-wider">
              Executive Business Takeaways
            </h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {business_insights}
          </p>
        </div>
      )}

      {/* Recommended Follow-Up Queries */}
      {follow_up_questions.length > 0 && (
        <div className="pt-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Suggested Follow-Up Analyses:
          </span>
          <div className="flex flex-wrap gap-2">
            {follow_up_questions.map((fq, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSelectFollowUp && onSelectFollowUp(fq)}
                className="px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-xs border border-white/10 hover:border-cyan-500/40 flex items-center gap-1.5 transition-all"
              >
                <span>{fq}</span>
                <ArrowRight className="w-3 h-3 text-cyan-400" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
