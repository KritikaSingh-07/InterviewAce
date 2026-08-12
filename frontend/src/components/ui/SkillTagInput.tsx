import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus } from 'lucide-react';

export const SKILL_SUGGESTIONS = [
  // Frontend
  'React', 'Vue.js', 'Angular', 'Next.js', 'Nuxt.js', 'Svelte', 'Astro',
  'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Tailwind CSS', 'SASS/SCSS',
  'Redux', 'Zustand', 'React Query', 'GraphQL Client',
  // Backend
  'Node.js', 'Express.js', 'NestJS', 'Fastify',
  'Python', 'Django', 'Flask', 'FastAPI',
  'Java', 'Spring Boot', 'Go', 'Rust', 'C++', 'C#', '.NET', 'Ruby on Rails',
  'PHP', 'Laravel',
  // Database
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch',
  'Firebase', 'Supabase', 'Prisma', 'SQLite',
  // Cloud & DevOps
  'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Terraform', 'Ansible',
  'GitHub Actions', 'Jenkins', 'CI/CD', 'Linux', 'Nginx',
  // APIs & Protocols
  'REST API', 'GraphQL', 'gRPC', 'WebSockets', 'OAuth 2.0',
  // AI/ML
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch',
  'scikit-learn', 'Pandas', 'NumPy', 'LangChain', 'OpenAI API',
  // General
  'Git', 'System Design', 'DSA', 'Microservices', 'Agile', 'Scrum',
];

// Curated color palette for chips
const CHIP_COLORS = [
  { bg: 'rgba(99,102,241,0.25)', border: 'rgba(139,92,246,0.5)', text: '#a78bfa' },   // indigo-violet
  { bg: 'rgba(16,185,129,0.2)',  border: 'rgba(5,150,105,0.5)',  text: '#34d399' },   // emerald
  { bg: 'rgba(245,158,11,0.2)',  border: 'rgba(217,119,6,0.5)',  text: '#fbbf24' },   // amber
  { bg: 'rgba(59,130,246,0.2)',  border: 'rgba(37,99,235,0.5)',  text: '#60a5fa' },   // blue
  { bg: 'rgba(236,72,153,0.2)',  border: 'rgba(219,39,119,0.5)', text: '#f472b6' },   // pink
  { bg: 'rgba(20,184,166,0.2)',  border: 'rgba(13,148,136,0.5)', text: '#2dd4bf' },   // teal
  { bg: 'rgba(139,92,246,0.2)',  border: 'rgba(124,58,237,0.5)', text: '#c084fc' },   // purple
  { bg: 'rgba(249,115,22,0.2)',  border: 'rgba(234,88,12,0.5)',  text: '#fb923c' },   // orange
];

function getChipColor(skill: string) {
  // Deterministic color based on skill name so same skill always gets same color
  let hash = 0;
  for (let i = 0; i < skill.length; i++) {
    hash = skill.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CHIP_COLORS[Math.abs(hash) % CHIP_COLORS.length];
}

interface SkillTagInputProps {
  skills: string[];
  onChange: (skills: string[]) => void;
  placeholder?: string;
  className?: string;
}

export default function SkillTagInput({
  skills,
  onChange,
  placeholder = '+ Add skills (comma separated)',
  className = '',
}: SkillTagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = inputValue.trim()
    ? SKILL_SUGGESTIONS.filter(
        (s) =>
          s.toLowerCase().includes(inputValue.toLowerCase()) &&
          !skills.includes(s)
      )
    : SKILL_SUGGESTIONS.filter((s) => !skills.includes(s)).slice(0, 20);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addSkill = useCallback(
    (skill: string) => {
      const trimmed = skill.trim();
      if (trimmed && !skills.includes(trimmed)) {
        onChange([...skills, trimmed]);
      }
      setInputValue('');
      setIsOpen(false);
      setActiveIndex(-1);
      inputRef.current?.focus();
    },
    [skills, onChange]
  );

  const removeSkill = useCallback(
    (skill: string) => {
      onChange(skills.filter((s) => s !== skill));
    },
    [skills, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (activeIndex >= 0 && filtered[activeIndex]) {
        addSkill(filtered[activeIndex]);
      } else if (inputValue.trim()) {
        addSkill(inputValue.replace(',', '').trim());
      }
      return;
    }
    if (e.key === 'Backspace' && !inputValue && skills.length > 0) {
      removeSkill(skills[skills.length - 1]);
      return;
    }
    if (!isOpen) {
      if (e.key === 'ArrowDown') {
        setIsOpen(true);
        setActiveIndex(0);
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, -1));
        break;
      case 'Escape':
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return <span>{text}</span>;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return <span>{text}</span>;
    return (
      <>
        <span>{text.slice(0, idx)}</span>
        <span className="text-violet-400 font-semibold">{text.slice(idx, idx + query.length)}</span>
        <span>{text.slice(idx + query.length)}</span>
      </>
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Tag + Input container */}
      <div
        className="input-field min-h-[48px] flex flex-wrap gap-2 items-center cursor-text py-2 px-3"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Rendered skill chips */}
        <AnimatePresence mode="popLayout">
          {skills.map((skill) => {
            const color = getChipColor(skill);
            return (
              <motion.span
                key={skill}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.15, type: 'spring', stiffness: 400, damping: 25 }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold flex-shrink-0 select-none"
                style={{
                  background: color.bg,
                  border: `1px solid ${color.border}`,
                  color: color.text,
                }}
              >
                {skill}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSkill(skill);
                  }}
                  className="hover:opacity-70 transition-opacity ml-0.5 flex-shrink-0"
                  style={{ color: color.text }}
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.span>
            );
          })}
        </AnimatePresence>

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={skills.length === 0 ? placeholder : ''}
          autoComplete="off"
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-gray-200 placeholder:text-gray-500"
        />
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-[9999] w-full bottom-full mb-2 max-h-56 overflow-y-auto rounded-xl border border-white/10 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(15,15,35,0.98) 0%, rgba(30,20,60,0.98) 100%)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="p-1">
              {filtered.map((skill, i) => {
                const color = getChipColor(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      addSkill(skill);
                    }}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-100 flex items-center gap-2.5 group ${
                      i === activeIndex ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    {/* Color dot preview */}
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: color.text, boxShadow: `0 0 6px ${color.text}80` }}
                    />
                    <span className="text-gray-300">{highlightMatch(skill, inputValue)}</span>
                    <Plus
                      className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: color.text }}
                    />
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
