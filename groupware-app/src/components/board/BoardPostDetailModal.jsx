// src/components/board/BoardPostDetailModal.jsx

import { useEffect } from "react";

function BoardPostDetailModal({ open, post, onClose }) {

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [onClose]);

    if (!open || !post) return null;


    return (

        <div
            onMouseDown={onClose}
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "16px",
                zIndex: 9999,
            }}
        >
            <div
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                    width: "min(900px, 96vw)",
                    maxHeight: "90vh",
                    overflow: "auto",
                    backgroundColor: "#fff",
                    borderRadius: "12px",
                    border: "1px solid #E5EAF1",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: "14px 16px",
                        borderBottom: "1px solid #E5EAF1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                    }}
                >
                    <div style={{ minWidth: 0 }}>
                        <div
                            style={{
                                fontSize: "16px",
                                fontWeight: "bold",
                                color: "#1F5FBF",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                            title={post.title}
                        >
                            {post.pinned ? "📌 " : ""}
                            {post.title}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "4px" }}>
                            {post.category ? `カテゴリ：${post.category}` : "カテゴリ：未設定"}
                            {post.createdAt ? `　/　${post.createdAt}` : ""}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            border: "1px solid #D7E3F7",
                            backgroundColor: "#F5F9FF",
                            color: "#1F5FBF",
                            borderRadius: "10px",
                            padding: "8px 10px",
                            cursor: "pointer",
                            fontSize: "13px",
                            whiteSpace: "nowrap",
                        }}
                    >
                        閉じる
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: "14px 16px" }}>
                    <div
                        style={{
                            fontSize: "13px",
                            color: "#111827",
                            lineHeight: 1.7,
                            whiteSpace: "pre-wrap",
                        }}
                    >
                        {post.content || "（本文がありません）"}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BoardPostDetailModal;
