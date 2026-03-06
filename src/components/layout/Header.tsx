import React from 'react';
import { Sun, Moon, Globe } from 'lucide-react';
import { useCurrency, type Currency } from '@/hooks/useCurrency';
import { useLanguage } from '@/hooks/useLanguage';

interface HeaderProps {
  isDark: boolean;
  toggle: () => void;
}

const currencies: Currency[] = ['CZK', 'EUR', 'USD'];

const Header: React.FC<HeaderProps> = ({ isDark, toggle }) => {
  const { currency, setCurrency } = useCurrency();
  const { lang, setLang, t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-card/80 border-b border-border/50 no-print">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <span className="text-primary-foreground font-black text-lg">VŽ</span>
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
          <button
            onClick={() => setLang(lang === 'cs' ? 'en' : 'cs')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-secondary hover:bg-accent border border-border/50 transition-all duration-200 active:scale-95"
            aria-label="Switch language"
          >
            <Globe size={14} className="text-muted-foreground" />
            <span className="text-xs font-bold text-foreground">{lang === 'cs' ? 'CZ' : 'EN'}</span>
          </button>
          <div className="flex items-center rounded-xl border border-border/50 overflow-hidden bg-secondary">
            {currencies.map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
                  currency === c
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {c}
              </button>
            ))}
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
