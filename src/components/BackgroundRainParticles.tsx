import React, { useEffect, useRef } from 'react';

type Particle = {
  x: number;
  y: number;
  r: number;
  vy: number;
  alpha: number;
};

interface BackgroundRainParticlesProps {
  density?: number;
  speed?: number;
  color?: string; // formato "r, g, b" (sin rgba)
}

const BackgroundRainParticles: React.FC<BackgroundRainParticlesProps> = ({
  density = 140,
  speed = 0.7,
  color = '220, 38, 38',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setSize = () => {
      const { offsetWidth, offsetHeight } = canvas;
      canvas.width = offsetWidth;
      canvas.height = offsetHeight;
    };

    setSize();

    const random = (min: number, max: number) => Math.random() * (max - min) + min;

    const spawnParticle = (): Particle => ({
      x: random(-canvas.width * 0.1, canvas.width * 1.1),
      y: random(-canvas.height, 0),
      r: random(4, 15),
      vy: random(45, 120) * speed,
      alpha: random(0.25, 0.6),
    });

    particlesRef.current = Array.from({ length: density }, spawnParticle);

    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); // cap 50ms
      last = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i];
        p.y += p.vy * dt;

        if (p.y - p.r > canvas.height) {
          particlesRef.current[i] = spawnParticle();
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, ${p.alpha})`;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(frame);
    };

    animRef.current = requestAnimationFrame(frame);

    const onResize = () => setSize();
    window.addEventListener('resize', onResize);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, [density, speed, color]);

  return <canvas ref={canvasRef} className="login-particles-canvas" />;
};

export default BackgroundRainParticles;


