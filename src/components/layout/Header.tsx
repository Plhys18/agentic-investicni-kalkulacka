import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useDarkMode } from '@/hooks/useDarkMode';

interface HeaderProps {
  isDark: boolean;
  toggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ isDark, toggle }) => {
  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm no-print">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl lg:text-2xl font-bold text-foreground">
          📊 Investiční Kalkulačka
        </h1>
        <button
          onClick={toggle}
          className="p-2 rounded-lg bg-muted hover:bg-accent transition-colors duration-200"
          aria-label={isDark ? 'Přepnout na světlý režim' : 'Přepnout na tmavý režim'}
        >
          {isDark ? (
            <Sun size={20} className="text-foreground transition-transform duration-300" />
          ) : (
            <Moon size={20} className="text-foreground transition-transform duration-300" />
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
