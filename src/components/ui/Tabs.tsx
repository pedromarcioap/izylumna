import React from 'react';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
  size = 'md'
}) => {
  return (
    <div className={`inline-flex p-1 bg-walnut-800/90 border border-brand-dark/40 rounded-xl max-w-full overflow-x-auto ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 rounded-lg font-medium transition-all duration-150 whitespace-nowrap ${
              size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
            } ${
              isActive
                ? 'bg-brand-primary text-white shadow-sm shadow-[#01743F]/30 border border-brand-primary/60 font-semibold'
                : 'text-walnut-400 hover:text-walnut-100 hover:bg-brand-primary/10 border border-transparent'
            }`}
          >
            {tab.icon && <span className="text-current">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`ml-1 px-1.5 py-0.5 text-[11px] rounded-full font-mono font-medium ${
                  isActive ? 'bg-brand-emerald text-white' : 'bg-walnut-700 text-walnut-300'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
