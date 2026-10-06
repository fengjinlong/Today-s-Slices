import React, { useRef } from 'react';
import { SliceTicket } from '../../types';
import { PRESET_POLAROID_PHOTOS } from '../../services/storage';
import { Camera, Image as ImageIcon } from 'lucide-react';

interface PolaroidPaperProps {
  ticket: SliceTicket;
  id?: string;
  onPhotoChange?: (url: string) => void;
  interactive?: boolean;
}

export const PolaroidPaper: React.FC<PolaroidPaperProps> = ({
  ticket,
  id,
  onPhotoChange,
  interactive = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const photo =
    ticket.photoUrl ||
    PRESET_POLAROID_PHOTOS[0];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onPhotoChange) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onPhotoChange(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const cyclePresetPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onPhotoChange) return;
    const currentIndex = PRESET_POLAROID_PHOTOS.indexOf(photo);
    const nextIndex = (currentIndex + 1) % PRESET_POLAROID_PHOTOS.length;
    onPhotoChange(PRESET_POLAROID_PHOTOS[nextIndex]);
  };

  return (
    <div
      id={id}
      className="relative w-full max-w-[330px] mx-auto bg-[#FFFDF9] text-[#2A2825] p-4 pb-7 rounded-sm select-none transition-shadow"
      style={{
        boxShadow: '0 14px 40px -10px rgba(42, 40, 37, 0.22), 0 2px 10px -2px rgba(42, 40, 37, 0.08)',
        border: '1px solid rgba(220, 214, 202, 0.6)',
      }}
    >
      {/* Washi masking tape at top */}
      <div
        className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-24 h-7 z-10 opacity-80"
        style={{
          backgroundColor: 'rgba(235, 222, 200, 0.75)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          clipPath: 'polygon(3% 0%, 97% 0%, 100% 100%, 0% 100%)',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* 3:4 Aspect Ratio Photo Box */}
      <div className="relative w-full aspect-[3/4] bg-[#22211F] rounded-[2px] overflow-hidden group shadow-inner">
        <img
          src={photo}
          alt="Slice Polaroid"
          className="w-full h-full object-cover filter contrast-[1.04] brightness-[0.98] saturate-[1.05]"
          crossOrigin="anonymous"
        />

        {/* Subtle vintage vignette and film grain overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, transparent 65%, rgba(20,18,16,0.35) 100%)',
          }}
        />

        {/* Interactive Controls Overlay */}
        {interactive && (
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3 text-white">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 text-stone-900 rounded-md text-xs font-medium shadow-md hover:bg-white active:scale-95 transition-all"
            >
              <Camera size={14} />
              上传/拍摄照片
            </button>
            <button
              onClick={cyclePresetPhoto}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 text-white border border-white/30 rounded-md text-xs font-medium shadow-md hover:bg-black/80 active:scale-95 transition-all"
            >
              <ImageIcon size={14} />
              切换预设生活图
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        {/* Date watermark on bottom right of photo */}
        <div className="absolute bottom-2.5 right-3 text-[10px] tracking-wider text-amber-100/90 font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          {ticket.dateDisplay}
        </div>
      </div>

      {/* Bottom Polaroid Border Section */}
      <div className="pt-4 px-1">
        {/* Poetic quote */}
        <p className="font-serif-vintage text-xs leading-relaxed text-[#3E3A33] text-center italic tracking-wide min-h-[36px] flex items-center justify-center">
          "{ticket.quote}"
        </p>

        {/* Completed items bullet summary */}
        <div className="mt-3 pt-2.5 border-t border-[#EAE5DC] flex items-center justify-between text-[11px] text-[#6E685F] font-mono-receipt">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">✦</span>
            <span>{ticket.city} · {ticket.weather}</span>
          </div>
          <div className="text-[10px] text-[#8C857A]">
            已完成 {ticket.completedCount}/{ticket.allHabitsCount} 切片
          </div>
        </div>

        {/* Stamp seal in bottom right corner */}
        <div className="mt-3 flex items-center justify-between">
          <div className="text-[9px] font-mono tracking-widest text-[#9C958A]">
            {ticket.ticketNo} · SLICE POLA
          </div>
          <div className="stamp-seal-circle text-[10px] text-[#C86D51] border-[#C86D51] px-2 py-0.5 font-bold">
            LIFE CAPTURE
          </div>
        </div>
      </div>
    </div>
  );
};
