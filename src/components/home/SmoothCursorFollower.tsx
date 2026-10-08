import React, { useEffect, useState, createContext, useContext } from 'react';
import { motion, useMotionValue, useSpring, useTransform, MotionValue } from 'motion/react';

interface CursorParallaxContextType {
  smoothMouseX: MotionValue<number>;
  smoothMouseY: MotionValue<number>;
  isPointerActive: boolean;
}

const CursorParallaxContext = createContext<CursorParallaxContextType | null>(null);

export const useCursorParallax = () => {
  const context = useContext(CursorParallaxContext);
  if (!context) {
    throw new Error('useCursorParallax must be used within a CursorParallaxProvider');
  }
  return context;
};

interface CursorParallaxProviderProps {
  children: React.ReactNode;
}

export const CursorParallaxProvider: React.FC<CursorParallaxProviderProps> = ({ children }) => {
  // Raw normalized mouse coordinates (-1 to 1)
  const rawNormX = useMotionValue(0);
  const rawNormY = useMotionValue(0);

  // Raw screen mouse coordinates for cursor element
  const rawMouseX = useMotionValue(-100);
  const rawMouseY = useMotionValue(-100);

  // Smoothed motion values with organic spring physics (feather-light, 0 CPU lag)
  const smoothMouseX = useSpring(rawNormX, { stiffness: 90, damping: 22, mass: 0.5 });
  const smoothMouseY = useSpring(rawNormY, { stiffness: 90, damping: 22, mass: 0.5 });

  // Cursor followers with slightly tighter spring for responsive feel
  const cursorDotX = useSpring(rawMouseX, { stiffness: 500, damping: 36 });
  const cursorDotY = useSpring(rawMouseY, { stiffness: 500, damping: 36 });
  const cursorRingX = useSpring(rawMouseX, { stiffness: 160, damping: 24 });
  const cursorRingY = useSpring(rawMouseY, { stiffness: 160, damping: 24 });

  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false);
  const [isPointerActive, setIsPointerActive] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only activate cursor enhancement on devices with mouse/fine pointer
    const mediaQuery = window.matchMedia('(pointer: fine)');
    setIsPointerActive(mediaQuery.matches);

    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsPointerActive(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    }

    if (!mediaQuery.matches) {
      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handleMediaChange);
        }
      };
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isVisible) setIsVisible(true);

      const { clientX, clientY } = e;
      rawMouseX.set(clientX);
      rawMouseY.set(clientY);

      // Normalize coordinates around the viewport center (-1 to +1)
      const width = window.innerWidth || 1;
      const height = window.innerHeight || 1;
      const normX = ((clientX - width / 2) / (width / 2));
      const normY = ((clientY - height / 2) / (height / 2));

      rawNormX.set(Math.max(-1, Math.min(1, normX)));
      rawNormY.set(Math.max(-1, Math.min(1, normY)));

      // Detect if user is hovering over an interactive control
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = target.closest('button, a, input, select, textarea, [role="button"], .cursor-pointer');
        setIsHoveringInteractive(!!interactive);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
      // Soft return to center
      rawNormX.set(0);
      rawNormY.set(0);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      }
    };
  }, [isVisible, rawMouseX, rawMouseY, rawNormX, rawNormY]);

  return (
    <CursorParallaxContext.Provider value={{ smoothMouseX, smoothMouseY, isPointerActive }}>
      {children}

      {/* Smooth Ambient Light & Custom Precision Cursor (Only on Desktop/Fine-pointer) */}
      {isPointerActive && isVisible && (
        <div className="hidden md:block pointer-events-none">
          {/* Subtle Ambient Mouse Glow traversing the page */}
          <motion.div
            className="fixed z-30 pointer-events-none rounded-full blur-3xl opacity-25"
            style={{
              x: cursorRingX,
              y: cursorRingY,
              translateX: '-50%',
              translateY: '-50%',
              width: 380,
              height: 380,
              background: 'radial-gradient(circle, rgba(251,191,36,0.18) 0%, rgba(225,29,72,0.08) 50%, transparent 70%)',
            }}
          />

          {/* Smooth Trailing Ring */}
          <motion.div
            className="fixed top-0 left-0 z-[9999] pointer-events-none rounded-full border transition-colors duration-200"
            style={{
              x: cursorRingX,
              y: cursorRingY,
              translateX: '-50%',
              translateY: '-50%',
              width: isHoveringInteractive ? 48 : 28,
              height: isHoveringInteractive ? 48 : 28,
              borderColor: isHoveringInteractive ? 'rgba(251, 191, 36, 0.85)' : 'rgba(251, 191, 36, 0.45)',
              backgroundColor: isHoveringInteractive ? 'rgba(251, 191, 36, 0.12)' : 'rgba(251, 191, 36, 0.03)',
              boxShadow: isHoveringInteractive ? '0 0 16px rgba(251, 191, 36, 0.35)' : 'none',
              backdropFilter: 'blur(0.5px)',
            }}
          />

          {/* Precision Dot */}
          <motion.div
            className="fixed top-0 left-0 z-[10000] pointer-events-none rounded-full bg-amber-300"
            style={{
              x: cursorDotX,
              y: cursorDotY,
              translateX: '-50%',
              translateY: '-50%',
              width: isHoveringInteractive ? 6 : 4,
              height: isHoveringInteractive ? 6 : 4,
              boxShadow: '0 0 8px rgba(251, 191, 36, 0.9)',
            }}
          />
        </div>
      )}
    </CursorParallaxContext.Provider>
  );
};
