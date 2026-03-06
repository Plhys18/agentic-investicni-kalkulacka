import React from 'react';
import { Home, TrendingUp, BarChart3, Coins } from 'lucide-react';

const tabs = [
  { label: 'Hypotéka', icon: Home },
  { label: 'ETF Kalkulačka', icon: TrendingUp },
  { label: 'DCA Aktiva', icon: Coins },
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
                    ? 'text-foreground font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon size={18} />
                <span className="hidden sm:inline">{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-[3px] rounded-full bg-primary" />
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
