// src/components/manual/ManualFilterBar.jsx
import { filterCard, inputBase } from "../../uiStyles";

function ManualFilterBar({
    allTags,
    selectedTag,
    onChangeTag,
    searchQuery,
    onChangeSearch,
}) {
    return (
        <div style={{ ...filterCard, marginBottom: "10px" }}>
            {/* 検索 + タグ */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(320px, 1fr) 220px",
                    gap: "10px",
                    alignItems: "stretch",
                }}
            >
                {/* キーワード検索 */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ fontSize: "12px", color: "#555", marginBottom: "4px" }}>
                        キーワード検索（タイトル・本文・タグ・カテゴリ）
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onChangeSearch(e.target.value)}
                        placeholder="例：清掃 手順 / トラブル 停止"
                        style={inputBase}
                    />
                </div>

                {/* タグ絞り込み */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ fontSize: "12px", color: "#555", marginBottom: "4px" }}>
                        タグで絞り込み
                    </div>
                    <select
                        value={selectedTag}
                        onChange={(e) => onChangeTag(e.target.value)}
                        style={{ ...inputBase, paddingRight: "24px" }}
                    >
                        <option value="すべて">すべて</option>
                        {allTags.map((tag) => (
                            <option key={tag} value={tag}>
                                #{tag}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* 補足 */}
            <div style={{ fontSize: "11px", color: "#777", marginTop: "6px" }}>
                ※ スペース区切りでAND検索
            </div>
        </div>
    );
}

export default ManualFilterBar;
