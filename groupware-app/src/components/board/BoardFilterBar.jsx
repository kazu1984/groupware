// src/components/board/BoardFilterBar.jsx
import { filterCard, inputBase } from "../../uiStyles";

/**
 * 絞り込みバー
 * props:
 *  - categories: string[]
 *  - categoryFilter: string
 *  - onChangeCategoryFilter: (value) => void
 *  - searchKeyword: string
 *  - onChangeSearchKeyword: (value) => void
 */
function BoardFilterBar({
    categories,
    categoryFilter,
    onChangeCategoryFilter,
    searchKeyword,
    onChangeSearchKeyword,
}) {
    return (
        <div style={filterCard}>
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "12px",
                    alignItems: "center",
                }}
            >
                {/* カテゴリ絞り込み */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                    }}
                >
                    <span style={{ fontSize: "12px", color: "#555" }}>カテゴリ：</span>
                    <select
                        value={categoryFilter}
                        onChange={(e) => onChangeCategoryFilter(e.target.value)}
                        style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                            fontSize: "12px",
                            minWidth: "140px",
                        }}
                    >
                        <option value="すべて">すべて</option>
                        {categories.map((cat) => (
                            <option key={cat || "未分類"} value={cat || "未分類"}>
                                {cat || "未分類"}
                            </option>
                        ))}
                    </select>
                </div>

                {/* キーワード検索 */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        flex: "1 1 180px",
                        minWidth: "160px",
                    }}
                >
                    <span style={{ fontSize: "12px", color: "#555" }}>キーワード：</span>
                    <input
                        type="text"
                        value={searchKeyword}
                        onChange={(e) => onChangeSearchKeyword(e.target.value)}
                        placeholder="タイトル・本文から検索"
                        style={{
                            ...inputBase,
                            marginTop: 0,
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

export default BoardFilterBar;
