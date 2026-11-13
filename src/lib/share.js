// Settings travel inside the URL, so nothing needs to be stored on a server.

export function encodeConfig(config) {
    const bytes = new TextEncoder().encode(JSON.stringify(config));
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeConfig(encoded = "") {
    if (!encoded) return null;
    try {
        let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
        while (base64.length % 4) base64 += "=";
        const binary = atob(base64);
        const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
        const parsed = JSON.parse(new TextDecoder().decode(bytes));
        return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
        return null;
    }
}
