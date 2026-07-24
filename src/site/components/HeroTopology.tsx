import { useEffect, useRef } from 'react';

interface HeroTopologyProps {
  className?: string;
}

const TEAL = '#00BFA6';
const BLUE = '#5B9DFF';
const GOLD = '#FBBF24';

export default function HeroTopology({ className = '' }: HeroTopologyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    let frameId = 0;
    let width = 0;
    let height = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const render = (time = 0) => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;

      if (!width || !height) return;

      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);

      const centerX = width * 0.66;
      const centerY = height * 0.52;
      const radius = Math.min(width * 0.41, height * 0.63);
      const pulse = reducedMotion ? 0 : (Math.sin(time / 1300) + 1) / 2;

      const outerGlow = context.createRadialGradient(centerX, centerY, radius * 0.12, centerX, centerY, radius * 1.26);
      outerGlow.addColorStop(0, 'rgba(0, 191, 166, 0.24)');
      outerGlow.addColorStop(0.52, 'rgba(91, 157, 255, 0.14)');
      outerGlow.addColorStop(1, 'rgba(13, 17, 23, 0)');
      context.fillStyle = outerGlow;
      context.fillRect(0, 0, width, height);

      context.save();
      context.beginPath();
      context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      context.clip();

      const waferFill = context.createRadialGradient(centerX - radius * 0.2, centerY - radius * 0.25, radius * 0.08, centerX, centerY, radius);
      waferFill.addColorStop(0, 'rgba(35, 100, 120, 0.98)');
      waferFill.addColorStop(0.52, 'rgba(10, 43, 56, 0.98)');
      waferFill.addColorStop(1, 'rgba(6, 18, 27, 0.99)');
      context.fillStyle = waferFill;
      context.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);

      const cell = Math.max(16, Math.floor(radius / 11));
      for (let row = -12; row <= 12; row += 1) {
        for (let column = -12; column <= 12; column += 1) {
          const x = centerX + column * cell;
          const y = centerY + row * cell;
          const distance = Math.hypot(x - centerX, y - centerY);
          if (distance > radius - cell * 0.25) continue;

          const phase = Math.abs((column * 7 + row * 11) % 17);
          const highlighted = phase === 0 || phase === 3 || phase === 8;
          context.fillStyle = highlighted
            ? `rgba(${phase === 3 ? '91, 157, 255' : phase === 8 ? '251, 191, 36' : '0, 191, 166'}, ${0.24 + pulse * 0.14})`
            : 'rgba(132, 225, 234, 0.075)';
          context.fillRect(x - cell * 0.43, y - cell * 0.43, cell * 0.86, cell * 0.86);
          context.strokeStyle = highlighted ? 'rgba(240, 246, 252, 0.42)' : 'rgba(100, 204, 216, 0.32)';
          context.lineWidth = 0.7;
          context.strokeRect(x - cell * 0.43, y - cell * 0.43, cell * 0.86, cell * 0.86);
        }
      }

      const paths = [
        { offset: -0.35, color: TEAL },
        { offset: 0.04, color: BLUE },
        { offset: 0.36, color: GOLD },
      ];
      paths.forEach(({ offset, color }, index) => {
        const pathY = centerY + radius * offset;
        context.strokeStyle = color;
        context.globalAlpha = 0.64;
        context.lineWidth = index === 1 ? 2.2 : 1.4;
        context.beginPath();
        context.moveTo(centerX - radius, pathY);
        context.bezierCurveTo(centerX - radius * 0.28, pathY - radius * 0.18, centerX + radius * 0.16, pathY + radius * 0.17, centerX + radius, pathY - radius * 0.05);
        context.stroke();

        const progress = reducedMotion ? 0.72 : ((time / 4400 + index * 0.27) % 1);
        const dotX = centerX - radius + radius * 2 * progress;
        const dotY = pathY + Math.sin(progress * Math.PI * 2) * radius * 0.12;
        context.fillStyle = color;
        context.globalAlpha = 0.95;
        context.beginPath();
        context.arc(dotX, dotY, 3.5, 0, Math.PI * 2);
        context.fill();
      });
      context.restore();

      context.globalAlpha = 1;
      [1, 0.78, 0.55].forEach((scale, index) => {
        context.strokeStyle = index === 0 ? 'rgba(240, 246, 252, 0.68)' : index === 1 ? 'rgba(0, 191, 166, 0.74)' : 'rgba(91, 157, 255, 0.64)';
        context.lineWidth = index === 0 ? 1.5 : 1;
        context.beginPath();
        context.arc(centerX, centerY, radius * scale, 0, Math.PI * 2);
        context.stroke();
      });

      context.fillStyle = TEAL;
      context.globalAlpha = 0.86;
      context.beginPath();
      context.arc(centerX, centerY, 6 + pulse * 2, 0, Math.PI * 2);
      context.fill();
      context.globalAlpha = 1;

      if (!reducedMotion) frameId = window.requestAnimationFrame(render);
    };

    const resizeObserver = new ResizeObserver(() => render());
    resizeObserver.observe(canvas);
    render();

    return () => {
      resizeObserver.disconnect();
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}