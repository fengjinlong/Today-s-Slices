import { createClient } from '@supabase/supabase-js';
import { HabitItem, SliceTicket } from '../types';
import { UserSettings } from './storage';

export const SUPABASE_PROJECT_REF = 'riulrryhoummmpxvawwz';
export const SUPABASE_SQL_URL = `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/sql/new`;

export function normalizeSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl) return `https://${SUPABASE_PROJECT_REF}.supabase.co`;
  const clean = rawUrl.trim();
  const dashboardMatch = clean.match(/supabase\.com\/dashboard\/project\/([a-zA-Z0-9]+)/);
  if (dashboardMatch && dashboardMatch[1]) {
    return `https://${dashboardMatch[1]}.supabase.co`;
  }
  if (clean.includes('.supabase.co')) {
    return clean.replace(/\/+$/, '');
  }
  return `https://${SUPABASE_PROJECT_REF}.supabase.co`;
}

export const SUPABASE_URL = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_glIQ9GNiZaEMgt5kdY3suw_yICpcdos';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * SQL 快速初始化脚本，可在 Supabase SQL Editor 中一键运行创建数据表
 */
export const SUPABASE_INIT_SQL = `-- ==========================================
-- Slice (生活切片) - Supabase 数据库表初始化脚本
-- 请在 Supabase 控制台 -> SQL Editor 中粘贴并点击 Run 运行
-- ==========================================

-- 1. 创建习惯打卡清单表 (habits)
CREATE TABLE IF NOT EXISTS public.habits (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  icon TEXT DEFAULT '☕',
  category TEXT DEFAULT 'morning',
  status TEXT DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  note TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 开启安全策略 (允许免登录匿名读写)
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access habits" ON public.habits;
CREATE POLICY "Public access habits" ON public.habits FOR ALL USING (true) WITH CHECK (true);

-- 2. 创建铸造切片票根表 (slice_tickets)
CREATE TABLE IF NOT EXISTS public.slice_tickets (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  date_display TEXT NOT NULL,
  weekday_display TEXT NOT NULL,
  time_display TEXT NOT NULL,
  city TEXT NOT NULL,
  weather TEXT NOT NULL,
  template TEXT NOT NULL,
  completed_habits JSONB DEFAULT '[]'::jsonb,
  all_habits_count INT DEFAULT 0,
  completed_count INT DEFAULT 0,
  willpower_percent INT DEFAULT 100,
  quote TEXT,
  photo_url TEXT,
  movie_title TEXT,
  seat_number TEXT,
  barcode_value TEXT,
  ticket_no TEXT,
  image_data TEXT
);

ALTER TABLE public.slice_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access slice_tickets" ON public.slice_tickets;
CREATE POLICY "Public access slice_tickets" ON public.slice_tickets FOR ALL USING (true) WITH CHECK (true);

-- 3. 创建用户城市与环境偏好表 (user_settings)
CREATE TABLE IF NOT EXISTS public.user_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  city TEXT DEFAULT '上海',
  weather TEXT DEFAULT '21°C 晴',
  streak_days INT DEFAULT 7,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access user_settings" ON public.user_settings;
CREATE POLICY "Public access user_settings" ON public.user_settings FOR ALL USING (true) WITH CHECK (true);
`;

export interface SupabaseHealthStatus {
  isConnected: boolean;
  habitsTableReady: boolean;
  ticketsTableReady: boolean;
  settingsTableReady: boolean;
  allTablesReady: boolean;
  habitsCount?: number;
  ticketsCount?: number;
  error?: string;
}

/**
 * 诊断 Supabase 数据库当前表结构是否已创建就绪及数据行数
 */
export async function checkSupabaseHealth(): Promise<SupabaseHealthStatus> {
  const result: SupabaseHealthStatus = {
    isConnected: true,
    habitsTableReady: false,
    ticketsTableReady: false,
    settingsTableReady: false,
    allTablesReady: false,
    habitsCount: 0,
    ticketsCount: 0,
  };

  try {
    const [habitsCheck, ticketsCheck, settingsCheck] = await Promise.allSettled([
      supabase.from('habits').select('id', { count: 'exact' }),
      supabase.from('slice_tickets').select('id', { count: 'exact' }),
      supabase.from('user_settings').select('id').limit(1),
    ]);

    if (habitsCheck.status === 'fulfilled' && !habitsCheck.value.error) {
      result.habitsTableReady = true;
      result.habitsCount = habitsCheck.value.count ?? habitsCheck.value.data?.length ?? 0;
    }
    if (ticketsCheck.status === 'fulfilled' && !ticketsCheck.value.error) {
      result.ticketsTableReady = true;
      result.ticketsCount = ticketsCheck.value.count ?? ticketsCheck.value.data?.length ?? 0;
    }
    if (settingsCheck.status === 'fulfilled' && !settingsCheck.value.error) {
      result.settingsTableReady = true;
    }

    result.allTablesReady =
      result.habitsTableReady && result.ticketsTableReady && result.settingsTableReady;
  } catch (err: any) {
    result.isConnected = false;
    result.error = err?.message || String(err);
  }

  return result;
}

/**
 * 1. Habits Operations
 */
export async function fetchRemoteHabits(): Promise<HabitItem[] | null> {
  try {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .order('updated_at', { ascending: true });

    if (error) {
      return null;
    }

    if (!data) return [];

    return data.map((row) => ({
      id: row.id,
      title: row.title,
      icon: row.icon || '☕',
      category: row.category || 'morning',
      status: row.status || 'pending',
      completedAt: row.completed_at || undefined,
      note: row.note || undefined,
    }));
  } catch {
    return null;
  }
}

export async function syncHabitToRemote(habit: HabitItem): Promise<boolean> {
  try {
    const { error } = await supabase.from('habits').upsert(
      {
        id: habit.id,
        title: habit.title,
        icon: habit.icon || '☕',
        category: habit.category || 'morning',
        status: habit.status || 'pending',
        completed_at: habit.completedAt || null,
        note: habit.note || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    return !error;
  } catch {
    return false;
  }
}

export async function syncAllHabitsToRemote(habits: HabitItem[]): Promise<boolean> {
  try {
    const rows = habits.map((h) => ({
      id: h.id,
      title: h.title,
      icon: h.icon || '☕',
      category: h.category || 'morning',
      status: h.status || 'pending',
      completed_at: h.completedAt || null,
      note: h.note || null,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('habits').upsert(rows, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteRemoteHabit(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('habits').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

/**
 * 2. Slice Tickets Operations
 */
export async function fetchRemoteTickets(): Promise<SliceTicket[] | null> {
  try {
    const { data, error } = await supabase
      .from('slice_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return null;
    }

    if (!data) return [];

    return data.map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      dateDisplay: row.date_display,
      weekdayDisplay: row.weekday_display,
      timeDisplay: row.time_display,
      city: row.city,
      weather: row.weather,
      template: row.template,
      completedHabits: row.completed_habits || [],
      allHabitsCount: row.all_habits_count || 0,
      completedCount: row.completed_count || 0,
      willpowerPercent: row.willpower_percent || 100,
      quote: row.quote || '',
      photoUrl: row.photo_url || undefined,
      movieTitle: row.movie_title || undefined,
      seatNumber: row.seat_number || undefined,
      barcodeValue: row.barcode_value,
      ticketNo: row.ticket_no,
      imageData: row.image_data || undefined,
    }));
  } catch {
    return null;
  }
}

export async function saveRemoteTicket(ticket: SliceTicket): Promise<boolean> {
  try {
    const { error } = await supabase.from('slice_tickets').upsert(
      {
        id: ticket.id,
        created_at: ticket.createdAt,
        date_display: ticket.dateDisplay,
        weekday_display: ticket.weekdayDisplay,
        time_display: ticket.timeDisplay,
        city: ticket.city,
        weather: ticket.weather,
        template: ticket.template,
        completed_habits: ticket.completedHabits,
        all_habits_count: ticket.allHabitsCount,
        completed_count: ticket.completedCount,
        willpower_percent: ticket.willpowerPercent,
        quote: ticket.quote,
        photo_url: ticket.photoUrl || null,
        movie_title: ticket.movieTitle || null,
        seat_number: ticket.seatNumber || null,
        barcode_value: ticket.barcodeValue,
        ticket_no: ticket.ticketNo,
        image_data: null,
      },
      { onConflict: 'id' }
    );
    return !error;
  } catch {
    return false;
  }
}

export async function deleteRemoteTicket(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('slice_tickets').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

/**
 * 3. User Settings Operations
 */
export async function fetchRemoteSettings(): Promise<UserSettings | null> {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('id', 'default')
      .single();

    if (error || !data) return null;

    return {
      city: data.city || '上海',
      weather: data.weather || '21°C 晴',
      streakDays: data.streak_days || 7,
    };
  } catch {
    return null;
  }
}

export async function saveRemoteSettings(settings: UserSettings): Promise<boolean> {
  try {
    const { error } = await supabase.from('user_settings').upsert(
      {
        id: 'default',
        city: settings.city,
        weather: settings.weather,
        streak_days: settings.streakDays,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    return !error;
  } catch {
    return false;
  }
}
