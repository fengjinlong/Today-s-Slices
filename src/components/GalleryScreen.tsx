import React, { useState } from 'react';
import { SliceTicket } from '../types';
import { sound } from '../services/soundEngine';
import { ReceiptPaper } from './templates/ReceiptPaper';
import { PolaroidPaper } from './templates/PolaroidPaper';
import { TicketStubPaper } from './templates/TicketStubPaper';
import { ShareModal } from './ShareModal';
import { generateMonthlyPoster } from '../services/posterCanvas';
import {
  Calendar,
  Flame,
  Layers,
  Download,
  Trash2,
  Sparkles,
  Share2,
  X,
  Check,
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
  const [isCollageModalOpen, setIsCollageModalOpen] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const totalSlices = tickets.reduce((acc, t) => acc + (t.completedCount || 0), 0);
  const currentMonthLabel = '2026年10月';

  const handleOpenTicket = (ticket: SliceTicket) => {
    sound.playStepTick();
    setSelectedTicket(ticket);
  };

  // 100% Deterministic Canvas 2D Poster Generator
  const handleExportCollage = async () => {
    sound.playStampThud();
    setIsExportingCollage(true);
    setIsCollageModalOpen(true);

    try {
      // Generate pristine 2D canvas poster (zero SVG bugs, zero mobile culling)
      const dataUrl = await generateMonthlyPoster(
        tickets,
        streakDays,
        currentMonthLabel,
        totalSlices
      );

      setCollageImageUrl(dataUrl);

      // Auto trigger download
      try {
        const link = document.createElement('a');
        link.download = `Slice-Collage-${currentMonthLabel}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch {
        // Fallback handled by UI download button
      }
    } catch (err) {
      console.error('Collage generation error:', err);
    } finally {
      setIsExportingCollage(false);
    }
  };

  const handleDownloadCollageManual = () => {
    if (!collageImageUrl) return;
    try {
      const link = document.createElement('a');
      link.download = `Slice-Collage-${currentMonthLabel}.png`;
      link.href = collageImageUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
    } catch (e) {
      console.error('Download error:', e);
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
            className="pointer-events-auto w-full py-3.5 px-4 bg-[#2A2825] hover:bg-[#1E1C1A] active:scale-[0.98] text-[#FFFDF9] rounded-2xl shadow-xl font-medium text-xs flex items-center justify-center gap-2 transition-all border border-[#484541] cursor-pointer"
          >
            <Sparkles size={15} className="text-[#C86D51]" />
            <span>
              {isExportingCollage ? '正在生成海报...' : '导出月度切片墙 (Export Monthly Collage)'}
            </span>
          </button>
        </div>
      )}

      {/* Monthly Collage Modal (100% Reliable Base64 Image Preview) */}
      {isCollageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md max-h-[94vh] overflow-y-auto bg-[#F7F5F0] rounded-2xl shadow-2xl p-4 sm:p-5 flex flex-col items-center">
            {/* Close Button */}
            <button
              onClick={() => setIsCollageModalOpen(false)}
              className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-[#7A7368] hover:text-[#2A2825] hover:bg-black/5 z-20 cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="text-center mb-3 pt-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C86D51] tracking-wide mb-0.5">
                <Sparkles size={13} />
                <span>月度切片墙海报已生成</span>
              </div>
              <h2 className="text-base font-bold text-[#2A2825] font-serif-vintage">
                分享至 微信朋友圈 / 小红书
              </h2>
            </div>

            {/* Poster Preview */}
            <div className="relative w-full flex flex-col items-center my-1 group">
              {collageImageUrl ? (
                <div className="relative max-h-[60vh] flex justify-center">
                  <img
                    src={collageImageUrl}
                    alt="Monthly Collage Wall Poster"
                    className="wechat-save-image max-h-[60vh] w-auto object-contain rounded-md shadow-xl border border-stone-200 select-auto pointer-events-auto"
                    style={{
                      WebkitTouchCallout: 'default',
                      touchAction: 'auto',
                    }}
                  />

                  {/* Bouncing finger hint */}
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#2A2825] text-white text-[11px] px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce pointer-events-none whitespace-nowrap z-20">
                    <span className="text-sm">👆</span>
                    <span className="font-medium tracking-wide">长按海报保存至相册</span>
                  </div>
                </div>
              ) : (
                <div className="w-64 h-80 flex flex-col items-center justify-center bg-stone-100 rounded-lg text-stone-400 text-xs gap-2">
                  <div className="w-6 h-6 border-2 border-stone-300 border-t-[#C86D51] rounded-full animate-spin" />
                  <span>正在合成月度切片海报...</span>
                </div>
              )}
            </div>

            {/* Hint Notice */}
            <div className="w-full mt-6 bg-[#EFECE4] rounded-xl p-3 text-center border border-[#E0DACE]">
              <p className="text-xs text-[#5D574C] leading-relaxed">
                长按上方海报即可直接「保存到手机相册」或「发送给微信好友」。
              </p>
            </div>

            {/* Action Buttons */}
            <div className="w-full mt-4 flex flex-col gap-2">
              <button
                onClick={handleDownloadCollageManual}
                disabled={!collageImageUrl}
                className="w-full py-2.5 px-4 bg-[#FFFDF9] hover:bg-[#F2EFE8] active:scale-[0.98] border border-[#D5CEC2] text-[#2A2825] rounded-xl font-medium text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                {downloadSuccess ? (
                  <>
                    <Check size={14} className="text-emerald-600" />
                    <span className="text-emerald-700 font-bold">已下载到手机！</span>
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    <span>保存海报到相册 (下载 PNG)</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setIsCollageModalOpen(false)}
                className="w-full py-2.5 px-4 bg-[#2A2825] text-white rounded-xl text-xs font-medium hover:bg-black transition-colors cursor-pointer"
              >
                关闭预览
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Inspection Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto bg-[#F7F5F0] rounded-2xl p-5 shadow-2xl flex flex-col items-center">
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#7A7368] hover:text-[#2A2825] hover:bg-black/5 cursor-pointer"
            >
              <X size={18} />
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
                className="w-full py-2.5 px-4 bg-[#2A2825] text-white rounded-xl text-xs font-medium flex items-center justify-center gap-2 hover:bg-black cursor-pointer"
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
                className="w-full py-2 px-4 text-[#A0988A] hover:text-red-600 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
