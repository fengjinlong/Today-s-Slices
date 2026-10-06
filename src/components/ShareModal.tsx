import React, { useState } from 'react';
import { SliceTicket } from '../types';
import { Download, Check, Sparkles, X, Share2 } from 'lucide-react';

interface ShareModalProps {
  ticket: SliceTicket;
  imageDataUrl: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveToGallery: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  ticket,
  imageDataUrl,
  isOpen,
  onClose,
  onSaveToGallery,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!imageDataUrl) return;
    try {
      const link = document.createElement('a');
      link.download = `Slice-${ticket.template}-${ticket.dateDisplay}.png`;
      link.href = imageDataUrl;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Container max-w-md for mobile-first experience */}
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto bg-[#F7F5F0] rounded-2xl shadow-2xl p-5 flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-[#7A7368] hover:text-[#2A2825] hover:bg-black/5 active:scale-95 transition-all z-10"
          aria-label="关闭"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-3 pt-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C86D51] tracking-wide mb-1">
            <Sparkles size={13} />
            <span>切片铸造完成 · 已生成实体纸品</span>
          </div>
          <h2 className="text-base font-bold text-[#2A2825] font-serif-vintage">
            分享至 微信朋友圈 / 小红书
          </h2>
        </div>

        {/* WeChat Long-press Image Container */}
        <div className="relative w-full flex flex-col items-center my-1 group">
          {imageDataUrl ? (
            <div className="relative max-h-[55vh] flex justify-center">
              <img
                src={imageDataUrl}
                alt="生活切片实体纸品"
                className="wechat-save-image max-h-[55vh] w-auto object-contain rounded-sm shadow-xl border border-stone-200 select-auto pointer-events-auto"
                style={{
                  WebkitTouchCallout: 'default',
                  touchAction: 'auto',
                }}
              />

              {/* WeChat Bouncing Finger Indicator */}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#2A2825] text-white text-[11px] px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce pointer-events-none whitespace-nowrap">
                <span className="text-sm">👆</span>
                <span className="font-medium tracking-wide">长按图片保存或发送</span>
              </div>
            </div>
          ) : (
            <div className="w-64 h-80 flex flex-col items-center justify-center bg-stone-100 rounded-lg text-stone-400 text-xs gap-2">
              <div className="w-6 h-6 border-2 border-stone-300 border-t-[#C86D51] rounded-full animate-spin" />
              <span>正在生成 300DPI 高清纸张...</span>
            </div>
          )}
        </div>

        {/* Guidance Notice */}
        <div className="w-full mt-6 bg-[#EFECE4] rounded-xl p-3 text-center border border-[#E0DACE]">
          <p className="text-xs text-[#5D574C] leading-relaxed">
            已开启微信 / 小红书长按识别。长按上方卡片即可直接「保存图片」或「发送给朋友」。
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full mt-4 flex flex-col gap-2.5">
          <button
            onClick={handleDownload}
            disabled={!imageDataUrl}
            className="w-full py-2.5 px-4 bg-[#FFFDF9] hover:bg-[#F2EFE8] active:scale-[0.98] border border-[#D5CEC2] text-[#2A2825] rounded-xl font-medium text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            {downloadSuccess ? (
              <>
                <Check size={14} className="text-emerald-600" />
                <span className="text-emerald-700 font-bold">已下载到本地！</span>
              </>
            ) : (
              <>
                <Download size={14} />
                <span>直接下载高清图片 (PNG)</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              onSaveToGallery();
              onClose();
            }}
            className="w-full py-3 px-4 bg-[#2A2825] hover:bg-[#1E1C1A] active:scale-[0.98] text-[#FFFDF9] rounded-xl font-medium text-xs flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <Check size={14} className="text-[#C86D51]" />
            <span>存入票夹并完成 (Save & View Gallery)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
