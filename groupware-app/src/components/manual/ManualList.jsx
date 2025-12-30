// src/components/manual/ManualList.jsx
import { sectionCard, tagPill, secondaryButton } from "../../uiStyles";

/**
 * マニュアル一覧カード
 * props:
 *  - manuals: Manual[]
 *  - formatCategoryPath: (path) => string
 *  - onOpenDetail: (manual) => void
 */
function ManualList({ manuals, formatCategoryPath, onOpenDetail }) {
    if (manuals.length === 0) {
        return <p style={{ color: "#777" }}>該当するマニュアルはありません。</p>;
    }

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
            }}
        >
            {manuals.map((manual) => (
                <article
                    key={manual.id}
                    style={{
                        ...sectionCard,
                        marginBottom: 0,
                        borderLeft: "4px solid #c5e579",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "8px",
                            marginBottom: "4px",
                        }}
                    >
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h2
                                style={{
                                    fontSize: "15px",
                                    margin: 0,
                                    color: "#2f4f10",
                                    wordBreak: "break-all",
                                }}
                            >
                                {manual.title}
                            </h2>
                            <div
                                style={{
                                    fontSize: "11px",
                                    color: "#777",
                                    marginTop: "2px",
                                }}
                            >
                                カテゴリ: {formatCategoryPath(manual.categoryPath)}
                            </div>
                            {manual.createdAt && (
                                <div
                                    style={{
                                        fontSize: "11px",
                                        color: "#777",
                                        marginTop: "2px",
                                    }}
                                >
                                    最終更新: {manual.createdAt}
                                </div>
                            )}
                        </div>

                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "4px",
                                justifyContent: "flex-end",
                                alignItems: "flex-start",
                                maxWidth: "180px",
                            }}
                        >
                            {(manual.tags || []).map((tag) => (
                                <span key={tag} style={tagPill}>
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div style={{ textAlign: "right", marginTop: "6px" }}>
                        <button
                            type="button"
                            onClick={() => onOpenDetail(manual)}
                            style={secondaryButton}
                        >
                            詳細を見る
                        </button>
                    </div>
                </article>
            ))}
        </div>
    );
}

export default ManualList;
