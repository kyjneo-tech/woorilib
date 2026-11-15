import type { Metadata } from "next";
import Link from "next/link";
import { ADSENSE, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description:
    "우리집 라이브러리가 처리하는 개인정보 항목, 쿠키와 Google AdSense 광고, 이용자의 권리와 문의 방법을 안내합니다.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

const EFFECTIVE_DATE = "2026-11-15";

export default function PrivacyPage() {
  return (
    <div className="wrap">
      <section className="page-head">
        <nav className="crumbs" aria-label="현재 위치" style={{ padding: 0 }}>
          <Link href="/">홈</Link>
          <span className="crumbs__sep" aria-hidden="true">
            /
          </span>
          <span aria-current="page">개인정보처리방침</span>
        </nav>
        <h1 className="page-head__title">개인정보처리방침</h1>
        <p className="page-head__desc">
          {SITE.name}(이하 “사이트”)는 이용자의 개인정보를 소중히 다루며, 어떤 정보를 어떤 목적으로
          처리하는지 아래와 같이 알립니다. 시행일: {EFFECTIVE_DATE}
        </p>
      </section>

      <div className="doc">
        <h2>1. 수집하는 개인정보 항목</h2>
        <p>
          사이트는 회원가입, 댓글, 게시판 기능을 운영하지 않습니다. 따라서 이름·전화번호·주민등록번호
          등 이용자를 식별할 수 있는 개인정보를 직접 수집하지 않습니다.
        </p>
        <p>
          다만 사이트를 열람하는 과정에서 아래 정보가 자동으로 생성되어 처리될 수 있습니다.
        </p>
        <ul>
          <li>접속 기록: 접속 IP 주소, 브라우저·기기 정보, 요청한 페이지, 접속 시각</li>
          <li>쿠키 및 이와 유사한 기술로 생성되는 광고·통계 식별자</li>
        </ul>

        <h2>2. 개인정보의 처리 목적</h2>
        <ul>
          <li>사이트 접속과 페이지 제공, 보안 유지 및 오류 대응</li>
          <li>광고 게재 및 광고 성과 측정</li>
          <li>이용 문의에 대한 응답</li>
        </ul>

        <h2>3. 보유 및 이용 기간</h2>
        <p>
          사이트는 개인정보를 별도로 저장하는 데이터베이스를 운영하지 않습니다. 접속 기록은 사이트
          호스팅 사업자(예: Vercel)의 정책에 따라 서비스 운영·보안 목적으로 일정 기간 보관될 수
          있으며, 보관 기간이 지나면 삭제됩니다. 이용자가 문의 과정에서 자발적으로 제공한 정보는
          문의 처리 완료 후 지체 없이 파기합니다.
        </p>

        <h2>4. 쿠키 및 제3자 광고</h2>
        <p>
          사이트는 Google AdSense를 통해 광고를 게재합니다. 게시자 ID는{" "}
          <code>{ADSENSE.publisherId}</code>입니다.
        </p>
        <ul>
          <li>
            Google을 비롯한 제3자 판매업체는 이용자가 이 사이트 또는 다른 사이트를 방문한 기록을
            바탕으로 광고를 게재하기 위해 쿠키를 사용할 수 있습니다.
          </li>
          <li>
            Google은 광고 쿠키를 사용하여 이용자가 본 사이트 및 다른 사이트 방문 기록에 기반한
            광고를 게재합니다. 이용자는{" "}
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google 광고 설정
            </a>
            에서 맞춤 광고를 사용 중지할 수 있습니다.
          </li>
          <li>
            제3자 판매업체의 맞춤 광고 사용 중지에 관한 자세한 내용은{" "}
            <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer">
              aboutads.info
            </a>
            에서 확인할 수 있습니다.
          </li>
          <li>
            Google의 데이터 처리 방식은{" "}
            <a
              href="https://policies.google.com/technologies/partner-sites"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google 파트너 사이트 정책
            </a>
            에서 안내합니다.
          </li>
        </ul>
        <p>
          이용자는 브라우저 설정에서 쿠키 저장을 거부하거나 삭제할 수 있습니다. 다만 쿠키를 차단하면
          일부 광고가 이용자의 관심과 무관하게 표시될 수 있습니다.
        </p>

        <h2>5. 개인정보의 제3자 제공 및 처리 위탁</h2>
        <p>
          사이트는 이용자의 개인정보를 제3자에게 판매하거나 제공하지 않습니다. 다만 서비스 운영에
          필요한 범위에서 아래 사업자의 서비스를 이용합니다.
        </p>
        <ul>
          <li>호스팅 및 콘텐츠 전송: Vercel Inc. (사이트 접속 로그 처리)</li>
          <li>광고 게재: Google LLC (광고 쿠키 및 광고 성과 측정)</li>
          <li>웹폰트·정적 자원 전송: jsDelivr, Google Fonts</li>
        </ul>

        <h2>6. 이용자의 권리</h2>
        <p>
          이용자는 자신에 관한 개인정보의 열람·정정·삭제·처리정지를 요구할 수 있습니다. 사이트가
          직접 보관하는 개인정보가 없는 경우에는 해당 사실을 안내해 드립니다. 요청은 아래 문의
          채널로 접수해 주시면 지체 없이 처리합니다.
        </p>

        <h2>7. 아동의 개인정보</h2>
        <p>
          사이트는 만 14세 미만 아동으로부터 개인정보를 수집하지 않습니다. 사이트의 글에는 특정
          아동의 실명·사진 등 개인을 식별할 수 있는 정보를 싣지 않습니다.
        </p>

        <h2>8. 개인정보 보호책임자 및 문의</h2>
        <p>
          개인정보 처리에 관한 문의, 불만 처리, 권리 행사는 사이트 운영자에게 요청할 수 있습니다.
        </p>
        <ul>
          <li>운영: {SITE.name} ({SITE.url})</li>
          <li>개인정보 보호책임자: {SITE.name} 운영자</li>
          <li>문의: 사이트 운영 채널을 통해 접수</li>
        </ul>

        <h2>9. 고지 의무</h2>
        <p>
          이 방침의 내용이 추가·삭제·수정될 경우 시행 전에 이 페이지를 통해 알리며, 중요한 변경이
          있는 경우에는 변경 사항과 시행일을 함께 표시합니다.
        </p>
      </div>
    </div>
  );
}
