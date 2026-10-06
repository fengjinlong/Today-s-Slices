import React, { useState } from 'react';
import { HabitItem } from '../types';
import { X, Plus, Sparkles } from 'lucide-react';
import { sound } from '../services/soundEngine';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddHabit: (habit: HabitItem) => void;
}

const PRESET_ICONS = ['☕', '📖', '🏃', '🍃', '✍️', '🧘', '🍵', '🎨', '🚲', '🪴', '🍎', '💤'];

export const AddHabitModal: React.FC<AddHabitModalProps> = ({ isOpen, onClose, onAddHabit }) => {
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('☕');
  const [category, setCategory] = useState<HabitItem['category']>('morning');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    sound.playStampThud();
    const newHabit: HabitItem = {
      id: `habit-${Date.now()}`,
      title: title.trim(),
      icon,
      category,
      status: 'pending',
      note: note.trim() || undefined,
    };

    onAddHabit(newHabit);
    setTitle('');
    setNote('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-[#FFFDF9] rounded-2xl shadow-xl border border-[#DFD9CD] p-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#7A7368] hover:text-[#2A2825] hover:bg-black/5 transition-all"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 text-xs font-semibold text-[#C86D51] mb-1">
          <Sparkles size={14} />
          <span>NEW ROUTINE SLICE</span>
        </div>
        <h3 className="text-base font-bold text-[#2A2825] font-serif-vintage mb-4">
          新增切片习惯
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-[#5E584E] mb-1.5">
              习惯名称 / 动作
            </label>
            <input
              type="text"
              required
              placeholder="例如：手冲瑰夏咖啡、书写三行日记"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CEC2] bg-[#FAF8F5] text-xs text-[#2A2825] focus:outline-hidden focus:border-[#C86D51] focus:ring-1 focus:ring-[#C86D51]"
            />
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-medium text-[#5E584E] mb-1.5">
              生活切片图示
            </label>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    sound.playStepTick();
                    setIcon(emoji);
                  }}
                  className={`h-10 flex items-center justify-center text-lg rounded-xl border transition-all ${
                    icon === emoji
                      ? 'border-[#C86D51] bg-[#C86D51]/10 scale-105 shadow-xs'
                      : 'border-[#E2DCD1] bg-[#FAF8F5] hover:bg-white'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-[#5E584E] mb-1.5">
              归属时刻
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(
                [
                  { id: 'morning', label: '晨间' },
                  { id: 'focus', label: '专注' },
                  { id: 'movement', label: '律动' },
                  { id: 'night', label: '夜泊' },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    sound.playStepTick();
                    setCategory(cat.id);
                  }}
                  className={`py-1.5 text-xs rounded-lg border font-medium transition-all ${
                    category === cat.id
                      ? 'border-[#2A2825] bg-[#2A2825] text-white'
                      : 'border-[#D5CEC2] bg-[#FAF8F5] text-[#5E584E]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-medium text-[#5E584E] mb-1.5">
              小注记 (可选)
            </label>
            <input
              type="text"
              placeholder="例如：无糖、沉浸30分钟"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-[#D5CEC2] bg-[#FAF8F5] text-xs text-[#2A2825] focus:outline-hidden focus:border-[#C86D51]"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full mt-2 py-3 px-4 bg-[#2A2825] hover:bg-[#1E1C1A] active:scale-[0.98] text-[#FFFDF9] rounded-xl font-medium text-xs flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <Plus size={15} />
            <span>保存并开启日常切片</span>
          </button>
        </form>
      </div>
    </div>
  );
};
