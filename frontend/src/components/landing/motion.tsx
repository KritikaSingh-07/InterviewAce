import { useRef, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useTransform, type Variants } from 'framer-motion';

/* Shared motion primitives for the landing page. Everything animates only
   transform / opacity so it stays on the compositor and runs at 60fps. */

export const EASE = [0.22, 1, 0.36, 1] as const;
const VIEWPORT = { once: true, margin: '-80px' } as const;

/** Fades + lifts its content in when it scrolls into view. */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.8, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const groupVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease: EASE } },
};

/** Container that staggers any `StaggerItem` / `itemVariants` children into view. */
export function StaggerGroup({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={groupVariants} initial="hidden" whileInView="show" viewport={VIEWPORT} className={className}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

/**
 * Section title: small eyebrow with a drawn rule, then the heading revealed
 * word by word from behind a mask. Words in `highlight` get the brand gradient.
 */
export function SectionHeading({
  eyebrow,
  title,
  highlight,
  subtitle,
  light = false,
}: {
  eyebrow?: string;
  title: string;
  highlight?: string;
  subtitle?: string;
  /** White text for use on dark/brand backgrounds */
  light?: boolean;
}) {
  const words = title.split(' ');
  const hl = new Set((highlight ?? '').split(' ').filter(Boolean));

  return (
    <div className="text-center mb-16">
      {eyebrow && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: 0.6, ease: EASE }}
          className={`mb-4 inline-flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.25em] ${
            light ? 'text-white/80' : 'text-indigo-800 dark:text-violet-400'
          }`}
        >
          <motion.span
            className="h-px w-8 origin-right bg-current"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={VIEWPORT}
            transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
          />
          {eyebrow}
          <motion.span
            className="h-px w-8 origin-left bg-current"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={VIEWPORT}
            transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
          />
        </motion.div>
      )}

      <motion.h2
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } }}
        className={`text-4xl md:text-5xl font-bold mb-5 ${light ? 'text-white' : 'text-gray-900 dark:text-white'}`}
      >
        {words.map((word, i) => (
          <span key={i} className="inline-block overflow-hidden align-bottom pb-[0.12em] -mb-[0.12em] mr-[0.25em] last:mr-0">
            <motion.span
              className={`inline-block ${hl.has(word) ? 'gradient-text' : ''}`}
              variants={{
                hidden: { y: '110%', rotate: 5 },
                show: { y: '0%', rotate: 0, transition: { duration: 0.9, ease: EASE } },
              }}
            >
              {word}
            </motion.span>
          </span>
        ))}
      </motion.h2>

      {subtitle && (
        <Reveal delay={0.35} y={16}>
          <p className={`text-lg md:text-xl max-w-2xl mx-auto ${light ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'}`}>
            {subtitle}
          </p>
        </Reveal>
      )}
    </div>
  );
}

/**
 * Card that tilts toward the pointer and shows a soft spotlight where the
 * cursor is. Pointer position is written to CSS variables directly, so moving
 * the mouse never re-renders React.
 */
export function TiltCard({
  children,
  className = '',
  max = 7,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spring = { stiffness: 150, damping: 20, mass: 0.5 };
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [max, -max]), spring);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-max, max]), spring);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  const onLeave = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      className={`group/tilt relative will-change-transform ${className}`}
    >
      {children}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover/tilt:opacity-100"
        style={{
          background: 'radial-gradient(380px circle at var(--mx) var(--my), rgb(var(--brand-2) / 0.13), transparent 65%)',
        }}
      />
    </motion.div>
  );
}

/** Wraps an element so it gets pulled slightly toward the cursor. */
export function Magnetic({
  children,
  strength = 0.3,
  className = '',
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const x = useSpring(0, { stiffness: 200, damping: 15, mass: 0.4 });
  const y = useSpring(0, { stiffness: 200, damping: 15, mass: 0.4 });

  return (
    <motion.div
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={{ x, y }}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.div>
  );
}
