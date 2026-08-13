'use client';

import {useEffect, useRef} from 'react';
import styles from './owl-canvas.module.css';

type OwlCanvasProps = {
  width?: number;
  height?: number;
  className?: string;
  ariaLabel?: string;
  variant?: 'idle' | 'loading';
  decorative?: boolean;
};

const TAU = Math.PI * 2;

function roundedEye(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  eyelid: number
) {
  context.save();
  context.beginPath();
  context.arc(x, y, radius, 0, TAU);
  context.clip();

  context.fillStyle = '#f7edb3';
  context.fillRect(x - radius, y - radius, radius * 2, radius * 2);

  context.fillStyle = '#171824';
  context.beginPath();
  context.arc(x, y + 0.5, radius * 0.28, 0, TAU);
  context.fill();

  if (eyelid > 0) {
    context.fillStyle = '#343447';
    const coverHeight = radius * 2 * eyelid;
    context.fillRect(x - radius, y - radius, radius * 2, coverHeight);
    context.fillRect(x - radius, y + radius - coverHeight, radius * 2, coverHeight);
  }

  context.restore();
}

function drawOwl(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  elapsed: number,
  reducedMotion: boolean,
  variant: 'idle' | 'loading'
) {
  context.clearRect(0, 0, width, height);

  const scale = Math.min(width / 96, height / 96);
  const offsetX = (width - 96 * scale) / 2;
  const offsetY = (height - 96 * scale) / 2;
  context.save();
  context.translate(offsetX, offsetY);
  context.scale(scale, scale);
  context.lineCap = 'round';
  context.lineJoin = 'round';

  const isLoading = variant === 'loading';
  const cycle = reducedMotion ? 0.48 : (elapsed % 5200) / 5200;
  const flap = reducedMotion || !isLoading ? 0 : Math.sin(elapsed / 105);
  const breathe = reducedMotion
    ? 0
    : isLoading
      ? Math.sin(elapsed / 210) * 1.4
      : Math.sin(elapsed / 620) * 0.8;
  const sleepyDip = isLoading ? 0 : reducedMotion ? 1 : Math.max(0, Math.sin(cycle * Math.PI));
  const blink = isLoading
    ? 0
    : reducedMotion
    ? 0.92
    : cycle < 0.1
      ? Math.sin((cycle / 0.1) * Math.PI)
      : cycle > 0.22 && cycle < 0.76
        ? 0.92
        : cycle > 0.84 && cycle < 0.9
          ? Math.sin(((cycle - 0.84) / 0.06) * Math.PI) * 0.75
          : 0;

  // The branch remains deliberately simple so the transparent logo stays legible.
  context.strokeStyle = '#76523a';
  context.lineWidth = 6;
  context.beginPath();
  context.moveTo(8, 82);
  context.bezierCurveTo(31, 78, 61, 84, 90, 77);
  context.stroke();
  context.strokeStyle = '#9b704d';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(10, 80);
  context.bezierCurveTo(35, 77, 62, 81, 87, 76);
  context.stroke();

  context.save();
  context.translate(48, 54 + breathe + sleepyDip * 1.4);
  context.rotate((-sleepyDip * 3.5 * Math.PI) / 180);

  // Feet behind the body.
  context.strokeStyle = '#e5b723';
  context.lineWidth = 2.3;
  for (const footX of [-13, 13]) {
    context.beginPath();
    context.moveTo(footX, 20);
    context.lineTo(footX - 2, 27);
    context.moveTo(footX - 2, 26);
    context.lineTo(footX - 7, 28);
    context.moveTo(footX - 2, 26);
    context.lineTo(footX + 3, 29);
    context.stroke();
  }

  // Loading mode opens the wings and animates them around their shoulder joints.
  if (isLoading) {
    const drawWing = (direction: -1 | 1) => {
      context.save();
      context.translate(direction * 20, -5);
      context.scale(direction, 1);
      context.rotate(((-20 - flap * 28) * Math.PI) / 180);
      context.fillStyle = '#292a3a';
      context.beginPath();
      context.moveTo(0, 0);
      context.bezierCurveTo(13, -4, 26, 6, 30, 23);
      context.bezierCurveTo(18, 27, 7, 20, 0, 6);
      context.closePath();
      context.fill();
      context.restore();
    };

    drawWing(-1);
    drawWing(1);
  }

  // Body and folded wings.
  context.fillStyle = '#343447';
  context.beginPath();
  context.ellipse(0, 4, 27, 29, 0, 0, TAU);
  context.fill();
  if (!isLoading) {
    context.fillStyle = '#292a3a';
    context.beginPath();
    context.ellipse(-20, 8, 8, 19, -0.18, 0, TAU);
    context.ellipse(20, 8, 8, 19, 0.18, 0, TAU);
    context.fill();
  }

  // Head, based on the silhouette and colors of the existing logo.
  context.fillStyle = '#343447';
  context.beginPath();
  context.moveTo(-28, -20);
  context.lineTo(-36, -34);
  context.lineTo(-18, -30);
  context.quadraticCurveTo(0, -37, 18, -30);
  context.lineTo(36, -34);
  context.lineTo(28, -20);
  context.quadraticCurveTo(31, 2, 17, 12);
  context.quadraticCurveTo(0, 22, -17, 12);
  context.quadraticCurveTo(-31, 2, -28, -20);
  context.fill();

  roundedEye(context, -13, -10, 12, blink);
  roundedEye(context, 13, -10, 12, blink);

  context.fillStyle = '#efbe25';
  context.beginPath();
  context.moveTo(-4, 0);
  context.quadraticCurveTo(0, -3, 4, 0);
  context.lineTo(0, 9);
  context.closePath();
  context.fill();

  // A few pale chest feathers echo the original mark.
  context.strokeStyle = '#f7edb3';
  context.lineWidth = 2;
  for (let x = -8; x <= 8; x += 4) {
    context.beginPath();
    context.moveTo(x, 12);
    context.lineTo(x - 1, 21 + Math.abs(x) * 0.15);
    context.stroke();
  }
  context.restore();

  // A restrained sleep symbol appears only during the deepest part of the nap.
  if (!isLoading && !reducedMotion && cycle > 0.38 && cycle < 0.72) {
    const progress = (cycle - 0.38) / 0.34;
    context.save();
    context.globalAlpha = Math.sin(progress * Math.PI) * 0.65;
    context.fillStyle = '#7f8198';
    context.font = '600 10px sans-serif';
    context.fillText('Z', 76, 28 - progress * 8);
    context.restore();
  }

  context.restore();
}

export function OwlCanvas({
  width = 76,
  height = 76,
  className,
  ariaLabel = 'A sleepy owl perched on a branch',
  variant = 'idle',
  decorative = false
}: OwlCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frameId = 0;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const render = (time: number) => {
      drawOwl(context, width, height, time, motionQuery.matches, variant);
      if (!motionQuery.matches) frameId = requestAnimationFrame(render);
    };

    const handleMotionChange = () => {
      cancelAnimationFrame(frameId);
      resize();
      if (motionQuery.matches) drawOwl(context, width, height, 0, true, variant);
      else frameId = requestAnimationFrame(render);
    };

    resize();
    handleMotionChange();
    motionQuery.addEventListener('change', handleMotionChange);

    return () => {
      cancelAnimationFrame(frameId);
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, [height, variant, width]);

  return (
    <canvas
      ref={canvasRef}
      className={[styles.canvas, className].filter(Boolean).join(' ')}
      style={{width, height}}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : ariaLabel}
    />
  );
}
