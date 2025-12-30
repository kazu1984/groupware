// src/aiData.js

/**
 * TODO・連絡ボード・マニュアルなどを
 * 「AIチャット用の共通フォーマット」に変換するヘルパー。
 *
 * 戻り値の配列の要素イメージ:
 * {
 *   id: "todo-1",
 *   type: "todo" | "board" | "manual",
 *   title: string,
 *   body: string,        // 人間が読んでも理解しやすい説明テキスト
 *   createdAt: string | null,
 *   meta: object,        // 追加情報（期限・重要度・カテゴリ・タグなど）
 * }
 */
export function buildAiKnowledge({ todos, boardPosts, manuals = [] }) {
    // TODOをAI用データに変換
    const todoItems = (todos || []).map((t) => {
        const deadlineText = t.deadline || "未設定";
        const priorityText = t.priority || "未設定";
        const completedText = t.completed ? "完了" : "未完了";

        return {
            id: `todo-${t.id}`,
            type: "todo",
            title: t.title,
            body: [
                `【TODO】${t.title}`,
                `期限: ${deadlineText}`,
                `重要度: ${priorityText}`,
                `完了状態: ${completedText}`,
            ].join("\n"),
            createdAt: null, // 今回は管理していないので一旦 null
            meta: {
                deadline: t.deadline,
                priority: t.priority,
                completed: t.completed,
            },
        };
    });

    // 連絡ボードをAI用データに変換
    const boardItems = (boardPosts || []).map((p) => ({
        id: `board-${p.id}`,
        type: "board",
        title: p.title,
        body: [
            `【連絡】${p.title}`,
            `カテゴリ: ${p.category}`,
            p.content,
        ].join("\n\n"),
        createdAt: p.createdAt || null,
        meta: {
            category: p.category,
            pinned: !!p.pinned,
        },
    }));

    // マニュアル（まだ未実装なのでダミー扱い）をAI用データに変換
    const manualItems = (manuals || []).map((m) => ({
        id: `manual-${m.id}`,
        type: "manual",
        title: m.title,
        body: m.content,
        createdAt: m.createdAt || null,
        meta: {
            categoryPath: m.categoryPath || [],
            tags: m.tags || [],
        },
    }));

    return [...todoItems, ...boardItems, ...manualItems];
}
