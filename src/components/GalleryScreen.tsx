import React, { useState, useRef } from 'react';
import { SliceTicket } from '../types';
import { sound } from '../services/soundEngine';
import { ReceiptPaper } from './templates/ReceiptPaper';
import { PolaroidPaper } from './templates/PolaroidPaper';
import { TicketStubPaper } from './templates/TicketStubPaper';
import { ShareModal } from './ShareModal';
import { toPng } from 'html-to-image';
import {
  Calendar,
  Flame,
  Layers,
  Download,
  Eye,
  Trash2,
  Sparkles,
  Share2,
  FileImage,
} from 'lucide-react';

interface GalleryScreenProps {
  tickets: SliceTicket[];
  streakDays: number;
  onDeleteTicket: (id: string) => void;
  onGoToMint: () => void;
}

export const GalleryScreen: React.FC<GalleryScreenProps> = ({
  tickets,
  streakDays,
  onDeleteTicket,
  onGoToMint,
}) => {
  const [selectedTicket, setSelectedTicket] = useState<SliceTicket | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [isExportingCollage, setIsExportingCollage] = useState(false);
  const [collageImageUrl, setCollageImageUrl] = useState<string | null>(null);
  const collageRef = useRef<HTMLDivElement | null>(null);

  const totalSlices = tickets.reduce((acc, t) => acc + (t.completedCount || 0), 0);

  // Filter or group by month
  const currentMonthLabel = '2026年10月';

  const handleOpenTicket = (ticket: SliceTicket) => {
    sound.playStepTick();
    setSelectedTicket(ticket);
  };

  const handleExportCollage = async () => {
    if (!collageRef.current) return;
    sound.playStampThud();
    setIsExportingCollage(true);

    try {
      const dataUrl = await toPng(collageRef.current, {
        pixelRatio: 2.5,
        backgroundColor: '#F7F5F0',
      });
      setCollageImageUrl(dataUrl);

      // Auto download collage
      const link = document.createElement('a');
      link.download = `Slice-Collage-${currentMonthLabel}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Collage export failed', err);
    } finally {
      setIsExportingCollage(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-68px)] px-4 pt-4 pb-28">
      {/* Stats Summary Bar */}
      <div className="bg-[#FFFDF9] rounded-2xl p-4 border border-[#E8E2D7] shadow-xs mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C86D51]/10 text-[#C86D51] flex items-center justify-center">
              <Layers size={18} />
            </div>
            <div>
              <div className="text-[11px] font-mono text-[#8C8578] uppercase">
                TICKETS COLLECTED
              </div>
              <div className="text-lg font-bold font-serif-vintage text-[#2A2825]">
                {tickets.length} 张实体票券
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 border-l border-[#EBE6DC] pl-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Flame size={18} />
            </div>
            <div>
              <div className="text-[11px] font-mono text-[#8C8578] uppercase">
                CONSECUTIVE STREAK
              </div>
              <div className="text-lg font-bold font-serif-vintage text-[#2A2825]">
                {streakDays} 天连续铸造
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-[#F0EBE0] flex items-center justify-between text-xs text-[#7A7367]">
          <span>累计达成生活切片：<b className="font-mono text-[#2A2825]">{totalSlices}</b> 个</span>
          <span className="font-mono text-[11px]">ARCHIVE #2026</span>
        </div>
      </div>

      {/* Album Title */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-[#C86D51]" />
          <h2 className="text-xs font-bold text-[#2A2825] uppercase tracking-wider font-mono-receipt">
            {currentMonthLabel} · 记忆票夹
          </h2>
        </div>
        <div className="text-[11px] text-[#918B80]">
          点击票券预览或重新保存
        </div>
      </div>

      {/* Tickets Grid Feed */}
      {tickets.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {tickets.map((t) => {
            return (
              <div
                key={t.id}
                onClick={() => handleOpenTicket(t)}
                className="group relative bg-[#FFFDF9] rounded-xl border border-[#DFD9CE] hover:border-[#C86D51]/50 p-2.5 shadow-2xs hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col justify-between"
              >
                {/* Visual miniature representation */}
                <div className="relative aspect-[3/4] w-full rounded-md overflow-hidden bg-[#FAF8F5] border border-[#ECE7DC] flex items-center justify-center p-1.5">
                  {t.imageData ? (
                    <img
                      src={t.imageData}
                      alt="Ticket thumbnail"
                      className="w-full h-full object-contain filter group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : t.template === 'polaroid' && t.photoUrl ? (
                    <div className="w-full h-full flex flex-col bg-white p-1 rounded-xs">
                      <img
                        src={t.photoUrl}
                        alt="Polaroid thumbnail"
                        className="w-full h-[70%] object-cover rounded-xs"
                      />
                      <div className="mt-1 text-[8px] font-serif-vintage truncate text-[#444] text-center">
                        {t.quote}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col justify-between p-2 text-[9px] font-mono-receipt bg-[#FFFDF9]">
                      <div className="border-b border-dashed border-stone-300 pb-1 font-bold text-center">
                        {t.template === 'receipt' ? '便利店小票' : '电影票根'}
                      </div>
                      <div className="space-y-0.5 text-stone-600 truncate">
                        {t.completedHabits.slice(0, 3).map((h, idx) => (
                          <div key={idx} className="truncate">
                            {h.icon} {h.title}
                          </div>
                        ))}
                      </div>
                      <div className="text-center font-bold text-[#C86D51]">
                        {t.ticketNo}
                      </div>
                    </div>
                  )}

                  {/* Stamp mark watermark */}
                  <div className="absolute top-2 right-2 stamp-seal text-[8px] px-1 py-0.2 border-[#C86D51] text-[#C86D51] opacity-75">
                    {t.template.toUpperCase()}
                  </div>
                </div>

                {/* Bottom info */}
                <div className="mt-2.5 px-0.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#4A453D]">
                    <span className="font-semibold">{t.dateDisplay}</span>
                    <span className="text-[#8C8578]">{t.timeDisplay}</span>
                  </div>
                  <div className="text-[10px] text-[#8C8578] mt-0.5 truncate font-serif-vintage">
                    "{t.quote}"
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#FFFDF9] rounded-2xl border-2 border-dashed border-[#DDD7CC] p-8 text-center my-6">
          <div className="w-12 h-12 rounded-full bg-[#FAF7F0] mx-auto flex items-center justify-center text-xl mb-3">
            📜
          </div>
          <h3 className="text-sm font-bold text-[#2A2825] font-serif-vintage mb-1">
            票夹目前空空如也
          </h3>
          <p className="text-xs text-[#7A7367] mb-4">
            完成今日习惯打卡后，即可在出纸机中撕下专属实体纸品。
          </p>
          <button
            onClick={onGoToMint}
            className="px-4 py-2 bg-[#2A2825] text-[#FFFDF9] rounded-xl text-xs font-medium shadow-sm hover:bg-black transition-colors"
          >
            立即铸造第一张切片
          </button>
        </div>
      )}

      {/* Floating Action Button: Export Monthly Collage */}
      {tickets.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 max-w-md mx-auto px-4 pointer-events-none z-30">
          <button
            onClick={handleExportCollage}
            disabled={isExportingCollage}
            className="pointer-events-auto w-full py-3 px-4 bg-[#2A2825] hover:bg-[#1E1C1A] active:scale-[0.98] text-[#FFFDF9] rounded-2xl shadow-xl font-medium text-xs flex items-center justify-center gap-2 transition-all border border-[#484541]"
          >
            <Sparkles size={15} className="text-[#C86D51]" />
            <span>
              {isExportingCollage
                ? '正在生成月度海报...'
                : '导出月度切片墙 (Export Monthly Collage)'}
            </span>
          </button>
        </div>
      )}

      {/* Off-screen Collage Container for High-Res Generation */}
      <div
        ref={collageRef}
        style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '750px' }}
        className="bg-[#F7F5F0] p-8 text-[#2A2825]"
      >
        <div className="text-center pb-6 border-b border-[#D8D2C5]">
          <div className="text-xs font-mono tracking-widest text-[#8C8578] uppercase">
            MONTHLY LIFE SLICES WALL
          </div>
          <h1 className="text-2xl font-bold font-serif-vintage mt-1 text-[#2A2825]">
            生活切片 · {currentMonthLabel} 胶囊墙
          </h1>
          <p className="text-xs text-[#6E685E] mt-1 font-serif-vintage italic">
            收集日常琐碎的微光，拼贴成平凡生活里的诗行
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5 my-6">
          {tickets.slice(0, 4).map((t, idx) => (
            <div
              key={idx}
              className="bg-[#FFFDF9] p-4 rounded-xl shadow-md border border-[#E0D9CD]"
            >
              <div className="flex justify-between text-xs font-mono text-[#888] mb-2">
                <span>{t.dateDisplay}</span>
                <span>{t.ticketNo}</span>
              </div>
              {t.imageData ? (
                <img
                  src={t.imageData}
                  alt="ticket"
                  className="w-full max-h-64 object-contain mx-auto"
                />
              ) : (
                <div className="text-xs font-serif-vintage p-2 text-center text-[#555]">
                  "{t.quote}"
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-[#D8D2C5] flex justify-between items-center text-xs font-mono text-[#8C8578]">
          <span>TOTAL MINTED: {tickets.length} TICKETS</span>
          <span>SLICE (生活切片) · GENERATED IN 2026</span>
        </div>
      </div>

      {/* Detailed Inspection Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto bg-[#F7F5F0] rounded-2xl p-5 shadow-2xl flex flex-col items-center">
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#7A7368] hover:text-[#2A2825] hover:bg-black/5"
            >
              ✕
            </button>

            <div className="text-xs font-mono text-[#C86D51] mb-1 font-bold">
              {selectedTicket.dateDisplay} · {selectedTicket.weekdayDisplay}
            </div>
            <h3 className="text-base font-bold font-serif-vintage text-[#2A2825] mb-4">
              切片票券详情
            </h3>

            {/* Ticket Preview */}
            <div className="w-full flex justify-center my-1">
              {selectedTicket.imageData ? (
                <img
                  src={selectedTicket.imageData}
                  alt="Saved Ticket"
                  className="wechat-save-image max-h-[50vh] object-contain rounded-md shadow-lg"
                />
              ) : selectedTicket.template === 'receipt' ? (
                <ReceiptPaper ticket={selectedTicket} showTearEdge={true} />
              ) : selectedTicket.template === 'polaroid' ? (
                <PolaroidPaper ticket={selectedTicket} />
              ) : (
                <TicketStubPaper ticket={selectedTicket} showTornState={true} />
              )}
            </div>

            {/* Actions inside inspection modal */}
            <div className="w-full mt-5 space-y-2">
              <button
                onClick={() => {
                  setShareModalOpen(true);
                }}
                className="w-full py-2.5 px-4 bg-[#2A2825] text-white rounded-xl text-xs font-medium flex items-center justify-center gap-2 hover:bg-black"
              >
                <Share2 size={14} className="text-[#C86D51]" />
                <span>微信 / 小红书长按保存视图</span>
              </button>

              <button
                onClick={() => {
                  if (confirm('确定要从票夹中移除这张切片吗？')) {
                    onDeleteTicket(selectedTicket.id);
                    setSelectedTicket(null);
                  }
                }}
                className="w-full py-2 px-4 text-[#A0988A] hover:text-red-600 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 size={13} />
                <span>从票夹删除</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal bridge */}
      {selectedTicket && (
        <ShareModal
          ticket={selectedTicket}
          imageDataUrl={selectedTicket.imageData || null}
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          onSaveToGallery={() => setShareModalOpen(false)}
        />
      )}
    </div>
  );
};
