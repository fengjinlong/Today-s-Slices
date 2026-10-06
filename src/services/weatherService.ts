/**
 * Real-time Weather & Rough Geolocation Service for H5
 * Uses IP geolocation, browser TimeZone mapping, and Open-Meteo (free, no API key required).
 */

export interface WeatherInfo {
  city: string;
  weather: string; // e.g. "21°C 晴"
  temperature: number;
  condition: string; // e.g. "晴", "多云", "微风"
}

// Open-Meteo WMO Weather interpretation codes
function decodeWeatherCode(code: number): string {
  if (code === 0) return '晴';
  if (code === 1) return '晴间多云';
  if (code === 2) return '多云';
  if (code === 3) return '阴天';
  if (code >= 45 && code <= 48) return '薄雾';
  if (code >= 51 && code <= 55) return '毛毛雨';
  if (code >= 61 && code <= 65) return '小雨';
  if (code >= 66 && code <= 67) return '冻雨';
  if (code >= 71 && code <= 77) return '降雪';
  if (code >= 80 && code <= 82) return '阵雨';
  if (code >= 85 && code <= 86) return '阵雪';
  if (code >= 95 && code <= 99) return '雷阵雨';
  return '微风晴朗';
}

// Preset Coordinates for common cities for instant fallback & fast weather lookup
export const CITY_COORDINATES: Record<string, { lat: number; lon: number; name: string }> = {
  '上海': { lat: 31.2304, lon: 121.4737, name: '上海' },
  '北京': { lat: 39.9042, lon: 116.4074, name: '北京' },
  '杭州': { lat: 30.2741, lon: 120.1551, name: '杭州' },
  '深圳': { lat: 22.5431, lon: 114.0579, name: '深圳' },
  '广州': { lat: 23.1291, lon: 113.2644, name: '广州' },
  '成都': { lat: 30.5728, lon: 104.0668, name: '成都' },
  '南京': { lat: 32.0603, lon: 118.7969, name: '南京' },
  '武汉': { lat: 30.5928, lon: 114.3055, name: '武汉' },
  '厦门': { lat: 24.4798, lon: 118.0894, name: '厦门' },
  '西安': { lat: 34.3416, lon: 108.9398, name: '西安' },
  '重庆': { lat: 29.5630, lon: 106.5516, name: '重庆' },
  '苏州': { lat: 31.2989, lon: 120.5853, name: '苏州' },
};

/**
 * Derives rough city from browser timezone or IP
 */
function getCityFromTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz.includes('Shanghai') || tz.includes('Chongqing') || tz.includes('Beijing')) {
      return '上海';
    }
    if (tz.includes('Hong_Kong')) return '香港';
    if (tz.includes('Taipei')) return '台北';
    if (tz.includes('Tokyo')) return '东京';
  } catch {
    // ignore
  }
  return '上海';
}

/**
 * Fetches real-time temperature and weather from Open-Meteo by coordinates
 */
export async function fetchWeatherByCoordinates(
  lat: number,
  lon: number,
  cityName: string = '上海'
): Promise<WeatherInfo> {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (!res.ok) throw new Error('Weather API error');
    const data = await res.json();
    const temp = Math.round(data.current?.temperature_2m ?? 21);
    const code = data.current?.weather_code ?? 0;
    const condition = decodeWeatherCode(code);
    return {
      city: cityName,
      temperature: temp,
      condition,
      weather: `${temp}°C ${condition}`,
    };
  } catch (err) {
    console.warn('Failed to fetch Open-Meteo weather:', err);
    return {
      city: cityName,
      temperature: 21,
      condition: '晴',
      weather: '21°C 晴',
    };
  }
}

/**
 * Attempts to auto-detect location via IP & browser Geolocation, then fetches weather
 */
export async function detectLocationAndWeather(): Promise<WeatherInfo> {
  // Strategy 1: Fast IP geolocation lookup (zero-permission)
  try {
    const ipRes = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
    if (ipRes.ok) {
      const data = await ipRes.json();
      const rawCity = data.city || '';
      const lat = data.latitude;
      const lon = data.longitude;

      // Map common pinyin/english city names to Chinese
      const pinyinMap: Record<string, string> = {
        Shanghai: '上海',
        Beijing: '北京',
        Hangzhou: '杭州',
        Shenzhen: '深圳',
        Guangzhou: '广州',
        Chengdu: '成都',
        Nanjing: '南京',
        Wuhan: '武汉',
        Xiamen: '厦门',
        "Xi'an": '西安',
        Chongqing: '重庆',
        Suzhou: '苏州',
      };

      const cityChinese = pinyinMap[rawCity] || rawCity || getCityFromTimezone();
      if (lat && lon) {
        return await fetchWeatherByCoordinates(lat, lon, cityChinese);
      }
    }
  } catch {
    // Continue to fallback
  }

  // Strategy 2: W3C Geolocation if available (with fast 3s timeout)
  if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 3000,
          maximumAge: 600000,
        });
      });
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      return await fetchWeatherByCoordinates(lat, lon, getCityFromTimezone());
    } catch {
      // Ignored, user might deny or timeout
    }
  }

  // Strategy 3: Timezone city + Open-Meteo
  const defaultCity = getCityFromTimezone();
  const coords = CITY_COORDINATES[defaultCity] || CITY_COORDINATES['上海'];
  return await fetchWeatherByCoordinates(coords.lat, coords.lon, defaultCity);
}
