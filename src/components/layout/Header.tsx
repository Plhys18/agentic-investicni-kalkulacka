import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Globe, ChevronDown } from 'lucide-react';
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
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-card/80 border-b border-border/50 no-print">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <span className="text-primary-foreground font-black text-lg">FK</span>
          </div>
          <div>
            <h1 className="text-lg lg:text-xl font-extrabold text-foreground leading-tight tracking-tight">
              {t('app.title')}
            </h1>
            <p className="text-[11px] text-muted-foreground hidden sm:block tracking-wide">
              {t('app.subtitle')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Dropdown menu for currency + language */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary hover:bg-accent border border-border/50 transition-all duration-200 active:scale-95"
              aria-label="Settings menu"
            >
              <span className="text-xs font-bold text-foreground">{currency}</span>
              <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 rounded-xl bg-card border border-border/50 shadow-lg overflow-hidden z-50">
                {/* Currency section */}
                <div className="px-3 py-2 border-b border-border/50">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {lang === 'cs' ? 'Měna' : 'Currency'}
                  </span>
                </div>
                {currencies.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setCurrency(c);
                      setMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      currency === c
                        ? 'bg-primary/10 text-foreground font-bold'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    {currencyLabels[c]}
                  </button>
                ))}

                {/* Language section */}
                <div className="px-3 py-2 border-t border-b border-border/50">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {lang === 'cs' ? 'Jazyk' : 'Language'}
                  </span>
                </div>
                <button
                  onClick={() => { setLang('cs'); setMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    lang === 'cs'
                      ? 'bg-primary/10 text-foreground font-bold'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  🇨🇿 Čeština
                </button>
                <button
                  onClick={() => { setLang('en'); setMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    lang === 'en'
                      ? 'bg-primary/10 text-foreground font-bold'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  🇬🇧 English
                </button>
              </div>
            )}
          </div>

          <button
            onClick={toggle}
            className="p-2.5 rounded-xl bg-secondary hover:bg-accent border border-border/50 transition-all duration-200 active:scale-95"
            aria-label={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <Sun size={18} className="text-foreground" /> : <Moon size={18} className="text-foreground" />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
