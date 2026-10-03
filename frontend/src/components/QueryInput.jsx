import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Play, 
  Cpu, 
  CornerDownLeft, 
  X, 
  Zap, 
  TrendingUp,
  RefreshCw
} from 'lucide-react';

export default function QueryInput({
  question,
  onQuestionChange,
  onSubmitQuery,
  isLoading,
  selectedProvider,
  onProviderChange
}) {
  const [presets, setPresets] = useState([]);

  useEffect(() => {
    fetch('/api/query/presets')
      .then(res => res.json())
      .then(json => {
        if (json.data && Array.isArray(json.data)) {
          setPresets(json.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isLoading && question.trim()) {
        onSubmitQuery();
      }
    }
  };

  return (
    <div className="glass-panel-sql rounded-2xl p-6 sm:p-7 space-y-4 transition-all duration-300">
      {/* Top Header & Model Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Ask In Plain English</span>
          </h2>
          <p className="text-xs text-slate-400">
            Translates business questions into production-grade, read-only SQL queries
          </p>
        </div>

        {/* Model Engine Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Model:
          </span>
          <select
            value={selectedProvider}
            onChange={(e) => onProviderChange(e.target.value)}
            className="bg-slate-900 border border-white/10 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 font-semibold cursor-pointer"
          >
            <option value="gemini">Google Gemini 2.5 Flash</option>
            <option value="groq">Groq (Llama-3.3 70B)</option>
            <option value="openai">OpenAI (GPT-4o Mini)</option>
            <option value="mock">Offline Smart Engine</option>
          </select>
        </div>
      </div>

      {/* Preset Question Chips */}
      {presets.length > 0 && (
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            1-Click Sample Analytics Questions:
          </span>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onQuestionChange(preset.question)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/40 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <TrendingUp className="w-3 h-3 text-cyan-400" />
                <span>{preset.question}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Textarea Input */}
      <div className="relative">
        <textarea
          value={question}
          onChange={(e) => onQuestionChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={4}
          placeholder="e.g. Which customer tier has the highest average spending, and how many orders did they place? or Show top 5 products by revenue..."
          className="w-full bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 resize-none font-sans leading-relaxed"
        />

        {question && (
          <button
            type="button"
            onClick={() => onQuestionChange('')}
            className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Clear prompt"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/10 font-mono text-[10px] text-slate-400">
            Ctrl + Enter
          </span>
          <span>to execute query</span>
        </div>

        <button
          type="button"
          onClick={onSubmitQuery}
          disabled={isLoading || !question.trim()}
          className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-lg ${
            isLoading || !question.trim()
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Generating SQL & Fetching Data...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Execute SQL Agent</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
