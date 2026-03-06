import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import TabBar from '@/components/layout/TabBar';
import MortgageCalculator from '@/components/calculators/MortgageCalculator';
import ETFCalculator from '@/components/calculators/ETFCalculator';
import ComparisonView from '@/components/calculators/ComparisonView';
import { useDarkMode } from '@/hooks/useDarkMode';

const Index: React.FC = () => {
  const { isDark, toggle } = useDarkMode();
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="min-h-screen bg-background">
      <Header isDark={isDark} toggle={toggle} />
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 0 && <MortgageCalculator />}
        {activeTab === 1 && <ETFCalculator />}
        {activeTab === 2 && <ComparisonView />}
      </main>
      <footer className="text-center py-4 text-sm text-muted-foreground">
        © {new Date().getFullYear()} Investiční Kalkulačka
      </footer>
    </div>
  );
};

export default Index;
