// src/components/board/BoardPostList.jsx
import { useState } from "react";
import {
    sectionCard,
    textareaBase,
    secondaryButton,
    primaryButton,
} from "../../uiStyles";

/**
 * 投稿一覧（編集・削除・ピン留め付き）
 * props:
 *  - posts: 投稿配列（絞り込み済み＆ソート済み）
 *  - onTogglePin(id)
 *  - onUpdatePost(id, updatedFields)
 *  - onDeletePost(id)
 */
function BoardPostList({ posts, onTogglePin, onUpdatePost, onDeletePost }) {
    const [editingPostId, setEditingPostId] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const [editCategory, setEditCategory] = useState("");
    const [editContent, setEditContent] = useState("");

    const handleStartEdit = (post) => {
        setEditingPostId(post.id);
        setEditTitle(post.title || "");
        setEditCategory(post.category || "");
        setEditContent(post.content || "");
    };

    const handleCancelEdit = () => {
        setEditingPostId(null);
        setEditTitle("");
        setEditCategory("");
        setEditContent("");
    };

    const handleSaveEdit = (id) => {
        if (!editTitle.trim()) {
            alert("タイトルを入力してください。");
            return;
        }
        if (!editContent.trim()) {
            alert("本文を入力してください。");
            return;
        }

        onUpdatePost(id, {
            title: editTitle.trim(),
            category: editCategory.trim() || "未分類",
            content: editContent.trim(),
        });

        handleCancelEdit();
    };

    if (posts.length === 0) {
        return <p style={{ color: "#777" }}>該当する投稿はありません。</p>;
    }

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
            }}
        >
            {posts.map((post) => {
                const isEditing = post.id === editingPostId;

                return (
                    <article
                        key={post.id}
                        style={{
                            ...sectionCard,
                            marginBottom: 0,
                            borderLeft: post.pinned
                                ? "4px solid #ffcc66"
                                : "4px solid #c5e579",
                        }}
                    >
                        {/* 上部：タイトル・カテゴリ・ピン表示 */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: "8px",
                                marginBottom: "4px",
                            }}
                        >
                            <div style={{ flex: 1, minWidth: 0 }}>
                                {isEditing ? (
                                    <>
                                        <input
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            style={{
                                                width: "100%",
                                                padding: "6px 8px",
                                                marginTop: 0,
                                                boxSizing: "border-box",
                                                borderRadius: "4px",
                                                border: "1px solid #ccc",
                                            }}
                                        />
                                        <div
                                            style={{
                                                marginTop: "4px",
                                            }}
                                        >
                                            <label style={{ fontSize: "12px", color: "#555" }}>
                                                カテゴリ
                                                <input
                                                    type="text"
                                                    value={editCategory}
                                                    onChange={(e) => setEditCategory(e.target.value)}
                                                    style={{
                                                        width: "100%",
                                                        padding: "6px 8px",
                                                        marginTop: "4px",
                                                        boxSizing: "border-box",
                                                        borderRadius: "4px",
                                                        border: "1px solid #ccc",
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <h2
                                            style={{
                                                fontSize: "15px",
                                                margin: 0,
                                                color: "#2f4f10",
                                                wordBreak: "break-all",
                                            }}
                                        >
                                            {post.title}
                                        </h2>
                                        <div
                                            style={{
                                                fontSize: "11px",
                                                color: "#777",
                                                marginTop: "2px",
                                            }}
                                        >
                                            カテゴリ: {post.category || "未分類"}
                                            {post.createdAt && <>　/　投稿日: {post.createdAt}</>}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* ピン状態表示 */}
                            <div
                                style={{
                                    textAlign: "right",
                                    fontSize: "11px",
                                    color: post.pinned ? "#b87300" : "#999",
                                    minWidth: "70px",
                                }}
                            >
                                {post.pinned ? "📌 ピン留め" : ""}
                            </div>
                        </div>

                        {/* 本文 or 編集用テキストエリア */}
                        {isEditing ? (
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                rows={4}
                                style={{
                                    ...textareaBase,
                                    marginTop: "4px",
                                }}
                            />
                        ) : (
                            <p
                                style={{
                                    margin: 0,
                                    marginTop: "6px",
                                    whiteSpace: "pre-wrap",
                                    fontSize: "13px",
                                    color: "#333",
                                }}
                            >
                                {post.content}
                            </p>
                        )}

                        {/* ボタン群 */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginTop: "8px",
                                gap: "8px",
                                flexWrap: "wrap",
                            }}
                        >
                            {/* 左：ピン留め */}
                            <div>
                                <button
                                    type="button"
                                    onClick={() => onTogglePin(post.id)}
                                    style={{
                                        ...secondaryButton,
                                        padding: "4px 10px",
                                    }}
                                >
                                    {post.pinned ? "ピンを外す" : "ピン留めする"}
                                </button>
                            </div>

                            {/* 右：編集 / 削除 or 保存 / キャンセル */}
                            <div
                                style={{
                                    display: "flex",
                                    gap: "6px",
                                    justifyContent: "flex-end",
                                    flexWrap: "wrap",
                                }}
                            >
                                {isEditing ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => handleSaveEdit(post.id)}
                                            style={{
                                                ...primaryButton,
                                                padding: "4px 12px",
                                                fontSize: "12px",
                                            }}
                                        >
                                            保存
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCancelEdit}
                                            style={{
                                                ...secondaryButton,
                                                padding: "4px 12px",
                                                fontSize: "12px",
                                            }}
                                        >
                                            キャンセル
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => handleStartEdit(post)}
                                            style={{
                                                ...secondaryButton,
                                                padding: "4px 12px",
                                                fontSize: "12px",
                                            }}
                                        >
                                            編集
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (
                                                    window.confirm(
                                                        "この投稿を削除します。よろしいですか？"
                                                    )
                                                ) {
                                                    onDeletePost(post.id);
                                                }
                                            }}
                                            style={{
                                                ...secondaryButton,
                                                padding: "4px 12px",
                                                fontSize: "12px",
                                                borderColor: "#ff9999",
                                                color: "#b22222",
                                                backgroundColor: "#ffecec",
                                            }}
                                        >
                                            削除
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}

export default BoardPostList;
