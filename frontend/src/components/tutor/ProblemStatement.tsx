import React from 'react';

export interface ProblemExample {
  input?: string;
  output?: string;
  explanation?: string;
}

export interface ProblemStatementProps {
  description?: string;
  inputFormat?: string;
  outputFormat?: string;
  constraints?: string;
  examples?: ProblemExample[];
  note?: string;
}

// Fix character encoding corruption issues
const fixCorruptedCharacters = (text: string = ''): string => {
  return text
    .replace(/â€”/g, '—')
    .replace(/â€“/g, '–')
    .replace(/â•â•/g, '║')
    .replace(/â†’/g, '→')
    .replace(/â€¦/g, '…')
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '“')
    .replace(/â€/g, '”')
    .replace(/â€/g, '”')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n');
};

// Replace standard LaTeX math notation commands with clean Unicode
const cleanLatexMath = (text: string = ''): string => {
  return text
    .replace(/\\le/g, '≤')
    .replace(/\\ge/g, '≥')
    .replace(/\\ne/g, '≠')
    .replace(/\\times/g, '×')
    .replace(/\\to/g, '→')
    .replace(/\\dots/g, '…')
    .replace(/\\ldots/g, '…')
    .replace(/\\cdot/g, '·')
    .replace(/\\pm/g, '±')
    .replace(/\\approx/g, '≈')
    .replace(/\\neq/g, '≠')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\mathrm\{([^}]+)\}/g, '$1')
    .replace(/\^\{([^}]+)\}/g, (_, inner) => {
      const superscripts: Record<string, string> = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
        '+': '⁺', '-': '⁻', '=': '⁼', 'n': 'ⁿ', 'i': 'ⁱ'
      };
      if (/^[0-9+\-ni]+$/.test(inner)) {
        return inner.split('').map((c: string) => superscripts[c] || c).join('');
      }
      return `^${inner}`;
    })
    .replace(/\^([0-9ni])/g, (_, digit) => {
      const superscripts: Record<string, string> = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
        'n': 'ⁿ', 'i': 'ⁱ'
      };
      return superscripts[digit] || `^${digit}`;
    });
};

// Double-insurance runtime cleanup of leftover section headers
const stripSectionMarkers = (text: string = ''): string => {
  return text
    .split('\n')
    .filter(line => {
      const cleaned = line
        .replace(/^[#>*\s\-+=_~]+/, '')
        .replace(/[#>*\s\-+=_~]+$/, '')
        .replace(/:$/, '')
        .trim()
        .toLowerCase();

      if (!cleaned) return true;

      // Filter out lines that look strictly like section markers
      if (
        cleaned === 'input' ||
        cleaned === 'input format' ||
        cleaned === 'input specification' ||
        cleaned === 'output' ||
        cleaned === 'output format' ||
        cleaned === 'output specification' ||
        cleaned === 'constraints' ||
        cleaned === 'constraint' ||
        cleaned === 'examples' ||
        cleaned === 'example' ||
        cleaned === 'sample input' ||
        cleaned === 'sample output' ||
        cleaned === 'note' ||
        cleaned === 'notes' ||
        cleaned === 'explanation' ||
        /^sample\s+input\s*\d*$/.test(cleaned) ||
        /^sample\s+output\s*\d*$/.test(cleaned) ||
        /^example\s+input\s*\d*$/.test(cleaned) ||
        /^example\s+output\s*\d*$/.test(cleaned) ||
        /^explanation\s*\d*$/.test(cleaned)
      ) {
        return false;
      }
      return true;
    })
    .join('\n')
    .trim();
};

// Format and render inline elements: bold, italic, inline code, and mathematical expressions
const inlineRender = (text: string): React.ReactNode => {
  if (!text) return null;

  const cleanVal = fixCorruptedCharacters(text);
  const parts: React.ReactNode[] = [];
  const regex = /(`[^`]+`|\$\$.*?\$\$|\$.*?\$|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_)/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  let key = 0;

  while ((m = regex.exec(cleanVal)) !== null) {
    if (m.index > lastIdx) {
      parts.push(<React.Fragment key={key++}>{cleanVal.slice(lastIdx, m.index)}</React.Fragment>);
    }
    const token = m[0];

    if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={key++}
          className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 font-mono text-[0.9em] break-words"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('$') && token.endsWith('$')) {
      const isDouble = token.startsWith('$$') && token.endsWith('$$');
      const inner = isDouble ? token.slice(2, -2) : token.slice(1, -1);
      const formattedMath = cleanLatexMath(inner);
      parts.push(
        <span
          key={key++}
          className="font-mono text-gray-800 dark:text-gray-200 italic font-medium px-0.5"
        >
          {formattedMath}
        </span>
      );
    } else if (token.startsWith('***') && token.endsWith('***')) {
      parts.push(<strong key={key++}><em>{token.slice(3, -3)}</em></strong>);
    } else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(<strong key={key++} className="font-semibold text-gray-900 dark:text-white">{token.slice(2, -2)}</strong>);
    } else if ((token.startsWith('*') && token.endsWith('*')) || (token.startsWith('_') && token.endsWith('_'))) {
      parts.push(<em key={key++} className="italic">{token.slice(1, -1)}</em>);
    } else {
      parts.push(<React.Fragment key={key++}>{token}</React.Fragment>);
    }
    lastIdx = m.index + token.length;
  }

  if (lastIdx < cleanVal.length) {
    parts.push(<React.Fragment key={key++}>{cleanVal.slice(lastIdx)}</React.Fragment>);
  }

  return <>{parts}</>;
};

// Segment and render paragraphs
const renderParagraphs = (text: string = '') => {
  const cleaned = stripSectionMarkers(fixCorruptedCharacters(text));
  if (!cleaned) return null;

  return cleaned
    .split(/\n{2,}/)
    .map((paragraph, index) => {
      const value = paragraph.trim();
      if (!value) return null;

      return (
        <p
          key={index}
          className="text-gray-700 dark:text-gray-300 leading-7 text-[13px] mb-4"
        >
          {inlineRender(value)}
        </p>
      );
    });
};

export default function ProblemStatement({
  description,
  inputFormat,
  outputFormat,
  constraints,
  examples = [],
  note,
}: ProblemStatementProps) {

  // Format constraints line by line
  const renderConstraints = (text: string = '') => {
    const cleaned = stripSectionMarkers(fixCorruptedCharacters(text));
    if (!cleaned) return null;

    const lines = cleaned
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) return null;

    return (
      <section className="space-y-3">
        <h3 className="text-sm font-bold text-gray-950 dark:text-gray-50">
          Constraints
        </h3>
        <div className="bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
          <ul className="space-y-2">
            {lines.map((line, index) => {
              const value = line.replace(/^[-*•]\s*/, '').trim();
              return (
                <li
                  key={index}
                  className="flex items-start gap-2.5 text-[12px] text-gray-600 dark:text-gray-400 leading-6"
                >
                  <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                  <span>
                    {inlineRender(value)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    );
  };

  const hasDescription = description && description.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Problem Description */}
      <section>
        {hasDescription ? (
          <div>{renderParagraphs(description)}</div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 italic text-[13px]">
            Problem statement unavailable.
          </p>
        )}
      </section>

      {/* Input format specs */}
      {inputFormat && inputFormat.trim().length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-gray-950 dark:text-gray-50">
            Input
          </h3>
          <div className="text-[13px] text-gray-700 dark:text-gray-300 leading-7">
            {renderParagraphs(inputFormat)}
          </div>
        </section>
      )}

      {/* Output format specs */}
      {outputFormat && outputFormat.trim().length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-gray-950 dark:text-gray-50">
            Output
          </h3>
          <div className="text-[13px] text-gray-700 dark:text-gray-300 leading-7">
            {renderParagraphs(outputFormat)}
          </div>
        </section>
      )}

      {/* Examples list */}
      {examples.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-gray-950 dark:text-gray-50">
            Examples
          </h3>
          <div className="space-y-4">
            {examples.map((example, index) => {
              const cleanedInput = fixCorruptedCharacters(example.input || '');
              const cleanedOutput = fixCorruptedCharacters(example.output || '');

              return (
                <div
                  key={index}
                  className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-950/40 p-4 space-y-3"
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-500">
                    Example {index + 1}
                  </p>

                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-1">
                        Input
                      </span>
                      <pre className="overflow-x-auto bg-white dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800/80 rounded-lg p-3 font-mono text-[11px] leading-relaxed text-gray-800 dark:text-gray-200">
                        <code>{cleanedInput}</code>
                      </pre>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-1">
                        Output
                      </span>
                      <pre className="overflow-x-auto bg-white dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800/80 rounded-lg p-3 font-mono text-[11px] leading-relaxed text-gray-800 dark:text-gray-200">
                        <code>{cleanedOutput}</code>
                      </pre>
                    </div>

                    {example.explanation && example.explanation.trim().length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-1">
                          Explanation
                        </span>
                        <p className="text-[12px] text-gray-600 dark:text-gray-400 leading-relaxed italic bg-white dark:bg-gray-900/60 p-3 rounded-lg border border-gray-100 dark:border-gray-800/80">
                          {inlineRender(example.explanation)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Constraints section */}
      {constraints && constraints.trim().length > 0 && renderConstraints(constraints)}

      {/* Note section */}
      {note && note.trim().length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-gray-950 dark:text-gray-50">
            Note
          </h3>
          <div className="text-[12px] text-amber-800 dark:text-amber-300 leading-relaxed bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 p-3 rounded-r-lg">
            {inlineRender(note)}
          </div>
        </section>
      )}
    </div>
  );
}
