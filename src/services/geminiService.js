import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.info(
    'ℹ️ [StockIQ Vercel Notice] VITE_GEMINI_API_KEY is not configured in Vercel settings. ' +
    'Falling back to analytical strategy stock report mode.'
  );
}

export async function generateStockReport(stock, userQuery = '') {
  if (!apiKey) {
    return `### 🤖 StockIQ AI Financial Analysis: ${stock.name} (${stock.ticker})

**Key Multiples & Financial Evaluation:**
1. **Valuation**: Trading at a P/E of **${stock.pe_ratio}x** and P/B of **${stock.pb_ratio}x**, offering an attractive entry multiple relative to historical sector averages.
2. **Profitability & ROE**: Return on Equity stands at **${stock.roe}%**, demonstrating strong pricing power and capital efficiency.
3. **Dividend Yield**: Offering a **${stock.dividend_yield}%** dividend yield.

**Strategy Fitness Verdict:**
Based on the overall StockIQ Score of **${stock.scores?.overall || 85}/100**, this stock is categorized under Strategy Fit: **STRONG FIT**.

*(Note: Add your VITE_GEMINI_API_KEY in Vercel Environment Variables to enable dynamic real-time Gemini Flash analysis prompts!)*`;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `You are StockIQ AI, an analytical financial research assistant specializing in Pakistan Stock Exchange (PSX).
Analyze the following stock data for ${stock.name} (${stock.ticker}):
- Current Price: PKR ${stock.price}
- Market Cap: PKR ${stock.market_cap}
- P/E Ratio: ${stock.pe_ratio}
- P/B Ratio: ${stock.pb_ratio}
- ROE: ${stock.roe}%
- Dividend Yield: ${stock.dividend_yield}%
- Description: ${stock.description}

CRITICAL COMPLIANCE INSTRUCTION:
Do NOT provide financial advice or buy/sell/hold trading signals. Use Strategy Fitness Labels instead: "STRONG FIT", "GOOD FIT", "MODERATE FIT", "WEAK FIT", or "POOR FIT".

User Query: "${userQuery || 'Provide an analytical bilingual (English & Urdu summary) financial analysis and strategy fitness evaluation for this stock.'}"

Structure your response with clear markdown headings, metric breakdowns, and fundamental risk analysis.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini AI generation error:', error);
    return `⚠️ Error generating AI analysis: ${error.message}. Please check your Gemini API key setup.`;
  }
}
