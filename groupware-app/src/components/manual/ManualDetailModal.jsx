// src/components/manual/ManualDetailModal.jsx
import { useEffect, useMemo, useState } from "react";
import { primaryButton, tagPill, inputBase, textareaBase } from "../../uiStyles";

const NEW_OPTION = "__NEW__";
const DEFAULT_CATEGORY = "未分類";

/**
 * マニュアル詳細モーダル（編集対応）
 * props:
 *  - manual
 *  - formatCategoryPath
 *  - onClose
 *  - onUpdateManual(id, updatedFields)
 *  - onDeleteManual(id)
 *  - existingCategoryPaths: string[][]
 */
function ManualDetailModal({
    manual,
    formatCategoryPath,
    onClose,
    onUpdateManual,
    onDeleteManual,
    existingCategoryPaths,
}) {
    const [isEditing, setIsEditing] = useState(false);

    const [editTitle, setEditTitle] = useState("");
    const [editTags, setEditTags] = useState("");
    const [editContent, setEditContent] = useState("");

    // セレクト用
    const [cat1Select, setCat1Select] = useState(DEFAULT_CATEGORY);
    const [cat2Select, setCat2Select] = useState("");
    const [cat3Select, setCat3Select] = useState("");

    // 新規入力用（NEW_OPTIONの時のみ有効）
    const [cat1New, setCat1New] = useState("");
    const [cat2New, setCat2New] = useState("");
    const [cat3New, setCat3New] = useState("");

    // 既存カテゴリ候補（大）
    const level1Options = useMemo(() => {
        const set = new Set();
        (existingCategoryPaths || []).forEach((path) => {
            if (path && path[0]) set.add(path[0]);
        });
        set.add(DEFAULT_CATEGORY);
        return Array.from(set);
    }, [existingCategoryPaths]);

    // 既存カテゴリ候補（中）
    const level2Options = useMemo(() => {
        const set = new Set();
        if (!cat1Select || cat1Select === NEW_OPTION) return [];
        (existingCategoryPaths || []).forEach((path) => {
            if (path && path[0] === cat1Select && path[1]) set.add(path[1]);
        });
        return Array.from(set);
    }, [existingCategoryPaths, cat1Select]);

    // 既存カテゴリ候補（小）
    const level3Options = useMemo(() => {
        const set = new Set();
        if (!cat1Select || cat1Select === NEW_OPTION) return [];
        if (!cat2Select || cat2Select === NEW_OPTION) return [];
        (existingCategoryPaths || []).forEach((path) => {
            if (path && path[0] === cat1Select && path[1] === cat2Select && path[2]) {
                set.add(path[2]);
            }
        });
        return Array.from(set);
    }, [existingCategoryPaths, cat1Select, cat2Select]);

    // Esc / 閉じる 共通処理
    const handleRequestClose = () => {
        // 編集中なら確認
        if (isEditing) {
            const ok = window.confirm(
                "編集中の内容は保存されていません。\n破棄して閉じますか？"
            );
            if (!ok) return;
        }
        onClose();
    };

    // manualが変わったら編集状態とフォーム内容をリセット
    useEffect(() => {
        if (!manual) return;

        setIsEditing(false);

        setEditTitle(manual.title || "");
        setEditTags((manual.tags || []).join(", "));
        setEditContent(manual.content || "");

        const path = Array.isArray(manual.categoryPath) ? manual.categoryPath : [];
        const c1 = path[0] || DEFAULT_CATEGORY;
        const c2 = path[1] || "";
        const c3 = path[2] || "";

        // 既存の値を基本は「選択」に入れる（新規入力は空のまま）
        setCat1Select(c1);
        setCat2Select(c2);
        setCat3Select(c3);

        setCat1New("");
        setCat2New("");
        setCat3New("");
    }, [manual]);

    // Escキー対応 + 背景スクロール禁止
    useEffect(() => {
        if (!manual) return;

        // 背景スクロール禁止
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                handleRequestClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            // 背景スクロール復元
            document.body.style.overflow = originalOverflow;
        };
    }, [manual, isEditing]); // ← isEditing を必ず含める



    if (!manual) return null;

    const isCat1NewEnabled = cat1Select === NEW_OPTION;
    const isCat2NewEnabled = cat2Select === NEW_OPTION;
    const isCat3NewEnabled = cat3Select === NEW_OPTION;

    const getFinalCategoryPart = (selected, newText, requiredDefault = false) => {
        if (selected === NEW_OPTION) {
            const v = (newText || "").trim();
            if (v) return v;
            return requiredDefault ? DEFAULT_CATEGORY : "";
        }
        if (selected) return selected;
        return requiredDefault ? DEFAULT_CATEGORY : "";
    };

    const handleDelete = () => {
        if (window.confirm("このマニュアルを削除します。よろしいですか？")) {
            onDeleteManual && onDeleteManual(manual.id);
            onClose();
        }
    };

    const handleSave = () => {
        if (!editTitle.trim()) {
            alert("タイトルを入力してください。");
            return;
        }
        if (!editContent.trim()) {
            alert("本文を入力してください。");
            return;
        }

        const cat1 = getFinalCategoryPart(cat1Select, cat1New, true); // 大カテゴリ必須
        const cat2 = getFinalCategoryPart(cat2Select, cat2New, false);
        const cat3 = getFinalCategoryPart(cat3Select, cat3New, false);

        const categoryPath = [cat1, cat2, cat3].filter((v) => v !== "");

        const tags = editTags
            .split(/[,、]/)
            .map((t) => t.trim())
            .filter((t) => t !== "");

        onUpdateManual &&
            onUpdateManual(manual.id, {
                title: editTitle.trim(),
                categoryPath,
                tags,
                content: editContent.trim(),
            });

        setIsEditing(false);
    };

    return (
        <div
            onClick={handleRequestClose}

            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "min(1200px, 96vw)",
                    height: "min(900px, 92vh)",
                    maxHeight: "92vh",
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                    padding: "18px 22px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    boxSizing: "border-box",
                }}

            >
                {/* ヘッダー */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "4px",
                        gap: "8px",
                    }}
                >
                    {isEditing ? (
                        <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            style={{
                                ...inputBase,
                                marginTop: 0,
                                fontSize: "16px",
                                fontWeight: "bold",
                            }}
                        />
                    ) : (
                        <h2
                            style={{
                                fontSize: "18px",
                                margin: 0,
                                color: "#2f4f10",
                                wordBreak: "break-all",
                            }}
                        >
                            {manual.title}
                        </h2>
                    )}

                    <button
                        type="button"
                        onClick={handleRequestClose}

                        style={{
                            border: "none",
                            background: "transparent",
                            fontSize: "18px",
                            cursor: "pointer",
                            color: "#555",
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* メタ情報 */}
                {!isEditing && (
                    <>
                        <div
                            style={{
                                fontSize: "12px",
                                color: "#777",
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "8px",
                            }}
                        >
                            <span>カテゴリ: {formatCategoryPath(manual.categoryPath)}</span>
                            {manual.createdAt && <span>最終更新: {manual.createdAt}</span>}
                        </div>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {(manual.tags || []).map((tag) => (
                                <span key={tag} style={tagPill}>
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </>
                )}

                {/* 編集フォーム（カテゴリUIを新規作成と統一） */}
                {isEditing && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                            {/* 大カテゴリ */}
                            <div style={{ flex: "1 1 170px" }}>
                                <label style={{ fontSize: "12px", color: "#555" }}>
                                    大カテゴリ（必須）
                                    <select
                                        value={cat1Select}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            setCat1Select(v);
                                            setCat2Select("");
                                            setCat3Select("");
                                            if (v !== NEW_OPTION) setCat1New("");
                                        }}
                                        style={{ ...inputBase, paddingRight: "24px" }}
                                    >
                                        <option value={DEFAULT_CATEGORY}>{DEFAULT_CATEGORY}</option>
                                        {level1Options
                                            .filter((n) => n !== DEFAULT_CATEGORY)
                                            .map((name) => (
                                                <option key={name} value={name}>
                                                    {name}
                                                </option>
                                            ))}
                                        <option value={NEW_OPTION}>新規カテゴリを入力</option>
                                    </select>
                                </label>

                                <input
                                    type="text"
                                    value={cat1New}
                                    onChange={(e) => setCat1New(e.target.value)}
                                    disabled={!isCat1NewEnabled}
                                    placeholder={
                                        isCat1NewEnabled
                                            ? "新しく追加したい場合のみ入力"
                                            : "「新規カテゴリを入力」を選択すると編集可"
                                    }
                                    style={{
                                        ...inputBase,
                                        marginTop: "4px",
                                        backgroundColor: isCat1NewEnabled ? "#fff" : "#f2f2f2",
                                    }}
                                />
                            </div>

                            {/* 中カテゴリ */}
                            <div style={{ flex: "1 1 170px" }}>
                                <label style={{ fontSize: "12px", color: "#555" }}>
                                    中カテゴリ
                                    <select
                                        value={cat2Select}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            setCat2Select(v);
                                            setCat3Select("");
                                            if (v !== NEW_OPTION) setCat2New("");
                                        }}
                                        style={{ ...inputBase, paddingRight: "24px" }}
                                        disabled={!cat1Select}
                                    >
                                        <option value="">（選択しない）</option>
                                        {level2Options.map((name) => (
                                            <option key={name} value={name}>
                                                {name}
                                            </option>
                                        ))}
                                        <option value={NEW_OPTION}>新規カテゴリを入力</option>
                                    </select>
                                </label>

                                <input
                                    type="text"
                                    value={cat2New}
                                    onChange={(e) => setCat2New(e.target.value)}
                                    disabled={!isCat2NewEnabled}
                                    placeholder={
                                        isCat2NewEnabled
                                            ? "必要な場合のみ入力"
                                            : "「新規カテゴリを入力」を選択すると編集可"
                                    }
                                    style={{
                                        ...inputBase,
                                        marginTop: "4px",
                                        backgroundColor: isCat2NewEnabled ? "#fff" : "#f2f2f2",
                                    }}
                                />
                            </div>

                            {/* 小カテゴリ */}
                            <div style={{ flex: "1 1 170px" }}>
                                <label style={{ fontSize: "12px", color: "#555" }}>
                                    小カテゴリ
                                    <select
                                        value={cat3Select}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            setCat3Select(v);
                                            if (v !== NEW_OPTION) setCat3New("");
                                        }}
                                        style={{ ...inputBase, paddingRight: "24px" }}
                                        disabled={!cat1Select}
                                    >
                                        <option value="">（選択しない）</option>
                                        {level3Options.map((name) => (
                                            <option key={name} value={name}>
                                                {name}
                                            </option>
                                        ))}
                                        <option value={NEW_OPTION}>新規カテゴリを入力</option>
                                    </select>
                                </label>

                                <input
                                    type="text"
                                    value={cat3New}
                                    onChange={(e) => setCat3New(e.target.value)}
                                    disabled={!isCat3NewEnabled}
                                    placeholder={
                                        isCat3NewEnabled
                                            ? "必要な場合のみ入力"
                                            : "「新規カテゴリを入力」を選択すると編集可"
                                    }
                                    style={{
                                        ...inputBase,
                                        marginTop: "4px",
                                        backgroundColor: isCat3NewEnabled ? "#fff" : "#f2f2f2",
                                    }}
                                />
                            </div>
                        </div>

                        {/* タグ */}
                        <div>
                            <label style={{ fontSize: "12px", color: "#555" }}>
                                タグ（カンマまたは「、」区切り）
                                <input
                                    type="text"
                                    value={editTags}
                                    onChange={(e) => setEditTags(e.target.value)}
                                    style={inputBase}
                                />
                            </label>
                        </div>
                    </div>
                )}

                {/* 本文 */}
                <div
                    style={{
                        marginTop: "8px",
                        padding: "10px",
                        backgroundColor: "#f7fbe9",
                        borderRadius: "8px",
                        flex: 1,
                        overflow: "hidden",     // ★ 中は textarea でスクロールさせる
                        display: "flex",        // ★ 子を縦に伸ばす
                        boxSizing: "border-box",
                    }}
                >
                    {isEditing ? (
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            style={{
                                ...textareaBase,
                                flex: 1,            // ★ 高さを最大に
                                width: "100%",
                                boxSizing: "border-box",
                                resize: "none",     // ★ リサイズつまみ無しでスッキリ
                                overflow: "auto",   // ★ 本文だけスクロール
                            }}
                        />
                    ) : (
                        <pre
                            style={{
                                margin: 0,
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                fontSize: "13px",
                                fontFamily: "inherit",
                                color: "#333",
                                overflow: "auto",
                                width: "100%",
                            }}
                        >
                            {manual.content}
                        </pre>
                    )}
                </div>


                {/* フッター */}
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
                    <button
                        type="button"
                        onClick={handleDelete}
                        style={{
                            padding: "6px 14px",
                            borderRadius: "20px",
                            border: "1px solid #ff9999",
                            backgroundColor: "#ffecec",
                            color: "#b22222",
                            fontSize: "12px",
                            cursor: "pointer",
                        }}
                    >
                        削除
                    </button>

                    <div style={{ display: "flex", gap: "6px" }}>
                        {isEditing ? (
                            <>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    style={{ ...primaryButton, padding: "6px 14px", fontSize: "13px" }}
                                >
                                    保存
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    style={{
                                        padding: "6px 14px",
                                        borderRadius: "20px",
                                        border: "1px solid #ccc",
                                        backgroundColor: "#f5f5f5",
                                        color: "#555",
                                        fontSize: "13px",
                                        cursor: "pointer",
                                    }}
                                >
                                    キャンセル
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(true)}
                                    style={{
                                        padding: "6px 14px",
                                        borderRadius: "20px",
                                        border: "1px solid #c5e579",
                                        backgroundColor: "#f7fbe9",
                                        color: "#2f4f10",
                                        fontSize: "13px",
                                        cursor: "pointer",
                                    }}
                                >
                                    編集
                                </button>
                                <button type="button" onClick={handleRequestClose}
                                    style={primaryButton}>
                                    閉じる
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ManualDetailModal;
