// src/components/chat/AiChatSection.jsx
import { useEffect, useMemo, useRef } from "react";
import { searchManuals, pickSnippet, summarizeFromManuals } from "../../ai/manualSearch";

function AiChatSection({
    manuals,
    onOpenManual,

    // App側で履歴を保持（消えない）
    chatHistory,
    setChatHistory,
    chatInput,
    setChatInput,
}) {
    const listRef = useRef(null);

    const safeHistory = Array.isArray(chatHistory) ? chatHistory : [];
    const safeManuals = Array.isArray(manuals) ? manuals : [];

    const scrollToBottom = () => {
        // requestAnimationFrame で描画後にスクロール
        requestAnimationFrame(() => {
            listRef.current?.scrollTo({
                top: listRef.current.scrollHeight,
                behavior: "smooth",
            });
        });
    };

    useEffect(() => {
        scrollToBottom();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [safeHistory.length]);

    const handleSend = () => {
        const q = (chatInput ?? "").trim();
        if (!q) return;

        // ① ユーザー発言を履歴へ
        const userMsg = {
            id: `${Date.now()}-u`,
            role: "user",
            text: q,
            createdAt: Date.now(),
        };

        // ② 関連マニュアル検索（上位3件）
        const refs = searchManuals(safeManuals, q, 3);

        // ③ 回答（まずはテンプレ）
        const summary = summarizeFromManuals(refs, q);

        const botText =
            refs.length === 0
                ? "関連するマニュアルが見つかりませんでした。別のキーワードで聞くか、マニュアルのタイトル/タグに含まれそうな言葉で試してください。"
                : summary
                    ? `以下は関連マニュアルから抜粋した要点です。\n${summary}\n\n必要なら「参照マニュアル」を開いて全文を確認してください。`
                    : "関連しそうなマニュアルを見つけました。下の「参照マニュアル」から内容を確認してください。";

        const botMsg = {
            id: `${Date.now()}-a`,
            role: "assistant",
            text: botText,
            createdAt: Date.now(),
            references: refs.map((m) => ({
                id: m.id,
                title: m.title,
                categoryPath: Array.isArray(m.categoryPath) ? m.categoryPath : [],
                snippet: pickSnippet(m, q),
            })),
            query: q,
        };

        setChatHistory((prev) => [...(Array.isArray(prev) ? prev : []), userMsg, botMsg]);
        setChatInput("");
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div
            style={{
                width: "100%",
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                padding: "14px",
                border: "1px solid #E5EAF1",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                minHeight: "70vh",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ fontSize: "14px", fontWeight: "bold", color: "#1F5FBF" }}>
                    AIチャット
                </div>
                <div style={{ fontSize: "12px", color: "#6B7280" }}>
                    マニュアルの内容から関連候補を提示します（根拠付き）
                </div>
            </div>

            {/* 履歴 */}
            <div
                ref={listRef}
                style={{
                    flex: 1,
                    overflowY: "auto",
                    border: "1px solid #EEF2FF",
                    borderRadius: "10px",
                    padding: "10px",
                    backgroundColor: "#F8FBFF",
                }}
            >
                {safeHistory.length === 0 ? (
                    <div style={{ fontSize: "13px", color: "#6B7280" }}>
                        例：「清掃の手順を教えて」「ライン停止時の対応は？」など
                    </div>
                ) : (
                    safeHistory.map((m) => (
                        <div key={m.id} style={{ marginBottom: "10px" }}>
                            <div
                                style={{
                                    display: "inline-block",
                                    maxWidth: "100%",
                                    padding: "8px 10px",
                                    borderRadius: "10px",
                                    backgroundColor: m.role === "user" ? "#EAF2FF" : "#FFFFFF",
                                    border: "1px solid #D7E3F7",
                                    color: "#111827",
                                    fontSize: "13px",
                                    whiteSpace: "pre-wrap",
                                }}
                            >
                                {m.text}
                            </div>

                            {/* 参照マニュアル（assistant のみ） */}
                            {m.role === "assistant" && Array.isArray(m.references) && m.references.length > 0 && (
                                <div style={{ marginTop: "8px" }}>
                                    <div style={{ fontSize: "12px", color: "#6B7280", marginBottom: "6px" }}>
                                        参照マニュアル（根拠）
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                        {m.references.map((r) => (
                                            <button
                                                key={r.id}
                                                type="button"
                                                onClick={() => onOpenManual?.(r.id)}
                                                style={{
                                                    textAlign: "left",
                                                    border: "1px solid #D7E3F7",
                                                    backgroundColor: "#FFFFFF",
                                                    borderRadius: "10px",
                                                    padding: "8px 10px",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                <div style={{ fontSize: "13px", color: "#1F5FBF", fontWeight: "bold" }}>
                                                    📘 {r.title}
                                                </div>
                                                <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "2px" }}>
                                                    {r.categoryPath.length ? `カテゴリ：${r.categoryPath.join(" / ")}` : "カテゴリ：未分類"}
                                                </div>
                                                {r.snippet && (
                                                    <div style={{ fontSize: "12px", color: "#111827", marginTop: "6px" }}>
                                                        {r.snippet}
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* 入力 */}
            <div style={{ display: "flex", gap: "8px" }}>
                <textarea
                    value={chatInput ?? ""}
                    onChange={(e) => setChatInput?.(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="質問を入力（Enterで送信 / Shift+Enterで改行）"
                    style={{
                        flex: 1,
                        minHeight: "44px",
                        maxHeight: "120px",
                        resize: "vertical",
                        border: "1px solid #D7E3F7",
                        borderRadius: "10px",
                        padding: "8px 10px",
                        fontSize: "13px",
                        outline: "none",
                        boxSizing: "border-box",
                    }}
                />
                <button
                    type="button"
                    onClick={handleSend}
                    style={{
                        border: "1px solid #1F5FBF",
                        backgroundColor: "#1F5FBF",
                        color: "#fff",
                        borderRadius: "10px",
                        padding: "10px 14px",
                        cursor: "pointer",
                        fontSize: "13px",
                        whiteSpace: "nowrap",
                    }}
                >
                    送信
                </button>
            </div>
        </div>
    );
}

export default AiChatSection;
