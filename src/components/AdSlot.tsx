"use client";

import { useEffect, useRef, useState } from "react";
import { ADSENSE, type AdSlotKey } from "@/lib/site";

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

type Props = {
  slot: AdSlotKey;
  /** 광고 위치 설명 (aria-label) */
  label?: string;
  format?: "auto" | "fluid" | "rectangle";
};

/**
 * AdSense 광고 슬롯.
 * - `ADSENSE.slots`에 광고 단위 번호가 없으면 아무것도 그리지 않는다.
 * - adsbygoogle 스크립트가 실제로 로드된 뒤에만 <ins> 를 그리고 push 하므로,
 *   애드센스 미승인/광고 차단 환경에서 빈 박스나 오류가 남지 않는다.
 */
export function AdSlot({ slot, label = "광고", format = "auto" }: Props) {
  const slotId = ADSENSE.slots[slot];
  const [scriptReady, setScriptReady] = useState(false);
  const pushed = useRef(false);

  useEffect(() => {
    if (!slotId) return;
    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const check = () => {
      if (cancelled) return;
      if (Array.isArray(window.adsbygoogle)) {
        setScriptReady(true);
        return;
      }
      if (attempts < 24) {
        attempts += 1;
        timer = setTimeout(check, 500);
      }
    };

    check();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [slotId]);

  useEffect(() => {
    if (!scriptReady || pushed.current) return;
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
      pushed.current = true;
    } catch {
      // 애드센스 스크립트가 막혀 있어도 페이지에는 영향이 없도록 조용히 넘어간다.
    }
  }, [scriptReady]);

  if (!slotId) return null;

  return (
    <aside className="ad" aria-label={label}>
      <span className="ad__label">AD</span>
      {scriptReady ? (
        <ins
          className="adsbygoogle"
          style={{ display: "block", width: "100%" }}
          data-ad-client={ADSENSE.client}
          data-ad-slot={slotId}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      ) : null}
    </aside>
  );
}
