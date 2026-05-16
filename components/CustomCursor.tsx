"use client";

import { useEffect, useRef, useState } from "react";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const isHoveringRef = useRef(false);
  const cursorScale = useRef(1);
  const isVisibleRef = useRef(false);
  const cursorOpacity = useRef(0);
  const [mounted, setMounted] = useState(false);
  const [useCustom, setUseCustom] = useState(true);

  useEffect(() => {
    setMounted(true);

    // Check for touch device capability
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
    if (isTouchDevice) {
      setUseCustom(false);
    }

    const checkCursorPreference = () => {
      setUseCustom(!document.documentElement.classList.contains("no-custom-cursor"));
    };

    const observer = new MutationObserver(checkCursorPreference);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    checkCursorPreference();
    
    return () => observer.disconnect();
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !useCustom) {
      document.documentElement.style.cursor = "";
      return;
    }

    document.documentElement.style.cursor = "none";

    const handleMouseMove = (e: MouseEvent) => {
      isVisibleRef.current = true;
      mousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      isHoveringRef.current = !!target.closest("button, a, label, input, textarea, [role='button'], .cursor-pointer");
    };

    const handleMouseLeave = () => {
      isVisibleRef.current = false;
    };

    const handleMouseEnter = () => {
      isVisibleRef.current = true;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    let frameId: number;
    const animate = () => {
      const targetScale = isHoveringRef.current ? 2.2 : 1;
      cursorScale.current += (targetScale - cursorScale.current) * 0.15;

      const targetOpacity = isVisibleRef.current ? 1 : 0;
      cursorOpacity.current += (targetOpacity - cursorOpacity.current) * 0.1;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${mousePos.current.x}px, ${mousePos.current.y}px, 0) translate(-50%, -50%) scale(${cursorScale.current})`;
        cursorRef.current.style.opacity = cursorOpacity.current.toString();
      }
      frameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      document.documentElement.style.cursor = "";
      cancelAnimationFrame(frameId);
    };
  }, [mounted, useCustom]);

  if (!mounted || !useCustom) return null;

  return (
    <div 
      ref={cursorRef}
      className="fixed top-0 left-0 w-4 h-4 border-2 border-zinc-300 rounded-full pointer-events-none z-[9999] mix-blend-difference"
      style={{ 
        willChange: 'transform',
        transform: 'translate3d(-100px, -100px, 0)',
        backfaceVisibility: 'hidden',
        opacity: 0,
      }}
    />
  );
}