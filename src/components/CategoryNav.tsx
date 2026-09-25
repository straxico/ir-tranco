import React from 'react';
import {
  Home,
  Plane,
  Coins,
  Bitcoin,
  ShoppingCart,
  Car,
  Tv,
  Newspaper,
  MessageSquare,
  Building2,
  Layers,
  GraduationCap,
  Globe,
} from 'lucide-react';
import { CategoryItem } from '../types/domain';

interface CategoryNavProps {
  categories: CategoryItem[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  isPersian: boolean;
  totalDomainsCount: number;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Home,
  Plane,
  Coins,
  Bitcoin,
  ShoppingCart,
  Car,
  Tv,
  Newspaper,
  MessageSquare,
  Building2,
  Layers,
  GraduationCap,
};

export const CategoryNav: React.FC<CategoryNavProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  isPersian,
  totalDomainsCount,
}) => {
  return (
    <div className="w-full overflow-x-auto pb-2 scrollbar-none">
      <div className="flex items-center gap-1.5 min-w-max p-1 bg-slate-900/60 border border-slate-800/80 rounded-xl">
        {/* All Domains Tab */}
        <button
          onClick={() => onSelectCategory('all')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{isPersian ? 'همه دامنه‌ها' : 'All Domains'}</span>
          <span className="font-mono text-[11px] opacity-75 tabular-nums">
            ({totalDomainsCount})
          </span>
        </button>

        {/* Category Tabs */}
        {categories.map((cat) => {
          const IconComponent = ICON_MAP[cat.icon] || Globe;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <IconComponent className="w-3.5 h-3.5" />
              <span>{isPersian ? cat.nameFa : cat.nameEn}</span>
              <span className="font-mono text-[11px] opacity-75 tabular-nums">
                ({cat.domainCount})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
