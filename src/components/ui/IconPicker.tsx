import React, { useState, useMemo } from 'react';
import {
  CATEGORY_ICONS,
  ICON_CATEGORIES,
  IconCategoryKey,
  IconOption,
} from '../../constants/iconsAndColors';
import { Search } from 'lucide-react';
import clsx from 'clsx';
import { getContrastIconColor } from '../../utils/colorUtils';

interface IconPickerProps {
  selectedIcon: string;
  onSelectIcon: (iconId: string) => void;
  label?: string;
  accentColor?: string;
}

export const IconPicker: React.FC<IconPickerProps> = ({
  selectedIcon,
  onSelectIcon,
  label = 'Select Icon',
  accentColor,
}) => {
  const [activeCategory, setActiveCategory] = useState<IconCategoryKey>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Find currently selected option
  const currentOption = useMemo(
    () => CATEGORY_ICONS.find((i) => i.id === selectedIcon) || CATEGORY_ICONS[0],
    [selectedIcon]
  );

  // Filter icons based on category and search query
  const filteredIcons = useMemo(() => {
    let list = CATEGORY_ICONS;
    if (activeCategory !== 'all') {
      list = list.filter((item) => item.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeCategory, searchQuery]);

  return (
    <div className="space-y-2.5">
      {/* Top Header: Label & Selected Badge */}
      <div className="flex items-center justify-between ml-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-charcoal">
          {label}
        </label>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md flex items-center gap-1">
            {currentOption.label}
          </span>
        </div>
      </div>

      {/* Category Filter Chips (Horizontally Scrollable) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth">
        {ICON_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              type="button"
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={clsx(
                'px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 flex items-center gap-1 border',
                isActive
                  ? 'bg-ink text-white border-ink shadow-2xs scale-102'
                  : 'bg-surface-bone text-charcoal border-hairline hover:bg-stone/20 hover:text-ink'
              )}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Quick Search Input */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/70 pointer-events-none"
        />
        <input
          type="text"
          aria-label="Search icons"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search icons (e.g. sugar, cake, morning, mom, gym...)"
          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-surface-bone border border-hairline text-ink placeholder:text-stone focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            aria-label="Clear search query"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-charcoal hover:text-ink"
          >
            ✕
          </button>
        )}
      </div>

      {/* Icon Grid */}
      <div className="grid grid-cols-6 sm:grid-cols-9 gap-2 max-h-48 overflow-y-auto p-2.5 bg-surface-card rounded-2xl border border-hairline">
        {filteredIcons.length === 0 ? (
          <div className="col-span-full py-6 text-center text-xs text-charcoal">
            No icons found matching &quot;{searchQuery}&quot;. Try another category!
          </div>
        ) : (
          filteredIcons.map((opt: IconOption) => {
            const Icon = opt.icon;
            const isSelected = selectedIcon === opt.id;
            return (
              <button
                type="button"
                key={opt.id}
                onClick={() => onSelectIcon(opt.id)}
                title={`${opt.label} (${opt.category})`}
                className={clsx(
                  'p-2.5 rounded-xl transition-all aspect-square flex items-center justify-center relative group',
                  isSelected
                    ? 'shadow-sm ring-2 ring-primary scale-105 font-bold'
                    : 'hover:bg-surface-bone text-charcoal hover:text-ink hover:scale-105'
                )}
                style={
                  isSelected && accentColor
                    ? {
                        backgroundColor: accentColor,
                        color: getContrastIconColor(accentColor),
                        borderColor: accentColor,
                      }
                    : isSelected
                    ? {
                        backgroundColor: '#E63946',
                        color: '#FFFFFF',
                      }
                    : undefined
                }
              >
                <Icon size={19} />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
