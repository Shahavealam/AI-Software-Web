"use client";
import { Children, Component, isValidElement, useState, type ReactNode } from "react";
import { Box, Divider, IconButton, Tooltip, Typography } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import TerminalIcon from "@mui/icons-material/Terminal";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const REMARK_PLUGINS = [remarkGfm];
const CODE_BG = "#0d1117";
const INLINE_CODE_BG = "rgba(255,255,255,0.12)";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

function codeTextOf(node: React.ReactNode): string {
  return Children.toArray(node)
    .map((c) => {
      if (typeof c === "string" || typeof c === "number") return String(c);
      if (isValidElement<{ children?: React.ReactNode }>(c)) return codeTextOf(c.props.children);
      return "";
    })
    .join("");
}

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Tooltip title={copied ? "Copied" : "Copy"}>
      <IconButton
        size="small"
        aria-label="Copy"
        onClick={() => {
          setCopied(true);
          try {
            void navigator.clipboard?.writeText(text);
          } catch {
            /* clipboard unavailable */
          }
          setTimeout(() => setCopied(false), 1500);
        }}
        sx={{ color: "text.secondary", p: 0.5, "&:hover": { color: "text.primary" } }}
      >
        {copied ? <CheckIcon sx={{ fontSize: 14 }} /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
      </IconButton>
    </Tooltip>
  );
}

function CodeBlock({ children }: { children?: React.ReactNode }) {
  const codeEl = Children.toArray(children).find(isValidElement) as
    | React.ReactElement<{ className?: string }>
    | undefined;
  const className = codeEl?.props?.className ?? "";
  // Backend fences look like ```python:cli_calculator.py -> class "language-python:cli_calculator.py"
  const raw = /language-([\w:./+-]+)/.exec(className)?.[1] ?? "";
  const [lang, ...rest] = raw.split(":");
  const file = rest.length > 0 ? rest.join(":") : undefined;
  const text = codeTextOf(children);
  return (
    <Box
      component="figure"
      sx={{
        m: 0,
        my: 1.25,
        borderRadius: 2,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: CODE_BG,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1.5,
          py: 0.5,
          backgroundColor: "rgba(255,255,255,0.04)",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <TerminalIcon sx={{ fontSize: 14, color: "text.secondary" }} />
        <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary", letterSpacing: 0.3 }}>
          {file ?? (lang || "code")}
        </Typography>
        {file && lang && (
          <Typography variant="caption" sx={{ color: "text.disabled" }}>
            {lang}
          </Typography>
        )}
        <Box sx={{ flexGrow: 1 }} />
        <CopyButton text={text} />
      </Box>
      <Box
        component="pre"
        sx={{
          m: 0,
          p: 1.5,
          overflowX: "auto",
          fontSize: "0.8rem",
          lineHeight: 1.6,
          fontFamily: MONO,
          color: "#e6edf3",
          "& code": {
            backgroundColor: "transparent !important",
            padding: 0,
            color: "inherit",
            fontFamily: "inherit",
          },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export const mdComponents: Components = {
  pre: CodeBlock,
  code: ({ className, children }) => {
    if (/language-/.test(className ?? "")) return <code className={className}>{children}</code>;
    return (
      <Box
        component="code"
        sx={{
          backgroundColor: INLINE_CODE_BG,
          borderRadius: 1,
          px: 0.75,
          py: 0.25,
          fontSize: "0.85em",
          fontFamily: MONO,
        }}
      >
        {children}
      </Box>
    );
  },
  h1: ({ children }) => (
    <Typography variant="h5" sx={{ fontWeight: 700, mt: 1.5, mb: 0.75, lineHeight: 1.35 }}>
      {children}
    </Typography>
  ),
  h2: ({ children }) => (
    <Typography variant="h6" sx={{ fontWeight: 700, mt: 1.5, mb: 0.75, lineHeight: 1.35 }}>
      {children}
    </Typography>
  ),
  h3: ({ children }) => (
    <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 1.25, mb: 0.5, lineHeight: 1.4 }}>
      {children}
    </Typography>
  ),
  h4: ({ children }) => (
    <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1, mb: 0.5, lineHeight: 1.4 }}>
      {children}
    </Typography>
  ),
  p: ({ children }) => (
    <Typography variant="body2" sx={{ my: 0.75, lineHeight: 1.7 }}>
      {children}
    </Typography>
  ),
  ul: ({ children }) => (
    <Box component="ul" sx={{ my: 0.75, pl: 2.5, "& > li": { mb: 0.25 } }}>
      {children}
    </Box>
  ),
  ol: ({ children }) => (
    <Box component="ol" sx={{ my: 0.75, pl: 2.5, "& > li": { mb: 0.25 } }}>
      {children}
    </Box>
  ),
  li: ({ children }) => (
    <Typography component="li" variant="body2" sx={{ lineHeight: 1.65, "& > p": { m: 0 } }}>
      {children}
    </Typography>
  ),
  blockquote: ({ children }) => (
    <Box
      component="blockquote"
      sx={{
        m: 0,
        my: 1,
        pl: 1.5,
        py: 0.25,
        borderLeft: "3px solid",
        borderColor: "primary.main",
        color: "text.secondary",
        "& > p": { my: 0.5 },
      }}
    >
      {children}
    </Box>
  ),
  table: ({ children }) => (
    <Box sx={{ overflowX: "auto", my: 1.25, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}>
      <Box
        component="table"
        sx={{
          borderCollapse: "collapse",
          width: "100%",
          fontSize: "0.85rem",
          lineHeight: 1.5,
          "& th, & td": {
            borderBottom: "1px solid",
            borderColor: "divider",
            px: 1.5,
            py: 1,
            textAlign: "left",
            verticalAlign: "top",
          },
          "& th": { backgroundColor: "rgba(255,255,255,0.04)", fontWeight: 700 },
          "& tr:last-child td": { borderBottom: 0 },
        }}
      >
        {children}
      </Box>
    </Box>
  ),
  hr: () => <Divider sx={{ my: 1.5 }} />,
  a: ({ children, href }) => (
    <Box
      component="a"
      href={href}
      target="_blank"
      rel="noreferrer"
      sx={{ color: "primary.main", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
    >
      {children}
    </Box>
  ),
};

export default function Markdown({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={mdComponents}>
      {normalizeFences(content)}
    </ReactMarkdown>
  );
}

/**
 * Backend "result" summaries sometimes persist code fences whose newlines
 * are literal backslash-n on a single line, e.g.
 *   ```shell:frontend\nmkdir frontend\n```
 * Markdown requires the closing fence on its own line, so such a fence
 * never closes and swallows the rest of the message into one code block
 * (the persisted summary is also truncated mid-code with no closing fence
 * at all). Repair before rendering:
 *  1. On lines containing a fence marker, expand literal \n to real breaks.
 *     Only fence lines are touched, so prose mentioning "\n" (or code
 *     inside properly closed fences) is left intact.
 *  2. Balance fences: append a closing fence when the count is odd.
 */
export function normalizeFences(content: string): string {
  if (!content.includes("```")) return content;
  let out = content;
  if (out.indexOf("\\n") !== -1) {
    const fixed: string[] = [];
    for (const line of out.split("\n")) {
      if (line.indexOf("```") !== -1 && line.indexOf("\\n") !== -1) {
        for (const part of line.split("\\n")) fixed.push(part);
      } else {
        fixed.push(line);
      }
    }
    out = fixed.join("\n");
  }
  const count = (out.match(/```/g) ?? []).length;
  if (count % 2 === 1) out += "\n```";
  return out;
}

/** A single malformed message must never blank the whole thread. */
export class MarkdownBoundary extends Component<{ content: string; children: ReactNode }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidUpdate(prev: { content: string }) {
    if (prev.content !== this.props.content && this.state.failed) {
      this.setState({ failed: false });
    }
  }

  render() {
    if (this.state.failed) {
      return (
        <Box
          component="pre"
          sx={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            m: 0,
            fontSize: "0.85rem",
            lineHeight: 1.6,
            color: "text.secondary",
          }}
        >
          {this.props.content}
        </Box>
      );
    }
    return this.props.children;
  }
}
