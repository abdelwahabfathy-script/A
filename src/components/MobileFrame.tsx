import React, { useState, useEffect } from 'react';
import { translations } from '../types';

interface MobileFrameProps {
  children: React.ReactNode;
  themeMode: 'light' | 'dark';
  language: 'en' | 'ar';
}

export default function MobileFrame({ children, themeMode, language }: MobileFrameProps) {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12; // 12-hour format
      setTime(`${hours}:${minutes} ${ampm}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const isRtl = language === 'ar';

  return (
    <div className={`min-h-screen w-full flex items-center justify-center p-0 md:p-6 transition-colors duration-300 ${
      themeMode === 'dark' 
        ? 'bg-zinc-950 text-slate-100 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(15,23,42,0.95),rgba(9,9,11,1))]' 
        : 'bg-[#F3F4F6] text-[#1C1B1F]'
    }`}>
      {/* Immersive Mobile Device Container */}
      <div 
        id="android_frame_container"
        className={`w-full h-screen md:h-[860px] md:max-w-[412px] md:rounded-[44px] md:border-8 md:border-zinc-800 md:shadow-2xl flex flex-col overflow-hidden relative transition-all duration-300 ${
          themeMode === 'dark' 
            ? 'bg-zinc-900 md:shadow-slate-950/80 ring-1 ring-slate-800/50' 
            : 'bg-[#FFFFFF] md:shadow-2xl'
        }`}
        style={{ direction: isRtl ? 'rtl' : 'ltr' }}
      >
        {/* Physical Camera Notch (hidden on mobile, simulated on desktop) */}
        <div className="hidden md:block absolute top-0 left-1/2 transform -translate-x-1/2 h-[26px] w-[140px] bg-slate-800 rounded-b-2xl z-50">
          <div className="absolute right-4 top-[7px] w-3 h-3 rounded-full bg-slate-900 border border-slate-700/50"></div>
          <div className="absolute left-[38px] top-[10px] w-12 h-1.5 rounded-full bg-slate-700/30"></div>
        </div>

        {/* Dynamic Android Status Bar */}
        <div className={`px-5 pt-3 pb-1 flex justify-between items-center text-xs font-semibold select-none z-40 transition-colors ${
          themeMode === 'dark' ? 'bg-zinc-950/40 text-slate-400' : 'bg-slate-100/40 text-slate-600'
        } ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Status Bar Left: Clock & Network */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="font-medium tracking-tight">{time}</span>
          </div>

          {/* Status Bar Right: Battery, WiFi, Cellular */}
          <div className="flex items-center gap-1.5">
            {/* Cellular */}
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M2,22 H22 V2 L2,22 Z" />
            </svg>
            {/* WiFi */}
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12,21L15.6,16.2C14.6,15.4 13.3,15 12,15C10.7,15 9.4,15.4 8.4,16.2L12,21M12,2C17.3,2 21.6,5.3 23.3,10L21.3,11C20,7.3 16.3,5 12,5C7.7,5 4,7.3 2.7,11L0.7,10C2.4,5.3 6.7,2 12,2Z" />
            </svg>
            {/* Battery */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold opacity-80">98%</span>
              <div className="w-5 h-2.5 rounded-[3px] border border-current p-[1px] relative flex">
                <div className="h-full bg-current rounded-[1px] w-4/5"></div>
                <div className="w-[1.5px] h-1 bg-current absolute top-[2px] right-[-2.5px] rounded-r-[1px]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Application Area */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {children}
        </div>

        {/* Android Digital Navigation Pill Mockup */}
        <div className={`py-2 w-full flex items-center justify-center select-none z-40 transition-colors ${
          themeMode === 'dark' ? 'bg-zinc-950/20' : 'bg-slate-100/10'
        }`}>
          <div className="w-28 h-1 rounded-full bg-slate-400/50 transition-colors hover:bg-slate-400"></div>
        </div>
      </div>
    </div>
  );
}
