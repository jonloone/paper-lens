'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  // Check if content is HTML (starts with < and contains tags)
  const isHTML = content.trim().startsWith('<') && /<[a-z][\s\S]*>/i.test(content);

  // If HTML, render directly with dangerouslySetInnerHTML
  if (isHTML) {
    return (
      <div
        className={cn('prose prose-sm max-w-none', className)}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Track if we just saw "Key Insights" header to style the next paragraph
  const insightFlagRef = React.useRef(false);
  const skipNextParagraph = React.useRef(false);

  return (
    <div className={cn('prose prose-sm max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        // Headers
        h1: ({ children }) => (
          <h1 className="text-xl font-semibold mt-4 mb-2 text-foreground">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-semibold mt-3 mb-2 text-foreground">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-semibold mt-2 mb-1 text-foreground">{children}</h3>
        ),

        // Paragraphs
        p: ({ children }) => {
          // Check if this paragraph contains "Key Insights"
          const childText = React.Children.toArray(children).map(child => {
            if (typeof child === 'string') return child;
            if (React.isValidElement(child) && child.props.children) {
              return React.Children.toArray(child.props.children).join('');
            }
            return '';
          }).join('');

          const containsKeyInsights = childText.includes('Key Insights');

          // If this paragraph contains "Key Insights", hide it and flag next paragraph
          if (containsKeyInsights) {
            insightFlagRef.current = true;
            skipNextParagraph.current = true;
            return null;
          }

          // If this is the paragraph right after "Key Insights"
          const isInsight = insightFlagRef.current && skipNextParagraph.current;
          if (insightFlagRef.current && skipNextParagraph.current) {
            insightFlagRef.current = false;
            skipNextParagraph.current = false;
          }

          return (
            <p className={cn(
              'mb-2 text-foreground',
              isInsight && 'text-4xl font-display leading-snug my-6'
            )}>
              {children}
            </p>
          );
        },

        // Lists
        ul: ({ children }) => (
          <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="text-foreground ml-2">{children}</li>
        ),

        // Code
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter
              style={oneDark}
              language={match[1]}
              PreTag="div"
              className="rounded-lg text-xs my-2"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
              {children}
            </code>
          );
        },

        // Tables
        table: ({ children }) => (
          <div className="overflow-x-auto my-2">
            <table className="min-w-full divide-y divide-border">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-muted/50">{children}</thead>
        ),
        tbody: ({ children }) => (
          <tbody className="divide-y divide-border">{children}</tbody>
        ),
        tr: ({ children }) => (
          <tr>{children}</tr>
        ),
        th: ({ children }) => (
          <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 text-sm text-foreground">{children}</td>
        ),

        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),

        // Blockquotes
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary/50 pl-4 my-2 italic text-muted-foreground">
            {children}
          </blockquote>
        ),

        // Horizontal rules
        hr: () => <hr className="my-4 border-border" />,

        // Strong and emphasis
        strong: ({ children }) => {
          // Check if this is the "Key Insights" header - hide it
          const childText = React.Children.toArray(children).join('');
          const isKeyInsights = childText.includes('Key Insights');

          if (isKeyInsights) {
            insightFlagRef.current = true;
            return null; // Hide the "Key Insights" label
          }

          return (
            <strong className="font-semibold text-foreground">
              {children}
            </strong>
          );
        },
        em: ({ children }) => (
          <em className="italic">{children}</em>
        ),

        // Images
        img: ({ src, alt }) => (
          <img
            src={src}
            alt={alt}
            className="rounded-lg max-w-full h-auto my-2"
          />
        ),
      }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}