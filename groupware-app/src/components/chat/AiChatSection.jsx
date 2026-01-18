// src/components/chat/AiChatSection.jsx
import { useEffect, useMemo, useRef, useState } from "react";

const API_URL = "http://localhost:3001/api/ai/chat";

/**
 * AIチャット画面
 * props:
 *  - manuals: マニュアル配列（今は未使用でもOK。将来「候補表示」などに使える）
 *  - onOpenManual(id): 引用マニュアルをクリックしたときに詳細を開く（任意）
 */
function AiChatSection({ manuals, onOpenManual }) {
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content:
                "こんにちは！マニュアルについて質問してください。\n例）「清掃の手順は？」「ライン停止時の初動は？」",
        },
    ]);
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [errorText, setErrorText] = useState("");

    const bottomRef = useRef(null);

    const canSend = useMemo(() => input.trim().length > 0 && !isSending, [input, isSending]);

    // 一番下へスクロール
    const scrollToBottom = () => {
        // ちょい遅延させるとDOM反映後に確実にスクロールできます
        setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        }, 0);
    };

    useEffect(() => {
        scrollToBottom();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages.length, isSending]);

    const handleSend = async () => {
        const userText = input.trim();
        if (!userText || isSending) return;

        setErrorText("");
        setIsSending(true);

        // ① ユーザー発言を先に追加
        setMessages((prev) => [...prev, { role: "user", content: userText }]);
        setInput("");

        try {
            const res = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userText }),
            });

            if (!res.ok) {
                const t = await res.text();
                throw new Error(t || "API Error");
            }

            const data = await res.json();
            const answer = (data?.answer ?? "").toString();
            const citations = Array.isArray(data?.citations) ? data.citations : [];

            // ② AI回答を追加
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: answer || "（回答が空でした）",
                    citations,
                },
            ]);
        } catch (e) {
            console.error(e);
            setErrorText("AIの応答に失敗しました。APIサーバーが起動しているか確認してください。");
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content:
                        "すみません、AIの応答に失敗しました。\n（APIサーバー起動・URL・CORS・OpenAIキー設定を確認してください）",
                },
            ]);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e) => {
        // Enterで送信、Shift+Enterで改行
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const bubbleStyle = (role) => {
        const isUser = role === "user";
        return {
            alignSelf: isUser ? "flex-end" : "flex-start",
            maxWidth: "min(820px, 92%)",
            backgroundColor: isUser ? "#EAF2FF" : "#FFFFFF",
            border: isUser ? "1px solid #D7E3F7" : "1px solid #E5EAF1",
            color: "#111827",
            borderRadius: "12px",
            padding: "10px 12px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            whiteSpace: "pre-wrap",
            lineHeight: 1.65,
            fontSize: "13px",
        };
    };

    return (
        <div
            style={{
                width: "100%",
                boxSizing: "border-box",
                backgroundColor: "#FFFFFF",
                borderRadius: "12px",
                border: "1px solid #E5EAF1",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                display: "flex",
                flexDirection: "column",
                height: "calc(100vh - 140px)", // ヘッダー分をざっくり引く（必要なら調整OK）
                minHeight: "520px",
            }}
        >
            {/* ヘッダー */}
            <div
                style={{
                    padding: "12px 14px",
                    borderBottom: "1px solid #E5EAF1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                }}
            >
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: "bold", color: "#1F5FBF" }}>
                        AIチャット
                    </div>
                    <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "2px" }}>
                        マニュアルを根拠に回答します（必要なら引用も表示）
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        setMessages([
                            {
                                role: "assistant",
                                content:
                                    "こんにちは！マニュアルについて質問してください。\n例）「清掃の手順は？」「ライン停止時の初動は？」",
                            },
                        ]);
                        setInput("");
                        setErrorText("");
                    }}
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
                    履歴クリア
                </button>
            </div>

            {/* 本文（履歴） */}
            <div
                style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    backgroundColor: "#F4F8FF",
                }}
            >
                {messages.map((m, idx) => (
                    <div key={idx} style={bubbleStyle(m.role)}>
                        {/* ラベル */}
                        <div
                            style={{
                                fontSize: "11px",
                                color: "#6B7280",
                                marginBottom: "6px",
                            }}
                        >
                            {m.role === "user" ? "あなた" : "AI"}
                        </div>

                        {/* 本文（箇条書きもpre-wrapで見やすい） */}
                        <div>{m.content}</div>

                        {/* 引用（マニュアル参照） */}
                        {Array.isArray(m.citations) && m.citations.length > 0 && (
                            <div style={{ marginTop: "10px" }}>
                                <div style={{ fontSize: "11px", color: "#6B7280", marginBottom: "6px" }}>
                                    参照したマニュアル
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    {m.citations.map((c) => (
                                        <button
                                            key={`${c.id}-${c.ref}`}
                                            type="button"
                                            onClick={() => {
                                                if (onOpenManual && c.id != null) onOpenManual(c.id);
                                            }}
                                            style={{
                                                textAlign: "left",
                                                border: "1px solid #D7E3F7",
                                                backgroundColor: "#FFFFFF",
                                                borderRadius: "10px",
                                                padding: "8px 10px",
                                                cursor: onOpenManual ? "pointer" : "default",
                                                fontSize: "13px",
                                                color: "#1F5FBF",
                                            }}
                                            title={onOpenManual ? "クリックで詳細を開く" : ""}
                                        >
                                            {c.ref ? `${c.ref} ` : ""}📘 {c.title}（id: {c.id}）
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {isSending && (
                    <div style={bubbleStyle("assistant")}>
                        <div style={{ fontSize: "11px", color: "#6B7280", marginBottom: "6px" }}>AI</div>
                        <div style={{ color: "#111827" }}>考えています…</div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* エラー表示 */}
            {errorText && (
                <div
                    style={{
                        padding: "10px 12px",
                        backgroundColor: "#FFF1F2",
                        borderTop: "1px solid #FECACA",
                        color: "#991B1B",
                        fontSize: "12px",
                    }}
                >
                    {errorText}
                </div>
            )}

            {/* 入力欄 */}
            <div
                style={{
                    padding: "12px",
                    borderTop: "1px solid #E5EAF1",
                    backgroundColor: "#FFFFFF",
                    display: "flex",
                    gap: "10px",
                    alignItems: "flex-end",
                }}
            >
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="質問を入力（Enterで送信 / Shift+Enterで改行）"
                    rows={2}
                    style={{
                        flex: 1,
                        resize: "none",
                        border: "1px solid #D7E3F7",
                        borderRadius: "10px",
                        padding: "10px 10px",
                        fontSize: "13px",
                        outline: "none",
                        backgroundColor: "#FFFFFF",
                        boxSizing: "border-box",
                    }}
                />

                <button
                    type="button"
                    onClick={handleSend}
                    disabled={!canSend}
                    style={{
                        border: "1px solid #D7E3F7",
                        backgroundColor: canSend ? "#1F5FBF" : "#A9C3EA",
                        color: "#FFFFFF",
                        borderRadius: "10px",
                        padding: "10px 14px",
                        cursor: canSend ? "pointer" : "not-allowed",
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
