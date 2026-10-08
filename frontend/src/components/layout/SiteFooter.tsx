import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowUpRight } from 'lucide-react';

interface FooterLink {
  label: string;
  /** Section id on the landing page to scroll to */
  target?: string;
}

const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features', target: 'features' },
      { label: 'Pricing', target: 'pricing' },
      { label: 'Testimonials', target: 'testimonials' },
      { label: 'FAQ', target: 'faq' },
    ],
  },
  {
    title: 'Company',
    links: [{ label: 'About' }, { label: 'Blog' }, { label: 'Careers' }, { label: 'Contact' }],
  },
  {
    title: 'Legal',
    links: [{ label: 'Privacy' }, { label: 'Terms' }, { label: 'Security' }],
  },
];

const scrollToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// Always-dark editorial footer: it reads as a solid black block in light mode
// and as an oxblood-lit continuation of the page in dark mode.
export default function SiteFooter() {
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const year = new Date().getFullYear();

  // Spotlight that follows the cursor across the oversized wordmark
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = wordmarkRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
  };

  return (
    <footer className="relative isolate overflow-hidden bg-gray-950 text-gray-200 border-t border-white/[0.06]">
      {/* Texture + glow */}
      <div className="bg-grain [--grain-blend:screen] [--grain-opacity:0.08]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[320px] rounded-full bg-indigo-700/45 blur-[120px] animate-aurora" />
      <div className="pointer-events-none absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 space-y-4"
          >
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-700 via-violet-600 to-indigo-900 bg-[length:200%_200%] animate-gradient shadow-lg shadow-black/40 ring-1 ring-white/10 flex items-center justify-center transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
                <span className="text-white font-bold font-display">IA</span>
              </div>
              <span className="text-xl font-bold font-display text-white tracking-tight">InterviewAce</span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-gray-200">
              AI-powered interview preparation that helps students and engineers walk into every interview prepared, confident and sharp.
            </p>
            <Link
              to="/register"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-400 hover:bg-violet-600 hover:shadow-[0_8px_30px_-6px_rgba(201,48,58,0.7)]"
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative">Start practicing free</span>
              <ArrowUpRight className="relative w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </motion.div>

          {/* Link columns */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {columns.map((col, i) => (
              <motion.div
                key={col.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              >
                <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-violet-400">
                  {col.title}
                </h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <button
                        type="button"
                        onClick={link.target ? () => scrollToSection(link.target!) : undefined}
                        className="group relative inline-flex items-center gap-1 text-sm font-medium text-gray-100 transition-all duration-300 hover:translate-x-1 hover:text-white hover:[text-shadow:0_0_18px_rgba(226,97,106,0.85)]"
                      >
                        <span className="relative">
                          {link.label}
                          <span className="absolute -bottom-0.5 left-0 h-[2px] w-full origin-left scale-x-0 rounded-full bg-gradient-to-r from-violet-500 to-violet-300 transition-transform duration-300 ease-out group-hover:scale-x-100" />
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 -translate-x-1 translate-y-1 text-violet-400 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100" />
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Oversized wordmark with cursor spotlight */}
        <div
          ref={wordmarkRef}
          onMouseMove={handleMouseMove}
          aria-hidden="true"
          className="group relative mt-10 select-none [--spot-x:50%] [--spot-y:50%]"
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="font-display font-bold leading-[0.8] tracking-tighter text-center text-[11vw] lg:text-[9rem] bg-clip-text text-transparent bg-gradient-to-b from-white/[0.32] to-white/[0.04]"
          >
            InterviewAce
          </motion.div>
          <div
            className="pointer-events-none absolute inset-0 font-display font-bold leading-[0.8] tracking-tighter text-center text-[11vw] lg:text-[9rem] bg-clip-text text-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              backgroundImage:
                'radial-gradient(200px circle at var(--spot-x) var(--spot-y), #ff8a92, #c9303a 40%, transparent 75%)',
            }}
          >
            InterviewAce
          </div>
        </div>

        {/* Bottom bar */}
        <div className="relative flex flex-col-reverse items-center justify-between gap-4 border-t border-white/[0.1] py-4 sm:flex-row">
          <p className="text-xs text-gray-300">
            &copy; {year} InterviewAce. All rights reserved.
          </p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-200 transition-colors hover:text-white"
          >
            Back to top
            <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-white/25 transition-all duration-300 group-hover:scale-110 group-hover:border-violet-400 group-hover:bg-violet-600 group-hover:shadow-[0_0_20px_rgba(201,48,58,0.7)]">
              <ArrowUp className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-y-6" />
              <ArrowUp className="absolute w-3.5 h-3.5 translate-y-6 transition-transform duration-300 group-hover:translate-y-0" />
            </span>
          </button>
        </div>
      </div>
    </footer>
  );
}
