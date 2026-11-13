import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Maximize,
    Minimize,
    Pause,
    Play,
    RotateCcw,
    Volume2,
    VolumeX,
} from "lucide-react";

import { safeHttpUrl, safeHttpsUrl, thumbnailUrl } from "../lib/youtube";

// YouTube player states reported through the iframe API.
const ENDED = 0;
const PLAYING = 1;
const BUFFERING = 3;
const IDLE_MS = 2500;

const formatTime = (seconds) => {
    const total = Math.floor(seconds || 0);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = String(total % 60).padStart(2, "0");
    return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
};

const fullscreenElement = () =>
    document.fullscreenElement || document.webkitFullscreenElement || null;

const canFullscreen = () =>
    typeof document !== "undefined" &&
    Boolean(document.fullscreenEnabled || document.webkitFullscreenEnabled);

export default function PlayerStage({
    videoId,
    color = "#e11d48",
    cover = "",
    endMessage = "",
    ctaLabel = "",
    ctaUrl = "",
    fill = false,
}) {
    const boxRef = useRef(null);
    const iframeRef = useRef(null);
    const idleTimer = useRef(null);

    const [started, setStarted] = useState(false);
    const [ytState, setYtState] = useState(-1);
    const [time, setTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [muted, setMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [active, setActive] = useState(true);

    const isPlaying = ytState === PLAYING;
    const hasEnded = ytState === ENDED;

    // Reset playback when a different video is loaded.
    useEffect(() => {
        setStarted(false);
        setYtState(-1);
        setTime(0);
        setDuration(0);
        setMuted(false);
    }, [videoId]);

    const send = useCallback((func, args = []) => {
        iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ event: "command", func, args }),
            "*",
        );
    }, []);

    // Receive playback state and progress from the YouTube iframe.
    useEffect(() => {
        const onMessage = (event) => {
            if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return;
            let message;
            try {
                message = JSON.parse(event.data);
            } catch {
                return;
            }
            if (message.event === "onStateChange") setYtState(message.info);
            if (message.event === "infoDelivery" && message.info) {
                const info = message.info;
                if (info.duration) setDuration(info.duration);
                if (typeof info.currentTime === "number") setTime(info.currentTime);
                if (info.playerState != null) setYtState(info.playerState);
            }
        };
        window.addEventListener("message", onMessage);
        return () => window.removeEventListener("message", onMessage);
    }, []);

    // Keep the fullscreen button icon in sync with the browser state.
    useEffect(() => {
        const sync = () => setIsFullscreen(fullscreenElement() === boxRef.current);
        document.addEventListener("fullscreenchange", sync);
        document.addEventListener("webkitfullscreenchange", sync);
        return () => {
            document.removeEventListener("fullscreenchange", sync);
            document.removeEventListener("webkitfullscreenchange", sync);
        };
    }, []);

    useEffect(() => () => clearTimeout(idleTimer.current), []);

    // Controls stay visible while paused and fade away during playback.
    const wake = useCallback(() => {
        setActive(true);
        clearTimeout(idleTimer.current);
        idleTimer.current = setTimeout(() => setActive(false), IDLE_MS);
    }, []);

    const iframeSrc = useMemo(() => {
        if (!started || !videoId) return "";
        const origin = window.location.origin.startsWith("http")
            ? "&origin=" + encodeURIComponent(window.location.origin)
            : "";
        return (
            "https://www.youtube-nocookie.com/embed/" +
            encodeURIComponent(videoId) +
            "?autoplay=1&controls=0&rel=0&modestbranding=1&playsinline=1" +
            "&iv_load_policy=3&disablekb=1&fs=0&enablejsapi=1" +
            origin
        );
    }, [started, videoId]);

    const handleIframeLoad = () => {
        iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ event: "listening", id: 1, channel: "widget" }),
            "*",
        );
    };

    const start = () => {
        setStarted(true);
        setYtState(BUFFERING);
        wake();
    };

    const togglePlay = () => {
        if (!started) return start();
        wake();
        send(isPlaying ? "pauseVideo" : "playVideo");
    };

    const toggleMute = () => {
        const next = !muted;
        setMuted(next);
        send(next ? "mute" : "unMute");
    };

    const seek = (event) => {
        if (!duration) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const target = ((event.clientX - rect.left) / rect.width) * duration;
        setTime(target);
        send("seekTo", [target, true]);
    };

    const watchAgain = () => {
        send("seekTo", [0, true]);
        send("playVideo");
    };

    const toggleFullscreen = () => {
        const box = boxRef.current;
        if (!box) return;
        if (fullscreenElement()) {
            const exit = document.exitFullscreen || document.webkitExitFullscreen;
            const result = exit?.call(document);
            result?.catch?.(() => {});
            return;
        }
        const request = box.requestFullscreen || box.webkitRequestFullscreen;
        const result = request?.call(box);
        result?.catch?.(() => {});
    };

    const progress = duration ? Math.min(100, (time / duration) * 100) : 0;
    const coverImage = safeHttpsUrl(cover) || thumbnailUrl(videoId);
    const ctaHref = safeHttpUrl(ctaUrl);
    const showBar = started && (!isPlaying || active) && !hasEnded;
    const btnClass =
        "grid h-9 w-9 place-items-center rounded-md text-white transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white";

    return (
        <div
            ref={boxRef}
            onPointerMove={wake}
            style={{ "--a": color }}
            className={`player-box relative w-full overflow-hidden bg-black text-white select-none ${
                fill ? "h-full" : "aspect-video rounded-xl"
            }`}
        >
            {started && (
                <iframe
                    ref={iframeRef}
                    src={iframeSrc}
                    title="Video player"
                    allow="autoplay; encrypted-media; fullscreen"
                    onLoad={handleIframeLoad}
                    className="absolute inset-0 h-full w-full border-0"
                />
            )}

            {started && !hasEnded && (
                <button
                    type="button"
                    onClick={togglePlay}
                    aria-label={isPlaying ? "Pause" : "Play"}
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer bg-transparent"
                />
            )}

            {!started && (
                <button
                    type="button"
                    onClick={start}
                    aria-label="Play video"
                    className="group absolute inset-0 z-20 grid cursor-pointer place-items-center bg-cover bg-center"
                    style={{
                        backgroundImage: `linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.25)), url("${coverImage}")`,
                    }}
                >
                    <span className="grid h-18 w-18 place-items-center rounded-full bg-[var(--a)] shadow-2xl transition group-hover:scale-105 sm:h-20 sm:w-20">
                        <Play className="ml-1 h-8 w-8 fill-white" />
                    </span>
                </button>
            )}

            {started && (
                <div
                    className={`absolute inset-x-0 bottom-0 z-30 flex items-center gap-2 bg-gradient-to-t from-black/90 to-black/0 px-3 pt-8 pb-2 transition-opacity duration-300 ${
                        showBar ? "opacity-100" : "pointer-events-none opacity-0"
                    }`}
                >
                    <button type="button" onClick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"} className={btnClass}>
                        {isPlaying ? <Pause className="h-5 w-5 fill-white" /> : <Play className="h-5 w-5 fill-white" />}
                    </button>

                    <div className="text-xs tabular-nums text-white/90">{formatTime(time)}</div>

                    <button
                        type="button"
                        onClick={seek}
                        aria-label="Seek"
                        className="group relative h-2 flex-1 cursor-pointer rounded-full bg-white/30"
                    >
                        <span
                            className="absolute inset-y-0 left-0 rounded-full bg-[var(--a)]"
                            style={{ width: `${progress}%` }}
                        />
                    </button>

                    <div className="text-xs tabular-nums text-white/90">{formatTime(duration)}</div>

                    <button type="button" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} className={btnClass}>
                        {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </button>

                    {canFullscreen() && (
                        <button
                            type="button"
                            onClick={toggleFullscreen}
                            aria-label={isFullscreen ? "Exit full screen" : "Full screen"}
                            className={btnClass}
                        >
                            {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                        </button>
                    )}
                </div>
            )}

            {hasEnded && (
                <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-neutral-950/95 p-6 text-center">
                    <p className="text-xl font-bold sm:text-3xl">{endMessage || "Thanks for watching"}</p>
                    {ctaLabel && ctaHref && (
                        <a
                            href={ctaHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg bg-[var(--a)] px-5 py-2.5 font-semibold text-white"
                        >
                            {ctaLabel}
                        </a>
                    )}
                    <button
                        type="button"
                        onClick={watchAgain}
                        className="inline-flex items-center gap-2 text-sm text-neutral-300 underline underline-offset-4 hover:text-white"
                    >
                        <RotateCcw className="h-4 w-4" /> Watch again
                    </button>
                </div>
            )}
        </div>
    );
}
