import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

// Auto-correct VITE_SUPABASE_URL if a dashboard URL was mistakenly provided
if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_URL.includes('/dashboard/project/')) {
  const match = process.env.VITE_SUPABASE_URL.match(/\/dashboard\/project\/([a-zA-Z0-9]+)/);
  if (match && match[1]) {
    process.env.VITE_SUPABASE_URL = `https://${match[1]}.supabase.co`;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// API: Generate habit-tailored uplifting quote using Gemini AI
app.post('/api/generate-quote', async (req, res) => {
  try {
    const { habits = [], city = '上海', weather = '晴' } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(400).json({ error: 'GEMINI_API_KEY not configured' });
    }

    const ai = new GoogleGenAI();
    const habitsList = Array.isArray(habits) && habits.length > 0
      ? habits.join('、')
      : '晨间手冲咖啡、阅读、散步';

    const prompt = `你是一位温润、具有审美生活情调的文字创作者（风格类似汪曾祺、林清玄散文与日系生活美学）。
用户今天在「生活切片」习惯追踪器中完成了以下日常切片：
【打卡习惯】：${habitsList}
【所在地与天气】：${city} · ${weather}

请根据以上具体的日常习惯，创作一句积极向上、温柔治愈、富有画面感的一句话寄语（字数在 16 到 26 字之间）。
创作要求：
1. 语言自然温润，不要大白话，不要鸡汤喊口号，不要出现“加油”、“努力”等字眼。
2. 巧妙融入今天习惯的意象（例如咖啡的温热、翻书的声音、散步时的风与晚霞、冥想的片刻宁静）。
3. 只返回这句短句本身，不要带有任何引号、序号或多余解释。`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    let quote = response.text ? response.text.trim() : '';
    // Strip wrapping quotes if any
    quote = quote.replace(/^["“'「]/, '').replace(/["”'」]$/, '').trim();

    if (!quote) {
      quote = '认真生活的每一刻，都在悄悄沉淀成诗。';
    }

    res.json({ quote });
  } catch (err: any) {
    console.error('Failed to generate AI quote:', err);
    res.status(500).json({ error: err.message || 'AI generation failed' });
  }
});

const PORT = 3000;

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running in production on port ${PORT}`);
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n  VITE v8.3.0  ready in 120 ms\n`);
      console.log(`  ➜  Local:   http://localhost:${PORT}/`);
      console.log(`  ➜  Network: http://0.0.0.0:${PORT}/\n`);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} in use, retrying in 500ms...`);
        setTimeout(() => {
          server.close();
          server.listen(PORT, '0.0.0.0');
        }, 500);
      } else {
        console.error('Server error:', err);
      }
    });

    const shutdown = () => {
      server.close(() => {
        process.exit(0);
      });
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  }
}

startServer();
