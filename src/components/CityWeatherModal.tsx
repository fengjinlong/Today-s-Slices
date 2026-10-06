import React, { useState } from 'react';
import { X, MapPin, RefreshCw, Sparkles, Sun, Check } from 'lucide-react';
import { CITY_COORDINATES, fetchWeatherByCoordinates, detectLocationAndWeather } from '../services/weatherService';
import { sound } from '../services/soundEngine';

interface CityWeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCity: string;
  currentWeather: string;
  onUpdateCityWeather: (city: string, weather: string) => void;
}

export const CityWeatherModal: React.FC<CityWeatherModalProps> = ({
  isOpen,
  onClose,
  currentCity,
  currentWeather,
  onUpdateCityWeather,
}) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [customCity, setCustomCity] = useState('');
  const [customWeather, setCustomWeather] = useState('');

  if (!isOpen) return null;

  const handleAutoDetect = async () => {
    sound.playStepTick();
    setIsDetecting(true);
    try {
      const res = await detectLocationAndWeather();
      sound.playStampThud();
      onUpdateCityWeather(res.city, res.weather);
      onClose();
    } catch {
      // ignore
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSelectPreset = async (cityName: string) => {
    sound.playStepTick();
    const coords = CITY_COORDINATES[cityName];
    if (coords) {
      setIsDetecting(true);
      const res = await fetchWeatherByCoordinates(coords.lat, coords.lon, cityName);
      sound.playStampThud();
      onUpdateCityWeather(res.city, res.weather);
      setIsDetecting(false);
      onClose();
    } else {
      onUpdateCityWeather(cityName, '21°C 晴');
      onClose();
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCity.trim()) return;
    sound.playStampThud();
    const w = customWeather.trim() || '22°C 晴';
    onUpdateCityWeather(customCity.trim(), w);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-[#FFFDF9] rounded-2xl shadow-xl border border-[#DFD9CD] p-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#7A7368] hover:text-[#2A2825] hover:bg-black/5 cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#C86D51] mb-1">
          <MapPin size={14} />
          <span>LOCATION & WEATHER SETTINGS</span>
        </div>
        <h3 className="text-base font-bold text-[#2A2825] font-serif-vintage mb-1">
          城市位置与实时气温
        </h3>
        <p className="text-xs text-[#7A7367] mb-4">
          用于实体小票分店标记、拍立得底片记录及电影票根场次印记。
        </p>

        {/* Auto Detect Button */}
        <button
          onClick={handleAutoDetect}
          disabled={isDetecting}
          className="w-full py-2.5 px-4 bg-[#ECE8DF] hover:bg-[#E2DDD2] active:scale-[0.98] text-[#2A2825] rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border border-[#D8D2C5] mb-4"
        >
          <RefreshCw size={14} className={isDetecting ? 'animate-spin text-[#C86D51]' : 'text-[#C86D51]'} />
          <span>{isDetecting ? '正在通过 IP 与卫星获取中...' : '📍 自动定位当前城市与天气温度'}</span>
        </button>

        {/* Quick Presets Grid */}
        <div className="mb-4">
          <div className="text-[11px] font-mono text-[#8C8578] uppercase mb-2">
            常用城市快速切换
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {Object.keys(CITY_COORDINATES).map((city) => {
              const isSelected = currentCity === city;
              return (
                <button
                  key={city}
                  onClick={() => handleSelectPreset(city)}
                  className={`py-1.5 text-xs rounded-lg border font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#2A2825] bg-[#2A2825] text-white shadow-2xs'
                      : 'border-[#D5CEC2] bg-[#FAF8F5] text-[#5E584E] hover:bg-white'
                  }`}
                >
                  {city}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom City & Weather Form */}
        <form onSubmit={handleCustomSubmit} className="pt-3 border-t border-[#EFE9DF] space-y-2.5">
          <div className="text-[11px] font-mono text-[#8C8578] uppercase">
            或自定义切片城市
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="城市名 (如：大理)"
              value={customCity}
              onChange={(e) => setCustomCity(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-[#D5CEC2] bg-[#FAF8F5] text-xs text-[#2A2825] focus:outline-hidden focus:border-[#C86D51]"
            />
            <input
              type="text"
              placeholder="气温 (如：19°C 晴)"
              value={customWeather}
              onChange={(e) => setCustomWeather(e.target.value)}
              className="w-28 px-3 py-2 rounded-xl border border-[#D5CEC2] bg-[#FAF8F5] text-xs text-[#2A2825] focus:outline-hidden focus:border-[#C86D51]"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-3 bg-[#2A2825] text-white rounded-xl text-xs font-medium hover:bg-black transition-colors cursor-pointer"
          >
            保存并应用到切片
          </button>
        </form>
      </div>
    </div>
  );
};
