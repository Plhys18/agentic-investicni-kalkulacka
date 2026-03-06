import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface HeaderProps {
  isDark: boolean;
  toggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ isDark, toggle }) => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-card/80 border-b border-border/50 no-print">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shadow-sm"
               style={{ background: 'linear-gradient(135deg, hsl(var(--gradient-start)), hsl(var(--gradient-end)))' }}>
            <span className="text-primary-foreground">📊</span>
          </div>
          <div>
            <h1 className="text-lg lg:text-xl font-bold text-foreground leading-tight">
              Investiční Kalkulačka
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Hypotéka vs. ETF — porovnejte své investice</p>
          </div>
        </div>
        <button
          onClick={toggle}
          className="p-2.5 rounded-xl bg-secondary hover:bg-accent border border-border/50 transition-all duration-200 hover:shadow-sm active:scale-95"
          aria-label={isDark ? 'Přepnout na světlý režim' : 'Přepnout na tmavý režim'}
        >
          {isDark ? (
            <Sun size={18} className="text-foreground" />
          ) : (
            <Moon size={18} className="text-foreground" />
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
