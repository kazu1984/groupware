// src/components/board/BoardForm.jsx
import { useState } from "react";
import { sectionCard, inputBase, textareaBase, primaryButton } from "../../uiStyles";

/**
 * 新規投稿フォーム
 * props:
 *  - onAddPost({ title, category, content }) を呼び出す
 */
function BoardForm({ onAddPost }) {
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("");
    const [content, setContent] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!title.trim()) {
            alert("タイトルを入力してください。");
            return;
        }
        if (!content.trim()) {
            alert("本文を入力してください。");
            return;
        }

        onAddPost({
            title: title.trim(),
            category: category.trim() || "未分類",
            content: content.trim(),
            pinned: false,
        });

        setTitle("");
        setCategory("");
        setContent("");
    };

    return (
        <form onSubmit={handleSubmit} style={sectionCard}>
            <h2
                style={{
                    fontSize: "14px",
                    margin: 0,
                    marginBottom: "4px",
                    color: "#2f4f10",
                }}
            >
                新規投稿
            </h2>

            <div>
                <label style={{ fontSize: "12px", color: "#555" }}>
                    タイトル
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="例：今週の生産スケジュールについて"
                        style={inputBase}
                    />
                </label>
            </div>

            <div>
                <label style={{ fontSize: "12px", color: "#555" }}>
                    カテゴリ
                    <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="例：お知らせ、メンテナンス など"
                        style={inputBase}
                    />
                </label>
            </div>

            <div>
                <label style={{ fontSize: "12px", color: "#555" }}>
                    本文
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="連絡内容を入力してください。"
                        rows={4}
                        style={textareaBase}
                    />
                </label>
            </div>

            <div style={{ textAlign: "right" }}>
                <button type="submit" style={primaryButton}>
                    投稿する
                </button>
            </div>
        </form>
    );
}

export default BoardForm;
