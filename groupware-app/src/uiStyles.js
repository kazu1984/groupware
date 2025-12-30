// src/uiStyles.js

// 共通カードベース（横幅いっぱい使う）
export const cardBase = {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    padding: "10px 12px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    border: "1px solid #e0eac2",
    width: "100%",          // ★ メインエリアの幅を全部使う
    boxSizing: "border-box",// ★ padding込みで幅計算
};

// 各セクション用カード（TODO/Board/Manualのブロック）
export const sectionCard = {
    ...cardBase,
    marginBottom: "8px",
};

// フィルタ用カード（絞り込みバーなど）
export const filterCard = {
    ...cardBase,
    marginBottom: "8px",
};

// サイドバー用カード（マニュアルのカテゴリツリーなど）
export const sidebarCard = {
    ...cardBase,
    height: "100%",
    overflow: "auto",
};

// 入力系
export const inputBase = {
    width: "100%",
    padding: "6px 8px",
    marginTop: "4px",
    boxSizing: "border-box",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "12px",
};

export const textareaBase = {
    width: "100%",
    padding: "6px 8px",
    marginTop: "4px",
    boxSizing: "border-box",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "12px",
    resize: "vertical",
};

// ボタン系
export const primaryButton = {
    padding: "6px 14px",
    borderRadius: "20px",
    border: "none",
    backgroundColor: "#c5e579",
    color: "#2f4f10",
    fontSize: "12px",
    cursor: "pointer",
};

export const secondaryButton = {
    padding: "6px 14px",
    borderRadius: "20px",
    border: "1px solid #c5e579",
    backgroundColor: "#ffffff",
    color: "#2f4f10",
    fontSize: "12px",
    cursor: "pointer",
};

// タグ表示用
export const tagPill = {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "999px",
    fontSize: "11px",
    backgroundColor: "#f7fbe9",
    color: "#556b2f",
    border: "1px solid #d9e6b5",
};
