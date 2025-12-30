// src/components/manual/ManualCategoryTree.jsx

/**
 * props:
 *  - root: { children: Map<string, node> }  ※ node = { name, path, children: Map, count }
 *  - selectedCategoryPath: string[]
 *  - expandedKeys: string[]   // key = path.join(" > ")
 *  - onToggleExpand: (path: string[]) => void
 *  - onSelectCategory: (path: string[]) => void
 */
function ManualCategoryTree({
    root,
    selectedCategoryPath,
    expandedKeys,
    onToggleExpand,
    onSelectCategory,
}) {
    const selectedKey = (selectedCategoryPath || []).join(" > ");

    const isExpanded = (path) => expandedKeys.includes(path.join(" > "));
    const hasChildren = (node) => node?.children && node.children.size > 0;

    const renderNodes = (node, depth = 0) => {
        if (!node?.children) return null;

        const entries = Array.from(node.children.entries()).sort((a, b) =>
            a[0].localeCompare(b[0], "ja")
        );

        return entries.map(([name, child]) => {
            const key = (child.path || []).join(" > ");
            const expanded = isExpanded(child.path);
            const childrenExist = hasChildren(child);
            const selected = key === selectedKey;

            // 行クリックで：選択 + （子があれば）展開/折りたたみ
            const handleRowClick = () => {
                onSelectCategory(child.path);
                if (childrenExist) {
                    onToggleExpand(child.path);
                }
            };

            const handleArrowClick = (e) => {
                e.stopPropagation();
                if (childrenExist) {
                    onToggleExpand(child.path);
                }
            };

            return (
                <div key={key}>
                    {/* 1行 */}
                    <div
                        onClick={handleRowClick}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "4px 8px",
                            paddingLeft: `${8 + depth * 14}px`,
                            borderRadius: "6px",
                            cursor: "pointer",
                            userSelect: "none",
                            backgroundColor: selected ? "#e0f3b2" : "transparent",
                            color: selected ? "#2f4f10" : "#333",
                            fontWeight: selected ? "bold" : "normal",
                        }}
                        title={child.path?.join(" > ") || name}
                    >
                        {/* ▶ / ▼（丸囲みを出さないため button ではなく span + all:unset） */}
                        <span
                            onClick={handleArrowClick}
                            style={{
                                all: "unset",
                                width: "16px",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#556b2f",
                                cursor: childrenExist ? "pointer" : "default",
                                outline: "none",
                            }}
                        >
                            {childrenExist ? (expanded ? "▼" : "▶") : " "}
                        </span>

                        {/* アイコン（全て同じ） */}
                        <span style={{ width: "18px", textAlign: "center" }}>📁</span>

                        {/* フォルダ名 + 件数 */}
                        <span style={{ flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {name}{" "}
                            <span style={{ color: "#6b8e23", fontWeight: "normal" }}>
                                ({child.count})
                            </span>
                        </span>
                    </div>

                    {/* 子ノード */}
                    {childrenExist && expanded && (
                        <div>{renderNodes(child, depth + 1)}</div>
                    )}
                </div>
            );
        });
    };

    return (
        <div>
            {/* ルート（すべて） */}
            <div
                onClick={() => onSelectCategory([])}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    backgroundColor:
                        selectedCategoryPath.length === 0 ? "#e0f3b2" : "transparent",
                    color:
                        selectedCategoryPath.length === 0 ? "#2f4f10" : "#333",
                    fontWeight:
                        selectedCategoryPath.length === 0 ? "bold" : "normal",
                }}
            >
                <span style={{ width: "16px" }} />
                <span style={{ width: "18px", textAlign: "center" }}>📁</span>
                <span>
                    すべて{" "}
                    <span style={{ color: "#6b8e23", fontWeight: "normal" }}>
                        ({root.count})
                    </span>
                </span>
            </div>

            {/* 子フォルダ */}
            <div>{renderNodes(root, 1)}</div>
        </div>
    );

}

export default ManualCategoryTree;
