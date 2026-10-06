export type HabitStatus = 'pending' | 'completed' | 'rest';

export interface HabitItem {
  id: string;
  title: string;
  icon: string;
  category: 'morning' | 'focus' | 'movement' | 'night' | 'mind';
  status: HabitStatus;
  completedAt?: string;
  note?: string;
}

export type TemplateType = 'receipt' | 'polaroid' | 'ticket';

export interface SliceTicket {
  id: string;
  createdAt: string; // ISO string
  dateDisplay: string; // "2026.10.06"
  weekdayDisplay: string; // "星期二"
  timeDisplay: string; // "10:48"
  city: string;
  weather: string;
  template: TemplateType;
  completedHabits: HabitItem[];
  allHabitsCount: number;
  completedCount: number;
  willpowerPercent: number;
  quote: string;
  photoUrl?: string; // for polaroid
  movieTitle?: string; // for cinema ticket
  seatNumber?: string;
  barcodeValue: string;
  ticketNo: string;
  imageData?: string; // captured high-res base64 png
}

export type NavigationTab = 'today' | 'mint' | 'gallery';
