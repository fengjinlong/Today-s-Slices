import React, { useRef } from 'react';
import { SliceTicket } from '../../types';
import { PRESET_POLAROID_PHOTOS } from '../../services/storage';
import { Camera, Image as ImageIcon } from 'lucide-react';
import { sound } from '../../services/soundEngine';

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

  const isDataUrl = photo.startsWith('data:') || photo.startsWith('blob:');

  // Handle local photo upload with canvas-based downsampling to ensure pristine, lightweight, non-corrupted Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onPhotoChange) {
      sound.playStampThud();
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawUrl = event.target?.result as string;
        if (!rawUrl) return;

        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const cleanDataUrl = canvas.toDataURL('image/jpeg', 0.92);
            onPhotoChange(cleanDataUrl);
          } else {
            onPhotoChange(rawUrl);
          }
        };
        img.onerror = () => {
          onPhotoChange(rawUrl);
        };
        img.src = rawUrl;
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const cyclePresetPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playStepTick();
    if (!onPhotoChange) return;
    const currentIndex = PRESET_POLAROID_PHOTOS.indexOf(photo);
    const nextIndex = (currentIndex + 1) % PRESET_POLAROID_PHOTOS.length;
    onPhotoChange(PRESET_POLAROID_PHOTOS[nextIndex]);
  };

  return (
    <div
      id={id}
      className="relative w-[340px] max-w-full mx-auto bg-[#FFFDF9] text-[#2A2825] p-4 pb-7 rounded-sm select-none transition-shadow"
      style={{
        boxShadow: '0 14px 40px -10px rgba(42, 40, 37, 0.22), 0 2px 10px -2px rgba(42, 40, 37, 0.08)',
        border: '1px solid rgba(220, 214, 202, 0.6)',
        width: '340px',
        boxSizing: 'border-box',
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

      {/* 3:4 Aspect Ratio Photo Box with warm paper placeholder instead of pure black */}
      <div className="relative w-full aspect-[3/4] bg-[#EAE6DF] rounded-[2px] overflow-hidden group shadow-inner">
        <img
          src={photo}
          alt="Slice Polaroid"
          className="w-full h-full object-cover block"
          loading="eager"
          decoding="sync"
          {...(!isDataUrl ? { crossOrigin: 'anonymous' } : {})}
        />

        {/* Date watermark on bottom right of photo */}
        <div className="absolute bottom-2.5 right-3 text-[10px] tracking-wider text-amber-100 font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] pointer-events-none z-10 whitespace-nowrap">
          {ticket.dateDisplay}
        </div>

        {/* Interactive Controls Overlay for Desktop Hover */}
        {interactive && (
          <div className="no-export absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3 text-white z-20">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-stone-900 rounded-md text-xs font-medium shadow-md hover:bg-stone-100 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <Camera size={14} className="text-[#C86D51]" />
              上传/拍摄照片
            </button>
            <button
              onClick={cyclePresetPhoto}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-black/70 text-white border border-white/30 rounded-md text-xs font-medium shadow-md hover:bg-black/90 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <ImageIcon size={14} />
              切换预设生活图
            </button>
          </div>
        )}

        {/* Mobile Quick Action Pill */}
        {interactive && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="no-export absolute bottom-2 left-2 z-20 bg-black/60 hover:bg-black/80 backdrop-blur-xs text-white text-[10px] px-2 py-1 rounded-md flex items-center gap-1 shadow-md active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            <Camera size={11} className="text-[#E8A590]" />
            <span>更换照片</span>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Bottom Polaroid Border Section */}
      <div className="pt-4 px-1">
        {/* Poetic quote */}
        <p className="font-serif-vintage text-xs leading-relaxed text-[#3E3A33] text-center italic tracking-wide min-h-[36px] flex items-center justify-center">
          "{ticket.quote}"
        </p>

        {/* Completed items bullet summary */}
        <div className="mt-3 pt-2.5 border-t border-[#EAE5DC] flex items-center justify-between text-[11px] text-[#6E685F] font-mono-receipt whitespace-nowrap">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-xs">✦</span>
            <span className="whitespace-nowrap">{ticket.city} · {ticket.weather}</span>
          </div>
          <div className="text-[10px] text-[#8C8578] whitespace-nowrap">
            已完成 {ticket.completedCount}/{ticket.allHabitsCount} 切片
          </div>
        </div>

        {/* Stamp seal in bottom right corner */}
        <div className="mt-3 flex items-center justify-between">
          <div className="text-[9px] font-mono tracking-widest text-[#9C958A] whitespace-nowrap">
            {ticket.ticketNo} · SLICE POLA
          </div>
          <div className="stamp-seal-circle text-[10px] text-[#C86D51] border-[#C86D51] px-2 py-0.5 font-bold whitespace-nowrap">
            LIFE CAPTURE
          </div>
        </div>
      </div>
    </div>
  );
};
