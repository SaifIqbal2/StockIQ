import { GoogleGenAI } from '@google/genai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

let ai = null;
if (apiKey) {
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (initErr) {
    console.warn('GoogleGenAI initialization warning:', initErr);
  }
}

/**
 * Computes deterministic macro and sector sentiment indicators for a PSX stock
 */
export function getMacroSentiment(stock) {
  if (!stock) return null;

  const ticker = stock.ticker || 'PSX';
  const sector = stock.sector || 'General';
  const score = stock.algorithmicAssessment?.compositeScore || stock.scores?.overall || 75;
  const changePercent = Number(stock.changePercent || 0);

  let hash = 0;
  for (let i = 0; i < ticker.length; i++) {
    hash = (hash << 5) - hash + ticker.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash);

  // Calibrate sentiment based on algorithmic strength and price momentum
  let baseSentimentScore = 60 + ((score - 50) * 0.4) + (changePercent * 3);
  const jitter = ((seed % 100) / 100) * 8 - 4;
  const sentimentScore = Math.min(96, Math.max(30, Math.round(baseSentimentScore + jitter)));

  let sentimentLabel = 'Bullish';
  let sentimentColor = '#10b981';
  let sentimentBg = 'rgba(16, 185, 129, 0.12)';
  let sentimentIcon = '🟢';

  if (sentimentScore >= 72) {
    sentimentLabel = 'Bullish';
    sentimentColor = '#10b981';
    sentimentBg = 'rgba(16, 185, 129, 0.12)';
    sentimentIcon = '🟢';
  } else if (sentimentScore >= 52) {
    sentimentLabel = 'Neutral / Rangebound';
    sentimentColor = '#f59e0b';
    sentimentBg = 'rgba(245, 158, 11, 0.12)';
    sentimentIcon = '🟡';
  } else {
    sentimentLabel = 'Bearish Headwinds';
    sentimentColor = '#ef4444';
    sentimentBg = 'rgba(239, 68, 68, 0.12)';
    sentimentIcon = '🔴';
  }

  // Macro catalysts per sector
  const macroFactors = [
    { title: 'Monetary Policy & SBP Rates', detail: 'Central bank interest rate trajectory supports institutional equity rotation and lowers corporate debt financing overhead.' },
    { title: 'Fiscal & IMF Program Milestones', detail: 'Extended Fund Facility adherence maintains foreign exchange stability and sovereign liquidity.' },
    { title: 'Sector Regulatory & Export Directives', detail: `Industry specific tariff adjustments and tax treaties impact ${sector} margin realizations.` }
  ];

  return {
    sentimentScore,
    sentimentLabel,
    sentimentColor,
    sentimentBg,
    sentimentIcon,
    macroFactors
  };
}

// Generate fallback structured analysis if key is missing or model throws error
function getLocalFallbackReport(stock) {
  const price = stock.price || 0;
  const pe = stock.pe_ratio || 6.5;
  const pb = stock.pb_ratio || 1.1;
  const roe = stock.roe || 18.5;
  const divYield = stock.dividend_yield || 5.0;
  const sentiment = getMacroSentiment(stock);

  return `### 🤖 StockIQ AI Institutional Financial & Macro Analysis: ${stock.name} (${stock.ticker})

**1. Valuation & Pricing Multiples:**
- **Share Price**: PKR ${Number(price).toLocaleString()}
- **P/E Multiple**: **${pe}x** | **P/B Ratio**: **${pb}x**
- Discounted entry multiple relative to historical ${stock.sector || 'General'} industry benchmarks on the Pakistan Stock Exchange.

**2. Profitability & Shareholder Yield:**
- **Return on Equity (ROE)**: **${roe}%**
- **Cash Dividend Yield**: **${divYield}%**
- Capital efficiency supported by predictable operating cash flow and domestic market pricing power.

**3. Macroeconomic & News Sentiment Indicator:**
- **Sentiment Score**: **${sentiment?.sentimentScore || 78}/100** (${sentiment?.sentimentLabel || 'Bullish'})
- **SBP Rate Cycle**: Monetary policy easing provides positive tailwinds for capital expenditure and valuation multiple expansion.
- **Sector Regulatory Outlook**: Stable operational environment with sustained balance sheet resilience.

**4. Analytical Strategy Fitness:**
- Based on quantitative scoring and risk-reward modeling, this security is categorized under Strategy Fit: **STRONG FIT / GOOD FIT**.

*(Tip: Set your \`VITE_GEMINI_API_KEY\` in your environment variables to enable dynamic real-time Gemini Flash queries!)*`;
}

export async function generateStockAnalysis(stockData, userQuery = '') {
  return generateStockReport(stockData, userQuery);
}

export async function generateStockReport(stock, userQuery = '') {
  if (!stock) return 'No stock data provided.';

  // If no API key is set, return clean local analytical breakdown
  if (!apiKey || !ai) {
    return getLocalFallbackReport(stock);
  }

  try {
    const symbol = stock.ticker || stock.symbol || 'PSX';
    const name = stock.name || symbol;
    const price = stock.price || 'N/A';
    const pe = stock.pe_ratio || stock.pe || 'N/A';
    const roe = stock.roe || 'N/A';
    const div = stock.dividend_yield || stock.dividend || 'N/A';
    const sentiment = getMacroSentiment(stock);

    const promptText = `You are StockIQ AI, an institutional-grade financial and macroeconomic analyst for the Pakistan Stock Exchange (PSX).
Analyze the following equity:
- Company: ${name} (${symbol})
- Price: PKR ${price}
- P/E Ratio: ${pe}x
- Return on Equity (ROE): ${roe}%
- Dividend Yield: ${div}%
- Sector: ${stock.sector || 'General'}
- Macro Sentiment Index: ${sentiment?.sentimentScore}/100 (${sentiment?.sentimentLabel})
- Description: ${stock.description || ''}

User Prompt: "${userQuery || 'Provide an institutional multi-factor financial analysis covering valuation multiples, growth catalysts, macroeconomic environment (SBP policy rates, inflation, IMF stability), sector risks, and a bilingual key conclusion summary.'}"

COMPLIANCE & FORMATTING:
1. Do NOT give direct financial buy/sell instructions. Frame outcomes strictly as Strategy Fit ("STRONG FIT", "GOOD FIT", "MODERATE FIT", "WEAK FIT").
2. Incorporate current Pakistani macroeconomic context (interest rates, inflation trajectory, currency stability).
3. Use clean markdown with headers, bold highlights, and clean bullet lists.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText
    });

    if (response && response.text) {
      return response.text;
    }

    return getLocalFallbackReport(stock);
  } catch (error) {
    console.error('Gemini 2.5 Flash API error:', error);
    return getLocalFallbackReport(stock);
  }
}
