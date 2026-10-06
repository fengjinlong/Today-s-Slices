import React, { useState, useEffect } from 'react';
import { HabitItem, NavigationTab, SliceTicket } from './types';
import {
  getStoredHabits,
  saveHabits,
  getStoredTickets,
  saveTickets,
  getSettings,
} from './services/storage';
import { sound } from './services/soundEngine';
import { detectLocationAndWeather } from './services/weatherService';
import { TodayScreen } from './components/TodayScreen';
import { MintScreen } from './components/MintScreen';
import { GalleryScreen } from './components/GalleryScreen';
import { CityWeatherModal } from './components/CityWeatherModal';
import { Sparkles, Calendar, Scissors, Layers, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('today');
  const [habits, setHabits] = useState<HabitItem[]>(() => getStoredHabits());
  const [tickets, setTickets] = useState<SliceTicket[]>(() => getStoredTickets());
  const [settings, setSettings] = useState(() => getSettings());
  const [city, setCity] = useState(settings.city || '上海');
  const [weather, setWeather] = useState(settings.weather || '21°C 晴');
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Silently auto-detect rough city & real-time weather from IP/TimeZone & Open-Meteo on startup
  useEffect(() => {
    let isCurrent = true;
    detectLocationAndWeather()
      .then((res) => {
        if (!isCurrent) return;
        setCity(res.city);
        setWeather(res.weather);
        const updated = { ...settings, city: res.city, weather: res.weather };
        setSettings(updated);
        try {
          localStorage.setItem('slice_settings_v1', JSON.stringify(updated));
        } catch {
          // ignore
        }
      })
      .catch(() => {
        // fallback to default
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const handleUpdateCityWeather = (newCity: string, newWeather: string) => {
    setCity(newCity);
    setWeather(newWeather);
    const updated = { ...settings, city: newCity, weather: newWeather };
    setSettings(updated);
    try {
      localStorage.setItem('slice_settings_v1', JSON.stringify(updated));
    } catch {
      // ignore
    }
    setToastMessage(`📍 已切换至 ${newCity} · ${newWeather}`);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Sync habits to localStorage
  const handleUpdateHabits = (newHabits: HabitItem[]) => {
    setHabits(newHabits);
    saveHabits(newHabits);
  };

  // When a ticket is minted
  const handleTicketMinted = (newTicket: SliceTicket) => {
    setTickets((prev) => {
      const exists = prev.some((t) => t.id === newTicket.id);
      const updated = exists
        ? prev.map((t) => (t.id === newTicket.id ? newTicket : t))
        : [newTicket, ...prev];
      saveTickets(updated);
      return updated;
    });

    setToastMessage('🎉 今日切片已成功存入票夹！');
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleDeleteTicket = (id: string) => {
    sound.playStepTick();
    setTickets((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      saveTickets(updated);
      return updated;
    });
  };

  const switchTab = (tab: NavigationTab) => {
    sound.playStepTick();
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full min-h-screen bg-[#EDE9E0] flex justify-center selection:bg-[#C86D51]/20">
      {/* Mobile-First Viewport Constraint (max-w-md mx-auto min-h-screen) */}
      <main className="w-full max-w-md min-h-screen bg-[#F7F5F0] text-[#2A2825] flex flex-col justify-between relative shadow-[0_0_50px_rgba(42,40,37,0.08)] border-x border-[#E6E1D6]">
        {/* Top App Bar */}
        <header className="sticky top-0 z-30 bg-[#F7F5F0]/90 backdrop-blur-md px-4 py-3 border-b border-[#EAE5DC] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#2A2825] text-white flex items-center justify-center font-bold text-xs shadow-xs font-serif-vintage">
              切
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight font-serif-vintage">
                  生活切片
                </span>
                <span className="text-[10px] font-mono tracking-widest text-[#8C8578] uppercase">
                  / SLICE
                </span>
              </div>
            </div>
          </div>

          {/* Quick city tag in header */}
          <button
            onClick={() => setIsWeatherModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-mono text-[#7C7569] hover:text-[#2A2825] bg-[#ECE7DC]/70 hover:bg-[#ECE7DC] px-2.5 py-1 rounded-full transition-all cursor-pointer"
            title="点击设置城市与天气"
          >
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{city}</span>
            <span>·</span>
            <span>{weather}</span>
          </button>
        </header>

        {/* Dynamic Toast Notification */}
        {toastMessage && (
          <div className="fixed top-14 left-0 right-0 max-w-md mx-auto px-4 z-50 pointer-events-none animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="bg-[#2A2825] text-[#FFFDF9] py-2 px-3.5 rounded-xl text-xs font-medium shadow-xl flex items-center justify-center gap-1.5 border border-[#444]">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}

        {/* Tab Screens Content */}
        <div className="flex-1">
          {activeTab === 'today' && (
            <TodayScreen
              habits={habits}
              city={city}
              weather={weather}
              onUpdateHabits={handleUpdateHabits}
              onOpenMint={() => switchTab('mint')}
              onOpenWeatherModal={() => setIsWeatherModalOpen(true)}
            />
          )}

          {activeTab === 'mint' && (
            <MintScreen
              habits={habits}
              city={city}
              weather={weather}
              onTicketMinted={handleTicketMinted}
              onGoToGallery={() => switchTab('gallery')}
            />
          )}

          {activeTab === 'gallery' && (
            <GalleryScreen
              tickets={tickets}
              streakDays={settings.streakDays}
              onDeleteTicket={handleDeleteTicket}
              onGoToMint={() => switchTab('mint')}
            />
          )}
        </div>

        {/* Bottom 3-View Navigation State Tab Bar */}
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 bg-[#FFFDF9]/95 backdrop-blur-md border-t border-[#E8E2D7] px-6 py-2 shadow-lg flex items-center justify-between">
          {/* Tab 1: Today's Slices */}
          <button
            onClick={() => switchTab('today')}
            className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors cursor-pointer ${
              activeTab === 'today'
                ? 'text-[#2A2825] font-bold'
                : 'text-[#968E82] hover:text-[#5C564D]'
            }`}
          >
            <Calendar size={18} className={activeTab === 'today' ? 'text-[#C86D51]' : ''} />
            <span className="text-[11px] tracking-tight">今日切片</span>
          </button>

          {/* Tab 2: Mint & Tear (Highlighted Center Button) */}
          <button
            onClick={() => switchTab('mint')}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all cursor-pointer ${
              activeTab === 'mint'
                ? 'bg-[#2A2825] text-[#FFFDF9] shadow-md scale-105'
                : 'text-[#5C564D] hover:bg-[#F2EEE4]'
            }`}
          >
            <div className="relative">
              <Scissors
                size={18}
                className={activeTab === 'mint' ? 'text-[#C86D51]' : 'text-[#8E877A]'}
              />
            </div>
            <span className="text-[11px] font-bold tracking-tight">出纸撕下</span>
          </button>

          {/* Tab 3: Gallery Album */}
          <button
            onClick={() => switchTab('gallery')}
            className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors cursor-pointer ${
              activeTab === 'gallery'
                ? 'text-[#2A2825] font-bold'
                : 'text-[#968E82] hover:text-[#5C564D]'
            }`}
          >
            <Layers size={18} className={activeTab === 'gallery' ? 'text-[#C86D51]' : ''} />
            <span className="text-[11px] tracking-tight">记忆票夹</span>
          </button>
        </nav>

        {/* Location & Real-time Weather Switcher Modal */}
        <CityWeatherModal
          isOpen={isWeatherModalOpen}
          onClose={() => setIsWeatherModalOpen(false)}
          currentCity={city}
          currentWeather={weather}
          onUpdateCityWeather={handleUpdateCityWeather}
        />
      </main>
    </div>
  );
}
