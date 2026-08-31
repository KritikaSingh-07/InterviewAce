import React from 'react';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Inline code copy button
function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 py-1.5 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <span className="text-[10px] font-mono font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {lang || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs font-mono leading-relaxed bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/**
 * Lightweight Markdown renderer for AI tutor responses.
 * Handles: headings, bold, italic, inline code, code blocks, bullet/ordered lists, tables, horizontal rules.
 * Strips raw LaTeX artifacts ($$, \text{}, etc.) cleanly.
 */
export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  // 1. Strip LaTeX delimiters and simplify math expressions
  const cleanLatex = (text: string) =>
    text
      .replace(/\$\$[\s\S]*?\$\$/g, (match) =>
        match
          .replace(/\$\$/g, '')
          .replace(/\\text\{([^}]+)\}/g, '$1')
          .replace(/\\[a-zA-Z]+\{([^}]+)\}/g, '$1')
          .replace(/\\[a-zA-Z]+/g, '')
          .trim()
      )
      .replace(/\$([^$]+)\$/g, (_, inner) =>
        inner
          .replace(/\\text\{([^}]+)\}/g, '$1')
          .replace(/\\[a-zA-Z]+\{([^}]+)\}/g, '$1')
          .replace(/\\[a-zA-Z]+/g, '')
          .trim()
      );

  const processedContent = cleanLatex(content);

  // Split into blocks by double newlines, preserving code fences
  const renderBlocks = (raw: string): React.ReactNode[] => {
    const nodes: React.ReactNode[] = [];
    // Split on code fences first
    const codeFenceRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;
    let blockIdx = 0;

    const parts: Array<{ type: 'text' | 'code'; content: string; lang?: string }> = [];

    while ((match = codeFenceRegex.exec(raw)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: raw.slice(lastIndex, match.index) });
      }
      parts.push({ type: 'code', content: match[2].trimEnd(), lang: match[1] });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < raw.length) {
      parts.push({ type: 'text', content: raw.slice(lastIndex) });
    }

    for (const part of parts) {
      if (part.type === 'code') {
        nodes.push(<CodeBlock key={`code-${blockIdx++}`} code={part.content} lang={part.lang} />);
      } else {
        // Process text blocks
        const textBlocks = part.content.split(/\n{2,}/);
        for (const block of textBlocks) {
          const trimmed = block.trim();
          if (!trimmed) continue;

          // Heading detection
          if (/^#{1,6}\s/.test(trimmed)) {
            const level = trimmed.match(/^(#+)/)?.[1].length || 1;
            const text = trimmed.replace(/^#+\s/, '');
            const sizes: Record<number, string> = {
              1: 'text-lg font-extrabold text-gray-900 dark:text-white mt-4 mb-2',
              2: 'text-base font-bold text-gray-800 dark:text-gray-100 mt-3 mb-1.5',
              3: 'text-sm font-bold text-gray-700 dark:text-gray-200 mt-2 mb-1',
              4: 'text-sm font-semibold text-gray-700 dark:text-gray-300 mt-2',
              5: 'text-xs font-semibold text-gray-600 dark:text-gray-400 mt-1',
              6: 'text-xs font-medium text-gray-500 dark:text-gray-500 mt-1',
            };
            nodes.push(
              <p key={blockIdx++} className={sizes[level] || sizes[3]}>
                {inlineRender(text)}
              </p>
            );
            continue;
          }

          // Horizontal rule
          if (/^---+$/.test(trimmed) || /^\*\*\*+$/.test(trimmed)) {
            nodes.push(<hr key={blockIdx++} className="border-gray-200 dark:border-gray-700 my-3" />);
            continue;
          }

          // Table detection
          if (trimmed.includes('|') && trimmed.split('\n').some((l) => /^\|.*\|$/.test(l.trim()))) {
            nodes.push(<TableRenderer key={blockIdx++} raw={trimmed} />);
            continue;
          }

          // Ordered list
          if (/^\d+\.\s/.test(trimmed)) {
            const items = trimmed.split('\n').filter((l) => l.trim());
            nodes.push(
              <ol key={blockIdx++} className="list-decimal list-outside ml-5 space-y-1 my-2">
                {items.map((item, i) => (
                  <li key={i} className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                    {inlineRender(item.replace(/^\d+\.\s/, ''))}
                  </li>
                ))}
              </ol>
            );
            continue;
          }

          // Unordered list
          if (/^[-*+]\s/.test(trimmed) || trimmed.split('\n').some((l) => /^[-*+]\s/.test(l.trim()))) {
            const items = trimmed
              .split('\n')
              .filter((l) => l.trim())
              .map((l) => l.replace(/^[-*+]\s/, '').trim());
            nodes.push(
              <ul key={blockIdx++} className="list-disc list-outside ml-5 space-y-1 my-2">
                {items.map((item, i) => (
                  <li key={i} className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                    {inlineRender(item)}
                  </li>
                ))}
              </ul>
            );
            continue;
          }

          // Regular paragraph (preserve line breaks)
          nodes.push(
            <p key={blockIdx++} className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed my-1.5">
              {trimmed.split('\n').map((line, li) => (
                <React.Fragment key={li}>
                  {li > 0 && <br />}
                  {inlineRender(line)}
                </React.Fragment>
              ))}
            </p>
          );
        }
      }
    }
    return nodes;
  };

  return (
    <div className={`markdown-content ${className}`}>
      {renderBlocks(processedContent)}
    </div>
  );
}

// Render a table
function TableRenderer({ raw }: { raw: string }) {
  const lines = raw.split('\n').filter((l) => l.trim() && l.includes('|'));
  if (lines.length < 2) return <p className="text-xs text-gray-600 dark:text-gray-400">{raw}</p>;

  const parseRow = (line: string) =>
    line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.trim());

  const header = parseRow(lines[0]);
  // lines[1] is the separator row (---)
  const rows = lines.slice(2).map(parseRow);

  return (
    <div className="overflow-x-auto my-3 rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800">
            {header.map((h, i) => (
              <th
                key={i}
                className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700"
              >
                {inlineRender(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              className={ri % 2 === 0 ? 'bg-white dark:bg-gray-950' : 'bg-gray-50 dark:bg-gray-900'}
            >
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                  {inlineRender(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Process inline markdown: bold, italic, inline code, links
function inlineRender(text: string): React.ReactNode {
  if (!text) return null;

  const parts: React.ReactNode[] = [];
  // Regex order matters: code > bold-italic > bold > italic > link
  const regex = /(`[^`]+`|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_|\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  let key = 0;

  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIdx) {
      parts.push(<React.Fragment key={key++}>{text.slice(lastIdx, m.index)}</React.Fragment>);
    }
    const token = m[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={key++} className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 font-mono text-[11px]">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('***') && token.endsWith('***')) {
      parts.push(<strong key={key++}><em>{token.slice(3, -3)}</em></strong>);
    } else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(<strong key={key++} className="font-semibold text-gray-900 dark:text-white">{token.slice(2, -2)}</strong>);
    } else if ((token.startsWith('*') && token.endsWith('*')) || (token.startsWith('_') && token.endsWith('_'))) {
      parts.push(<em key={key++} className="italic">{token.slice(1, -1)}</em>);
    } else if (token.startsWith('[') && m[2] && m[3]) {
      parts.push(
        <a key={key++} href={m[3]} target="_blank" rel="noopener noreferrer"
           className="text-indigo-500 underline hover:text-indigo-700 dark:hover:text-indigo-300">
          {m[2]}
        </a>
      );
    } else {
      parts.push(<React.Fragment key={key++}>{token}</React.Fragment>);
    }
    lastIdx = m.index + token.length;
  }

  if (lastIdx < text.length) {
    parts.push(<React.Fragment key={key++}>{text.slice(lastIdx)}</React.Fragment>);
  }

  return <>{parts}</>;
}
