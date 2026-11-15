import type { TocItem } from "@/lib/markdown";

export function TableOfContents({ items }: { items: TocItem[] }) {
  if (items.length < 2) return null;

  return (
    <nav className="toc" aria-labelledby="toc-title">
      <p className="toc__title" id="toc-title">
        이 글에서 다루는 내용
      </p>
      <ol className="toc__list">
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`}>{item.text}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
