// groupware-api/server.js
const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");

// === DB 初期化（なければ groupware.db を作成） ===
const db = new Database("groupware.db");

// TODOS テーブル作成（あれば何もしない）
db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    deadline TEXT,
    priority TEXT,
    completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
`);

// 連絡ボード（board_posts）
db.exec(`
  CREATE TABLE IF NOT EXISTS board_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT,
    content TEXT,
    pinned INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);


const app = express();
const PORT = 3001;

// JSONボディを受け取るための設定
app.use(express.json());

// CORS許可（フロントが http://localhost:5173 の場合）
app.use(
    cors({
        origin: "http://localhost:5173",
    })
);

// ---- TODO API ----

// 一覧取得
app.get("/api/todos", (req, res) => {
    const rows = db
        .prepare("SELECT id, title, deadline, priority, completed, created_at FROM todos ORDER BY id DESC")
        .all();

    // completed: 0/1 を boolean に変換して返す
    const todos = rows.map((r) => ({
        ...r,
        completed: r.completed === 1,
    }));

    res.json(todos);
});

// 追加
app.post("/api/todos", (req, res) => {
    const { title, deadline, priority } = req.body || {};

    if (!title || !title.trim()) {
        return res.status(400).json({ error: "title is required" });
    }

    const now = new Date().toISOString();
    const stmt = db.prepare(
        "INSERT INTO todos (title, deadline, priority, completed, created_at) VALUES (?, ?, ?, ?, ?)"
    );
    const info = stmt.run(title.trim(), deadline || null, priority || "中", 0, now);

    const newTodo = {
        id: info.lastInsertRowid,
        title: title.trim(),
        deadline: deadline || null,
        priority: priority || "中",
        completed: false,
        created_at: now,
    };

    res.status(201).json(newTodo);
});

// 完了フラグのトグル
app.patch("/api/todos/:id/toggle", (req, res) => {
    const id = Number(req.params.id);
    if (!id) {
        return res.status(400).json({ error: "invalid id" });
    }

    // 現在の状態取得
    const row = db.prepare("SELECT completed FROM todos WHERE id = ?").get(id);
    if (!row) {
        return res.status(404).json({ error: "not found" });
    }

    const newCompleted = row.completed === 1 ? 0 : 1;
    db.prepare("UPDATE todos SET completed = ? WHERE id = ?").run(newCompleted, id);

    res.json({ id, completed: newCompleted === 1 });
});

// ---- Board API ----

// 一覧取得（ピン留め優先 → 新しい順）
app.get("/api/board-posts", (req, res) => {
    const rows = db
        .prepare(`
      SELECT id, title, category, content, pinned, created_at, updated_at
      FROM board_posts
      ORDER BY pinned DESC, datetime(created_at) DESC, id DESC
    `)
        .all();

    const posts = rows.map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        content: r.content,
        pinned: r.pinned === 1,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    }));

    res.json(posts);
});

// 追加
app.post("/api/board-posts", (req, res) => {
    const { title, category, content, pinned } = req.body || {};

    if (!title || !title.trim()) {
        return res.status(400).json({ error: "title is required" });
    }

    const now = new Date().toISOString();

    const stmt = db.prepare(`
    INSERT INTO board_posts (title, category, content, pinned, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

    const info = stmt.run(
        title.trim(),
        category ? String(category) : null,
        content ? String(content) : "",
        pinned ? 1 : 0,
        now,
        now
    );

    res.status(201).json({
        id: info.lastInsertRowid,
        title: title.trim(),
        category: category ? String(category) : null,
        content: content ? String(content) : "",
        pinned: !!pinned,
        createdAt: now,
        updatedAt: now,
    });
});

// 編集（title/category/content など更新）
app.patch("/api/board-posts/:id", (req, res) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "invalid id" });

    const row = db.prepare("SELECT id FROM board_posts WHERE id = ?").get(id);
    if (!row) return res.status(404).json({ error: "not found" });

    const { title, category, content } = req.body || {};
    const now = new Date().toISOString();

    // title は空なら更新しない（任意）
    if (title !== undefined) {
        if (!String(title).trim()) {
            return res.status(400).json({ error: "title cannot be empty" });
        }
    }

    db.prepare(`
    UPDATE board_posts
    SET
      title = COALESCE(?, title),
      category = CASE WHEN ? IS NULL THEN category ELSE ? END,
      content = COALESCE(?, content),
      updated_at = ?
    WHERE id = ?
  `).run(
        title !== undefined ? String(title).trim() : null,
        category !== undefined ? (category === null ? null : String(category)) : null,
        category !== undefined ? (category === null ? null : String(category)) : null,
        content !== undefined ? String(content) : null,
        now,
        id
    );

    const updated = db
        .prepare(`
      SELECT id, title, category, content, pinned, created_at, updated_at
      FROM board_posts
      WHERE id = ?
    `)
        .get(id);

    res.json({
        id: updated.id,
        title: updated.title,
        category: updated.category,
        content: updated.content,
        pinned: updated.pinned === 1,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
    });
});

// ピン留めトグル
app.patch("/api/board-posts/:id/toggle-pin", (req, res) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "invalid id" });

    const row = db.prepare("SELECT pinned FROM board_posts WHERE id = ?").get(id);
    if (!row) return res.status(404).json({ error: "not found" });

    const newPinned = row.pinned === 1 ? 0 : 1;
    const now = new Date().toISOString();

    db.prepare("UPDATE board_posts SET pinned = ?, updated_at = ? WHERE id = ?").run(
        newPinned,
        now,
        id
    );

    res.json({ id, pinned: newPinned === 1 });
});

// 削除
app.delete("/api/board-posts/:id", (req, res) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "invalid id" });

    const info = db.prepare("DELETE FROM board_posts WHERE id = ?").run(id);
    if (info.changes === 0) return res.status(404).json({ error: "not found" });

    res.json({ ok: true });
});


// サーバー起動
app.listen(PORT, () => {
    console.log(`API server listening on http://localhost:${PORT}`);
});
