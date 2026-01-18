// groupware-api/server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const Database = require("better-sqlite3");

require("dotenv").config();
const OpenAI = require("openai");


// ===== DB 初期化（必ず groupware-api/groupware.db を使う）=====
const dbPath = path.join(__dirname, "groupware.db");
const db = new Database(dbPath);
console.log("DB PATH =", dbPath);


// ===== Manuals テーブル作成 =====
db.exec(`
  CREATE TABLE IF NOT EXISTS manuals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category_path TEXT NOT NULL DEFAULT '[]',  -- JSON文字列
    tags TEXT NOT NULL DEFAULT '[]',           -- JSON文字列
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

const safeJsonParseArray = (value) => {
    try {
        const v = JSON.parse(value);
        return Array.isArray(v) ? v : [];
    } catch {
        return [];
    }
};

const toJsonArrayString = (arr) => {
    if (!Array.isArray(arr)) return "[]";
    return JSON.stringify(arr);
};

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // .env のキー
});


// ===== Express =====
const app = express();
const PORT = 3001;

app.use(express.json());

// CORS（フロントが Vite の 5173 の場合）
app.use(
    cors({
        origin: "http://localhost:5173",
    })
);

// ===== ヘルスチェック =====
app.get("/api/health", (req, res) => {
    const count = db.prepare("SELECT COUNT(*) AS c FROM manuals").get();
    res.json({
        ok: true,
        dbPath,
        manualsCount: count?.c ?? 0,
    });
});

// =====================
// Manuals API
// =====================

// 一覧取得（更新日が新しい順）
app.get("/api/manuals", (req, res) => {
    const rows = db
        .prepare(`
      SELECT id, title, content, category_path, tags, created_at, updated_at
      FROM manuals
      ORDER BY datetime(updated_at) DESC, id DESC
    `)
        .all();

    const manuals = rows.map((r) => ({
        id: r.id,
        title: r.title,
        content: r.content,
        categoryPath: safeJsonParseArray(r.category_path),
        tags: safeJsonParseArray(r.tags),
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    }));

    res.json(manuals);
});

// 1件取得
app.get("/api/manuals/:id", (req, res) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "invalid id" });

    const r = db
        .prepare(`
      SELECT id, title, content, category_path, tags, created_at, updated_at
      FROM manuals
      WHERE id = ?
    `)
        .get(id);

    if (!r) return res.status(404).json({ error: "not found" });

    res.json({
        id: r.id,
        title: r.title,
        content: r.content,
        categoryPath: safeJsonParseArray(r.category_path),
        tags: safeJsonParseArray(r.tags),
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    });
});

// 追加
app.post("/api/manuals", (req, res) => {
    const { title, content, categoryPath, tags } = req.body || {};

    if (!title || !String(title).trim()) {
        return res.status(400).json({ error: "title is required" });
    }
    if (!content || !String(content).trim()) {
        return res.status(400).json({ error: "content is required" });
    }

    const now = new Date().toISOString();
    const info = db
        .prepare(`
      INSERT INTO manuals (title, content, category_path, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
        .run(
            String(title).trim(),
            String(content).trim(),
            toJsonArrayString(categoryPath),
            toJsonArrayString(tags),
            now,
            now
        );

    res.status(201).json({
        id: info.lastInsertRowid,
        title: String(title).trim(),
        content: String(content).trim(),
        categoryPath: Array.isArray(categoryPath) ? categoryPath : [],
        tags: Array.isArray(tags) ? tags : [],
        createdAt: now,
        updatedAt: now,
    });
});

// 更新
app.patch("/api/manuals/:id", (req, res) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "invalid id" });

    const row = db.prepare("SELECT id FROM manuals WHERE id = ?").get(id);
    if (!row) return res.status(404).json({ error: "not found" });

    const { title, content, categoryPath, tags } = req.body || {};
    const now = new Date().toISOString();

    if (title !== undefined && !String(title).trim()) {
        return res.status(400).json({ error: "title cannot be empty" });
    }
    if (content !== undefined && !String(content).trim()) {
        return res.status(400).json({ error: "content cannot be empty" });
    }

    db.prepare(`
    UPDATE manuals
    SET
      title = COALESCE(?, title),
      content = COALESCE(?, content),
      category_path = COALESCE(?, category_path),
      tags = COALESCE(?, tags),
      updated_at = ?
    WHERE id = ?
  `).run(
        title !== undefined ? String(title).trim() : null,
        content !== undefined ? String(content).trim() : null,
        categoryPath !== undefined ? toJsonArrayString(categoryPath) : null,
        tags !== undefined ? toJsonArrayString(tags) : null,
        now,
        id
    );

    const r = db
        .prepare(`
      SELECT id, title, content, category_path, tags, created_at, updated_at
      FROM manuals
      WHERE id = ?
    `)
        .get(id);

    res.json({
        id: r.id,
        title: r.title,
        content: r.content,
        categoryPath: safeJsonParseArray(r.category_path),
        tags: safeJsonParseArray(r.tags),
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    });
});

// 削除
app.delete("/api/manuals/:id", (req, res) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "invalid id" });

    const info = db.prepare("DELETE FROM manuals WHERE id = ?").run(id);
    if (info.changes === 0) return res.status(404).json({ error: "not found" });

    res.json({ ok: true });
});

// ---- AI Chat API ----
app.post("/api/ai-chat", async (req, res) => {
    try {
        const { message } = req.body || {};
        const q = (message || "").toString().trim();
        if (!q) return res.status(400).json({ error: "message is required" });

        const rows = db
            .prepare(`
        SELECT id, title, content, category_path, tags, updated_at
        FROM manuals
        ORDER BY datetime(updated_at) DESC, id DESC
      `)
            .all();

        const manuals = rows.map((r) => ({
            id: r.id,
            title: r.title,
            content: r.content,
            categoryPath: safeJsonParseArray(r.category_path),
            tags: safeJsonParseArray(r.tags),
            updatedAt: r.updated_at,
        }));

        if (manuals.length === 0) {
            return res.json({
                answer: "マニュアルがまだ登録されていません。",
                references: [],
                debug: { manualsCount: 0 },
            });
        }

        const knowledge = manuals
            .slice(0, 20)
            .map((m) => {
                const categoryArr = Array.isArray(m.categoryPath) ? m.categoryPath : [];
                const tagsArr = Array.isArray(m.tags) ? m.tags : [];

                const cat = categoryArr.length ? categoryArr.join(" / ") : "未分類";
                const tags = tagsArr.length ? tagsArr.join(", ") : "";

                return `#${m.id} ${m.title}
カテゴリ: ${cat}
タグ: ${tags}
本文:
${m.content || ""}`;
            })
            .join("\n\n---\n\n");


        const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content:
                        "あなたは社内マニュアル検索アシスタントです。与えられたマニュアルだけを根拠に回答してください。",
                },
                {
                    role: "user",
                    content: `質問: ${q}\n\n---\n${knowledge}`,
                },
            ],
            temperature: 0.2,
        });

        const answer =
            completion.choices?.[0]?.message?.content ??
            "マニュアルが見つかりません";

        res.json({
            answer,
            references: [],
            debug: { manualsCount: manuals.length },
        });
    } catch (err) {
        console.error("AI chat error:", err);
        res.status(500).json({
            error: "AIの応答に失敗しました",
            detail: err.message,
        });
    }
});


// =====================
// AI Chat API
// =====================

const normalize = (s) => String(s || "").toLowerCase().trim();

const searchManuals = (message, limit = 5) => {
    const normalize = (s) => String(s || "").toLowerCase().trim();

    // ★ 日本語向け：キーワードっぽい塊を拾う（漢字/ひらがな/カタカナ/英数）
    const extractTermsJa = (text) => {
        const q = normalize(text);
        if (!q) return [];

        // 英数字 / 漢字2文字以上 / かな2文字以上 を拾う
        const parts = q.match(/[a-z0-9]{2,}|[一-龥]{2,}|[ぁ-んァ-ン]{2,}/g) || [];

        // 何も拾えない（短い/記号だけ等）場合は、全体を1語として扱う
        if (parts.length === 0) return [q];

        // 長すぎる語はノイズになりやすいので適度に
        return parts.slice(0, 6);
    };

    const searchManuals = (message, limit = 5) => {
        const terms = extractTermsJa(message);

        // まずはSQLで広く拾う（terms を OR でLIKE）
        const likes = terms.map((t) => `%${t}%`);

        // termsがない場合は最新を返す
        if (terms.length === 0) {
            return db
                .prepare(`
        SELECT id, title, content, category_path, tags, updated_at
        FROM manuals
        ORDER BY datetime(updated_at) DESC, id DESC
        LIMIT ?
      `)
                .all(30)
                .slice(0, limit);
        }

        // OR 条件を動的に生成
        const orParts = likes
            .map(
                () => `
      lower(title) LIKE lower(?) OR
      lower(content) LIKE lower(?) OR
      lower(category_path) LIKE lower(?) OR
      lower(tags) LIKE lower(?)
    `
            )
            .join(" OR ");

        const params = [];
        likes.forEach((lk) => {
            // title/content/category/tags の4回分
            params.push(lk, lk, lk, lk);
        });

        let rows = db
            .prepare(
                `
      SELECT id, title, content, category_path, tags, updated_at
      FROM manuals
      WHERE ${orParts}
      ORDER BY datetime(updated_at) DESC, id DESC
      LIMIT 50
    `
            )
            .all(...params);

        // ★ もしSQLで0件なら、最新50件からJSで判定する（フォールバック）
        if (rows.length === 0) {
            rows = db
                .prepare(`
        SELECT id, title, content, category_path, tags, updated_at
        FROM manuals
        ORDER BY datetime(updated_at) DESC, id DESC
        LIMIT 50
      `)
                .all();
        }

        // JSで「全部のtermを含む（AND）」で絞る（日本語の塊termなら現実的に効く）
        const hit = rows.filter((r) => {
            const hay = normalize([r.title, r.content, r.category_path, r.tags].join(" "));
            return terms.every((t) => hay.includes(t));
        });

        // ANDで0なら、ORでも返す（ユーザー体験優先）
        const fallback = rows.filter((r) => {
            const hay = normalize([r.title, r.content, r.category_path, r.tags].join(" "));
            return terms.some((t) => hay.includes(t));
        });

        return (hit.length > 0 ? hit : fallback).slice(0, limit);
    };

};

async function callOpenAI({ question, contexts }) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        const err = new Error("OPENAI_API_KEY is missing");
        err.status = 500;
        throw err;
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const system = `
あなたは社内マニュアル検索のアシスタントです。
与えられた「マニュアル抜粋」だけを根拠に、ユーザーの質問に日本語で回答してください。
不明な場合は推測せず、「マニュアル上は確認できません」と言ってください。
回答は読みやすく箇条書きを優先してください。
`;

    const contextText = contexts
        .map((c, i) => {
            return `【資料${i + 1}】(id:${c.id}) ${c.title}\n${c.content}`;
        })
        .join("\n\n");

    // Node 18+ は fetch が使えます
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model,
            temperature: 0.2,
            messages: [
                { role: "system", content: system.trim() },
                {
                    role: "user",
                    content: `質問：${question}\n\n---\nマニュアル抜粋：\n${contextText}`,
                },
            ],
        }),
    });

    if (!resp.ok) {
        const t = await resp.text();
        const err = new Error(t || "OpenAI API Error");
        err.status = 500;
        throw err;
    }

    const data = await resp.json();
    const answer = data?.choices?.[0]?.message?.content ?? "";
    return String(answer);
}

// フロント(AiChatSection) から叩く
app.post("/api/ai/chat", async (req, res) => {
    const message = String(req.body?.message || "").trim();
    if (!message) return res.status(400).json({ error: "message is required" });

    const total = db.prepare("SELECT COUNT(*) AS c FROM manuals").get()?.c ?? 0;

    // ① まずDB検索
    const found = searchManuals(message, 3) || [];

    if (found.length === 0) {
        return res.json({
            answer:
                total === 0
                    ? "マニュアルが0件です。まずマニュアルを登録してください。"
                    : "マニュアルが見つかりませんでした。別の言い方でもう一度試してください。",
            citations: [],
            debug: { manualsCount: total },
        });
    }

    // citations 用（フロントでクリック→詳細表示できる）
    const citations = found.map((m, i) => ({
        id: m.id,
        ref: `#${i + 1}`,
        title: m.title,
    }));

    // ② OpenAI に回答生成
    try {
        const contexts = found.map((m) => ({
            id: m.id,
            title: m.title,
            content: m.content,
        }));

        const answer = await callOpenAI({
            question: message,
            contexts,
        });

        res.json({
            answer: answer || "（AIの回答が空でした）",
            citations,
            debug: { manualsCount: total },
        });
    } catch (e) {
        console.error(e);
        res.status(e.status || 500).json({
            error: "AI generation failed",
            detail: String(e.message || e),
            citations,
            debug: { manualsCount: total },
        });
    }
});

// ===== サーバー起動 =====
app.listen(PORT, () => {
    console.log(`API server listening on http://localhost:${PORT}`);
});
