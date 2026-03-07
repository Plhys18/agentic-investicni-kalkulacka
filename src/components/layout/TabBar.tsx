import React from 'react';
import { Home, TrendingUp, BarChart3, Coins, Flame, Receipt, GraduationCap } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

const TabBar: React.FC<{ activeTab: number; onTabChange: (index: number) => void }> = ({ activeTab, onTabChange }) => {
  const { t } = useLanguage();

  const tabs = [
    { label: t('tab.mortgage'), icon: Home },
    { label: t('tab.etf'), icon: TrendingUp },
    { label: t('tab.comparison'), icon: BarChart3 },
    { label: t('tab.dca'), icon: Coins },
    { label: t('tab.fire'), icon: Flame },
    { label: t('tab.tax'), icon: Receipt },
    { label: t('tab.education'), icon: GraduationCap },
  ];

  return (
    <div className="bg-card/60 backdrop-blur-sm border-b border-border/50 no-print">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-center gap-1 overflow-x-auto scrollbar-hide" role="tablist">
          {tabs.map((tab, i) => {
            const Icon = tab.icon;
            const isActive = activeTab === i;
            return (
              <button
                key={i}
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(i)}
                className={`relative flex items-center gap-1.5 px-3 sm:px-4 py-3.5 text-xs sm:text-sm lg:text-base font-medium transition-all duration-200 whitespace-nowrap ${
                  isActive ? 'text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
                {isActive && <span className="absolute bottom-0 left-2 right-2 h-[3px] rounded-full bg-primary" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TabBar;
