import React from 'react';
import { Home, TrendingUp, BarChart3 } from 'lucide-react';

const tabs = [
  { label: 'Hypotéka', icon: Home },
  { label: 'ETF Kalkulačka', icon: TrendingUp },
  { label: 'Porovnání', icon: BarChart3 },
];

interface TabBarProps {
  activeTab: number;
  onTabChange: (index: number) => void;
}

const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="bg-card/60 backdrop-blur-sm border-b border-border/50 no-print">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-center gap-1">
          {tabs.map((tab, i) => {
            const Icon = tab.icon;
            const isActive = activeTab === i;
            return (
              <button
                key={i}
                onClick={() => onTabChange(i)}
                className={`relative flex items-center gap-2 px-5 py-3.5 text-sm lg:text-base font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-primary' : ''} />
                <span className="hidden sm:inline">{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                        style={{ background: 'linear-gradient(90deg, hsl(var(--gradient-start)), hsl(var(--gradient-end)))' }} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TabBar;
