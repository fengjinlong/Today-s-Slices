import { HabitItem } from '../types';

/**
 * Intelligent habit-aware quote generator.
 * Tries Gemini AI backend first; gracefully falls back to tailored contextual library.
 */

// Fallback thematic pools based on actual habits checked
const THEMATIC_QUOTES: Record<string, string[]> = {
  coffee: [
    '咖啡的苦香落入清晨，今天的好心情正在发生。',
    '手冲一壶热气腾腾的浅焙，唤醒对生活全部的热爱。',
    '第一口咖啡咽下时，心里已经装满了安静的笃定。',
  ],
  reading: [
    '在文字的安静缝隙里，寻得一片只属于自己的森林。',
    '翻过二十页书页的沙沙声，是日常里最温柔的白噪音。',
    '把喧嚣关在门外，在别人的故事里读懂自己的生活。',
  ],
  walk: [
    '踩着落日余晖散步三公里，把积攒的疲惫随风吹散。',
    '晚风吹过树梢的黄昏，双脚正在踏实地丈量生活。',
    '脚步慢下来的时候，沿途的晚霞才真正有了意义。',
  ],
  night: [
    '熄灭屏幕与杂念，在沉静的呼吸里与自己重逢。',
    '给今天的自己道一声辛苦，在月光下安心睡去。',
    '夜晚是白日的收信人，放下一切，静候晨曦。',
  ],
  general: [
    '认真生活的每一刻，都在悄悄沉淀成诗。',
    '时间是流动的河，习惯是河底温润的石。',
    '给平淡日常打上一枚温柔的钢印。',
    '万物皆有裂隙，那是光照进来的地方。',
    '今天也是被热烈且具体爱着的一天。',
    '风吹过树梢的下午，心里装满安静的确定。',
    '生活不需要波澜壮阔，点滴自律便是平凡的英雄主义。',
    '一草一木皆有灵，一朝一夕皆成诗。',
  ],
};

function generateContextualFallback(completedHabits: HabitItem[]): string {
  const titles = completedHabits.map((h) => h.title.toLowerCase());
  const matchedPool: string[] = [];

  if (titles.some((t) => t.includes('咖啡') || t.includes('茶') || t.includes('早'))) {
    matchedPool.push(...THEMATIC_QUOTES.coffee);
  }
  if (titles.some((t) => t.includes('读') || t.includes('书') || t.includes('写') || t.includes('学'))) {
    matchedPool.push(...THEMATIC_QUOTES.reading);
  }
  if (titles.some((t) => t.includes('步') || t.includes('跑') || t.includes('练') || t.includes('动') || t.includes('散'))) {
    matchedPool.push(...THEMATIC_QUOTES.walk);
  }
  if (titles.some((t) => t.includes('睡') || t.includes('冥想') || t.includes('晚') || t.includes('夜') || t.includes('静'))) {
    matchedPool.push(...THEMATIC_QUOTES.night);
  }

  const pool = matchedPool.length > 0 ? matchedPool : THEMATIC_QUOTES.general;
  return pool[Math.floor(Math.random() * pool.length)];
}

export async function generateHabitQuote(
  completedHabits: HabitItem[],
  city: string = '上海',
  weather: string = '晴'
): Promise<string> {
  const habitTitles = completedHabits.map((h) => `${h.icon} ${h.title}`);

  try {
    const res = await fetch('/api/generate-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        habits: habitTitles,
        city,
        weather,
      }),
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    if (res.ok) {
      const data = await res.json();
      if (data.quote && data.quote.trim().length > 5) {
        return data.quote.trim();
      }
    }
  } catch (err) {
    console.warn('AI quote fetch error, using contextual generator fallback:', err);
  }

  // Graceful, tailored fallback based on checked routines
  return generateContextualFallback(completedHabits);
}
