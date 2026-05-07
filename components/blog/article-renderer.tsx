import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

type Props = {
  markdown: string;
  className?: string;
};

export function ArticleRenderer({ markdown, className }: Props) {
  return (
    <div className={cn("space-y-6", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (props) => (
            <h1 className="heading-2 mt-12 mb-4" {...props} />
          ),
          h2: (props) => (
            <h2 className="heading-2 mt-12 mb-4" {...props} />
          ),
          h3: (props) => (
            <h3 className="heading-3 mt-10 mb-3" {...props} />
          ),
          p: (props) => (
            <p
              className="text-base md:text-lg leading-relaxed text-foreground/90"
              {...props}
            />
          ),
          ul: (props) => (
            <ul
              className="list-disc list-outside pl-6 space-y-2.5 marker:text-muted-foreground"
              {...props}
            />
          ),
          ol: (props) => (
            <ol
              className="list-decimal list-outside pl-6 space-y-2.5 marker:font-mono marker:text-muted-foreground"
              {...props}
            />
          ),
          li: (props) => (
            <li
              className="text-base md:text-lg leading-relaxed text-foreground/90"
              {...props}
            />
          ),
          a: ({ href, ...rest }) => (
            <a
              href={href}
              className="text-foreground underline decoration-brand decoration-2 underline-offset-4 hover:decoration-brand/60"
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
              {...rest}
            />
          ),
          blockquote: (props) => (
            <blockquote
              className="rounded-2xl border-l-4 border-brand bg-muted/40 px-6 py-5 text-lg md:text-xl italic leading-relaxed text-foreground"
              {...props}
            />
          ),
          code: ({ className, children, ...rest }) => {
            const isBlock = className?.includes("language-");
            if (!isBlock) {
              return (
                <code
                  className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm"
                  {...rest}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className="font-mono text-sm leading-relaxed" {...rest}>
                {children}
              </code>
            );
          },
          pre: (props) => (
            <pre
              className="rounded-2xl border border-border bg-zinc-950 text-zinc-100 p-5 overflow-x-auto"
              {...props}
            />
          ),
          hr: () => <hr className="my-10 border-border" />,
          img: ({ alt, src, ...rest }) =>
            typeof src === "string" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={alt ?? ""}
                className="rounded-xl border border-border w-full"
                {...rest}
              />
            ) : null,
          table: (props) => (
            <div className="overflow-x-auto">
              <table
                className="w-full border-collapse text-sm"
                {...props}
              />
            </div>
          ),
          th: (props) => (
            <th
              className="text-left font-semibold border-b border-border py-2 px-3"
              {...props}
            />
          ),
          td: (props) => (
            <td
              className="border-b border-border/60 py-2 px-3 align-top"
              {...props}
            />
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
