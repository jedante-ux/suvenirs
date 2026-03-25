'use client';

import { useEffect, useRef, useCallback } from 'react';

const COLORS = ['#FE248A', '#F47920', '#D3DC2A', '#FF6B9D', '#FFD4E0'];
const PARTICLE_COUNT = 3;
const PARTICLE_LIFE = 600;
const MIN_DISTANCE = 8;

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  birth: number;
  vx: number;
  vy: number;
  rotation: number;
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
        x: x + (Math.random() - 0.5) * 10,
        y: y + 15 + Math.random() * 6,
        size: Math.random() * 5 + 2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        birth: performance.now(),
        vx: (Math.random() - 0.5) * 1.2,
        vy: Math.random() * 1.5 + 0.5,
        rotation: Math.random() * 360,
      });
    }
  }, []);

  useEffect(() => {
    // Skip on admin pages and respect reduced motion
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
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
        const opacity = 1 - life;
        const scale = 1 - life * 0.5;

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04; // gravity — falls down
        p.vx *= 0.99; // subtle drag
        p.rotation += 4;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = opacity;

        const s = p.size * scale;

        // Glow layer
        ctx.shadowColor = p.color;
        ctx.shadowBlur = s * 3;

        // Draw 4-point sparkle star
        ctx.fillStyle = p.color;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI) / 2;
          const outerX = Math.cos(angle) * s;
          const outerY = Math.sin(angle) * s;
          const innerAngle = angle + Math.PI / 4;
          const innerX = Math.cos(innerAngle) * s * 0.25;
          const innerY = Math.sin(innerAngle) * s * 0.25;
          if (i === 0) ctx.moveTo(outerX, outerY);
          else ctx.lineTo(outerX, outerY);
          ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();

        // Bright white center dot
        ctx.shadowBlur = 0;
        ctx.globalAlpha = opacity * 0.9;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.25, 0, Math.PI * 2);
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
