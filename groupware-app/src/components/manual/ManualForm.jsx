// src/components/manual/ManualForm.jsx
import { useState, useEffect, useMemo } from "react";
import { cardBase, inputBase, textareaBase, primaryButton } from "../../uiStyles";

/**
 * マニュアル新規追加用モーダル
 * props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - onSubmitManual: (manualInput) => void
 *      manualInput = { title, categoryPath, tags, content }
 *  - existingCategoryPaths: string[][]  // 既存マニュアルのカテゴリパス一覧
 */

const NEW_OPTION = "__NEW__";
const DEFAULT_CATEGORY = "未分類";

function ManualForm({ isOpen, onClose, onSubmitManual, existingCategoryPaths }) {
    const [title, setTitle] = useState("");
    const [tagsText, setTagsText] = useState("");
    const [content, setContent] = useState("");

    // セレクト用 state
    const [cat1Select, setCat1Select] = useState(DEFAULT_CATEGORY);
    const [cat2Select, setCat2Select] = useState("");
    const [cat3Select, setCat3Select] = useState("");

    // 新規入力用 state
    const [cat1New, setCat1New] = useState("");
    const [cat2New, setCat2New] = useState("");
    const [cat3New, setCat3New] = useState("");

    // 既存カテゴリ（大カテゴリ）候補
    const level1Options = useMemo(() => {
        const set = new Set();
        (existingCategoryPaths || []).forEach((path) => {
            if (path && path[0]) set.add(path[0]);
        });
        // 既存データに「未分類」がなくても、必ず選べるように固定で用意
        set.add(DEFAULT_CATEGORY);
        return Array.from(set);
    }, [existingCategoryPaths]);

    // 既存カテゴリ（中カテゴリ）候補：cat1Select が既存カテゴリのときのみ
    const level2Options = useMemo(() => {
        const set = new Set();
        if (!cat1Select || cat1Select === NEW_OPTION) return [];
        (existingCategoryPaths || []).forEach((path) => {
            if (path && path[0] === cat1Select && path.length >= 2 && path[1]) {
                set.add(path[1]);
            }
        });
        return Array.from(set);
    }, [existingCategoryPaths, cat1Select]);

    // 既存カテゴリ（小カテゴリ）候補：cat1Select, cat2Select が既存カテゴリのときのみ
    const level3Options = useMemo(() => {
        const set = new Set();
        if (!cat1Select || cat1Select === NEW_OPTION) return [];
        if (!cat2Select || cat2Select === NEW_OPTION) return [];
        (existingCategoryPaths || []).forEach((path) => {
            if (
                path &&
                path[0] === cat1Select &&
                path[1] === cat2Select &&
                path.length >= 3 &&
                path[2]
            ) {
                set.add(path[2]);
            }
        });
        return Array.from(set);
    }, [existingCategoryPaths, cat1Select, cat2Select]);

    // モーダルが開かれたら入力リセット
    useEffect(() => {
        if (isOpen) {
            setTitle("");
            setTagsText("");
            setContent("");

            setCat1New("");
            setCat2New("");
            setCat3New("");

            // 大カテゴリは必ず「未分類」または既存カテゴリのどれか
            // 既存がある場合は先頭の既存を選ぶ（ただし "未分類" を最優先にするなら DEFAULT_CATEGORY 固定でもOK）
            setCat1Select(DEFAULT_CATEGORY);

            setCat2Select("");
            setCat3Select("");
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // selected が NEW_OPTION の時は newText を採用。空なら「未分類」（特に大カテゴリで安全）
    const getFinalCategoryPart = (selected, newText, isRequiredDefault = false) => {
        if (selected === NEW_OPTION) {
            const v = newText.trim();
            if (v) return v;
            return isRequiredDefault ? DEFAULT_CATEGORY : "";
        }
        if (selected) return selected;
        return isRequiredDefault ? DEFAULT_CATEGORY : "";
    };

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

        // 大カテゴリは必須扱い（必ず未分類以上になる）
        const cat1 = getFinalCategoryPart(cat1Select, cat1New, true);
        const cat2 = getFinalCategoryPart(cat2Select, cat2New, false);
        const cat3 = getFinalCategoryPart(cat3Select, cat3New, false);

        const categoryPath = [cat1, cat2, cat3].filter((v) => v !== "");

        const tags = tagsText
            .split(/[,、]/)
            .map((t) => t.trim())
            .filter((t) => t !== "");

        onSubmitManual({
            title: title.trim(),
            categoryPath,
            tags,
            content: content.trim(),
        });

        onClose();
    };

    // 「新規カテゴリを入力」のときだけ入力可
    const isCat1NewEnabled = cat1Select === NEW_OPTION;
    const isCat2NewEnabled = cat2Select === NEW_OPTION;
    const isCat3NewEnabled = cat3Select === NEW_OPTION;

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1100,
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    ...cardBase,
                    width: "min(1100px, 96vw)",
                    height: "min(860px, 92vh)",
                    maxHeight: "92vh",
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
                    }}
                >
                    <h2
                        style={{
                            fontSize: "16px",
                            margin: 0,
                            color: "#2f4f10",
                        }}
                    >
                        新規マニュアルを追加
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
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

                {/* 本体フォーム */}
                <form
                    onSubmit={handleSubmit}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        flex: 1,
                        overflow: "auto",
                        paddingRight: "2px",
                    }}
                >
                    {/* タイトル */}
                    <div>
                        <label style={{ fontSize: "12px", color: "#555" }}>
                            タイトル
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="例：製造ラインの立ち上げ手順"
                                style={inputBase}
                            />
                        </label>
                    </div>

                    {/* カテゴリ（既存選択 + 新規入力） */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {/* 大カテゴリ */}
                        <div style={{ flex: "1 1 150px" }}>
                            <label style={{ fontSize: "12px", color: "#555" }}>
                                大カテゴリ（必須）
                                <select
                                    value={cat1Select}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        setCat1Select(v);
                                        setCat2Select("");
                                        setCat3Select("");
                                        if (v !== NEW_OPTION) {
                                            setCat1New("");
                                        }
                                    }}
                                    style={{
                                        ...inputBase,
                                        paddingRight: "24px",
                                    }}
                                >
                                    {/* 「選択なし」は無し。先頭は未分類 */}
                                    <option value={DEFAULT_CATEGORY}>{DEFAULT_CATEGORY}</option>

                                    {/* 既存カテゴリ（未分類は二重表示防止） */}
                                    {level1Options
                                        .filter((name) => name !== DEFAULT_CATEGORY)
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
                                placeholder={
                                    isCat1NewEnabled
                                        ? "新しく追加したい場合のみ入力"
                                        : "「新規カテゴリを入力」を選択すると編集可"
                                }
                                disabled={!isCat1NewEnabled}
                                style={{
                                    ...inputBase,
                                    marginTop: "4px",
                                    backgroundColor: isCat1NewEnabled ? "#fff" : "#f2f2f2",
                                }}
                            />
                        </div>

                        {/* 中カテゴリ */}
                        <div style={{ flex: "1 1 150px" }}>
                            <label style={{ fontSize: "12px", color: "#555" }}>
                                中カテゴリ
                                <select
                                    value={cat2Select}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        setCat2Select(v);
                                        setCat3Select("");
                                        if (v !== NEW_OPTION) {
                                            setCat2New("");
                                        }
                                    }}
                                    style={{
                                        ...inputBase,
                                        paddingRight: "24px",
                                    }}
                                    // 大カテゴリが新規入力の場合でも中カテゴリは選択可能にして良いが、
                                    // 今は「大カテゴリが決まっていること」を前提にしているのでこの条件でOK
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
                                placeholder={
                                    isCat2NewEnabled
                                        ? "必要な場合のみ入力"
                                        : "「新規カテゴリを入力」を選択すると編集可"
                                }
                                disabled={!isCat2NewEnabled}
                                style={{
                                    ...inputBase,
                                    marginTop: "4px",
                                    backgroundColor: isCat2NewEnabled ? "#fff" : "#f2f2f2",
                                }}
                            />
                        </div>

                        {/* 小カテゴリ */}
                        <div style={{ flex: "1 1 150px" }}>
                            <label style={{ fontSize: "12px", color: "#555" }}>
                                小カテゴリ
                                <select
                                    value={cat3Select}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        setCat3Select(v);
                                        if (v !== NEW_OPTION) {
                                            setCat3New("");
                                        }
                                    }}
                                    style={{
                                        ...inputBase,
                                        paddingRight: "24px",
                                    }}
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
                                placeholder={
                                    isCat3NewEnabled
                                        ? "必要な場合のみ入力"
                                        : "「新規カテゴリを入力」を選択すると編集可"
                                }
                                disabled={!isCat3NewEnabled}
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
                                value={tagsText}
                                onChange={(e) => setTagsText(e.target.value)}
                                placeholder="例：設備, 起動, 日次"
                                style={inputBase}
                            />
                        </label>
                    </div>

                    {/* 本文 */}
                    <div>
                        <label style={{ fontSize: "12px", color: "#555" }}>
                            本文
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="手順や注意点などを記載してください。"
                                rows={6}
                                style={textareaBase}
                            />
                        </label>
                    </div>

                    {/* ボタン */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: "8px",
                            marginTop: "4px",
                        }}
                    >
                        <button
                            type="button"
                            onClick={onClose}
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
                        <button
                            type="submit"
                            style={{
                                ...primaryButton,
                                padding: "6px 16px",
                                fontSize: "13px",
                            }}
                        >
                            追加する
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ManualForm;
