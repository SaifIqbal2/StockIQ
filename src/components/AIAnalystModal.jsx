import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, Sparkles, Send, Bot, Loader2, RefreshCw, FileText, CheckCircle } from 'lucide-react';
import { generateStockReport } from '../services/geminiService';

// Cleans malformed markdown, unclosed syntax, or redundant bullet dashes
function cleanMarkdownText(rawText) {
  if (!rawText) return '';
  return rawText
    // Clean double dashes or malformed bullet combinations
    .replace(/^[\s]*[-*][\s]+[-*][\s]*/gm, '- ')
    .replace(/^[\s]*[-*][\s]*\*\*/gm, '- **')
    // Remove raw HTML script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .trim();
}

export function AIAnalystModal({ isOpen, onClose, stock }) {
  const [query, setQuery] = useState('');
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !stock) return null;

  const handleGenerate = async (customPrompt = '') => {
    const finalPrompt = customPrompt || query;
    setLoading(true);
    setReport('');
    try {
      const result = await generateStockReport(stock, finalPrompt);
      setReport(cleanMarkdownText(result));
    } catch (e) {
      setReport(`⚠️ Error generating report: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (promptText) => {
    setQuery(promptText);
    handleGenerate(promptText);
  };

  const quickPrompts = [
    'Analyze Bull & Bear Investment Cases',
    'Explain Dividend Sustainability & Yield',
    'Valuation Multiples vs PSX Sector'
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', maxWidth: '720px', width: '100%', color: '#ffffff', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '88vh', boxShadow: '0 25px 50px rgba(0,0,0,0.7)', boxSizing: 'border-box' }}>
        
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0f172a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'linear-gradient(to top right, #6366f1, #7c3aed)', color: '#ffffff' }}>
              <Sparkles style={{ width: '18px', height: '18px', color: '#fde047' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', margin: 0 }}>StockIQ AI Analyst</h3>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>Institutional Gemini Financial Reasoning for {stock.ticker} ({stock.name})</p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Quick Starter Suggestions */}
          {!report && !loading && (
            <div style={{ textAlign: 'center', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Bot style={{ width: '44px', height: '44px', color: '#818cf8', margin: '0 auto' }} />
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: 0 }}>Ask Gemini AI about {stock.ticker}</h4>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px', maxWidth: '480px', margin: '6px auto 0' }}>
                  Institutional-grade evaluation covering PSX valuation multiples, growth catalysts, and bilingual investment insights.
                </p>
              </div>

              {/* Quick Prompt Badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '4px' }}>
                {quickPrompts.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickPrompt(q)}
                    style={{ background: '#0f172a', border: '1px solid #334155', color: '#cbd5e1', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease' }}
                  >
                    ✨ {q}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleGenerate()}
                style={{ background: 'linear-gradient(to right, #059669, #0d9488)', border: 'none', color: '#ffffff', padding: '10px 22px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', margin: '8px auto 0', fontSize: '13px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}
              >
                <Sparkles style={{ width: '16px', height: '16px', color: '#fde047' }} />
                Generate Comprehensive Report
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '48px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Loader2 style={{ width: '32px', height: '32px', color: '#10b981', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#cbd5e1' }}>Generating Gemini 2.5 Flash financial analysis...</p>
            </div>
          )}

          {/* Formatted Markdown Output */}
          {report && !loading && (
            <div style={{ background: '#0f172a', padding: '20px 22px', borderRadius: '12px', border: '1px solid #334155', fontSize: '13px', color: '#e2e8f0' }}>
              <ReactMarkdown
                components={{
                  h1: ({ node, ...props }) => <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', marginTop: '16px', marginBottom: '8px', borderBottom: '1px solid #1e293b', paddingBottom: '6px' }} {...props} />,
                  h2: ({ node, ...props }) => <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#38bdf8', marginTop: '14px', marginBottom: '8px' }} {...props} />,
                  h3: ({ node, ...props }) => <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#34d399', marginTop: '12px', marginBottom: '6px' }} {...props} />,
                  p: ({ node, ...props }) => <p style={{ fontSize: '13px', lineHeight: '1.6', margin: '0 0 10px 0', color: '#cbd5e1' }} {...props} />,
                  ul: ({ node, ...props }) => <ul style={{ paddingLeft: '20px', margin: '0 0 12px 0', display: 'flex', flexDirection: 'column', gap: '4px' }} {...props} />,
                  li: ({ node, ...props }) => <li style={{ fontSize: '13px', lineHeight: '1.5', color: '#e2e8f0' }} {...props} />,
                  strong: ({ node, ...props }) => <strong style={{ fontWeight: 700, color: '#ffffff' }} {...props} />,
                  blockquote: ({ node, ...props }) => <blockquote style={{ borderLeft: '3px solid #6366f1', margin: '10px 0', padding: '6px 12px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '4px', color: '#cbd5e1' }} {...props} />,
                  code: ({ node, ...props }) => <code style={{ background: '#1e293b', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }} {...props} />
                }}
              >
                {report}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Prompt Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} style={{ padding: '14px 20px', borderTop: '1px solid #334155', background: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="text"
            placeholder="Ask specific question (e.g. compare with sector P/E, 5-year growth)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1, background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '9px 14px', fontSize: '13px', color: '#ffffff', outline: 'none' }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ background: '#6366f1', border: 'none', color: '#ffffff', padding: '9px 16px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', opacity: loading ? 0.6 : 1 }}
          >
            <Send style={{ width: '14px', height: '14px' }} />
            Analyze
          </button>
        </form>

      </div>
    </div>
  );
}
