import { memo, useEffect, useRef, useState } from "react";

import { ADS, adsEnabled, loadAdSense } from "../lib/ads";

// Space is reserved up front so the page doesn't jump when the ad arrives.
const SHAPES = {
  top: { format: "horizontal", box: "min-h-[60px] md:min-h-[90px]" },
  side: { format: "rectangle", box: "min-h-[250px]" },
};

const DEV = import.meta.env.DEV;

/**
 * One responsive Google AdSense display unit.
 *
 *   <AdSlot placement="top" />   banner under the header
 *   <AdSlot placement="side" />  rectangle in the right column
 *
 * Renders nothing when AdSense isn't configured (a labelled placeholder is
 * shown in `npm run dev` so you can check the layout), when the ad is
 * blocked, or when Google has no ad to show.
 */
function AdSlot({ placement, className = "" }) {
  const shape = SHAPES[placement];
  const slot = ADS.slots[placement];
  const insRef = useRef(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (!adsEnabled || !slot) return;
    let cancelled = false;

    loadAdSense()
      .then(() => {
        const ins = insRef.current;
        // Skip if unmounted, or if this <ins> was already filled
        // (React StrictMode runs effects twice in development).
        if (cancelled || !ins || ins.dataset.adsbygoogleStatus) return;
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      })
      .catch(() => {
        if (!cancelled) setBlocked(true);
      });

    return () => {
      cancelled = true;
    };
  }, [slot]);

  if (!shape) return null;

  if (!adsEnabled || !slot) {
    if (!DEV) return null;
    return (
      <div className={className}>
        <div
          className={`${shape.box} grid place-items-center rounded-lg border border-dashed border-neutral-300 p-2 text-center text-xs text-neutral-500 dark:border-neutral-700`}
        >
          Ad slot: {placement} (placeholder, set VITE_ADSENSE_* to enable)
        </div>
      </div>
    );
  }

  if (blocked) return null;

  return (
    <div className={`ad-slot ${className}`}>
      <p className="mb-1 text-center text-[10px] uppercase tracking-wide text-neutral-400">
        Advertisement
      </p>
      <div className={`${shape.box} overflow-hidden`}>
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={ADS.client}
          data-ad-slot={slot}
          data-ad-format={shape.format}
          data-full-width-responsive="true"
          // Test ads in development: no real impressions, no accidental clicks.
          {...(DEV ? { "data-adtest": "on" } : {})}
        />
      </div>
    </div>
  );
}

export default memo(AdSlot);
