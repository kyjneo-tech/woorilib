import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap">
      <div className="notice">
        <p className="eyebrow">404</p>
        <h1 className="notice__title">찾으시는 페이지가 없습니다</h1>
        <p className="notice__desc">
          주소가 바뀌었거나 글이 정리되었을 수 있습니다. 홈에서 전체 글 목록을 확인해 보세요.
        </p>
        <Link className="button" href="/">
          홈으로 가기
        </Link>
      </div>
    </div>
  );
}
