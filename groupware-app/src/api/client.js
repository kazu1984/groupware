// src/api/client.js

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

/**
 * 共通fetchラッパー
 */
async function request(path, options = {}) {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
            "Content-Type": "application/json",
        },
        ...options,
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "API Error");
    }

    // 204 No Content 対応
    if (res.status === 204) return null;

    return res.json();
}

/* ====== HTTPメソッド別 ====== */

export const apiGet = (path) =>
    request(path, { method: "GET" });

export const apiPost = (path, body) =>
    request(path, {
        method: "POST",
        body: JSON.stringify(body),
    });

export const apiPut = (path, body) =>
    request(path, {
        method: "PUT",
        body: JSON.stringify(body),
    });

export const apiDelete = (path) =>
    request(path, { method: "DELETE" });


export const apiPatch = (path, body) =>
    request(path, { method: "PATCH", body: JSON.stringify(body) });
