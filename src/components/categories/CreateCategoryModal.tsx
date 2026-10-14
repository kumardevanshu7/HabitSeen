import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../../constants/iconsAndColors';
import { IconPicker } from '../ui/IconPicker';
import { useAppStore } from '../../stores/useAppStore';
import { Category } from '../../types/habit';
import { boostVibrancy, getContrastIconColor } from '../../utils/colorUtils';
import clsx from 'clsx';
import { Check } from 'lucide-react';

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToEdit?: Category | null;
  onCategoryCreated?: (newCategory: Category) => void;
}

export const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({
  isOpen,
  onClose,
  categoryToEdit,
  onCategoryCreated,
}) => {
  const { categories, addCategory, updateCategory } = useAppStore();

  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('flame');
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0].hex);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (categoryToEdit && isOpen) {
      setName(categoryToEdit.name);
      setSelectedIcon(categoryToEdit.icon || 'flame');
      setSelectedColor(categoryToEdit.color || CATEGORY_COLORS[0].hex);
      setError('');
    } else if (isOpen) {
      setName('');
      setSelectedIcon('flame');
      setSelectedColor(CATEGORY_COLORS[0].hex);
      setError('');
    }
  }, [categoryToEdit, isOpen]);

  const vibrantColor = boostVibrancy(selectedColor);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please provide a category name');
      return;
    }

    const alreadyExists = categories.some(
      (c) =>
        c.id !== categoryToEdit?.id &&
        c.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (alreadyExists) {
      setError(`A category named "${trimmed}" already exists.`);
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      if (categoryToEdit) {
        const updatedCat: Category = {
          ...categoryToEdit,
          name: trimmed,
          icon: selectedIcon,
          color: vibrantColor,
        };
        await updateCategory(updatedCat);
        onClose();
      } else {
        const newCat = await addCategory({
          name: trimmed,
          icon: selectedIcon,
          color: vibrantColor,
          isDefault: false,
        });

        setName('');
        setSelectedIcon('flame');
        setSelectedColor(CATEGORY_COLORS[0].hex);
        if (onCategoryCreated) onCategoryCreated(newCat);
        onClose();
      }
    } catch (err: any) {
      console.error('Failed to save category:', err);
      setError(err.message || 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const SelectedIconComp =
    CATEGORY_ICONS.find((i) => i.id === selectedIcon)?.icon || CATEGORY_ICONS[0].icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={categoryToEdit ? 'Edit & Rename Category' : 'Create New Category'}
      subtitle={
        categoryToEdit
          ? `Update domain name, icon, and visual color theme for "${categoryToEdit.name}"`
          : 'Organize habits into custom behavioral domains'
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Input */}
        <Input
          label="Category Name"
          placeholder="e.g. Fitness & Power, Mindful Coding"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError('');
          }}
          error={error}
          autoFocus
          required
        />

        {/* Live Preview Pill with Clear Visual Theme */}
        <div className="p-4 bg-surface-card border border-hairline rounded-2xl flex items-center justify-between shadow-2xs">
          <span className="text-xs font-semibold text-charcoal uppercase ml-1">Card Preview</span>
          <div
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border-2 text-ink text-sm font-bold shadow-xs transition-all"
            style={{
              backgroundColor: `${vibrantColor}20`,
              borderColor: vibrantColor,
            }}
          >
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm"
              style={{
                backgroundColor: vibrantColor,
                color: getContrastIconColor(vibrantColor),
              }}
            >
              <SelectedIconComp size={16} strokeWidth={2.5} />
            </span>
            <span>{name.trim() || 'Category Preview'}</span>
          </div>
        </div>

        {/* Categorized Icons Selection */}
        <IconPicker
          selectedIcon={selectedIcon}
          onSelectIcon={(newIcon) => setSelectedIcon(newIcon)}
          label="Choose Category Icon"
          accentColor={vibrantColor}
        />

        {/* 15 Curated Vibrant Colors Selection */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-2 ml-1">
            Choose Category Color (15 Vibrant Tones)
          </label>
          <div className="grid grid-cols-5 sm:grid-cols-8 gap-2.5 p-2.5 bg-surface-card rounded-2xl border border-hairline">
            {CATEGORY_COLORS.map((col) => {
              const isSelected = selectedColor === col.hex;
              return (
                <button
                  type="button"
                  key={col.hex}
                  title={col.name}
                  onClick={() => setSelectedColor(col.hex)}
                  className={clsx(
                    'h-11 w-full rounded-xl border border-hairline flex items-center justify-center transition-all',
                    isSelected
                      ? 'ring-3 ring-ink ring-offset-2 scale-105 shadow-md'
                      : 'hover:opacity-90 hover:scale-102'
                  )}
                  style={{ backgroundColor: col.hex }}
                >
                  {isSelected && <Check size={18} className="text-white stroke-[3] drop-shadow-sm" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-hairline">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : categoryToEdit ? 'Save Changes' : 'Save Category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
