import React from 'react';
import { Bot, Home, TrendingUp, BarChart3, Coins, Flame, Receipt, GraduationCap } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

const TabBar: React.FC<{ activeTab: number; onTabChange: (index: number) => void }> = ({ activeTab, onTabChange }) => {
  const { t } = useLanguage();

  const tabs = [
    { label: t('tab.ai'), icon: Bot },
    { label: t('tab.mortgage'), icon: Home },
    { label: t('tab.etf'), icon: TrendingUp },
    { label: t('tab.comparison'), icon: BarChart3 },
    { label: t('tab.dca'), icon: Coins },
    { label: t('tab.fire'), icon: Flame },
    { label: t('tab.tax'), icon: Receipt },
    { label: t('tab.education'), icon: GraduationCap },
  ];

  return (
    <div className="sticky top-[80px] z-40 px-4 sm:px-6 py-4 no-print pointer-events-none">
      <div className="max-w-6xl mx-auto flex justify-center">
        <div className="inline-flex glass-card p-1.5 rounded-2xl gap-1 overflow-x-auto scrollbar-hide pointer-events-auto shadow-xl">
          {tabs.map((tab, i) => {
            const Icon = tab.icon;
            const isActive = activeTab === i;
            return (
              <button
                key={i}
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(i)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-500 whitespace-nowrap active:scale-95 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                <Icon size={16} className={isActive ? 'animate-pulse' : ''} />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TabBar;
