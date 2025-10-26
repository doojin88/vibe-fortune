'use client';

import ReactMarkdown from 'react-markdown';

type MarkdownRendererProps = {
  content: string;
};

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-slate max-w-none">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
