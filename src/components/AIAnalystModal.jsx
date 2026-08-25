import React, { useState } from 'react';
import { X, Sparkles, Send, Bot, Loader2 } from 'lucide-react';
import { generateStockReport } from '../services/geminiService';

export function AIAnalystModal({ isOpen, onClose, stock }) {
  const [query, setQuery] = useState('');
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !stock) return null;

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setReport('');
    const result = await generateStockReport(stock, query);
    setReport(result);
    setLoading(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', maxWidth: '680px', width: '100%', color: '#ffffff', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '85vh', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', boxSizing: 'border-box' }}>
        
        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0f172a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'linear-gradient(to top right, #6366f1, #7c3aed)', color: '#ffffff' }}>
              <Sparkles style={{ width: '20px', height: '20px', color: '#fde047' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: 0 }}>StockIQ AI Analyst</h3>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>Gemini Financial Reasoning for {stock.ticker} ({stock.name})</p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!report && !loading && (
            <div style={{ textAlign: 'center', padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Bot style={{ width: '48px', height: '48px', color: '#818cf8', margin: '0 auto' }} />
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: 0 }}>Ask Gemini AI about {stock.ticker}</h4>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                  Get explainable reasoning on valuation metrics, bull/bear scenarios, and bilingual investment insights.
                </p>
              </div>

              <button
                onClick={() => handleGenerate()}
                style={{ background: 'linear-gradient(to right, #059669, #0d9488)', border: 'none', color: '#ffffff', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto', fontSize: '13px' }}
              >
                <Sparkles style={{ width: '16px', height: '16px', color: '#fde047' }} />
                Generate Comprehensive Report
              </button>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '48px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Loader2 style={{ width: '32px', height: '32px', color: '#10b981', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#cbd5e1' }}>Analyzing financial statements & market data...</p>
            </div>
          )}

          {report && (
            <div style={{ background: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid #334155', fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-line', color: '#e2e8f0' }}>
              {report}
            </div>
          )}
        </div>

        {/* Prompt Form */}
        <form onSubmit={handleGenerate} style={{ padding: '16px 24px', borderTop: '1px solid #334155', background: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            type="text"
            placeholder="Ask custom question about valuation or dividend yields..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1, background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#ffffff', outline: 'none' }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ background: '#6366f1', border: 'none', color: '#ffffff', padding: '10px 16px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', opacity: loading ? 0.6 : 1 }}
          >
            <Send style={{ width: '14px', height: '14px' }} />
            Analyze
          </button>
        </form>

      </div>
    </div>
  );
}
