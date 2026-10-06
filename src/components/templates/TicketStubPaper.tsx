import React from 'react';
import { SliceTicket } from '../../types';
import { Film, Sparkles } from 'lucide-react';

interface TicketStubPaperProps {
  ticket: SliceTicket;
  id?: string;
  showTornState?: boolean;
}

export const TicketStubPaper: React.FC<TicketStubPaperProps> = ({
  ticket,
  id,
  showTornState = false,
}) => {
  const movieTitle = ticket.movieTitle || '《认真生活的一天》';
  const seat = ticket.seatNumber || 'VIP-01-A';

  return (
    <div
      id={id}
      className="relative w-full max-w-[340px] mx-auto bg-[#F4F1EA] text-[#2A2825] rounded-lg overflow-hidden select-none"
      style={{
        boxShadow: '0 12px 36px -10px rgba(42, 40, 37, 0.2), 0 2px 8px -2px rgba(42, 40, 37, 0.08)',
        border: '1px solid #DFD9CE',
      }}
    >
      {/* Top Banner */}
      <div className="bg-[#2A2825] text-[#F7F5F0] px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Film size={13} className="text-[#C86D51]" />
          <span className="text-[11px] font-bold tracking-wider uppercase font-mono-receipt">
            LIFE CINEMA · 人生放映厅
          </span>
        </div>
        <div className="text-[10px] text-[#A69F93] font-mono">
          HALL 01 / 巨幕厅
        </div>
      </div>

      {/* Main Ticket Body with 72% / 28% split */}
      <div className="relative flex flex-row min-h-[300px]">
        {/* Left Side (72% Main Ticket) */}
        <div className="w-[72%] p-3.5 pr-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1 text-[10px] text-[#8C857A] tracking-wider uppercase mb-1">
              <Sparkles size={11} className="text-[#C86D51]" />
              <span>TODAY'S EXCLUSIVE SCREENING</span>
            </div>
            <h3 className="text-base font-bold text-[#2A2825] font-serif-vintage tracking-tight">
              {movieTitle}
            </h3>
            <p className="text-[10px] font-serif-vintage italic text-[#726C62] mt-0.5">
              "{ticket.quote}"
            </p>
          </div>

          {/* Routine credits list */}
          <div className="my-2.5 py-2 border-t border-b border-dashed border-[#D2CBC0]">
            <div className="text-[9px] font-mono uppercase text-[#8C857A] mb-1 tracking-wider">
              主演日常 / CAST & HABITS
            </div>
            <div className="space-y-1">
              {ticket.completedHabits.slice(0, 4).map((h, i) => (
                <div key={h.id || i} className="flex items-center justify-between text-[11px]">
                  <span className="truncate pr-1 text-[#3E3A33]">
                    {h.icon} {h.title}
                  </span>
                  <span className="text-[10px] font-mono text-[#8C857A] shrink-0">
                    {h.completedAt || '✓'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono-receipt text-[#625D54]">
            <div>
              <span className="text-[9px] text-[#9A9388] block">DATE / 日期</span>
              <span className="font-bold text-[#2A2825]">{ticket.dateDisplay}</span>
            </div>
            <div>
              <span className="text-[9px] text-[#9A9388] block">TIME / 时间</span>
              <span className="font-bold text-[#2A2825]">{ticket.timeDisplay}</span>
            </div>
            <div>
              <span className="text-[9px] text-[#9A9388] block">SEAT / 座位</span>
              <span className="font-bold text-[#C86D51]">{seat}</span>
            </div>
            <div>
              <span className="text-[9px] text-[#9A9388] block">PRICE / 票价</span>
              <span className="font-bold text-[#2A2825]">热爱生活 (无价)</span>
            </div>
          </div>
        </div>

        {/* Perforation Line & Cutout Notches */}
        <div className="relative w-0 flex items-stretch">
          {/* Top Notch Cutout */}
          <div
            className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#F7F5F0] z-10 border border-[#DFD9CE]"
            style={{ clipPath: 'inset(50% 0 0 0)' }}
          />

          {/* Vertical Perforated Dashed Line */}
          <div className="w-[1.5px] h-full perforated-vertical-line" />

          {/* Bottom Notch Cutout */}
          <div
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#F7F5F0] z-10 border border-[#DFD9CE]"
            style={{ clipPath: 'inset(0 0 50% 0)' }}
          />
        </div>

        {/* Right Side (28% Tear-off Stub) */}
        <div
          className={`w-[28%] bg-[#EFECE4] p-2.5 flex flex-col justify-between items-center text-center transition-opacity ${
            showTornState ? 'opacity-40' : 'opacity-100'
          }`}
        >
          <div className="text-[9px] font-mono uppercase tracking-widest text-[#7C766D] border-b border-[#D8D2C6] pb-1 w-full">
            TICKET STUB
          </div>

          {/* Terracotta Oval Stamp */}
          <div className="stamp-seal-circle text-[9px] text-[#C86D51] border-[#C86D51] px-1.5 py-0.5 font-bold my-1 leading-tight">
            ADMIT ONE<br />入场凭证
          </div>

          <div className="text-[9px] font-mono text-[#5E5951] leading-tight space-y-0.5">
            <div>{ticket.city}</div>
            <div className="font-bold text-[#2A2825]">{seat}</div>
          </div>

          {/* Vertical Barcode */}
          <div className="w-full flex items-center justify-center gap-[2px] h-12 my-1 overflow-hidden px-1">
            {Array.from({ length: 18 }).map((_, i) => (
              <div
                key={i}
                className={`h-full ${
                  i % 3 === 0 ? 'w-[2.5px] bg-[#2A2825]' : 'w-[1px] bg-[#2A2825]'
                }`}
              />
            ))}
          </div>

          <div className="text-[8px] font-mono text-[#8C857A] truncate w-full">
            {ticket.ticketNo}
          </div>
        </div>
      </div>

      {/* Bottom Jagged/Notch bar */}
      <div className="bg-[#E5E0D5] px-4 py-1.5 text-[9px] text-[#80796E] font-mono flex justify-between items-center border-t border-[#DFD9CE]">
        <span>SLICE FILM SOCIETY #1994</span>
        <span className="text-[#C86D51] font-bold">★ 凭此券入梦 ★</span>
      </div>
    </div>
  );
};
