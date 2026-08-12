import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search } from 'lucide-react';

export const JOB_ROLE_SUGGESTIONS = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Software Engineer',
  'Senior Software Engineer',
  'Staff Software Engineer',
  'Principal Engineer',
  'AI / ML Engineer',
  'Machine Learning Engineer',
  'Data Scientist',
  'Data Engineer',
  'Data Analyst',
  'Business Intelligence Analyst',
  'DevOps Engineer',
  'Site Reliability Engineer',
  'Platform Engineer',
  'Cloud Architect',
  'Solutions Architect',
  'Mobile Developer (iOS)',
  'Mobile Developer (Android)',
  'React Native Developer',
  'Flutter Developer',
  'Embedded Systems Engineer',
  'Blockchain Developer',
  'Web3 Developer',
  'Cybersecurity Engineer',
  'Security Analyst',
  'Penetration Tester',
  'QA Engineer',
  'SDET (Software Dev in Test)',
  'Technical Program Manager',
  'Engineering Manager',
  'Product Manager',
  'UI/UX Designer',
  'Database Administrator',
  'Game Developer',
  'AR/VR Developer',
  'Systems Programmer',
  'Compiler Engineer',
  'Firmware Engineer',
  'Network Engineer',
];

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  id?: string;
}

export default function AutocompleteInput({
  value,
  onChange,
  placeholder = 'e.g., Senior AI Engineer, Data Architect',
  className = '',
  required = false,
  id,
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = value.trim()
    ? JOB_ROLE_SUGGESTIONS.filter((r) =>
        r.toLowerCase().includes(value.toLowerCase())
      )
    : JOB_ROLE_SUGGESTIONS;

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

  const handleSelect = useCallback((role: string) => {
    onChange(role);
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') setIsOpen(true);
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
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && filtered[activeIndex]) {
          handleSelect(filtered[activeIndex]);
        }
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
      {/* Input wrapper */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          className="input-field pl-9 pr-10 w-full"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => {
            setIsOpen((v) => !v);
            inputRef.current?.focus();
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
        >
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </button>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-[9999] w-full mt-2 max-h-64 overflow-y-auto rounded-xl border border-white/10 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(15,15,35,0.98) 0%, rgba(30,20,60,0.98) 100%)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {filtered.map((role, i) => (
              <button
                key={role}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(role);
                }}
                onMouseEnter={() => setActiveIndex(i)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-100 flex items-center gap-2 group ${
                  i === activeIndex
                    ? 'bg-violet-600/30 text-white'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                } ${i === 0 ? 'rounded-t-xl' : ''} ${i === filtered.length - 1 ? 'rounded-b-xl' : ''}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${
                    i === activeIndex ? 'bg-violet-400' : 'bg-gray-600 group-hover:bg-violet-500'
                  }`}
                />
                {highlightMatch(role, value)}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
