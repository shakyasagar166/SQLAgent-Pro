import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Database, 
  Zap, 
  ShieldCheck, 
  BarChart2, 
  TableProperties, 
  AlertCircle 
} from 'lucide-react';
import SchemaViewer from '../components/SchemaViewer';
import QueryInput from '../components/QueryInput';
import QueryResult from '../components/QueryResult';

export default function Home() {
  const [question, setQuestion] = useState('What are the top 5 best selling products by total revenue?');
  const [selectedProvider, setSelectedProvider] = useState('gemini');
  const [isLoading, setIsLoading] = useState(false);
  const [queryResult, setQueryResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const resultsRef = useRef(null);

  const handleExecuteQuery = async (customQ) => {
    const qToRun = customQ || question;
    if (!qToRun.trim()) return;

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/query/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: qToRun,
          provider: selectedProvider,
          execute_query: true,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.detail || json.message || 'Query synthesis failed');
      }

      setQueryResult(json.data);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } catch (err) {
      setErrorMessage(err.message || 'An error occurred while running SQLAgent.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowUp = (fq) => {
    setQuestion(fq);
    handleExecuteQuery(fq);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto space-y-4 pt-4 sm:pt-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold shadow-inner">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>Autonomous Text-to-SQL Analytics Agent & BI Studio</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
          Query Any Database In <br className="hidden sm:inline" />
          <span className="text-gradient-cyan">Plain Natural Language</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Powered by Google Gemini and advanced LLM schema reasoning. Ask complex business questions, get optimized read-only SQL, interactive data tables, and automatic chart visualizations.
        </p>
      </section>

      {/* Error Alert */}
      {errorMessage && (
        <div className="max-w-4xl mx-auto p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3 shadow-lg shadow-rose-950/20">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      {/* Main Studio Grid: Schema Explorer (Left) & Query Console (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto items-start">
        {/* Left Column: Schema Viewer (4 Cols) */}
        <div className="lg:col-span-4 h-full">
          <SchemaViewer />
        </div>

        {/* Right Column: Query Studio & Results (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <QueryInput
            question={question}
            onQuestionChange={setQuestion}
            onSubmitQuery={() => handleExecuteQuery()}
            isLoading={isLoading}
            selectedProvider={selectedProvider}
            onProviderChange={setSelectedProvider}
          />

          <div ref={resultsRef}>
            {queryResult && (
              <QueryResult 
                result={queryResult} 
                onSelectFollowUp={handleFollowUp}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
