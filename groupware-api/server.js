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

// サーバー起動
app.listen(PORT, () => {
    console.log(`API server listening on http://localhost:${PORT}`);
});
