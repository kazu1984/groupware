// src/ai/manualSearch.js

const normalize = (s) => (s ?? "").toString().toLowerCase();

const splitTerms = (q) =>
    normalize(q).split(/\s+/).map((t) => t.trim()).filter(Boolean);

const buildText = (m) => {
    const category = Array.isArray(m.categoryPath) ? m.categoryPath.join(" ") : "";
    const tags = Array.isArray(m.tags) ? m.tags.join(" ") : "";
    return normalize([m.title, m.content, category, tags].join(" "));
};

// 超簡易スコア：タイトル一致を強め、本文一致も加点
export function searchManuals(manuals, query, limit = 3) {
    const terms = splitTerms(query);
    if (terms.length === 0) return [];

    const scored = (manuals || []).map((m) => {
        const title = normalize(m.title);
        const text = buildText(m);

        let score = 0;
        for (const t of terms) {
            if (!t) continue;
            if (title.includes(t)) score += 5;
            if (text.includes(t)) score += 1;
        }

        return { manual: m, score };
    });

    return scored
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((x) => x.manual);
}

export function pickSnippet(manual, query, maxLen = 120) {
    const content = (manual?.content ?? "").toString();
    const terms = splitTerms(query);
    if (!content.trim() || terms.length === 0) return "";

    const lower = normalize(content);
    let idx = -1;
    for (const t of terms) {
        idx = lower.indexOf(t);
        if (idx !== -1) break;
    }
    if (idx === -1) return content.slice(0, maxLen) + (content.length > maxLen ? "…" : "");

    const start = Math.max(0, idx - 30);
    const end = Math.min(content.length, idx + maxLen);
    const snippet = content.slice(start, end);
    return (start > 0 ? "…" : "") + snippet + (end < content.length ? "…" : "");
}

// === 追加：ルールベース要約（関連行を抽出して箇条書き） ===
export function summarizeFromManuals(manuals, query, maxBullets = 6) {
    const terms = splitTerms(query);
    if (!Array.isArray(manuals) || manuals.length === 0 || terms.length === 0) return "";

    const bullets = [];

    for (const m of manuals) {
        const lines = (m.content ?? "")
            .toString()
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);

        // 1) まず「番号付き行」「・」の行を優先
        const candidates = lines.filter((line) => {
            const low = normalize(line);
            const hit = terms.some((t) => low.includes(t));
            const looksStep = /^(\d+[\.\)]|[-・●■])/.test(line);
            return hit || looksStep;
        });

        // 2) スコアで並び替え（ヒット数が多いほど上）
        const scored = candidates
            .map((line) => {
                const low = normalize(line);
                let score = 0;
                for (const t of terms) {
                    if (low.includes(t)) score += 3;
                }
                if (/^(\d+[\.\)]|[-・●■])/.test(line)) score += 1;
                return { line, score };
            })
            .sort((a, b) => b.score - a.score);

        for (const s of scored) {
            if (bullets.length >= maxBullets) break;
            // 重複っぽいのは避ける
            if (bullets.some((b) => b.includes(s.line))) continue;
            bullets.push(s.line);
        }

        if (bullets.length >= maxBullets) break;
    }

    if (bullets.length === 0) return "";
    return bullets.slice(0, maxBullets).map((b) => `・${b}`).join("\n");
}
