import React, { useState, useRef, useEffect } from 'react';
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
  Trash2,
  Sparkles,
  Share2,
  X,
  Check,
  RefreshCw,
  Eye,
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

  // Ref to the live visible poster element inside the modal
  const posterRef = useRef<HTMLDivElement | null>(null);

  const totalSlices = tickets.reduce((acc, t) => acc + (t.completedCount || 0), 0);
  const currentMonthLabel = '2026年10月';

  const handleOpenTicket = (ticket: SliceTicket) => {
    sound.playStepTick();
    setSelectedTicket(ticket);
  };

  // Open the collage modal and trigger mobile-safe capture
  const handleOpenCollage = () => {
    sound.playStampThud();
    setCollageImageUrl(null);
    setIsCollageModalOpen(true);
    setIsExportingCollage(true);
  };

  // When modal is open and poster element is mounted & visible in viewport, capture it safely
  useEffect(() => {
    if (!isCollageModalOpen || !posterRef.current) return;

    let isMounted = true;
    const generateImage = async () => {
      try {
        // Wait 2 animation frames + 150ms to ensure the mobile browser has fully painted fonts and layout
        await new Promise((r) => requestAnimationFrame(r));
        await new Promise((r) => setTimeout(r, 180));

        if (!posterRef.current || !isMounted) return;

        // Mobile-safe capture with optimal dimensions (350px * 2 = 700px width)
        const dataUrl = await toPng(posterRef.current, {
          pixelRatio: 2,
          cacheBust: false,
          backgroundColor: '#F7F5F0',
          filter: (node) => {
            if (node instanceof HTMLElement && node.classList.contains('no-export')) {
              return false;
            }
            return true;
          },
        });

        if (isMounted) {
          setCollageImageUrl(dataUrl);
          setIsExportingCollage(false);
        }
      } catch (err) {
        console.error('Mobile collage capture failed:', err);
        if (isMounted) {
          setIsExportingCollage(false);
        }
      }
    };

    generateImage();

    return () => {
      isMounted = false;
    };
  }, [isCollageModalOpen]);

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

  // Select up to 4 featured tickets for the monthly collage
  const collageTickets = tickets.slice(0, 4);

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
            onClick={handleOpenCollage}
            className="pointer-events-auto w-full py-3.5 px-4 bg-[#2A2825] hover:bg-[#1E1C1A] active:scale-[0.98] text-[#FFFDF9] rounded-2xl shadow-xl font-medium text-xs flex items-center justify-center gap-2 transition-all border border-[#484541] cursor-pointer"
          >
            <Sparkles size={15} className="text-[#C86D51]" />
            <span>导出月度切片墙 (Export Monthly Collage)</span>
          </button>
        </div>
      )}

      {/* Monthly Collage Modal (Mobile-First, Visible Render Architecture) */}
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

            {/* Main Stage: If image is generated, show WeChat-saveable image;
                Otherwise show the live rendered DOM poster so the mobile engine paints every pixel */}
            <div className="relative w-full flex flex-col items-center my-1 group">
              {collageImageUrl ? (
                /* WeChat Long-Press Saveable Image */
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
                /* Generating status + live DOM poster */
                <div className="w-full flex flex-col items-center">
                  <div className="mb-2 flex items-center gap-1.5 text-xs text-[#7A7368] font-mono">
                    <div className="w-3.5 h-3.5 border-2 border-stone-400 border-t-[#C86D51] rounded-full animate-spin" />
                    <span>正在生成高清海报，请稍候...</span>
                  </div>
                </div>
              )}

              {/* The Mobile-Calibrated Poster DOM Element (Always rendered in DOM for capture, width 340px) */}
              <div
                className={`w-full flex justify-center ${
                  collageImageUrl ? 'absolute opacity-0 pointer-events-none' : 'relative opacity-100'
                }`}
              >
                <div
                  ref={posterRef}
                  style={{ width: '340px' }}
                  className="bg-[#F7F5F0] p-4 text-[#2A2825] font-sans border border-[#DFD9CD] rounded-xl shadow-md select-none mx-auto"
                >
                  {/* Poster Header */}
                  <div className="text-center pb-3 border-b border-[#D8D2C5]">
                    <div className="text-[9px] font-mono tracking-widest text-[#8C8578] uppercase">
                      MONTHLY LIFE SLICES WALL
                    </div>
                    <h1 className="text-lg font-bold font-serif-vintage mt-0.5 text-[#2A2825] tracking-tight">
                      {currentMonthLabel} · 日常微光拼贴
                    </h1>
                    <p className="text-[10px] font-serif-vintage italic text-[#6E685E] mt-0.5">
                      认真生活的每一刻，都在悄悄沉淀成诗
                    </p>

                    <div className="flex items-center justify-center gap-2 mt-2 text-[10px] font-mono text-[#777] bg-[#EFECE5] py-1 px-2 rounded-lg">
                      <span>{tickets.length} 张票券</span>
                      <span>·</span>
                      <span>连续 {streakDays} 天</span>
                      <span>·</span>
                      <span>达成 {totalSlices} 项</span>
                    </div>
                  </div>

                  {/* 2x2 Grid of Slice Cards */}
                  <div className="grid grid-cols-2 gap-2.5 my-3">
                    {collageTickets.map((t, idx) => (
                      <div
                        key={idx}
                        className="bg-[#FFFDF9] p-2.5 rounded-lg border border-[#DFD9CD] shadow-2xs flex flex-col justify-between"
                      >
                        {/* Date & No */}
                        <div className="flex justify-between items-center text-[9px] font-mono text-[#8C8578] mb-1.5 border-b border-[#EAE5DB] pb-1">
                          <span className="font-semibold text-[#2A2825]">{t.dateDisplay}</span>
                          <span className="text-[#C86D51] font-bold">{t.ticketNo}</span>
                        </div>

                        {/* Card Content Thumbnail */}
                        {t.imageData ? (
                          <div className="h-28 flex items-center justify-center my-0.5 overflow-hidden rounded-[2px]">
                            <img
                              src={t.imageData}
                              alt="Ticket"
                              className="max-h-28 w-auto object-contain"
                            />
                          </div>
                        ) : t.template === 'polaroid' && t.photoUrl ? (
                          <div className="bg-[#FFFDF9] p-1 border border-[#E5DFD4] rounded-xs shadow-2xs">
                            <div className="h-20 bg-[#EAE6DF] overflow-hidden rounded-[2px] mb-1">
                              <img
                                src={t.photoUrl}
                                alt="Polaroid"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-[8px] font-serif-vintage italic text-[#4A453D] text-center truncate">
                              "{t.quote}"
                            </p>
                          </div>
                        ) : t.template === 'ticket' ? (
                          <div className="bg-[#F4F1EA] p-2 rounded-md border border-[#DFD9CE] text-[9px] min-h-[90px] flex flex-col justify-between">
                            <div>
                              <div className="font-mono text-[#C86D51] font-bold text-[8px]">
                                LIFE CINEMA
                              </div>
                              <div className="font-bold text-[10px] font-serif-vintage text-[#2A2825] truncate">
                                {t.movieTitle || '《认真生活的一天》'}
                              </div>
                              <div className="space-y-0.5 text-[#555] my-1 text-[8px]">
                                {t.completedHabits.slice(0, 2).map((h, i) => (
                                  <div key={i} className="truncate">
                                    {h.icon} {h.title}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="flex justify-between font-mono text-[8px] text-[#888] pt-1 border-t border-dashed border-[#CCC]">
                              <span>{t.seatNumber || 'VIP-01-A'}</span>
                              <span className="text-[#C86D51]">ADMIT 1</span>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-[#FFFDF9] p-2 rounded-sm border border-[#E2DDD2] font-mono-receipt text-[9px] min-h-[90px] flex flex-col justify-between">
                            <div>
                              <div className="text-center font-bold text-[9px] pb-0.5 border-b border-dashed border-[#DDD]">
                                生活便利店清单
                              </div>
                              <div className="space-y-0.5 my-1 text-[8px]">
                                {t.completedHabits.slice(0, 2).map((h, i) => (
                                  <div key={i} className="flex justify-between">
                                    <span className="truncate pr-1">{h.icon} {h.title}</span>
                                    <span className="text-[#C86D51]">100%</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="flex justify-between items-center pt-0.5 border-t border-dashed border-[#DDD] text-[8px] text-[#888]">
                              <span>实付意志力</span>
                              <span className="font-bold text-[#2A2825]">{t.willpowerPercent}%</span>
                            </div>
                          </div>
                        )}

                        {/* Footer stamp */}
                        <div className="mt-1.5 pt-1 border-t border-[#F0EBE0] flex justify-between items-center text-[8px] font-mono text-[#999]">
                          <span>{t.city}</span>
                          <span className="stamp-seal text-[6px] px-1 border-[#C86D51] text-[#C86D51]">
                            MINTED
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Synthetic Barcode & Poster Footer */}
                  <div className="pt-2.5 border-t border-[#D8D2C5] flex flex-col items-center">
                    <div className="flex items-center justify-center gap-[2px] h-6 mb-1 px-4 overflow-hidden w-full">
                      {Array.from({ length: 32 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-full ${
                            i % 4 === 0 ? 'w-[2px] bg-[#2A2825]' : 'w-[1px] bg-[#2A2825]'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between items-center w-full text-[8px] font-mono text-[#8C8578]">
                      <span>SLICE ARCHIVE #2026</span>
                      <span className="text-[#C86D51] font-bold">★ 平凡日常 皆为诗篇 ★</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hint Notice */}
            <div className="w-full mt-5 bg-[#EFECE4] rounded-xl p-3 text-center border border-[#E0DACE]">
              <p className="text-xs text-[#5D574C] leading-relaxed">
                已优化手机端专属比例。长按上方海报即可直接「保存到手机相册」或「发送给好友」。
              </p>
            </div>

            {/* Action Buttons */}
            <div className="w-full mt-3.5 flex flex-col gap-2">
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
