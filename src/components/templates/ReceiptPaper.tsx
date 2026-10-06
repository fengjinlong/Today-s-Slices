import React from 'react';
import { SliceTicket } from '../../types';

interface ReceiptPaperProps {
  ticket: SliceTicket;
  id?: string;
  showTearEdge?: boolean;
}

export const ReceiptPaper: React.FC<ReceiptPaperProps> = ({ ticket, id, showTearEdge = false }) => {
  return (
    <div
      id={id}
      className="relative w-[340px] max-w-full mx-auto bg-[#FFFDF9] text-[#2A2825] px-6 pt-7 pb-8 shadow-[0_12px_35px_-8px_rgba(42,40,37,0.18)] font-mono-receipt text-xs select-none border-t border-[#EAE6DF]"
      style={{
        boxShadow: '0 12px 36px -10px rgba(42, 40, 37, 0.2), 0 2px 8px -2px rgba(42, 40, 37, 0.08)',
        width: '340px',
        boxSizing: 'border-box',
      }}
    >
      {/* Top jagged edge if torn or perforated */}
      {showTearEdge && (
        <div
          className="absolute -top-2 left-0 right-0 h-2"
          style={{
            backgroundImage:
              'linear-gradient(135deg, #FFFDF9 5px, transparent 0), linear-gradient(225deg, #FFFDF9 5px, transparent 0)',
            backgroundSize: '12px 8px',
            backgroundRepeat: 'repeat-x',
          }}
        />
      )}

      {/* Header */}
      <div className="text-center pb-4 border-b border-dashed border-[#C8C2B7]">
        <div className="text-[10px] tracking-widest text-[#7C766D] uppercase mb-0.5 whitespace-nowrap">
          24H LIFE CONVENIENCE MART
        </div>
        <h2 className="text-base font-bold tracking-tight text-[#2A2825] whitespace-nowrap">
          生活便利店 · 今日清单
        </h2>
        <div className="text-[10px] text-[#8C8578] mt-1 whitespace-nowrap">
          {ticket.city}分店 · {ticket.weather}
        </div>
      </div>

      {/* Transaction Metadata */}
      <div className="py-3 text-[11px] leading-relaxed border-b border-dashed border-[#C8C2B7] space-y-1 text-[#5E5951]">
        <div className="flex justify-between items-center whitespace-nowrap">
          <span className="whitespace-nowrap">时间: {ticket.dateDisplay} {ticket.timeDisplay}</span>
          <span className="whitespace-nowrap">机台: #01</span>
        </div>
        <div className="flex justify-between items-center whitespace-nowrap">
          <span className="whitespace-nowrap">收银员: 自己的内心</span>
          <span className="whitespace-nowrap font-mono">单号: {ticket.ticketNo}</span>
        </div>
      </div>

      {/* Items List */}
      <div className="py-4 border-b border-dashed border-[#C8C2B7]">
        <div className="flex justify-between font-bold text-[10px] text-[#7C766D] pb-2 uppercase tracking-wider whitespace-nowrap">
          <span>品项 / 日常切片</span>
          <span>状态 / 意志力</span>
        </div>

        <div className="space-y-2.5 my-1">
          {ticket.completedHabits.length > 0 ? (
            ticket.completedHabits.map((item, index) => (
              <div key={item.id || index} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 flex-1 pr-2 min-w-0">
                  <span className="text-sm shrink-0">{item.icon}</span>
                  <span className="font-medium text-[#2A2825] truncate whitespace-nowrap">{item.title}</span>
                </div>
                <div className="text-right text-[11px] text-[#555047] whitespace-nowrap shrink-0">
                  <span>{item.completedAt || '完成'}</span>
                  <span className="ml-2 font-mono text-[#2A2825] font-bold">100%</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-3 text-[#9A948A] italic whitespace-nowrap">今日尚无完成习惯，静候发生</div>
          )}
        </div>
      </div>

      {/* Summary and Willpower */}
      <div className="py-3.5 border-b border-dashed border-[#C8C2B7] space-y-1.5 text-xs">
        <div className="flex justify-between text-[#5E5951] whitespace-nowrap">
          <span>切片达成数</span>
          <span className="font-mono">{ticket.completedCount} / {ticket.allHabitsCount}</span>
        </div>
        <div className="flex justify-between text-[#5E5951] whitespace-nowrap">
          <span>日常焦虑折扣</span>
          <span className="text-[#C86D51] font-mono font-bold">-100%</span>
        </div>
        <div className="flex justify-between items-baseline font-bold text-sm pt-1 text-[#2A2825] whitespace-nowrap">
          <span>实付意志力</span>
          <span className="text-base font-mono">{ticket.willpowerPercent}%</span>
        </div>
      </div>

      {/* Rubber Stamp Badge */}
      <div className="relative my-4 py-2 flex items-center justify-between">
        <div className="flex-1 pr-2">
          <p className="text-[11px] font-serif-vintage italic text-[#5E5951] leading-relaxed">
            "{ticket.quote}"
          </p>
        </div>

        {/* Physical Terracotta Stamp */}
        <div className="stamp-seal border-[#C86D51] text-[#C86D51] px-2.5 py-1 text-center shrink-0 whitespace-nowrap">
          <div className="text-[9px] leading-tight font-black tracking-widest whitespace-nowrap">PAID IN FULL</div>
          <div className="text-[11px] font-black tracking-wider leading-none whitespace-nowrap">意志力核销</div>
        </div>
      </div>

      {/* Barcode & Footer */}
      <div className="pt-2 text-center">
        {/* Synthetic Vector Barcode */}
        <div className="flex items-center justify-center gap-[2.5px] h-9 mb-1.5 px-4 overflow-hidden">
          {Array.from({ length: 42 }).map((_, i) => {
            const isThick = (i * 7 + 3) % 4 === 0;
            const isMedium = (i * 3) % 3 === 0;
            const w = isThick ? 'w-[3px]' : isMedium ? 'w-[2px]' : 'w-[1px]';
            const bg = (i % 5 === 0 && i % 2 !== 0) ? 'bg-transparent' : 'bg-[#2A2825]';
            return <div key={i} className={`h-full ${w} ${bg}`} />;
          })}
        </div>
        <div className="text-[9px] tracking-[0.25em] text-[#7C766D] font-mono whitespace-nowrap">
          {ticket.barcodeValue}
        </div>
        <div className="text-[10px] text-[#9A948A] mt-2 font-serif-vintage whitespace-nowrap">
          ★ 感谢惠顾，请妥善保管今日心流 ★
        </div>
      </div>

      {/* Bottom jagged edge */}
      <div
        className="absolute -bottom-2 left-0 right-0 h-2"
        style={{
          backgroundImage:
            'linear-gradient(45deg, #FFFDF9 5px, transparent 0), linear-gradient(315deg, #FFFDF9 5px, transparent 0)',
          backgroundSize: '12px 8px',
          backgroundRepeat: 'repeat-x',
        }}
      />
    </div>
  );
};
