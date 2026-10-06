import React, { useState } from 'react';
import { HabitItem, HabitStatus } from '../types';
import { sound } from '../services/soundEngine';
import { AddHabitModal } from './AddHabitModal';
import { Plus, Check, Leaf, Clock, ArrowRight, Sparkles, MapPin, Sun } from 'lucide-react';

interface TodayScreenProps {
  habits: HabitItem[];
  city: string;
  weather: string;
  onUpdateHabits: (habits: HabitItem[]) => void;
  onOpenMint: () => void;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({
  habits,
  city,
  weather,
  onUpdateHabits,
  onOpenMint,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Date strings
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const weekday = weekdays[now.getDay()];

  const completedCount = habits.filter((h) => h.status === 'completed').length;
  const totalCount = habits.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Cycle habit status: pending -> completed -> rest -> pending
  const cycleStatus = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = habits.map((h) => {
      if (h.id !== id) return h;
      let nextStatus: HabitStatus = 'pending';
      let completedAt = h.completedAt;

      if (h.status === 'pending') {
        nextStatus = 'completed';
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(
          now.getMinutes()
        ).padStart(2, '0')}`;
        completedAt = currentTime;
        sound.playStampThud();
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(25);
          } catch {
            // Ignore
          }
        }
      } else if (h.status === 'completed') {
        nextStatus = 'rest';
        sound.playStepTick();
      } else {
        nextStatus = 'pending';
        sound.playStepTick();
      }

      return {
        ...h,
        status: nextStatus,
        completedAt,
      };
    });
    onUpdateHabits(updated);
  };

  const handleAddHabit = (newHabit: HabitItem) => {
    onUpdateHabits([...habits, newHabit]);
  };

  const removeHabit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playStepTick();
    onUpdateHabits(habits.filter((h) => h.id !== id));
  };

  return (
    <div className="relative min-h-[calc(100vh-68px)] px-4 pt-4 pb-24 flex flex-col justify-between">
      <div>
        {/* Header Section */}
        <div className="bg-[#FFFDF9] rounded-2xl p-4 sm:p-5 border border-[#E8E2D7] shadow-xs mb-4">
          {/* Top Location & Weather */}
          <div className="flex items-center justify-between text-xs text-[#7C7569] mb-2 font-mono-receipt">
            <div className="flex items-center gap-1.5">
              <MapPin size={13} className="text-[#C86D51]" />
              <span className="font-medium text-[#2A2825]">{city}</span>
              <span className="text-[#C0B9AC]">·</span>
              <span className="flex items-center gap-1">
                <Sun size={12} className="text-amber-500" />
                {weather}
              </span>
            </div>
            <div className="text-[11px] text-[#A0988A]">
              SLICES TRACKER
            </div>
          </div>

          {/* Date Headline */}
          <div className="flex items-baseline justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-serif-vintage text-[#2A2825] tracking-tight">
                {year}年{month}月{date}日
              </h1>
              <div className="text-xs text-[#706A5F] mt-0.5">
                {weekday} · 给今日生活切片留下实体印记
              </div>
            </div>

            {/* Progress Badge */}
            <div className="text-right">
              <div className="text-xs font-mono font-bold text-[#C86D51]">
                {completedCount}/{totalCount} COMPLETED
              </div>
              <div className="text-[10px] text-[#918A7D]">
                已完成 {progressPercent}%
              </div>
            </div>
          </div>

          {/* Minimalist Progress Bar */}
          <div className="w-full bg-[#EFECE5] h-1.5 rounded-full mt-3.5 overflow-hidden">
            <div
              className="bg-[#C86D51] h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Routine List Header */}
        <div className="flex items-center justify-between px-1 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#2A2825] uppercase tracking-wider font-mono-receipt">
              ROUTINE SLICES / 今日切片
            </span>
            <span className="text-[11px] text-[#9A9385] font-serif-vintage">
              (点击印章切换状态)
            </span>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1 text-xs text-[#C86D51] hover:text-[#AC593E] font-medium py-1 px-2 rounded-lg hover:bg-[#C86D51]/10 transition-colors"
          >
            <Plus size={14} />
            <span>新增切片</span>
          </button>
        </div>

        {/* Routine Cards List */}
        <div className="space-y-2.5">
          {habits.map((habit) => {
            const isCompleted = habit.status === 'completed';
            const isRest = habit.status === 'rest';
            const isPending = habit.status === 'pending';

            return (
              <div
                key={habit.id}
                onClick={() => cycleStatus(habit.id)}
                className={`relative group rounded-xl p-3.5 transition-all cursor-pointer flex items-center justify-between ${
                  isCompleted
                    ? 'bg-[#FFFDF9] border border-[#DDD6C8] shadow-xs'
                    : isRest
                    ? 'bg-[#F2EFE8] border border-dashed border-[#CEC7B8] opacity-80'
                    : 'bg-[#FFFDF9] border-2 border-dashed border-[#D2CBBF] hover:border-[#B2AAA0]'
                }`}
              >
                {/* Left: Icon & Info */}
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  {/* Emoji Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-[#FAF8F2] border border-[#E6E0D4] flex items-center justify-center text-lg shrink-0 shadow-2xs">
                    {habit.icon}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium tracking-tight truncate ${
                          isCompleted
                            ? 'text-[#2A2825] font-serif-vintage'
                            : isRest
                            ? 'text-[#827C72] line-through'
                            : 'text-[#3E3A33]'
                        }`}
                      >
                        {habit.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-[#8C8578] mt-0.5 font-mono-receipt">
                      {isCompleted && (
                        <span className="flex items-center gap-1 text-[#C86D51]">
                          <Clock size={11} />
                          {habit.completedAt || '完成'}
                        </span>
                      )}
                      {isRest && (
                        <span className="flex items-center gap-1 text-emerald-700">
                          <Leaf size={11} />
                          今日调休 · 无压力
                        </span>
                      )}
                      {isPending && (
                        <span>待打卡 · 轻轻点击盖章</span>
                      )}
                      {habit.note && (
                        <>
                          <span className="text-[#CCC6B9]">·</span>
                          <span className="truncate max-w-[140px] text-[#7A7368]">
                            {habit.note}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Stamp or Status Trigger */}
                <div className="shrink-0 flex items-center gap-2">
                  {isCompleted && (
                    <div className="stamp-seal text-[10px] px-2 py-0.5 border-[#C86D51] text-[#C86D51] font-bold shadow-2xs select-none animate-in zoom-in-90 duration-150">
                      COMPLETED
                    </div>
                  )}

                  {isRest && (
                    <div className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded-full select-none">
                      <Leaf size={11} />
                      <span>休息</span>
                    </div>
                  )}

                  {isPending && (
                    <div className="w-7 h-7 rounded-full border-2 border-dashed border-[#A49C8F] group-hover:border-[#C86D51] flex items-center justify-center text-[#A49C8F] group-hover:text-[#C86D51] transition-colors">
                      <Check size={14} className="opacity-0 group-hover:opacity-100" />
                    </div>
                  )}

                  {/* Remove option on hover/mobile */}
                  <button
                    onClick={(e) => removeHabit(habit.id, e)}
                    className="opacity-0 group-hover:opacity-60 hover:opacity-100 text-[#9E978C] hover:text-red-600 p-1 rounded-md transition-opacity"
                    title="删除"
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Floating Sticky Call-to-Action Bar */}
      <div className="w-full max-w-md mx-auto pt-6">
        <button
          onClick={onOpenMint}
          className="w-full py-3.5 px-5 bg-[#2A2825] hover:bg-[#1E1C1A] active:scale-[0.98] text-[#FFFDF9] rounded-2xl shadow-lg hover:shadow-xl font-medium text-sm flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#C86D51] text-white rounded-lg">
              <Sparkles size={16} />
            </span>
            <div className="text-left">
              <div className="font-bold leading-tight">
                打包今日切片 (Mint Today's Receipt)
              </div>
              <div className="text-[11px] text-[#A6A095] font-mono">
                已捕获 {completedCount} 项生活切片
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-[#E5DFD5] group-hover:translate-x-1 transition-transform">
            <span>去撕纸</span>
            <ArrowRight size={14} />
          </div>
        </button>
      </div>

      {/* Add Custom Routine Modal */}
      <AddHabitModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddHabit={handleAddHabit}
      />
    </div>
  );
};
