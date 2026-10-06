import { HabitItem, SliceTicket } from '../types';

const HABITS_KEY = 'slice_habits_v1';
const TICKETS_KEY = 'slice_tickets_v1';
const SETTINGS_KEY = 'slice_settings_v1';

export const DEFAULT_HABITS: HabitItem[] = [
  {
    id: 'habit-1',
    title: '晨间手冲咖啡',
    icon: '☕',
    category: 'morning',
    status: 'completed',
    completedAt: '08:15',
    note: '浅烘埃塞耶加雪菲，柑橘花香',
  },
  {
    id: 'habit-2',
    title: '翻开书本阅读 20 页',
    icon: '📖',
    category: 'focus',
    status: 'completed',
    completedAt: '12:40',
    note: '《瓦尔登湖》第三章',
  },
  {
    id: 'habit-3',
    title: '日落散步 3km',
    icon: '🏃',
    category: 'movement',
    status: 'pending',
  },
  {
    id: 'habit-4',
    title: '睡前冥想断网',
    icon: '🍃',
    category: 'night',
    status: 'pending',
  },
];

export const PRESET_QUOTES = [
  '认真生活的每一刻，都在悄悄沉淀成诗。',
  '时间是流动的河，习惯是河底温润的石。',
  '给平淡日常打上一枚温柔的钢印。',
  '万物皆有裂隙，那是光照进来的地方。',
  '今天也是被热烈且具体爱着的一天。',
  '风吹过树梢的下午，心里装满安静的确定。',
];

export const PRESET_POLAROID_PHOTOS = [
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80', // Coffee cup in morning light
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80', // Reading book cozy
  'https://images.unsplash.com/photo-1476820865390-c52ae91350a9?auto=format&fit=crop&w=800&q=80', // Sunset walk pathway
  'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=800&q=80', // Sunlight through leaves
];

export const getStoredHabits = (): HabitItem[] => {
  try {
    const raw = localStorage.getItem(HABITS_KEY);
    if (!raw) {
      localStorage.setItem(HABITS_KEY, JSON.stringify(DEFAULT_HABITS));
      return DEFAULT_HABITS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_HABITS;
  }
};

export const saveHabits = (habits: HabitItem[]): void => {
  try {
    localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
  } catch (err) {
    console.warn('Failed to save habits to localStorage', err);
  }
};

export const getStoredTickets = (): SliceTicket[] => {
  try {
    const raw = localStorage.getItem(TICKETS_KEY);
    if (!raw) {
      // Seed with initial aesthetic sample stubs for demonstration
      const initialTickets: SliceTicket[] = [
        {
          id: 'ticket-demo-1',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          dateDisplay: '2026.10.05',
          weekdayDisplay: '星期一',
          timeDisplay: '21:30',
          city: '上海',
          weather: '22°C 晴',
          template: 'receipt',
          completedHabits: [
            { id: 'd1', title: '晨间手冲咖啡', icon: '☕', category: 'morning', status: 'completed', completedAt: '08:20' },
            { id: 'd2', title: '翻开书本阅读 20 页', icon: '📖', category: 'focus', status: 'completed', completedAt: '13:00' },
            { id: 'd3', title: '日落散步 3km', icon: '🏃', category: 'movement', status: 'completed', completedAt: '18:45' },
            { id: 'd4', title: '睡前冥想断网', icon: '🍃', category: 'night', status: 'completed', completedAt: '22:10' },
          ],
          allHabitsCount: 4,
          completedCount: 4,
          willpowerPercent: 100,
          quote: '给平淡日常打上一枚温柔的钢印。',
          barcodeValue: 'SLICE-20261005-9921',
          ticketNo: 'NO. 00892',
        },
        {
          id: 'ticket-demo-2',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          dateDisplay: '2026.10.04',
          weekdayDisplay: '星期日',
          timeDisplay: '19:15',
          city: '上海',
          weather: '20°C 微风',
          template: 'ticket',
          completedHabits: [
            { id: 'd1', title: '晨间手冲咖啡', icon: '☕', category: 'morning', status: 'completed', completedAt: '09:00' },
            { id: 'd3', title: '公园慢跑 5km', icon: '🏃', category: 'movement', status: 'completed', completedAt: '17:30' },
          ],
          allHabitsCount: 3,
          completedCount: 2,
          willpowerPercent: 67,
          quote: '风吹过树梢的下午，心里装满安静的确定。',
          movieTitle: '《普通人的周日白日梦》',
          seatNumber: 'A-07',
          barcodeValue: 'CINEMA-20261004-4412',
          ticketNo: 'NO. 00891',
        },
        {
          id: 'ticket-demo-3',
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          dateDisplay: '2026.10.03',
          weekdayDisplay: '星期六',
          timeDisplay: '16:40',
          city: '上海',
          weather: '23°C 晴朗',
          template: 'polaroid',
          completedHabits: [
            { id: 'd1', title: '烘焙手作可颂', icon: '🥐', category: 'focus', status: 'completed', completedAt: '10:15' },
            { id: 'd2', title: '胶片摄影扫街', icon: '📷', category: 'movement', status: 'completed', completedAt: '15:20' },
          ],
          allHabitsCount: 3,
          completedCount: 2,
          willpowerPercent: 67,
          quote: '认真生活的每一刻，都在悄悄沉淀成诗。',
          photoUrl: PRESET_POLAROID_PHOTOS[0],
          barcodeValue: 'POLA-20261003-1082',
          ticketNo: 'NO. 00890',
        },
      ];
      localStorage.setItem(TICKETS_KEY, JSON.stringify(initialTickets));
      return initialTickets;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const saveTickets = (tickets: SliceTicket[]): void => {
  try {
    localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
  } catch (err) {
    console.warn('Failed to save tickets to localStorage', err);
  }
};

export interface UserSettings {
  city: string;
  weather: string;
  streakDays: number;
}

export const getSettings = (): UserSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      const def: UserSettings = {
        city: '上海',
        weather: '21°C 晴',
        streakDays: 7,
      };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(def));
      return def;
    }
    return JSON.parse(raw);
  } catch {
    return {
      city: '上海',
      weather: '21°C 晴',
      streakDays: 7,
    };
  }
};
