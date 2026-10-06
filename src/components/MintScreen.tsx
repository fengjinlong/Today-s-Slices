import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { TemplateType, SliceTicket, HabitItem } from '../types';
import { ReceiptPaper } from './templates/ReceiptPaper';
import { PolaroidPaper } from './templates/PolaroidPaper';
import { TicketStubPaper } from './templates/TicketStubPaper';
import { ConfettiCanvas, ConfettiCanvasHandle } from './ConfettiCanvas';
import { ShareModal } from './ShareModal';
import { sound } from '../services/soundEngine';
import { PRESET_QUOTES, PRESET_POLAROID_PHOTOS } from '../services/storage';
import { Scissors, RefreshCw, Volume2, VolumeX, Sparkles, MoveHorizontal } from 'lucide-react';

interface MintScreenProps {
  habits: HabitItem[];
  city: string;
  weather: string;
  onTicketMinted: (ticket: SliceTicket) => void;
  onGoToGallery: () => void;
}

export const MintScreen: React.FC<MintScreenProps> = ({
  habits,
  city,
  weather,
  onTicketMinted,
  onGoToGallery,
}) => {
  const [template, setTemplate] = useState<TemplateType>('receipt');
  const [photoUrl, setPhotoUrl] = useState<string>(PRESET_POLAROID_PHOTOS[0]);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(sound.getMuted());

  // Tear Physics State
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isTorn, setIsTorn] = useState(false);
  const [isDispensing, setIsDispensing] = useState(true);

  // Modal and Image generation
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);

  const confettiRef = useRef<ConfettiCanvasHandle | null>(null);
  const paperElementRef = useRef<HTMLDivElement | null>(null);
  const dragStartXRef = useRef<number>(0);
  const lastStepTickRef = useRef<number>(0);

  // Compute ticket details from current habits and props
  const completedHabits = habits.filter((h) => h.status === 'completed');
  const totalHabits = habits.length || 1;
  const completedCount = completedHabits.length;
  const willpowerPercent = Math.min(100, Math.round((completedCount / totalHabits) * 100));

  const now = new Date();
  const dateDisplay = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(
    now.getDate()
  ).padStart(2, '0')}`;
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const weekdayDisplay = weekdays[now.getDay()];
  const timeDisplay = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;
  const randomSerial = String(Math.floor(Math.random() * 90000) + 10000);
  const ticketNo = `NO. ${randomSerial}`;
  const barcodeValue = `SLICE-${dateDisplay.replace(/\./g, '')}-${randomSerial.slice(0, 4)}`;

  const currentTicket: SliceTicket = {
    id: `ticket-${Date.now()}`,
    createdAt: now.toISOString(),
    dateDisplay,
    weekdayDisplay,
    timeDisplay,
    city,
    weather,
    template,
    completedHabits,
    allHabitsCount: totalHabits,
    completedCount,
    willpowerPercent,
    quote: PRESET_QUOTES[quoteIndex % PRESET_QUOTES.length],
    photoUrl,
    movieTitle: '《认真生活的一天》',
    seatNumber: 'VIP-01-A',
    barcodeValue,
    ticketNo,
  };

  // Dispense sound on initial mount
  useEffect(() => {
    sound.playDispenseHum();
    const timer = setTimeout(() => {
      setIsDispensing(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // Cycle quote
  const handleCycleQuote = () => {
    sound.playStepTick();
    setQuoteIndex((prev) => (prev + 1) % PRESET_QUOTES.length);
  };

  // Capture image as PNG Base64 with pixelRatio 3
  const capturePristineTicket = useCallback(async () => {
    if (!paperElementRef.current) return;
    try {
      // Ensure browser rendering and any image decode is settled
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => setTimeout(r, 60));

      const dataUrl = await toPng(paperElementRef.current, {
        width: 340, // Locks exact 340px width so text and titles NEVER wrap or shrink
        pixelRatio: 3,
        skipFonts: true, // Prevents SVG font metric recalculation from wrapping text
        cacheBust: false,
        backgroundColor: '#FFFDF9',
        filter: (node) => {
          if (node instanceof HTMLElement && node.classList.contains('no-export')) {
            return false;
          }
          return true;
        },
      });
      setCapturedImageUrl(dataUrl);

      // Save ticket to state & parent
      const savedTicket: SliceTicket = {
        ...currentTicket,
        photoUrl,
        imageData: dataUrl,
      };
      onTicketMinted(savedTicket);
    } catch (err) {
      console.error('Failed to capture ticket:', err);
    }
  }, [currentTicket, photoUrl, onTicketMinted]);

  // Execute tear off
  const executeTear = useCallback(() => {
    if (isTorn) return;
    setIsTorn(true);
    setIsDragging(false);

    // Haptics & audio
    sound.playTearSnap();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([30, 20, 50]);
      } catch {
        // Safe fallback
      }
    }

    // Confetti burst
    confettiRef.current?.burst(0.5);

    // Capture pristine ticket and pop modal after animation settles
    setTimeout(async () => {
      await capturePristineTicket();
      setShareModalOpen(true);
    }, 700);
  }, [isTorn, capturePristineTicket]);

  // Pointer / Touch Handlers for Drag
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isTorn || isDispensing) return;
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    lastStepTickRef.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || isTorn) return;

    const currentX = e.clientX;
    const delta = currentX - dragStartXRef.current;
    setDragX(delta);

    // Haptic feedback & gear tick sounds generated per 20px moved
    const movedDistance = Math.abs(delta);
    const stepCount = Math.floor(movedDistance / 20);

    if (stepCount > lastStepTickRef.current) {
      lastStepTickRef.current = stepCount;
      sound.playStepTick();
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(8);
        } catch {
          // Ignore
        }
      }
    }

    // Break threshold (Math.abs(deltaX) > 85px)
    if (Math.abs(delta) > 85) {
      executeTear();
    }
  };

  const handlePointerUp = () => {
    if (!isDragging || isTorn) return;
    setIsDragging(false);
    // Smooth snapback if threshold not reached
    setDragX(0);
  };

  // Shear transformation values
  const shearX = dragX * 0.4;
  const rotationDeg = dragX * 0.08;
  const tearProgress = Math.min(1, Math.abs(dragX) / 85);

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    sound.setMuted(next);
  };

  return (
    <div className="relative min-h-[calc(100vh-68px)] flex flex-col justify-between pb-8">
      {/* Paper Confetti Engine */}
      <ConfettiCanvas ref={confettiRef} />

      {/* Top Controls: Template Switcher & Sound */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-2 z-20">
        {/* Template Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-[#ECE8DF] rounded-xl text-xs">
          <button
            onClick={() => {
              if (!isTorn) {
                sound.playStepTick();
                setTemplate('receipt');
              }
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              template === 'receipt'
                ? 'bg-[#FFFDF9] text-[#2A2825] shadow-xs'
                : 'text-[#7A7368] hover:text-[#2A2825]'
            }`}
          >
            便利店小票
          </button>
          <button
            onClick={() => {
              if (!isTorn) {
                sound.playStepTick();
                setTemplate('polaroid');
              }
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              template === 'polaroid'
                ? 'bg-[#FFFDF9] text-[#2A2825] shadow-xs'
                : 'text-[#7A7368] hover:text-[#2A2825]'
            }`}
          >
            复古拍立得
          </button>
          <button
            onClick={() => {
              if (!isTorn) {
                sound.playStepTick();
                setTemplate('ticket');
              }
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              template === 'ticket'
                ? 'bg-[#FFFDF9] text-[#2A2825] shadow-xs'
                : 'text-[#7A7368] hover:text-[#2A2825]'
            }`}
          >
            电影票根
          </button>
        </div>

        {/* Audio Mute & Quote Reroll Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCycleQuote}
            className="p-2 rounded-xl bg-[#ECE8DF] text-[#6E685F] hover:text-[#2A2825] active:scale-95 transition-all text-xs flex items-center gap-1"
            title="更换切片寄语"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-[#ECE8DF] text-[#6E685F] hover:text-[#2A2825] active:scale-95 transition-all"
            title={isMuted ? '开启音效' : '静音'}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
        </div>
      </div>

      {/* Main Dispenser Stage */}
      <div className="relative flex-1 flex flex-col items-center justify-start pt-2 px-4 overflow-visible">
        {/* Dark Printer Slot at top (#232221) */}
        <div className="relative w-full max-w-[340px] z-20">
          {/* Printer Slot Bezel */}
          <div className="w-full h-5 bg-[#232221] rounded-t-md shadow-inner flex items-center justify-center border-b border-[#353432]">
            {/* The slit opening */}
            <div className="w-[88%] h-1 bg-[#131211] rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] relative">
              {/* Metallic roller highlight */}
              <div className="absolute inset-x-2 top-0 h-[0.5px] bg-[#4F4C47]" />
            </div>
          </div>
          {/* Subtle bottom shadow cast onto paper */}
          <div className="w-full h-2 bg-gradient-to-b from-[#232221]/40 to-transparent pointer-events-none -mb-2 z-10" />
        </div>

        {/* Perforated Shear Strip Indicator (Tear Line) */}
        <div className="w-full max-w-[330px] h-3 relative z-10 flex items-center justify-center">
          <div className="w-full border-b border-dashed border-[#A0998E] opacity-70" />
          {isDragging && (
            <div
              className="absolute text-[10px] font-mono uppercase bg-[#C86D51] text-white px-2 py-0.5 rounded-full shadow-sm"
              style={{
                opacity: 0.3 + tearProgress * 0.7,
                transform: `translateX(${shearX * 0.5}px)`,
              }}
            >
              撕裂阻尼: {Math.round(tearProgress * 100)}%
            </div>
          )}
        </div>

        {/* Interactive Paper Card with Native Touch Drag Gesture */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`relative w-full max-w-[340px] touch-none cursor-grab active:cursor-grabbing select-none transition-transform duration-75 ${
            isTorn
              ? 'animate-out translate-y-12 rotate-6 opacity-85 duration-500 pointer-events-none'
              : ''
          } ${isDispensing ? 'animate-in -translate-y-8 duration-500' : ''}`}
          style={{
            transform: isTorn
              ? 'translateY(40px) rotate(4deg)'
              : `translate3d(${shearX}px, ${Math.abs(shearX) * 0.15}px, 0) rotate(${rotationDeg}deg)`,
            transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
            transformOrigin: 'top center',
          }}
        >
          {/* Pristine Paper Content */}
          <div ref={paperElementRef} style={{ width: '340px' }} className="w-[340px] max-w-full mx-auto">
            {template === 'receipt' && (
              <ReceiptPaper ticket={currentTicket} showTearEdge={isTorn} />
            )}
            {template === 'polaroid' && (
              <PolaroidPaper
                ticket={currentTicket}
                onPhotoChange={(url) => setPhotoUrl(url)}
                interactive={!isTorn}
              />
            )}
            {template === 'ticket' && (
              <TicketStubPaper ticket={currentTicket} showTornState={isTorn} />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Guidance & Action Bar */}
      <div className="w-full max-w-md mx-auto px-4 mt-6 z-20">
        {!isTorn ? (
          <div className="flex flex-col items-center gap-3">
            {/* Gesture guidance */}
            <div className="flex items-center gap-2 text-xs text-[#7A7368] font-medium animate-pulse">
              <MoveHorizontal size={15} className="text-[#C86D51]" />
              <span>按住卡片「左右横向拖拽」撕下切片</span>
            </div>

            {/* Quick action button for direct tear */}
            <button
              onClick={executeTear}
              className="w-full py-3 px-4 bg-[#2A2825] text-[#FFFDF9] hover:bg-[#1C1A19] active:scale-[0.98] rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <Scissors size={15} className="text-[#C86D51]" />
              <span>撕下切片纸品 (Tear Off & Save)</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setShareModalOpen(true)}
              className="w-full py-3 px-4 bg-[#C86D51] text-white active:scale-[0.98] rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <Sparkles size={15} />
              <span>查看长按保存蒙层 (WeChat / RED Share)</span>
            </button>

            <button
              onClick={() => {
                setIsTorn(false);
                setDragX(0);
                sound.playDispenseHum();
              }}
              className="w-full py-2.5 px-4 bg-[#ECE8DF] text-[#4A453D] hover:bg-[#E2DDD2] active:scale-[0.98] rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
            >
              <RefreshCw size={13} />
              <span>重新出纸并铸造 (Re-mint)</span>
            </button>
          </div>
        )}
      </div>

      {/* WeChat / RED Share Modal */}
      <ShareModal
        ticket={currentTicket}
        imageDataUrl={capturedImageUrl}
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        onSaveToGallery={() => {
          setShareModalOpen(false);
          onGoToGallery();
        }}
      />
    </div>
  );
};
