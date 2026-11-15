import Image from "next/image";
import Link from "next/link";
import { formatKoreanDate, type Post } from "@/lib/posts";

type Props = {
  post: Post;
  /** 대표 글은 이미지를 크게 */
  featured?: boolean;
};

export function PostCard({ post, featured = false }: Props) {
  return (
    <article className={featured ? "card card--featured" : "card"}>
      <Link href={`/posts/${post.slug}`} className="card__cover" tabIndex={-1} aria-hidden="true">
        <Image
          src={post.cover}
          alt=""
          width={1200}
          height={630}
          sizes={featured ? "(max-width: 720px) 100vw, 720px" : "(max-width: 720px) 100vw, 380px"}
          className="card__image"
          priority={featured}
        />
      </Link>
      <div className="card__body">
        <Link href={`/category/${post.category.slug}`} className="badge">
          {post.category.label}
        </Link>
        <h3 className="card__title">
          <Link href={`/posts/${post.slug}`}>{post.title}</Link>
        </h3>
        <p className="card__desc">{post.description}</p>
        <p className="card__meta">
          <time dateTime={post.date}>{formatKoreanDate(post.date)}</time>
          <span aria-hidden="true">·</span>
          <span>{post.readingMinutes}분 읽기</span>
        </p>
      </div>
    </article>
  );
}
