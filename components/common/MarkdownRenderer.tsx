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
    // Clean up common AI mess-ups where it uses LaTeX for simple units even when told not to
    .replace(/\$\s*\\text\{([^}]+)\}\^2\s*\$/g, '$1²')
    .replace(/\$\s*\\text\{([^}]+)\}\^3\s*\$/g, '$1³')
    .replace(/\$\s*\\text\{([^}]+)\}\s*\$/g, '$1')
    .replace(/\$\s*([^$]+)\^2\s*\$/g, '$1²')
    .replace(/\$\s*([^$]+)\^3\s*\$/g, '$1³')
    .replace(/\$\s*([0-9.,]+)\s*\\\s*text\{([^}]+)\}\s*\$/g, '$1 $2')
    .replace(/\$\s*\\circ\s*C\s*\$/g, '°C')
    .replace(/\$\s*([^$]+)\^\\circ\s*C\s*\$/g, '$1°C')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\([,;!])\s*/g, '$1 ') // Fix LaTeX style character escaping
    .replace(/\$([0-9.,]+)\s*մ\^2\$/g, '**$1 մ²**')
    .replace(/\$([0-9.,]+)\s*մ\^3\$/g, '**$1 մ³**')
    .replace(/\$([0-9.,]+)\s*մ\$/g, '**$1 մ**')
    .replace(/\$([0-9.,]+)\$/g, '$1')
    // Additional cleaning for nested text or weird artifacts
    .replace(/\\mathrm\{([^}]+)\}/g, '$1')
    .replace(/\\quad/g, '  ')
    .replace(/\\textsf\{([^}]+)\}/g, '$1');

  return (
    <div className={`markdown-body book-style-report ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}
        components={{
          h1: ({ node, ...props }) => <h1 className="text-2xl font-black mb-6 pb-2 border-b-2 border-slate-200 armenian-text" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-8 mb-4 armenian-text text-slate-800" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-lg font-bold mt-6 mb-3 armenian-text text-slate-700" {...props} />,
          p: ({ node, ...props }) => <p className="mb-4 leading-relaxed text-slate-700 armenian-text" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 space-y-2 ml-4" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 space-y-2 ml-4" {...props} />,
          li: ({ node, ...props }) => <li className="text-slate-700 armenian-text" {...props} />,
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
          line-height: 1.8;
          padding: 1rem;
        }
        .book-style-report h2 {
          color: #1e293b;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 0.5rem;
          margin-top: 2.5rem;
          font-weight: 800;
        }
        .book-style-report h3 {
          color: #334155;
          margin-top: 1.75rem;
          font-weight: 700;
        }
        .book-style-report hr {
          border: none;
          border-top: 1px solid #e2e8f0;
          margin: 2rem 0;
        }
        .book-style-report ul {
          margin-left: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .book-style-report li {
          margin-bottom: 0.75rem;
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
            margin: 2rem 0;
        }
      `}</style>
    </div>
  );
};

export default MarkdownRenderer;
