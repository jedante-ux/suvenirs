'use client';

import { useEffect, useRef, useCallback } from 'react';

const PARTICLE_COUNT = 6;
const PARTICLE_LIFE = 1200;
const MIN_DISTANCE = 8;
const MAX_PARTICLES = 80;

interface Particle {
  x: number;
  y: number;
  size: number;
  birth: number;
  vx: number;
  vy: number;
  drift: number;
  twinkleSpeed: number;
  pinkAmount: number;
  isLightBg: boolean;
}

export default function GlitterCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const lastPos = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const bgLightRef = useRef(true);

  const spawnParticles = useCallback((x: number, y: number) => {
    const now = performance.now();
    const arr = particles.current;

    // Hard cap — drop oldest if over limit
    if (arr.length > MAX_PARTICLES - PARTICLE_COUNT) {
      arr.splice(0, PARTICLE_COUNT);
    }

    const isLight = bgLightRef.current;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + 4 + Math.random() * 10,
        size: Math.random() * 0.5 + 0.3,
        birth: now,
        vx: (Math.random() - 0.5) * 1.2,
        vy: Math.random() * 1.5 + 0.4,
        drift: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 8 + 3,
        pinkAmount: Math.random(),
        isLightBg: isLight,
      });
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(hover: none)').matches) return;
    if (window.location.pathname.startsWith('/gestion')) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Sample bg brightness infrequently — at cursor position, not per particle
    const sampleBg = (x: number, y: number) => {
      try {
        const el = document.elementFromPoint(x, y);
        if (!el) return;
        const bg = getComputedStyle(el).backgroundColor;
        const match = bg.match(/\d+/g);
        if (!match) return;
        const [r, g, b] = match.map(Number);
        bgLightRef.current = (r * 299 + g * 587 + b * 114) / 1000 > 180;
      } catch { /* keep last value */ }
    };

    let sampleCounter = 0;
    const handleMove = (e: MouseEvent) => {
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      if (dx * dx + dy * dy > MIN_DISTANCE * MIN_DISTANCE) {
        // Sample bg every ~10 moves instead of per particle
        if (++sampleCounter % 10 === 0) {
          sampleBg(e.clientX, e.clientY);
        }
        spawnParticles(e.clientX, e.clientY);
        lastPos.current = { x: e.clientX, y: e.clientY };
      }
    };
    window.addEventListener('mousemove', handleMove);

    const ctx = canvas.getContext('2d', { alpha: true })!;

    const animate = () => {
      const now = performance.now();
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const arr = particles.current;
      let writeIdx = 0;

      // Filter in-place to avoid allocation
      for (let i = 0; i < arr.length; i++) {
        if (now - arr[i].birth < PARTICLE_LIFE) {
          arr[writeIdx++] = arr[i];
        }
      }
      arr.length = writeIdx;

      // Batch: no save/restore, no shadowBlur per particle
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      for (let i = 0; i < arr.length; i++) {
        const p = arr[i];
        const age = now - p.birth;
        const life = age / PARTICLE_LIFE;

        let opacity: number;
        if (life < 0.05) opacity = life * 20;
        else if (life < 0.7) opacity = 1;
        else opacity = 1 - (life - 0.7) / 0.3;

        const twinkle = 0.7 + 0.3 * Math.sin(age * p.twinkleSpeed * 0.01);

        p.x += p.vx + Math.sin(p.drift + age * 0.002) * 0.15;
        p.y += p.vy;
        p.vy *= 0.999;

        const s = p.size * (1 - life * 0.2);
        const alpha = opacity * twinkle;
        if (alpha < 0.01) continue;

        const pink = p.isLightBg ? p.pinkAmount : p.pinkAmount * 0.2;
        const r = 255 - (pink * 1) | 0;
        const g = 255 - (pink * 219) | 0;
        const b = 255 - (pink * 117) | 0;

        // Single circle with radial gradient for glow effect (no shadowBlur)
        ctx.globalAlpha = alpha;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
        ctx.fill();

        // White core — smaller, brighter
        ctx.globalAlpha = alpha * 0.85;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, s * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [spawnParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      aria-hidden="true"
    />
  );
}
