import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, ChevronDown, Sparkles } from 'lucide-react';
import { useCurrency, type Currency } from '@/hooks/useCurrency';
import { useLanguage } from '@/hooks/useLanguage';

interface HeaderProps {
  isDark: boolean;
  toggle: () => void;
}

const currencies: Currency[] = ['CZK', 'EUR', 'USD'];
const currencyLabels: Record<Currency, string> = {
  CZK: 'CZK (Kč)',
  EUR: 'EUR (€)',
  USD: 'USD ($)',
};

const Header: React.FC<HeaderProps> = ({ isDark, toggle }) => {
  const { currency, setCurrency } = useCurrency();
  const { lang, setLang, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-2xl bg-background/60 border-b border-glass-border no-print">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
              <span className="text-primary-foreground font-black text-xl italic tracking-tighter">VŽ</span>
            </div>
            <div className="absolute -top-1 -right-1">
              <Sparkles className="text-primary animate-pulse" size={14} />
            </div>
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-black text-foreground leading-none tracking-tight premium-gradient-text">
              {t('app.title')}
            </h1>
            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.15em] mt-1 hidden sm:block">
              {t('app.subtitle')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-secondary/50 hover:bg-secondary border border-border/50 transition-all duration-300 active:scale-95 shadow-sm"
            >
              <span className="text-xs font-black tracking-widest text-foreground">{currency}</span>
              <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-300 ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-3 w-52 rounded-2xl bg-card/95 backdrop-blur-xl border border-glass-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                <div className="px-4 py-3 border-b border-border/10">
                  <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">
                    {lang === 'cs' ? 'Zvolte měnu' : 'Select Currency'}
                  </span>
                </div>
                <div className="p-1.5 pt-2">
                  {currencies.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setCurrency(c);
                        setMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                        currency === c
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }`}
                    >
                      {currencyLabels[c]}
                    </button>
                  ))}
                </div>

                <div className="px-4 py-3 border-t border-border/10">
                  <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">
                    {lang === 'cs' ? 'Jazyk' : 'Language'}
                  </span>
                </div>
                <div className="p-1.5 pb-2">
                  <button
                    onClick={() => { setLang('cs'); setMenuOpen(false); }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                      lang === 'cs'
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    🇨🇿 Čeština
                  </button>
                  <button
                    onClick={() => { setLang('en'); setMenuOpen(false); }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                      lang === 'en'
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    🇬🇧 English
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={toggle}
            className="p-3 rounded-2xl bg-secondary/50 hover:bg-secondary border border-border/50 transition-all duration-300 active:scale-95 shadow-sm"
            aria-label={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <Sun size={18} className="text-primary" /> : <Moon size={18} className="text-foreground" />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
