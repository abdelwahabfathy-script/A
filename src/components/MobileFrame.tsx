import React, { useState, useEffect } from 'react';
import { translations } from '../types';

interface MobileFrameProps {
  children: React.ReactNode;
  themeMode: 'light' | 'dark';
  language: 'en' | 'ar';
  isPwa?: boolean;
}

export default function MobileFrame({ children, themeMode, language, isPwa = false }: MobileFrameProps) {
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
    <div className={`min-h-screen w-full flex items-center justify-center transition-colors duration-300 ${
      isPwa ? 'p-0' : 'p-0 md:p-6'
    } ${
      themeMode === 'dark' 
        ? 'bg-zinc-950 text-slate-100 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(15,23,42,0.95),rgba(9,9,11,1))]' 
        : 'bg-[#F3F4F6] text-[#1C1B1F]'
    }`}>
      {/* Permanent, full-width top overlay mask to cover system overlays, notch, status bar area */}
      <div 
        id="pwa_top_system_overlay"
        className={`fixed top-0 left-0 right-0 w-full z-[100000] pointer-events-none transition-colors duration-300 ${
          themeMode === 'dark' ? 'bg-zinc-900' : 'bg-[#F3F4F6]'
        }`}
        style={{
          height: 'env(safe-area-inset-top, 24px)',
        }}
      />

      {/* Permanent, full-width bottom overlay mask to cover gesture pill, system navigation area */}
      <div 
        id="pwa_bottom_system_overlay"
        className={`fixed bottom-0 left-0 right-0 w-full z-[100000] pointer-events-none transition-colors duration-300 ${
          themeMode === 'dark' ? 'bg-zinc-900' : 'bg-[#F3F4F6]'
        }`}
        style={{
          height: 'env(safe-area-inset-bottom, 16px)',
        }}
      />

      {/* Immersive Mobile Device Container */}
      <div 
        id="android_frame_container"
        className={`w-full flex flex-col overflow-hidden relative transition-all duration-300 ${
          isPwa 
            ? 'h-screen max-w-none border-0 rounded-none shadow-none bg-black'
            : 'h-screen md:h-[860px] md:max-w-[412px] md:rounded-[44px] md:border-8 md:border-zinc-800 md:shadow-2xl'
        } ${
          themeMode === 'dark' 
            ? isPwa ? 'bg-zinc-950' : 'bg-zinc-900 md:shadow-slate-950/80 ring-1 ring-slate-800/50' 
            : 'bg-[#FFFFFF] md:shadow-2xl'
        }`}
        style={{ direction: isRtl ? 'rtl' : 'ltr' }}
      >
        {/* Main Application Area */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
