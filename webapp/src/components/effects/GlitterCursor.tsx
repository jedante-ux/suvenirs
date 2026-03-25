'use client';

import { useEffect, useRef, useCallback } from 'react';

// Frost/escarcha style — ultra fine, pink on light, white on dark
const PARTICLE_COUNT = 10;
const PARTICLE_LIFE = 1800;
const MIN_DISTANCE = 3;

interface Particle {
  x: number;
  y: number;
  size: number;
  birth: number;
  vx: number;
  vy: number;
  drift: number;
  twinkleSpeed: number;
  pinkAmount: number; // 0 = white, 1 = full pink
}

export default function GlitterCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const lastPos = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  const spawnParticles = useCallback((x: number, y: number) => {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.current.push({
        x: x + (Math.random() - 0.5) * 24,
        y: y + 6 + Math.random() * 12,
        size: Math.random() * 0.4 + 0.2, // 0.2–0.6px escarcha
        birth: performance.now(),
        vx: (Math.random() - 0.5) * 0.5,
        vy: Math.random() * 0.4 + 0.08, // very slow fall
        drift: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 10 + 3,
        pinkAmount: Math.random(), // mix of pink and white
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

    const handleMove = (e: MouseEvent) => {
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > MIN_DISTANCE) {
        spawnParticles(e.clientX, e.clientY);
        lastPos.current = { x: e.clientX, y: e.clientY };
      }
    };
    window.addEventListener('mousemove', handleMove);

    const ctx = canvas.getContext('2d')!;

    // Sample background brightness at a point to decide pink vs white
    const getBgBrightness = (x: number, y: number): number => {
      try {
        const el = document.elementFromPoint(x, y);
        if (!el) return 255;
        const bg = getComputedStyle(el).backgroundColor;
        const match = bg.match(/\d+/g);
        if (!match) return 255;
        const [r, g, b] = match.map(Number);
        return (r * 299 + g * 587 + b * 114) / 1000;
      } catch {
        return 255;
      }
    };

    // Cache bg brightness per particle at spawn
    const brightnessCache = new WeakMap<Particle, number>();

    const origSpawn = spawnParticles;

    const animate = () => {
      const now = performance.now();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.current = particles.current.filter(p => now - p.birth < PARTICLE_LIFE);

      for (const p of particles.current) {
        const age = now - p.birth;
        const life = age / PARTICLE_LIFE;

        // Fade in fast, stay visible long, fade out last 30%
        let opacity: number;
        if (life < 0.05) opacity = life * 20;
        else if (life < 0.7) opacity = 1;
        else opacity = 1 - (life - 0.7) / 0.3;

        // Twinkle
        const twinkle = 0.4 + 0.6 * Math.sin(age * p.twinkleSpeed * 0.01);

        // Floating drift
        p.x += p.vx + Math.sin(p.drift + age * 0.002) * 0.2;
        p.y += p.vy;
        p.vy *= 0.9995; // almost no deceleration — drifts forever

        const s = p.size * (1 - life * 0.2);

        // Cache bg check once per particle
        if (!brightnessCache.has(p)) {
          brightnessCache.set(p, getBgBrightness(p.x, p.y));
        }
        const bright = brightnessCache.get(p)!;

        // On light bg (>180): show pink. On dark bg (<180): show white/light
        const isLightBg = bright > 180;
        const pink = isLightBg ? p.pinkAmount : p.pinkAmount * 0.2;

        // Interpolate color: white ↔ pink based on pinkAmount + bg
        const r = Math.round(255 - pink * 1); // 254-255
        const g = Math.round(255 - pink * 219); // 36-255
        const b = Math.round(255 - pink * 117); // 138-255
        const color = `rgb(${r},${g},${b})`;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.globalAlpha = opacity * twinkle * 0.9;

        // Glow halo
        ctx.shadowColor = isLightBg ? '#FE248A' : '#ffffff';
        ctx.shadowBlur = 3;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, s, 0, Math.PI * 2);
        ctx.fill();

        // White sparkle core
        ctx.shadowBlur = 0;
        ctx.globalAlpha = opacity * twinkle * 0.6;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
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
