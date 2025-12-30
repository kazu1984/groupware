// src/components/search/GlobalSearchResults.jsx
import React from "react";

const normalize = (s) => (s ?? "").toString().toLowerCase().trim();

const includesAllTerms = (text, query) => {
    const q = normalize(query);
    if (!q) return false;
    const terms = q.split(/\s+/).filter(Boolean);
    const hay = normalize(text);
    return terms.every((t) => hay.includes(t));
};

function GlobalSearchResults({ query, todos, boardPosts, manuals, onClickResult }) {
    const q = query.trim();
    if (!q) return null;

    // TODO 結果
    const todoResults = (todos || []).filter((t) =>
        includesAllTerms([t.title, t.deadline, t.priority].join(" "), q)
    );

    // 連絡 結果
    const boardResults = (boardPosts || []).filter((p) =>
        includesAllTerms([p.title, p.content, p.category, p.createdAt].join(" "), q)
    );

    // マニュアル 結果
    const manualResults = (manuals || []).filter((m) =>
        includesAllTerms(
            [
                m.title,
                m.content,
                (m.tags || []).join(" "),
                Array.isArray(m.categoryPath) ? m.categoryPath.join(" ") : "",
            ].join(" "),
            q
        )
    );

    const hasAny = todoResults.length + boardResults.length + manualResults.length > 0;

    return (
        <div
            style={{
                marginBottom: "12px",
                padding: "10px 12px",
                borderRadius: "10px",
                border: "1px solid #D7E3F7",
                backgroundColor: "#F9FBFF",
                maxHeight: "260px",
                overflow: "auto",
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    fontSize: "12px",
                    color: "#6B7280",
                    marginBottom: "6px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "8px",
                }}
            >
                <span>「{q}」の検索結果</span>
                <span>
                    TODO {todoResults.length} 件 / 連絡 {boardResults.length} 件 / マニュアル{" "}
                    {manualResults.length} 件
                </span>
            </div>

            {!hasAny && (
                <div style={{ fontSize: "13px", color: "#374151" }}>
                    該当する結果は見つかりませんでした。
                    <br />
                    キーワードを少し変えて検索してみてください。
                </div>
            )}

            {hasAny && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "8px" }}>
                    {/* TODO セクション */}
                    <div>
                        <div
                            style={{
                                fontSize: "12px",
                                fontWeight: "bold",
                                color: "#1F5FBF",
                                marginBottom: "4px",
                            }}
                        >
                            ✅ TODO
                        </div>
                        {todoResults.length === 0 ? (
                            <div style={{ fontSize: "11px", color: "#9CA3AF" }}>該当なし</div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                {todoResults.slice(0, 5).map((t) => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() =>
                                            onClickResult &&
                                            onClickResult({
                                                type: "todo",
                                                id: t.id,
                                            })
                                        }
                                        style={{
                                            width: "100%",
                                            textAlign: "left",
                                            borderRadius: "8px",
                                            border: "1px solid #E5EAF1",
                                            backgroundColor: "#FFFFFF",
                                            padding: "6px 8px",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "13px",
                                                color: "#111827",
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {t.title}
                                        </div>
                                        <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "2px" }}>
                                            期限：{t.deadline || "-"} / 重要度：{t.priority || "-"}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 連絡 セクション */}
                    <div>
                        <div
                            style={{
                                fontSize: "12px",
                                fontWeight: "bold",
                                color: "#1F5FBF",
                                marginBottom: "4px",
                            }}
                        >
                            📋 連絡ボード
                        </div>
                        {boardResults.length === 0 ? (
                            <div style={{ fontSize: "11px", color: "#9CA3AF" }}>該当なし</div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                {boardResults.slice(0, 5).map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() =>
                                            onClickResult &&
                                            onClickResult({
                                                type: "board",
                                                id: p.id,
                                            })
                                        }
                                        style={{
                                            width: "100%",
                                            textAlign: "left",
                                            borderRadius: "8px",
                                            border: "1px solid #E5EAF1",
                                            backgroundColor: "#FFFFFF",
                                            padding: "6px 8px",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "13px",
                                                color: "#111827",
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {p.pinned ? "📌 " : ""}
                                            {p.title}
                                        </div>
                                        <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "2px" }}>
                                            {p.category ? `カテゴリ：${p.category}` : "カテゴリ：未設定"}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* マニュアル セクション */}
                    <div>
                        <div
                            style={{
                                fontSize: "12px",
                                fontWeight: "bold",
                                color: "#1F5FBF",
                                marginBottom: "4px",
                            }}
                        >
                            📘 マニュアル
                        </div>
                        {manualResults.length === 0 ? (
                            <div style={{ fontSize: "11px", color: "#9CA3AF" }}>該当なし</div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                {manualResults.slice(0, 5).map((m) => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() =>
                                            onClickResult &&
                                            onClickResult({
                                                type: "manual",
                                                id: m.id,
                                            })
                                        }
                                        style={{
                                            width: "100%",
                                            textAlign: "left",
                                            borderRadius: "8px",
                                            border: "1px solid #E5EAF1",
                                            backgroundColor: "#FFFFFF",
                                            padding: "6px 8px",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "13px",
                                                color: "#111827",
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {m.title}
                                        </div>
                                        <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "2px" }}>
                                            {Array.isArray(m.categoryPath) && m.categoryPath.length > 0
                                                ? m.categoryPath.join(" / ")
                                                : "未分類"}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default GlobalSearchResults;
