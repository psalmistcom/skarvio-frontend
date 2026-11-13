const LINK_PATTERN = /(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/;

/** Returns the 11-character video id from a YouTube link or bare id, or "". */
export function parseYouTubeId(input = "") {
    const value = input.trim();
    const match = value.match(LINK_PATTERN);
    if (match) return match[1];
    return /^[\w-]{11}$/.test(value) ? value : "";
}

export const thumbnailUrl = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

/** Accepts only https URLs. Returns the normalised href or "". */
export function safeHttpsUrl(value = "") {
    try {
        const url = new URL(value.trim());
        return url.protocol === "https:" ? url.href : "";
    } catch {
        return "";
    }
}

/** Accepts http or https URLs. Returns the normalised href or "". */
export function safeHttpUrl(value = "") {
    try {
        const url = new URL(value.trim());
        return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
    } catch {
        return "";
    }
}
