'use client';

import { useEffect, useRef, useCallback } from 'react';

// Sandman dreamsand style — ultra fine luminous pink dust
const COLORS = ['#FE248A', '#FF6B9D', '#FFB6D1', '#FFD4E0', '#ffffff'];
const PARTICLE_COUNT = 8;
const PARTICLE_LIFE = 800;
const MIN_DISTANCE = 3;

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  birth: number;
  vx: number;
  vy: number;
  drift: number; // sine wave drift
  twinkleSpeed: number;
}

export default function GlitterCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const lastPos = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const isAdmin = useRef(false);

  const spawnParticles = useCallback((x: number, y: number) => {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.current.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + 8 + Math.random() * 10,
        size: Math.random() * 0.8 + 0.2, // 0.2–1.0px ultra fine
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        birth: performance.now(),
        vx: (Math.random() - 0.5) * 0.8,
        vy: Math.random() * 0.8 + 0.15, // gentle fall
        drift: Math.random() * Math.PI * 2, // random sine phase
        twinkleSpeed: Math.random() * 8 + 4, // twinkle frequency
      });
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(hover: none)').matches) return;
    isAdmin.current = window.location.pathname.startsWith('/gestion');
    if (isAdmin.current) return;

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
    const animate = () => {
      const now = performance.now();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.current = particles.current.filter(p => now - p.birth < PARTICLE_LIFE);

      for (const p of particles.current) {
        const age = now - p.birth;
        const life = age / PARTICLE_LIFE;

        // Fade in quickly then fade out slowly
        const opacity = life < 0.1 ? life * 10 : 1 - (life - 0.1) / 0.9;

        // Twinkle — pulsing brightness
        const twinkle = 0.5 + 0.5 * Math.sin(age * p.twinkleSpeed * 0.01);

        // Sine wave horizontal drift — floats like dream dust
        p.x += p.vx + Math.sin(p.drift + age * 0.003) * 0.3;
        p.y += p.vy;
        p.vy *= 0.998; // slow deceleration — hangs in the air

        const s = p.size * (1 - life * 0.3);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.globalAlpha = opacity * twinkle;

        // Outer glow halo
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 4 + s * 3;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, s, 0, Math.PI * 2);
        ctx.fill();

        // Bright white core
        ctx.shadowBlur = 0;
        ctx.globalAlpha = opacity * twinkle * 0.8;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2);
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
