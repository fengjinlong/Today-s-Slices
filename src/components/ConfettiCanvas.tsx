import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

export interface ConfettiCanvasHandle {
  burst: (originXPercent?: number) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  rot: number;
  rotSpeed: number;
  color: string;
  alpha: number;
  decay: number;
}

export const ConfettiCanvas = forwardRef<ConfettiCanvasHandle, { className?: string }>(
  ({ className = '' }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animIdRef = useRef<number | null>(null);

    const burst = (originXPercent: number = 0.5) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const width = canvas.width;
      const height = canvas.height;
      const startX = width * originXPercent;
      const startY = height * 0.08; // close to the tear slit at top

      const colors = ['#FFFDF9', '#FAF7F0', '#EFECE6', '#E4DFC8', '#DDD7CD', '#C86D51'];
      const newParticles: Particle[] = [];

      for (let i = 0; i < 35; i++) {
        // Disperse horizontally across tear line with random explosion
        const spread = (Math.random() - 0.5) * (width * 0.7);
        const vx = (Math.random() - 0.5) * 6 + spread * 0.02;
        const vy = -Math.random() * 5 - 1.5; // slight initial upward burst then gravity pulls down

        newParticles.push({
          x: Math.max(10, Math.min(width - 10, startX + spread)),
          y: startY + (Math.random() - 0.5) * 10,
          vx,
          vy,
          width: 5 + Math.random() * 6,
          height: 7 + Math.random() * 8,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.18,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          decay: 0.012 + Math.random() * 0.012,
        });
      }

      particlesRef.current = [...particlesRef.current, ...newParticles];

      if (!animIdRef.current) {
        loop();
      }
    };

    useImperativeHandle(ref, () => ({
      burst,
    }));

    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const remaining: Particle[] = [];
      const gravity = 0.22;
      const airDrag = 0.97;

      for (const p of particlesRef.current) {
        p.vx *= airDrag;
        p.vy = p.vy * airDrag + gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rotSpeed;
        p.alpha -= p.decay;

        if (p.alpha > 0.02 && p.y < canvas.height + 20) {
          remaining.push(p);

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);

          // 3D flip rotation effect: Math.abs(Math.cos(rot * 1.5))
          const flipScale = Math.abs(Math.cos(p.rot * 1.5));
          ctx.scale(1, flipScale);

          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.alpha);

          // Draw slight jagged or rectangular paper scrap
          ctx.beginPath();
          ctx.rect(-p.width / 2, -p.height / 2, p.width, p.height);
          ctx.fill();

          // Subtle scrap edge border for physical texture
          ctx.strokeStyle = 'rgba(42, 40, 37, 0.15)';
          ctx.lineWidth = 0.5;
          ctx.stroke();

          ctx.restore();
        }
      }

      particlesRef.current = remaining;

      if (remaining.length > 0) {
        animIdRef.current = requestAnimationFrame(loop);
      } else {
        animIdRef.current = null;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(dpr, dpr);
        }
      };

      resize();
      window.addEventListener('resize', resize);
      return () => {
        window.removeEventListener('resize', resize);
        if (animIdRef.current) {
          cancelAnimationFrame(animIdRef.current);
        }
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        className={`pointer-events-none absolute inset-0 z-30 w-full h-full ${className}`}
      />
    );
  }
);
