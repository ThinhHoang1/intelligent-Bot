
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className="prose prose-sm max-w-none text-gray-800"
      components={{
        a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" />,
        p: ({ node, ...props }) => <p className="mb-2 leading-relaxed" {...props} />,
        ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2" {...props} />,
        li: ({ node, ...props }) => <li className="mb-1" {...props} />,
        h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />,
        h2: ({ node, ...props }) => <h2 className="text-xl font-semibold mt-3 mb-2" {...props} />,
        h3: ({ node, ...props }) => <h3 className="text-lg font-medium mt-2 mb-1" {...props} />,
        code: ({ node, inline, className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <pre className="bg-gray-800 text-white p-2 rounded-md overflow-x-auto my-2 text-sm">
              <code className={`language-${match[1]}`} {...props}>
                {children}
              </code>
            </pre>
          ) : (
            <code className="bg-gray-200 text-red-600 px-1 py-0.5 rounded text-sm" {...props}>
              {children}
            </code>
          );
        },
        table: ({ node, ...props }) => <table className="w-full table-auto border-collapse border border-gray-300 my-2" {...props} />,
        thead: ({ node, ...props }) => <thead className="bg-gray-50" {...props} />,
        th: ({ node, ...props }) => <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200" {...props} />,
        tbody: ({ node, ...props }) => <tbody className="bg-white divide-y divide-gray-200" {...props} />,
        tr: ({ node, ...props }) => <tr className="hover:bg-gray-50" {...props} />,
        td: ({ node, ...props }) => <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border border-gray-200" {...props} />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;
