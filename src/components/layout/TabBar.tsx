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
    <div className="bg-card border-b border-border no-print">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-center gap-1">
          {tabs.map((tab, i) => {
            const Icon = tab.icon;
            const isActive = activeTab === i;
            return (
              <button
                key={i}
                onClick={() => onTabChange(i)}
                className={`flex items-center gap-2 px-4 py-3 text-sm lg:text-base font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary-600 text-primary-600 font-bold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon size={18} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TabBar;
