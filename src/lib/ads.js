// Google AdSense configuration. Values come from build-time env vars
// (see .env.example). Ad client and slot ids are public by design.

const CLIENT_RE = /^ca-pub-\d{10,20}$/;
const SLOT_RE = /^\d{6,20}$/;

const pick = (value, re) => (re.test(value || "") ? value : "");

export const ADS = {
  client: pick(import.meta.env.VITE_ADSENSE_CLIENT, CLIENT_RE),
  slots: {
    top: pick(import.meta.env.VITE_ADSENSE_SLOT_TOP, SLOT_RE),
    side: pick(import.meta.env.VITE_ADSENSE_SLOT_SIDE, SLOT_RE),
  },
};

export const adsEnabled = Boolean(ADS.client);

let scriptPromise = null;

/** Loads adsbygoogle.js once. Rejects if it is blocked (ad blockers, offline). */
export function loadAdSense() {
  if (!adsEnabled)
    return Promise.reject(new Error("AdSense is not configured"));
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS.client}`;
    script.onload = resolve;
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("AdSense script was blocked"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}
