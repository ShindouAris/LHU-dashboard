import { Table } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkToc from "remark-toc";
import remarkBreak from 'remark-breaks'
import "katex/dist/katex.min.css";
import { TableHead, TableCell, TableRow } from "../ui/table";

const katexSanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    div: [
      ...(defaultSchema.attributes?.div || []),
      ['className'],
      ['style'],
      ['aria-hidden'],
      ['aria-label'],
      ['role'],
    ],
    span: [
      ...(defaultSchema.attributes?.span || []),
      ['className'],
      ['style'],
      ['aria-hidden'],
      ['aria-label'],
      ['role'],
    ],
    code: [
      ...(defaultSchema.attributes?.code || []),
      ['className'],
    ],
    pre: [
      ...(defaultSchema.attributes?.pre || []),
      ['className'],
    ],
  },
} as const;
    

export const Message = (message: any, index: number, Part: any) => {
  return (
    <ReactMarkdown key={`${message.id}-streaming-${index}`} 
      remarkPlugins={[remarkGfm, remarkMath, remarkBreak, remarkToc]}
      rehypePlugins={[
        rehypeRaw,
        [rehypeKatex, { output: 'html' }],
        [rehypeSanitize, katexSanitizeSchema],
      ]}
      components={{
        pre({ children }) {
          return <pre className="bg-muted p-2 rounded overflow-auto dark:bg-muted/20">{children}</pre>;
        },
        code( props ) {
          const {children, className, node, ...rest} = props
          const match = /language-(\w+)/.exec(className || '')
          const [copied, setCopied] = useState(false);

          const handleCopy = () => {
            const code = String(children).replace(/\n$/, '');
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }
          return match ? (
            <div className='relative group'>
              <SyntaxHighlighter
              PreTag="div"
              children={String(children).replace(/\n$/, '')}
              language={match[1]}
              style={atomDark}
            />
                  <span className="absolute right-2 top-2 text-xs text-white z-10 flex items-center gap-2">
                  {match[1]}
                  <button
                    className="ml-2 px-2 py-0.5 rounded text-xs bg-purple-600 hover:bg-purple-700 transition-colors opacity-80 hover:opacity-100"
                    onClick={handleCopy}
                    type="button"
                  >
                    {copied ? "✓ Đã sao chép!" : "Sao chép"}
                  </button>
                </span>

            </div>
            
          ) : (
            <code {...rest} className={className}>
              {children}
            </code>
          )
        },                              
        table({ children }) {
          return (
              <Table className="w-full">
                {children}
              </Table>
          );
        },
        thead({ children }) {
          return <thead className="bg-muted/50 dark:bg-muted/20">{children}</thead>;
        },
        th({ children }) {
          return (
            <TableHead className="px-4 py-2 border font-semibold  bg-purple-400 dark:bg-green-600 text-black dark:text-white">
              {children}
            </TableHead>
          );
        },
        td({ children }) {
          return (
            <TableCell className="px-4 py-2 border align-top">
              {children}
            </TableCell>
          );
        },
        tr({ children }) {
          return <TableRow className="bg-pink-300 dark:bg-sky-600 text-black dark:text-white">{children}</TableRow>;
        },
        h2: ({ children }) => (
          <h2 className="mt-8 mb-4 text-2xl font-bold tracking-tight border-b pb-2">
            {children}
          </h2>
        ),
        ul: ({ children }) => (
          <ul className="my-4 ml-6 space-y-2 list-disc">
            {children}
          </ul>
        ),
        li: ({ children }) => (
          <li className="leading-relaxed">
            {children}
          </li>
        ),
        
      }} skipHtml={true}>
      {Part.text}
    </ReactMarkdown>
  )
}
