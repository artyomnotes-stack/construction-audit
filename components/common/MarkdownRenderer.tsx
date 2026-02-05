import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import 'github-markdown-css/github-markdown-light.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  // Preprocess content to fix potential escaped LaTeX delimiters and common AI formatting issues
  const processedContent = content
    .replace(/\\\\\[/g, '$$$$')
    .replace(/\\\\\]/g, '$$$$')
    .replace(/\\\\\(/g, '$$')
    .replace(/\\\\\)/g, '$$')
    // Fix broken AI tables (common mess-ups)
    .replace(/\|\s*\|\s*(:?-+:?)/g, '|\n|$1') // Fix missing newline before separator
    .replace(/([^|\n])\n\|(?!:?-+:?)([^|\n]+\|)+/g, '$1\n\n|$2') // Ensure newline before table header if not already there
    .replace(/(\|(?:\s*[^|\n]+\s*\|)+)\s*(\|(?:\s*[:\-]+\s*\|)+)/g, '$1\n$2') // Ensure newline before separator row
    .replace(/(\|(?:\s*[:\-]+\s*\|)+)\s*(\|(?:\s*[^|\n]+\s*\|)+)/g, '$1\n$2') // Ensure newline after separator row
    .replace(/\|\s*\|\s*/g, '|\n|') // Fix double pipes that should be newlines
    .replace(/^\s*\|\s*\|\s*/gm, '|') // Fix double pipes at start of line
    .replace(/\|\s*\|\s*$/gm, '|')   // Fix double pipes at end of line
    .replace(/^\s*\|[:\-\s|]+\|\s*$/gm, '') // Remove orphaned separator lines if they are not part of a table
    // Clean up only BROKEN or REDUNDANT LaTeX-like notation, but allow valid $...$ formulas
    .replace(/\\([,;!])\s*/g, '$1 ') // Fix LaTeX style character escaping for plain text
    // Remove rogue bolding inside LaTeX if AI does it (common error)
    .replace(/\$\s*\*\*(.*?)\*\*\s*\$/g, '$$$1$$')
    // Remove excessive bolding around LaTeX if it's already bold enough
    .replace(/\b([0-9.,]+)\s*մ\^2\b/g, '$1 մ²')
    .replace(/\b([0-9.,]+)\s*մ\^3\b/g, '$1 մ³')
    // Additional cleaning for nested text
    .replace(/\\mathrm\{([^}]+)\}/g, '$1')
    .replace(/\\quad/g, '  ')
    .replace(/\\textsf\{([^}]+)\}/g, '$1')
    // Aggressively remove rogue bullets before major technical labels
    .replace(/^[*-•]\s+\*\*(Նկարագրություն|Նորմ|Կետ|Կարգավիճակ|Հղում|Լուծում|Առաջարկ|Խնդիր|Բացատրություն)\.\*\*/gm, '**$1.**')
    // Remove bullets that are used as line separators (lone bullets)
    .replace(/^\s*[*-•]\s*$/gm, '\n')
    .replace(/^\s*[*-•]\s*\n/gm, '\n')
    // Ensure headings and table markers have space before them if needed, but keep it tight
    .replace(/([^#])\n# /g, '$1\n\n# ')
    .replace(/([^#])\n## /g, '$1\n\n## ');

  return (
    <div className={`markdown-body book-style-report ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}
        components={{
          h1: ({ node, ...props }) => <h1 className="text-2xl font-black mb-6 pb-2 border-b-2 border-slate-200 armenian-text" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-8 mb-4 armenian-text text-slate-800" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-lg font-bold mt-6 mb-3 armenian-text text-slate-700" {...props} />,
          p: ({ node, ...props }) => <p className="mb-0.5 leading-tight text-slate-700 armenian-text" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-0.5 space-y-0 ml-4" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-0.5 space-y-0 ml-4" {...props} />,
          li: ({ node, ...props }) => <li className="text-slate-700 armenian-text mb-0" {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50/50 my-6 rounded-r-lg italic text-slate-600 armenian-text" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-8">
              <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => <th className="px-4 py-3 bg-slate-50 text-left text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200" {...props} />,
          td: ({ node, ...props }) => <td className="px-4 py-3 text-sm text-slate-600 border-b border-slate-100" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-bold text-slate-900" {...props} />,
        }}
      >
        {processedContent}
      </ReactMarkdown>
      <style>{`
        .book-style-report {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          background-color: transparent !important;
          color: #334155;
          line-height: 1.5;
          padding: 0.5rem;
        }
        .book-style-report h2 {
          color: #1e293b;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 0.25rem;
          margin-top: 1.5rem;
          font-weight: 800;
        }
        .book-style-report h3 {
          color: #334155;
          margin-top: 1rem;
          font-weight: 700;
        }
        .book-style-report hr {
          border: none;
          border-top: 1px solid #e2e8f0;
          margin: 1.5rem 0;
        }
        .book-style-report ul {
          margin-left: 1rem;
          margin-bottom: 0.5rem;
        }
        .book-style-report li {
          margin-bottom: 0.1rem;
        }
        .book-style-report strong {
          color: #0f172a;
        }
        .katex {
          font-size: 1.1em !important;
        }
        .markdown-body {
          box-sizing: border-box;
          min-width: 200px;
          margin: 0 auto;
          font-size: 16px;
        }
        .markdown-body table {
            display: table;
            width: 100%;
            margin: 1rem 0;
            border-collapse: collapse;
        }
        .markdown-body table th, .markdown-body table td {
            padding: 8px 12px;
            border: 1px solid #e2e8f0;
            line-height: 1.3;
        }
        .markdown-body table th {
            background-color: #f8fafc;
            font-weight: 800;
            color: #475569;
        }
      `}</style>
    </div>
  );
};

export default MarkdownRenderer;
