// src/components/ManualSection.jsx
import { useEffect, useMemo, useState } from "react";
import { cardBase } from "../uiStyles";
import ManualForm from "./manual/ManualForm";
import ManualFilterBar from "./manual/ManualFilterBar";
import ManualList from "./manual/ManualList";
import ManualDetailModal from "./manual/ManualDetailModal";
import ManualCategoryTree from "./manual/ManualCategoryTree";

/**
 * マニュアル一覧画面（画面全体の司令塔）
 */
function ManualSection({
    manuals,
    onAddManual,
    onUpdateManual,
    onDeleteManual,
    openManualId,          // 外部から「このIDを開いて」と指定される
    onConsumedOpenManual,  // openManualId を使い終わったら呼ぶ
    openedFromDashboard,   // ダッシュボード or AIチャットから来たとき true
    onBackToDashboard,     // 閉じたときの戻り先 (App 側で home / chat を制御)
}) {
    const [selectedCategoryPath, setSelectedCategoryPath] = useState([]);
    const [selectedTag, setSelectedTag] = useState("すべて");
    const [expandedKeys, setExpandedKeys] = useState([]);
    const [selectedManual, setSelectedManual] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // ==== 外部から指定された openManualId を自動で開く ====
    useEffect(() => {
        if (!openManualId) return;
        const target = manuals.find((m) => m.id === openManualId);
        if (target) {
            setSelectedManual(target);
        }
        onConsumedOpenManual && onConsumedOpenManual();
    }, [openManualId, manuals, onConsumedOpenManual]);

    // 全タグ一覧
    const allTags = useMemo(() => {
        const set = new Set();
        manuals.forEach((m) => {
            (m.tags || []).forEach((t) => set.add(t));
        });
        return Array.from(set);
    }, [manuals]);

    // 既存マニュアルのカテゴリパス一覧（例: ["共通マニュアル","清掃"] など）
    const existingCategoryPaths = useMemo(
        () =>
            manuals
                .map((m) => m.categoryPath)
                .filter((path) => Array.isArray(path) && path.length > 0),
        [manuals]
    );

    // カテゴリツリー構造
    const categoryTree = useMemo(() => {
        const root = {
            name: "すべて",
            path: [], // ルートは空配列
            children: new Map(),
            count: manuals.length, // 全件数
        };

        manuals.forEach((m) => {
            const path = m.categoryPath;
            if (!Array.isArray(path) || path.length === 0) return;

            let node = root;

            path.forEach((name, idx) => {
                let child = node.children.get(name);
                if (!child) {
                    child = {
                        name,
                        path: path.slice(0, idx + 1),
                        children: new Map(),
                        count: 0,
                    };
                    node.children.set(name, child);
                }
                child.count += 1;
                node = child;
            });
        });

        return root;
    }, [manuals]);

    const matchesCategory = (manual, selectedPath) => {
        if (!selectedPath || selectedPath.length === 0) return true;
        if (!Array.isArray(manual.categoryPath)) return false;
        if (manual.categoryPath.length < selectedPath.length) return false;
        for (let i = 0; i < selectedPath.length; i++) {
            if (manual.categoryPath[i] !== selectedPath[i]) return false;
        }
        return true;
    };

    const matchesTag = (manual, tag) => {
        if (!tag || tag === "すべて") return true;
        return (manual.tags || []).includes(tag);
    };

    const formatCategoryPath = (path) => {
        if (!Array.isArray(path) || path.length === 0) return "未分類";
        return path.join(" > ");
    };

    const handleToggleExpand = (path) => {
        const key = path.join(" > ");
        setExpandedKeys((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        );
    };

    const handleSelectCategory = (path) => {
        setSelectedCategoryPath(path);
    };

    // 新規マニュアル追加時
    const handleSubmitManual = (manualInput) => {
        onAddManual(manualInput);

        const categoryPath = manualInput.categoryPath || [];
        if (categoryPath.length > 0) {
            setSelectedCategoryPath(categoryPath);

            const newExpanded = [...expandedKeys];
            for (let depth = 1; depth <= categoryPath.length; depth++) {
                const sub = categoryPath.slice(0, depth);
                const key = sub.join(" > ");
                if (!newExpanded.includes(key)) newExpanded.push(key);
            }
            setExpandedKeys(newExpanded);
        }
        setSelectedTag("すべて");
    };

    const handleOpenDetail = (manual) => setSelectedManual(manual);

    // ★ 閉じるときの挙動：Dashboard/AIチャットから来ていたら onBackToDashboard を呼ぶ
    const handleCloseDetail = () => {
        setSelectedManual(null);
        if (openedFromDashboard && onBackToDashboard) {
            onBackToDashboard();
        }
    };

    const normalizeText = (s) => (s ?? "").toString().toLowerCase().trim();

    const matchesKeyword = (manual, query) => {
        const q = normalizeText(query);
        if (!q) return true;

        // スペース区切りで AND 検索
        const terms = q.split(/\s+/).filter(Boolean);
        if (terms.length === 0) return true;

        const haystack = normalizeText(
            [
                manual.title,
                manual.content,
                (manual.tags || []).join(" "),
                Array.isArray(manual.categoryPath)
                    ? manual.categoryPath.join(" ")
                    : "",
            ].join(" ")
        );

        return terms.every((t) => haystack.includes(t));
    };

    const filteredManuals = useMemo(() => {
        return manuals.filter(
            (m) =>
                matchesCategory(m, selectedCategoryPath) &&
                matchesTag(m, selectedTag) &&
                matchesKeyword(m, searchQuery)
        );
    }, [manuals, selectedCategoryPath, selectedTag, searchQuery]);

    return (
        <>
            {/* メインエリア */}
            <div
                style={{
                    ...cardBase,
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "12px",
                }}
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "260px minmax(0, 1fr)",
                        gap: "16px",
                        width: "100%",
                        boxSizing: "border-box",
                        alignItems: "flex-start",
                    }}
                >
                    {/* 左：カテゴリツリー */}
                    <aside
                        style={{
                            backgroundColor: "#ffffff",
                            borderRadius: "8px",
                            padding: "10px",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                            border: "1px solid #e0eac2",
                            boxSizing: "border-box",
                        }}
                    >
                        <h2
                            style={{
                                fontSize: "14px",
                                margin: "0 0 8px",
                                color: "#2f4f10",
                            }}
                        >
                            カテゴリツリー
                        </h2>

                        <ManualCategoryTree
                            root={categoryTree}
                            selectedCategoryPath={selectedCategoryPath}
                            expandedKeys={expandedKeys}
                            onToggleExpand={handleToggleExpand}
                            onSelectCategory={handleSelectCategory}
                        />
                    </aside>

                    {/* 右：フィルタ＋一覧 */}
                    <section
                        style={{
                            width: "100%",
                            boxSizing: "border-box",
                        }}
                    >
                        {/* 右上ボタン */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                marginBottom: "8px",
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(true)}
                                style={{
                                    padding: "6px 12px",
                                    borderRadius: "20px",
                                    border: "1px solid #c5e579",
                                    backgroundColor: "#f7fbe9",
                                    color: "#2f4f10",
                                    fontSize: "13px",
                                    cursor: "pointer",
                                }}
                            >
                                ＋ 新規マニュアルを追加
                            </button>
                        </div>

                        <ManualFilterBar
                            allTags={allTags}
                            selectedTag={selectedTag}
                            onChangeTag={setSelectedTag}
                            searchQuery={searchQuery}
                            onChangeSearch={setSearchQuery}
                        />

                        <ManualList
                            manuals={filteredManuals}
                            formatCategoryPath={formatCategoryPath}
                            onOpenDetail={handleOpenDetail}
                        />
                    </section>
                </div>
            </div>

            {/* 新規作成モーダル */}
            <ManualForm
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmitManual={handleSubmitManual}
                existingCategoryPaths={existingCategoryPaths}
            />

            {/* 詳細モーダル（ここで handleCloseDetail を渡す） */}
            <ManualDetailModal
                manual={selectedManual}
                formatCategoryPath={formatCategoryPath}
                onClose={handleCloseDetail}
                onUpdateManual={onUpdateManual}
                onDeleteManual={onDeleteManual}
                existingCategoryPaths={existingCategoryPaths}
            />
        </>
    );
}

export default ManualSection;
