import { useMemo, useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

import CustomizePanel from "./components/CustomizePanel";
import PlayerStage from "./components/PlayerStage";
import { decodeConfig, encodeConfig } from "./lib/share";
import { parseYouTubeId, safeHttpUrl, safeHttpsUrl } from "./lib/youtube";

const DEFAULT_CONFIG = {
  url: "",
  title: "",
  color: "#e11d48",
  cover: "",
  endMessage: "",
  ctaLabel: "",
  ctaUrl: "",
};

function readInitialState() {
  const params = new URLSearchParams(window.location.search);
  const shared = decodeConfig(params.get("c") || "");
  return {
    embed: params.get("embed") === "1",
    config: { ...DEFAULT_CONFIG, ...(shared || {}) },
  };
}

export default function App() {
  const [initial] = useState(readInitialState);
  const [config, setConfig] = useState(initial.config);
  const [copied, setCopied] = useState("");

  const videoId = parseYouTubeId(config.url);

  const errors = useMemo(() => {
    const e = {};
    if (config.url.trim() && !videoId)
      e.url = "That doesn't look like a YouTube link.";
    if (config.cover.trim() && !safeHttpsUrl(config.cover))
      e.cover = "Use a full https:// image link.";
    if (config.ctaUrl.trim() && !safeHttpUrl(config.ctaUrl))
      e.ctaUrl = "Use a full http:// or https:// link.";
    return e;
  }, [config, videoId]);

  const origin = window.location.origin + window.location.pathname;
  const encoded = encodeConfig(config);
  const shareUrl = `${origin}?c=${encoded}`;
  const embedUrl = `${origin}?c=${encoded}&embed=1`;
  const embedCode = `<iframe src="${embedUrl}" title="${config.title || "Video player"}" style="width:100%;aspect-ratio:16/9;border:0;border-radius:12px" allow="autoplay; encrypted-media; fullscreen" loading="lazy"></iframe>`;

  const update = (key, value) => setConfig((c) => ({ ...c, [key]: value }));

  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      window.prompt("Copy this:", text);
    }
  };

  const player = (
    <PlayerStage
      videoId={videoId}
      color={config.color}
      cover={config.cover}
      endMessage={config.endMessage}
      ctaLabel={config.ctaLabel}
      ctaUrl={config.ctaUrl}
      fill={initial.embed}
    />
  );

  if (initial.embed) {
    return (
      <div className="h-screen w-screen bg-black">
        {videoId ? player : null}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <span className="text-lg font-semibold">Skarvio</span>
          <span className="text-sm text-neutral-500">
            Customize any YouTube link
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <section>
            <div className="mb-6 ">
              <CustomizePanel
                config={config}
                errors={errors}
                onChange={update}
              />
            </div>
            {videoId ? (
              player
            ) : (
              <div className="grid aspect-video place-items-center rounded-xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700">
                Paste a YouTube link on the right to see your player here.
              </div>
            )}

            {videoId && (
              <div className="mt-6 space-y-4">
                <div>
                  <p className="mb-1 text-sm font-semibold">Share link</p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={shareUrl}
                      className="min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs dark:border-neutral-700 dark:bg-neutral-900"
                    />
                    <button
                      type="button"
                      onClick={() => copy(shareUrl, "link")}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white dark:bg-white dark:text-neutral-900"
                    >
                      {copied === "link" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      {copied === "link" ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                {/* <div>
                  <p className="mb-1 text-sm font-semibold">Embed code</p>
                  <div className="flex gap-2">
                    <textarea
                      readOnly
                      rows={2}
                      value={embedCode}
                      className="min-w-0 flex-1 resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2 font-mono text-xs dark:border-neutral-700 dark:bg-neutral-900"
                    />
                    <button
                      type="button"
                      onClick={() => copy(embedCode, "embed")}
                      className="inline-flex items-center gap-1.5 self-start rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700"
                    >
                      {copied === "embed" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      {copied === "embed" ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <a
                    href={embedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-neutral-500 hover:underline"
                  >
                    Open embed view <ExternalLink className="h-3 w-3" />
                  </a>
                </div> */}
              </div>
            )}
          </section>
          <aside className="lg:sticky lg:top-6 lg:self-start">
            {/* <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Customize
            </h2>
            <CustomizePanel config={config} errors={errors} onChange={update} />
            <p className="mt-6 text-xs text-neutral-500">
              Nothing is stored on a server. Your settings live in the share
              link.
            </p> */}
          </aside>
        </div>
      </main>
    </div>
  );
}
