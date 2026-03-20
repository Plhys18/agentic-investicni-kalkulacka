import React, { useState, useRef, useEffect } from 'react';
import { useCalculatorStore } from '@/hooks/useCalculatorStore';
import { useLanguage } from '@/hooks/useLanguage';
import { Bot, Send, Settings2, Sparkles, Check } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Provider = 'claude' | 'openai' | 'gemini' | 'groq';

interface AdvisorConfig {
  provider: Provider;
  apiKey: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  appliedTools?: string[];
}

const DEFAULT_CONFIG: AdvisorConfig = { provider: 'groq', apiKey: '' };

const PROVIDER_LABELS: Record<Provider, string> = {
  claude: 'Claude',
  openai: 'OpenAI',
  gemini: 'Gemini',
  groq: 'Groq',
};

const PROVIDER_PLACEHOLDERS: Record<Provider, string> = {
  claude: 'sk-ant-...',
  openai: 'sk-...',
  gemini: 'AI...',
  groq: 'gsk_...',
};

// ---------------------------------------------------------------------------
// Tool definitions for function calling
// ---------------------------------------------------------------------------

const TOOL_DEFINITIONS = [
  {
    name: 'set_mortgage',
    description: 'Set mortgage/real estate calculator values. Use when the user discusses property purchase, mortgage, or rental investment.',
    parameters: {
      type: 'object' as const,
      properties: {
        propertyPrice: { type: 'number', description: 'Property price in current currency' },
        downPayment: { type: 'number', description: 'Down payment amount' },
        interestRate: { type: 'number', description: 'Annual interest rate in percent (e.g. 5.5)' },
        loanTerm: { type: 'number', description: 'Loan term in years (1-40)' },
        monthlyRent: { type: 'number', description: 'Expected monthly rental income' },
        monthlyExpenses: { type: 'number', description: 'Monthly property expenses (maintenance, insurance)' },
        annualAppreciation: { type: 'number', description: 'Expected annual property value appreciation in percent' },
        vacancyRate: { type: 'number', description: 'Expected vacancy rate in percent (0-50)' },
      },
      required: [],
    },
  },
  {
    name: 'set_etf',
    description: 'Set ETF/savings calculator values. Use when the user discusses stock market investment, index funds, ETFs, or general savings.',
    parameters: {
      type: 'object' as const,
      properties: {
        initialInvestment: { type: 'number', description: 'Initial lump sum investment' },
        monthlyContribution: { type: 'number', description: 'Monthly contribution amount' },
        annualReturn: { type: 'number', description: 'Expected annual return in percent (e.g. 8)' },
        years: { type: 'number', description: 'Investment horizon in years (1-50)' },
      },
      required: [],
    },
  },
  {
    name: 'set_comparison',
    description: 'Set mortgage vs ETF comparison parameters.',
    parameters: {
      type: 'object' as const,
      properties: {
        comparisonYears: { type: 'number', description: 'Number of years to compare (1-40)' },
        etfReturn: { type: 'number', description: 'Expected ETF annual return for comparison in percent' },
      },
      required: [],
    },
  },
  {
    name: 'set_dca',
    description: 'Set DCA (Dollar-Cost Averaging) calculator values for crypto/gold investments.',
    parameters: {
      type: 'object' as const,
      properties: {
        selectedAssets: { type: 'array', items: { type: 'string', enum: ['bitcoin', 'ethereum', 'gold', 'silver'] }, description: 'Assets to include in DCA comparison' },
        initialInvestment: { type: 'number', description: 'Initial investment' },
        monthlyInvestment: { type: 'number', description: 'Monthly DCA amount' },
        years: { type: 'number', description: 'Investment horizon in years (1-30)' },
      },
      required: [],
    },
  },
  {
    name: 'set_fire',
    description: 'Set FIRE (Financial Independence, Retire Early) calculator values.',
    parameters: {
      type: 'object' as const,
      properties: {
        currentSavings: { type: 'number', description: 'Current total savings' },
        monthlyIncome: { type: 'number', description: 'Monthly income' },
        monthlyExpenses: { type: 'number', description: 'Monthly expenses' },
        monthlySavings: { type: 'number', description: 'Monthly amount saved' },
        annualReturn: { type: 'number', description: 'Expected annual investment return in percent' },
        withdrawalRate: { type: 'number', description: 'Safe withdrawal rate in percent (typically 3-4)' },
      },
      required: [],
    },
  },
  {
    name: 'set_tax',
    description: 'Set tax impact calculator values to compare tax implications across investment types.',
    parameters: {
      type: 'object' as const,
      properties: {
        investmentAmount: { type: 'number', description: 'Total investment amount' },
        investmentYears: { type: 'number', description: 'Investment holding period in years' },
        etfGrossReturn: { type: 'number', description: 'Expected gross ETF return in percent' },
        realEstateGrossReturn: { type: 'number', description: 'Expected gross real estate return in percent' },
        cryptoGrossReturn: { type: 'number', description: 'Expected gross crypto return in percent' },
        etfTaxRate: { type: 'number', description: 'ETF tax rate in percent' },
        realEstateTaxRate: { type: 'number', description: 'Real estate tax rate in percent' },
        cryptoTaxRate: { type: 'number', description: 'Crypto tax rate in percent' },
      },
      required: [],
    },
  },
];

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a financial advisor AI integrated into an investment calculator app. The app has these calculator tabs:

1. **Mortgage** — property purchase, mortgage payments, rental income analysis
2. **ETF/Savings** — compound interest growth with monthly contributions
3. **Mortgage vs ETF Comparison** — which strategy wins over time
4. **DCA** — Dollar-Cost Averaging into bitcoin, ethereum, gold, silver
5. **FIRE** — Financial Independence / Retire Early planning
6. **Tax Impact** — compare tax implications (Czech tax rules: ETF/crypto 3-year exemption, real estate 10-year exemption)

When the user describes their financial situation, you MUST:
1. Respond with concise, helpful financial advice (2-5 sentences)
2. Use the available tools to SET the calculator values based on their situation
3. Fill in ALL relevant calculators — not just one. Think about which tabs would be useful.
4. Use realistic numbers based on current market conditions (2024-2026 Czech Republic context)

Default assumptions if user doesn't specify:
- Currency: CZK
- Mortgage interest: 4.5-5.5%
- ETF returns: 7-10% annually
- Property appreciation: 3-5%
- FIRE withdrawal rate: 4%
- Czech tax rates: 15% standard

Always call the tools — the user expects the calculators to be filled automatically. Respond in the same language the user writes in.`;

// ---------------------------------------------------------------------------
// API calls with tool/function calling
// ---------------------------------------------------------------------------

interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

async function queryWithTools(
  config: AdvisorConfig,
  messages: Message[],
  signal: AbortSignal,
): Promise<{ text: string; toolCalls: ToolCall[] }> {
  const { provider, apiKey } = config;
  const apiMessages = messages.map(m => ({ role: m.role, content: m.content }));

  if (provider === 'claude') {
    const tools = TOOL_DEFINITIONS.map(t => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters,
    }));

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools,
        messages: apiMessages,
      }),
      signal,
    });
    if (!res.ok) throw new Error(`Claude API error: ${res.status} ${await res.text()}`);
    const data = await res.json();

    let text = '';
    const toolCalls: ToolCall[] = [];
    for (const block of data.content) {
      if (block.type === 'text') text += block.text;
      if (block.type === 'tool_use') {
        toolCalls.push({ name: block.name, arguments: block.input });
      }
    }
    return { text, toolCalls };
  }

  if (provider === 'openai' || provider === 'groq') {
    const url = provider === 'openai'
      ? 'https://api.openai.com/v1/chat/completions'
      : 'https://api.groq.com/openai/v1/chat/completions';
    const model = provider === 'openai' ? 'gpt-4o-mini' : 'llama-3.3-70b-versatile';

    const tools = TOOL_DEFINITIONS.map(t => ({
      type: 'function' as const,
      function: { name: t.name, description: t.description, parameters: t.parameters },
    }));

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...apiMessages],
        tools,
      }),
      signal,
    });
    if (!res.ok) throw new Error(`${PROVIDER_LABELS[provider]} API error: ${res.status} ${await res.text()}`);
    const data = await res.json();

    const choice = data.choices[0];
    const text = choice.message.content || '';
    const toolCalls: ToolCall[] = (choice.message.tool_calls || []).map((tc: { function: { name: string; arguments: string } }) => ({
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments),
    }));
    return { text, toolCalls };
  }

  if (provider === 'gemini') {
    const functionDeclarations = TOOL_DEFINITIONS.map(t => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    }));

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: apiMessages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          })),
          tools: [{ functionDeclarations }],
        }),
        signal,
      },
    );
    if (!res.ok) throw new Error(`Gemini API error: ${res.status} ${await res.text()}`);
    const data = await res.json();

    let text = '';
    const toolCalls: ToolCall[] = [];
    for (const part of data.candidates[0].content.parts) {
      if (part.text) text += part.text;
      if (part.functionCall) {
        toolCalls.push({ name: part.functionCall.name, arguments: part.functionCall.args });
      }
    }
    return { text, toolCalls };
  }

  throw new Error(`Unknown provider: ${provider}`);
}

// ---------------------------------------------------------------------------
// Tool name to label mapping
// ---------------------------------------------------------------------------

const TOOL_LABELS: Record<string, { cs: string; en: string }> = {
  set_mortgage: { cs: 'Hypotéka', en: 'Mortgage' },
  set_etf: { cs: 'Spoření & ETF', en: 'ETF/Savings' },
  set_comparison: { cs: 'Porovnání', en: 'Comparison' },
  set_dca: { cs: 'DCA Investice', en: 'DCA' },
  set_fire: { cs: 'FIRE', en: 'FIRE' },
  set_tax: { cs: 'Daňový dopad', en: 'Tax Impact' },
};

const TOOL_TAB_INDEX: Record<string, number> = {
  set_mortgage: 1,
  set_etf: 2,
  set_comparison: 3,
  set_dca: 4,
  set_fire: 5,
  set_tax: 6,
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface AIAdvisorProps {
  onTabChange: (tab: number) => void;
}

const AIAdvisor: React.FC<AIAdvisorProps> = ({ onTabChange }) => {
  const store = useCalculatorStore();
  const { lang } = useLanguage();

  const [config, setConfig] = useState<AdvisorConfig>(DEFAULT_CONFIG);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  function applyToolCalls(toolCalls: ToolCall[]): string[] {
    const applied: string[] = [];
    for (const tc of toolCalls) {
      const args = tc.arguments;
      switch (tc.name) {
        case 'set_mortgage':
          store.setMortgage(args as Parameters<typeof store.setMortgage>[0]);
          applied.push(tc.name);
          break;
        case 'set_etf':
          store.setETF(args as Parameters<typeof store.setETF>[0]);
          applied.push(tc.name);
          break;
        case 'set_comparison':
          store.setComparison(args as Parameters<typeof store.setComparison>[0]);
          applied.push(tc.name);
          break;
        case 'set_dca':
          store.setDCA(args as Parameters<typeof store.setDCA>[0]);
          applied.push(tc.name);
          break;
        case 'set_fire':
          store.setFIRE(args as Parameters<typeof store.setFIRE>[0]);
          applied.push(tc.name);
          break;
        case 'set_tax':
          store.setTax(args as Parameters<typeof store.setTax>[0]);
          applied.push(tc.name);
          break;
      }
    }
    return applied;
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text) return;

    if (!config.apiKey) {
      setSettingsOpen(true);
      return;
    }

    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setError(null);
    setLoading(true);

    try {
      abortRef.current = new AbortController();
      const result = await queryWithTools(config, newMessages, abortRef.current.signal);

      const applied = applyToolCalls(result.toolCalls);

      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: result.text,
          appliedTools: applied.length > 0 ? applied : undefined,
        },
      ]);
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const providerLabel = PROVIDER_LABELS[config.provider];

  const suggestions = lang === 'cs'
    ? [
        'Mám 3 miliony CZK a chci koupit byt na pronájem',
        'Chci investovat 10 000 Kč měsíčně do ETF na 20 let',
        'Mám 500 000 Kč úspor, jak nejrychleji dosáhnu finanční nezávislosti?',
        'Porovnej mi hypotéku vs ETF pro byt za 5 milionů',
      ]
    : [
        'I have 3M CZK and want to buy a rental apartment',
        'I want to invest 10,000 CZK monthly into ETFs for 20 years',
        'I have 500k CZK savings, how to reach financial independence fastest?',
        'Compare mortgage vs ETF for a 5M CZK apartment',
      ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Settings dialog */}
      {settingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/40 backdrop-blur-2xl" onClick={() => setSettingsOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-card/95 backdrop-blur-3xl rounded-3xl border border-glass-border shadow-2xl p-8 space-y-6 overflow-hidden">
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/20 blur-3xl rounded-full" />
            
            <div className="flex items-center justify-between relative">
              <div>
                <h3 className="text-xl font-black text-foreground tracking-tight">AI Settings</h3>
                <p className="text-xs text-muted-foreground font-medium mt-1">Configure your advisor's intelligence</p>
              </div>
              <button 
                onClick={() => setSettingsOpen(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 relative">
              {(['claude', 'openai', 'gemini', 'groq'] as Provider[]).map(p => (
                <button
                  key={p}
                  onClick={() => setConfig(c => ({ ...c, provider: p }))}
                  className={`px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 border-2 ${
                    config.provider === p
                      ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                      : 'bg-secondary/40 text-muted-foreground border-transparent hover:border-border/50 hover:bg-secondary'
                  }`}
                >
                  {PROVIDER_LABELS[p]}
                </button>
              ))}
            </div>

            <div className="space-y-2 relative">
              <label className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] ml-1">Secure API Access</label>
              <div className="relative">
                <input
                  type="password"
                  value={config.apiKey}
                  onChange={e => setConfig(c => ({ ...c, apiKey: e.target.value }))}
                  placeholder={PROVIDER_PLACEHOLDERS[config.provider]}
                  className="w-full bg-secondary/30 backdrop-blur-md border border-glass-border rounded-2xl px-5 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary/50 transition-all shadow-inner"
                />
              </div>
              <p className="text-[10px] text-muted-foreground/60 italic px-1">
                {lang === 'cs'
                  ? 'Vaše klíče jsou uloženy pouze v lokální paměti prohlížeče.'
                  : 'API keys are stored strictly in-memory for your security.'}
              </p>
            </div>

            <button
              onClick={() => setSettingsOpen(false)}
              disabled={!config.apiKey.trim()}
              className="btn-primary w-full group relative overflow-hidden"
            >
              <span className="relative z-10">{lang === 'cs' ? 'Aktivovat Poradce' : 'Activate Advisor'}</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-end justify-between px-2">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Sparkles className="text-primary" size={20} />
            </div>
            <h2 className="text-2xl lg:text-3xl font-black text-foreground tracking-tighter">
              {lang === 'cs' ? 'Privátní Poradce' : 'Private Concierge'}
            </h2>
          </div>
          <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-[0.15em] ml-1">
            {lang === 'cs' ? 'Inteligentní analýza vašich financí' : 'Bespoke financial intelligence'}
          </p>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-secondary/50 hover:bg-secondary border border-glass-border transition-all duration-300 text-[10px] font-black uppercase tracking-widest text-muted-foreground shadow-sm hover:shadow-md active:scale-95"
        >
          <Settings2 size={14} />
          {config.apiKey ? providerLabel : (lang === 'cs' ? 'Konfigurovat' : 'Configure')}
        </button>
      </div>

      {/* Main Chat Area */}
      <div className="calculator-card p-4 sm:p-8 min-h-[400px] flex flex-col relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 blur-[100px] rounded-full" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/5 blur-[100px] rounded-full" />

        {/* No API key state */}
        {!config.apiKey && messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-10 animate-in fade-in zoom-in-95 duration-1000 relative z-10 px-4">
            <div className="relative">
              <div className="w-32 h-32 rounded-[40px] bg-gradient-to-br from-primary via-primary to-primary/60 flex items-center justify-center shadow-[0_20px_50px_rgba(var(--primary-rgb),0.3)] animate-float border-4 border-white/20">
                <Bot className="text-primary-foreground drop-shadow-lg" size={64} />
              </div>
              <div className="absolute -top-4 -right-4 w-12 h-12 rounded-2xl bg-card border-2 border-primary/20 flex items-center justify-center shadow-xl rotate-12">
                <Sparkles className="text-primary animate-pulse" size={20} />
              </div>
            </div>
            
            <div className="max-w-md space-y-4">
              <h3 className="text-3xl font-black text-foreground tracking-tight leading-tight">
                {lang === 'cs'
                  ? 'Váš osobní finanční mozek'
                  : 'Your Personal Financial Brain'}
              </h3>
              <p className="text-base font-medium text-muted-foreground/80 leading-relaxed">
                {lang === 'cs'
                  ? 'Aktivujte privátní AI a získejte okamžitou analýzu vašich investic. Vaše data nikdy neopustí tento prohlížeč.'
                  : 'Activate your private AI for instant investment analysis. Your data never leaves this browser.'}
              </p>
            </div>
            
            <button
              onClick={() => setSettingsOpen(true)}
              className="btn-primary scale-125 px-10 shadow-[0_15px_30px_-5px_rgba(var(--primary-rgb),0.4)]"
            >
              {lang === 'cs' ? 'Aktivovat Privátní AI' : 'Activate Private AI'}
            </button>
          </div>
        )}

        {/* Suggestion cards */}
        {messages.length === 0 && config.apiKey && (
          <div className="flex-1 flex flex-col justify-center space-y-8 relative z-10 animate-in fade-in duration-700 max-w-2xl mx-auto w-full">
            <div className="space-y-2 text-center">
              <h3 className="text-xl font-black text-foreground">Jak vám mohu dnes pomoci?</h3>
              <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">Strategické scénáře pro vaše finance</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(s); inputRef.current?.focus(); }}
                  className="text-left p-6 rounded-3xl bg-secondary/50 hover:bg-card border border-glass-border hover:border-primary/40 transition-all duration-300 group relative shadow-sm hover:shadow-xl hover:-translate-y-1"
                >
                  <p className="text-sm font-bold text-foreground leading-snug group-hover:text-primary transition-colors pr-6">{s}</p>
                  <div className="absolute right-4 bottom-4 w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <Send size={14} className="text-primary" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat messages */}
        {messages.length > 0 && (
          <div className="flex-1 space-y-8 pb-4 overflow-y-auto pr-2 custom-scrollbar relative z-10">
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div className={`max-w-[85%] rounded-[28px] px-7 py-5 text-sm leading-relaxed shadow-md ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-none font-bold shadow-lg shadow-primary/20'
                    : 'bg-card/80 backdrop-blur-xl text-foreground rounded-tl-none border border-glass-border shadow-sm'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  
                  {msg.appliedTools && msg.appliedTools.length > 0 && (
                    <div className="mt-5 pt-5 border-t border-glass-border/50 space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                        {lang === 'cs' ? 'Provedené změny' : 'Strategic Adjustments'}:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {msg.appliedTools.map((tool, j) => (
                          <button
                            key={j}
                            onClick={() => onTabChange(TOOL_TAB_INDEX[tool] ?? 0)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all duration-300 border border-primary/20"
                          >
                            <Check size={12} strokeWidth={3} />
                            {TOOL_LABELS[tool]?.[lang] ?? tool}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2 px-3">
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                    {msg.role === 'user' ? 'Client' : providerLabel}
                  </span>
                  {msg.role !== 'user' && <div className="w-1 h-1 rounded-full bg-primary/30" />}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex flex-col items-start">
                <div className="bg-card/60 backdrop-blur-xl border border-glass-border rounded-[28px] rounded-tl-none px-8 py-5 flex gap-3 items-center shadow-sm">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" style={{ animationDelay: '0ms' }} />
                    <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" style={{ animationDelay: '200ms' }} />
                    <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" style={{ animationDelay: '400ms' }} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-2">
                    {lang === 'cs' ? 'Analyzuji data...' : 'Architecting Strategy...'}
                  </span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}

        {/* Input Area */}
        <div className="mt-8 pt-8 border-t border-glass-border relative z-10">
          <div className="relative group">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={lang === 'cs'
                ? 'Co máte na srdci? Popište své finanční cíle...'
                : 'How can I assist? Describe your financial vision...'}
              rows={2}
              className="w-full bg-card/40 backdrop-blur-2xl border border-glass-border rounded-[32px] px-8 py-5 pr-20 text-sm text-foreground font-medium placeholder:text-muted-foreground/30 outline-none focus:ring-8 focus:ring-primary/5 focus:border-primary/30 transition-all resize-none shadow-xl hover:bg-card/60"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className={`absolute right-4 bottom-4 p-4 rounded-2xl transition-all duration-300 active:scale-90 ${
                loading || !input.trim()
                  ? 'bg-secondary text-muted-foreground/20'
                  : 'bg-primary text-primary-foreground shadow-2xl shadow-primary/30 hover:scale-105 hover:rotate-3'
              }`}
            >
              <Send size={24} />
            </button>
          </div>
          
          <div className="flex items-center justify-between mt-3 px-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-profit animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                {config.apiKey ? `Engine Active: ${providerLabel}` : 'Engine Standby'}
              </span>
            </div>
            <p className="text-[9px] font-medium text-muted-foreground/30 italic">
              AI can make mistakes. Verify critical financial data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAdvisor;
