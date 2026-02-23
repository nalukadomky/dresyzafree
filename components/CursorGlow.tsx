'use client';

import { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export default function CursorGlow() {
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 30 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth);
      mouseY.set(e.clientY / window.innerHeight);
    };
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        mouseX.set(touch.clientX / window.innerWidth);
        mouseY.set(touch.clientY / window.innerHeight);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [mouseX, mouseY]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Primary glow — follows cursor */}
      <motion.div
        className="absolute w-[700px] h-[700px] rounded-full"
        style={{
          left: useTransform(springX, (v: number) => `calc(${v * 100}% - 350px)`),
          top: useTransform(springY, (v: number) => `calc(${v * 100}% - 350px)`),
          background: 'radial-gradient(circle, rgba(59,130,246,0.10) 0%, rgba(59,130,246,0.04) 40%, transparent 70%)',
          willChange: 'transform',
        }}
      />
      {/* Secondary glow — inverse direction */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          right: useTransform(springX, (v: number) => `calc(${v * 100}% - 250px)`),
          bottom: useTransform(springY, (v: number) => `calc(${v * 100}% - 250px)`),
          background: 'radial-gradient(circle, rgba(30,58,138,0.08) 0%, transparent 60%)',
          willChange: 'transform',
        }}
      />
      {/* Floating parallax dots */}
      <motion.div
        className="absolute top-[20%] right-[20%] w-1 h-1 bg-blue-400/25 rounded-full"
        style={{ x: useTransform(springX, [0, 1], [25, -25]), y: useTransform(springY, [0, 1], [15, -15]) }}
      />
      <motion.div
        className="absolute top-[45%] right-[10%] w-1.5 h-1.5 bg-blue-300/15 rounded-full"
        style={{ x: useTransform(springX, [0, 1], [-20, 20]), y: useTransform(springY, [0, 1], [20, -20]) }}
      />
      <motion.div
        className="absolute top-[70%] left-[20%] w-1 h-1 bg-blue-400/20 rounded-full"
        style={{ x: useTransform(springX, [0, 1], [30, -30]), y: useTransform(springY, [0, 1], [-25, 25]) }}
      />
      <motion.div
        className="absolute top-[15%] left-[45%] w-0.5 h-0.5 bg-white/15 rounded-full"
        style={{ x: useTransform(springX, [0, 1], [-35, 35]), y: useTransform(springY, [0, 1], [20, -20]) }}
      />
      <motion.div
        className="absolute top-[55%] left-[55%] w-1 h-1 bg-blue-500/10 rounded-full"
        style={{ x: useTransform(springX, [0, 1], [15, -15]), y: useTransform(springY, [0, 1], [-10, 10]) }}
      />
    </div>
  );
}
