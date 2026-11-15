import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: false });

export type TocItem = {
  id: string;
  text: string;
};

export type RenderedPost = {
  html: string;
  toc: TocItem[];
};

function stripTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Markdown → HTML.
 * - H2 마다 id(sec-1, sec-2…)를 붙이고 같은 순서로 목차를 만든다.
 * - 표는 가로 스크롤 래퍼로 감싼다.
 * - 외부 링크는 새 창에서 열리도록 target/rel 을 붙인다.
 */
export function renderMarkdown(markdown: string): RenderedPost {
  const parsed = marked.parse(markdown, { async: false });
  let html = typeof parsed === "string" ? parsed : "";

  const toc: TocItem[] = [];
  let sectionIndex = 0;

  html = html.replace(/<h2>([\s\S]*?)<\/h2>/g, (_match, inner: string) => {
    sectionIndex += 1;
    const id = `sec-${sectionIndex}`;
    toc.push({ id, text: stripTags(inner) });
    return `<h2 id="${id}">${inner}</h2>`;
  });

  html = html.replace(
    /<h3>([\s\S]*?)<\/h3>/g,
    (_match, inner: string) => `<h3>${inner}</h3>`,
  );

  html = html
    .replace(/<table>/g, '<div class="table-wrap"><table>')
    .replace(/<\/table>/g, "</table></div>")
    .replace(
      /<a href="(https?:\/\/[^"]+)">/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">',
    );

  return { html, toc };
}
