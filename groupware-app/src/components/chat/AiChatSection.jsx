// src/components/chat/AiChatSection.jsx
import { useEffect, useRef, useState } from "react";

// ===== 文字列処理のヘルパー =====
const normalize = (s) => (s ?? "").toString().toLowerCase().trim();

const includesAllTerms = (text, query) => {
    const q = normalize(query);
    if (!q) return false;
    const terms = q.split(/\s+/).filter(Boolean);
    const hay = normalize(text);
    return terms.every((t) => hay.includes(t));
};

const typeLabel = (type) => {
    if (type === "todo") return "TODO";
    if (type === "board") return "連絡";
    return "マニュアル";
};

const STORAGE_KEY_MESSAGES = "groupware_ai_chat_messages_v1";
const STORAGE_KEY_INPUT = "groupware_ai_chat_input_v1";

function AiChatSection({ todos, boardPosts, manuals, onOpenTodo, onOpenBoard, onOpenManual }) {
    // --- 初期メッセージ（localStorage にあれば復元） ---
    const [messages, setMessages] = useState(() => {
        try {
            const saved = window.localStorage.getItem(STORAGE_KEY_MESSAGES);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            }
        } catch (e) {
            // 失敗時は無視してデフォルトを使う
        }
        return [
            {
                role: "assistant",
                text: "こんにちは！社内データ（TODO / 連絡 / マニュアル）から探してご案内します。\n例：『清掃のルール教えて』『ライン停止の対応は？』",
            },
        ];
    });

    // 入力欄も復元
    const [input, setInput] = useState(() => {
        try {
            const saved = window.localStorage.getItem(STORAGE_KEY_INPUT);
            return saved ?? "";
        } catch {
            return "";
        }
    });

    // ★ チャットログのスクロール領域への ref
    const logRef = useRef(null);

    // --- 履歴と入力欄を localStorage に保存 ---
    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
        } catch {
            // 保存できなくても動作は続ける
        }
    }, [messages]);

    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY_INPUT, input);
        } catch {
            // noop
        }
    }, [input]);

    // ★ メッセージが増えたら一番下まで自動スクロール
    useEffect(() => {
        const el = logRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
    }, [messages]);

    // 質問テキストから候補を作る
    const buildResults = (q) => {
        const results = [];

        // TODO
        (todos || []).forEach((t) => {
            if (includesAllTerms(t.title, q)) {
                results.push({
                    type: "todo",
                    id: t.id,
                    title: t.title,
                    meta: t.deadline ? `期限：${t.deadline}` : "",
                });
            }
        });

        // 連絡
        (boardPosts || []).forEach((p) => {
            const text = [p.title, p.content].join(" ");
            if (includesAllTerms(text, q)) {
                results.push({
                    type: "board",
                    id: p.id,
                    title: p.title,
                    meta: p.category ? `カテゴリ：${p.category}` : "",
                });
            }
        });

        // マニュアル
        (manuals || []).forEach((m) => {
            const text = [
                m.title,
                m.content,
                (m.tags || []).join(" "),
                Array.isArray(m.categoryPath) ? m.categoryPath.join(" ") : "",
            ].join(" ");
            if (includesAllTerms(text, q)) {
                results.push({
                    type: "manual",
                    id: m.id,
                    title: m.title,
                    meta: Array.isArray(m.categoryPath)
                        ? `カテゴリ：${m.categoryPath.join(" / ")}`
                        : "カテゴリ：未分類",
                });
            }
        });

        return results.slice(0, 5); // 最大5件
    };

    const handleSend = () => {
        const q = input.trim();
        if (!q) return;

        // ユーザー発言を追加
        setMessages((prev) => [...prev, { role: "user", text: q }]);
        setInput("");

        const results = buildResults(q);

        if (results.length === 0) {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    text:
                        "社内データからは該当しそうな情報が見つかりませんでした。\n" +
                        "キーワードを少し変えてみると見つかる場合があります（例：『清掃』→『日次清掃』『製造室 清掃』など）。",
                    results: [],
                },
            ]);
            return;
        }

        // 候補付きの返信
        setMessages((prev) => [
            ...prev,
            {
                role: "assistant",
                text: "関連しそうな情報が見つかりました。開きたいものを選んでください。",
                results,
            },
        ]);
    };

    // 候補をクリックした時（各機能側へハンドオフ）
    const handlePick = (r) => {
        if (r.type === "todo") {
            onOpenTodo && onOpenTodo(r.id);
        } else if (r.type === "board") {
            onOpenBoard && onOpenBoard(r.id);
        } else if (r.type === "manual") {
            onOpenManual && onOpenManual(r.id);
        }
    };

    return (
        <div
            style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                padding: "14px",
                border: "1px solid #E5EAF1",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                width: "100%",
                boxSizing: "border-box",
            }}
        >
            <h2
                style={{
                    fontSize: "14px",
                    marginTop: 0,
                    marginBottom: "6px",
                    color: "#1F5FBF",
                }}
            >
                AIチャット（社内データ検索）
            </h2>
            <p style={{ fontSize: "12px", color: "#6B7280", marginTop: 0, marginBottom: "8px" }}>
                TODO・連絡ボード・マニュアルの内容から、キーワードで近いものを探して候補を表示します。
            </p>

            {/* ログ表示エリア */}
            <div
                ref={logRef}  // ★ ここに ref をセット
                style={{
                    border: "1px solid #D7E3F7",
                    borderRadius: "10px",
                    padding: "10px",
                    backgroundColor: "#F9FBFF",
                    height: "360px",
                    overflow: "auto",
                    boxSizing: "border-box",
                }}
            >
                {messages.map((m, idx) => (
                    <div key={idx} style={{ marginBottom: "10px" }}>
                        {/* 発言者ラベル */}
                        <div
                            style={{
                                fontSize: "12px",
                                color: "#6B7280",
                                marginBottom: "4px",
                            }}
                        >
                            {m.role === "user" ? "あなた" : "AI"}
                        </div>

                        {/* 本文 */}
                        <div
                            style={{
                                fontSize: "13px",
                                color: "#111827",
                                whiteSpace: "pre-wrap",
                                lineHeight: 1.6,
                            }}
                        >
                            {m.text}
                        </div>

                        {/* AI側の候補リスト */}
                        {Array.isArray(m.results) && m.results.length > 0 && (
                            <div
                                style={{
                                    marginTop: "8px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "6px",
                                }}
                            >
                                {m.results.map((r) => (
                                    <button
                                        key={`${r.type}-${r.id}`}
                                        type="button"
                                        onClick={() => handlePick(r)}
                                        style={{
                                            textAlign: "left",
                                            border: "1px solid #D7E3F7",
                                            backgroundColor: "#FFFFFF",
                                            borderRadius: "10px",
                                            padding: "8px 10px",
                                            cursor: "pointer",
                                            display: "flex",
                                            gap: "8px",
                                            alignItems: "center",
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: "11px",
                                                padding: "2px 6px",
                                                borderRadius: "999px",
                                                backgroundColor:
                                                    r.type === "todo"
                                                        ? "#EAF2FF"
                                                        : r.type === "board"
                                                            ? "#FFF4E5"
                                                            : "#EAF7EA",
                                                color:
                                                    r.type === "todo"
                                                        ? "#1F5FBF"
                                                        : r.type === "board"
                                                            ? "#B45309"
                                                            : "#2F7D32",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {typeLabel(r.type)}
                                        </span>
                                        <div style={{ minWidth: 0 }}>
                                            <div
                                                style={{
                                                    fontSize: "13px",
                                                    color: "#111827",
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                }}
                                            >
                                                {r.title}
                                            </div>
                                            {r.meta && (
                                                <div style={{ fontSize: "11px", color: "#6B7280" }}>{r.meta}</div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* 入力エリア */}
            <div
                style={{
                    marginTop: "10px",
                    display: "flex",
                    gap: "8px",
                }}
            >
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="例：清掃ルールを教えて / ライン停止の対応は？"
                    style={{
                        flex: 1,
                        minWidth: 0,
                        border: "1px solid #D7E3F7",
                        borderRadius: "10px",
                        padding: "10px",
                        fontSize: "13px",
                        outline: "none",
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                />
                <button
                    type="button"
                    onClick={handleSend}
                    style={{
                        border: "1px solid #D7E3F7",
                        backgroundColor: "#1F5FBF",
                        color: "#fff",
                        borderRadius: "10px",
                        padding: "10px 12px",
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
