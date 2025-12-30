// src/components/dashboard/DashboardSection.jsx
import { useMemo } from "react";
import DashboardCard from "./DashboardCard";

/** ====== date helpers ====== */
const parseDateLoose = (value) => {
    if (!value) return 0;
    const t = Date.parse(String(value).replace(/\//g, "-"));
    return Number.isNaN(t) ? 0 : t;
};

const normalizeDate = (yyyy_mm_dd) => {
    if (!yyyy_mm_dd) return null;
    const d = new Date(yyyy_mm_dd + "T00:00:00");
    return Number.isNaN(d.getTime()) ? null : d;
};

const daysDiffFromToday = (yyyy_mm_dd) => {
    const d = normalizeDate(yyyy_mm_dd);
    if (!d) return null;

    const today = new Date();
    const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const d0 = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    const diffMs = d0.getTime() - t0.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

/** ====== deadline display ====== */
const deadlineLabel = (diff) => {
    if (diff === null) return "";
    if (diff < 0) return `期限超過（${Math.abs(diff)}日前）`;
    if (diff === 0) return "今日まで";
    if (diff === 1) return "明日まで";
    return `${diff}日後まで`;
};

const deadlineColor = (diff) => {
    if (diff === null) return "#6B7280";
    if (diff < 0) return "#B42318"; // 赤
    if (diff === 0) return "#D97706"; // オレンジ
    if (diff <= 3) return "#2563EB"; // 青（近い）
    return "#6B7280";
};

const priorityRank = (priority) => {
    const rank = { 高: 0, 中: 1, 低: 2 };
    return rank[priority] ?? 9;
};

function DashboardSection({
    todos = [],
    boardPosts = [],
    manuals = [],
    onGoTodo,
    onGoBoard,
    onGoManual,
    onOpenBoardPost,
    onOpenManual,
}) {
    /** 期限が今日〜3日以内（期限超過含む）を最大5件 */
    const todoItems = useMemo(() => {
        return (todos || [])
            .filter((t) => !t.completed)
            .map((t) => ({ ...t, _diff: daysDiffFromToday(t.deadline) }))
            .filter((t) => t._diff !== null && t._diff <= 3)
            .sort((a, b) => {
                if (a._diff !== b._diff) return a._diff - b._diff;
                return priorityRank(a.priority) - priorityRank(b.priority);
            })
            .slice(0, 5);
    }, [todos]);

    /** 連絡：ピン留め優先 → 新しい順 → 最大5件 */
    const dashboardPosts = useMemo(() => {
        return (boardPosts || [])
            .slice()
            .sort((a, b) => {
                if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
                const ta = parseDateLoose(a.createdAt);
                const tb = parseDateLoose(b.createdAt);
                return tb - ta;
            })
            .slice(0, 5);
    }, [boardPosts]);

    /** マニュアル：更新日（updatedAt優先） → 最大5件 */
    const recentManuals = useMemo(() => {
        return (manuals || [])
            .slice()
            .sort((a, b) => {
                const ta = parseDateLoose(a.updatedAt ?? a.createdAt);
                const tb = parseDateLoose(b.updatedAt ?? b.createdAt);
                return tb - ta;
            })
            .slice(0, 5);
    }, [manuals]);

    return (
        <div style={{ width: "100%", boxSizing: "border-box", padding: "16px" }}>
            {/* タイトル */}
            <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "18px", fontWeight: "bold", color: "#1F5FBF" }}>
                    ダッシュボード
                </div>
                <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "4px" }}>
                    今日のタスク・重要連絡・最近更新されたマニュアルをまとめて確認できます
                </div>
            </div>

            {/* カード */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(12, 1fr)",
                    gap: "12px",
                    alignItems: "stretch",
                }}
            >
                {/* 今日のTODO */}
                <div style={{ gridColumn: "span 6" }}>
                    <DashboardCard title="今日のTODO" actionLabel="すべて見る" onActionClick={onGoTodo}>
                        {todoItems.length === 0 ? (
                            <div style={{ fontSize: "13px", color: "#374151" }}>
                                期限が近い未完了TODOはありません ✅
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {todoItems.map((t) => {
                                    const diff = t._diff;
                                    return (
                                        <div key={t.id} className="dashboard-row">
                                            <div style={{ minWidth: 0 }}>
                                                <div className="dashboard-item-title" title={t.title}>
                                                    {t.title}
                                                </div>
                                                <div className="dashboard-item-sub">重要度：{t.priority}</div>
                                            </div>

                                            {/* 期限はロジック依存なので inline で色を上書き */}
                                            <div
                                                className="dashboard-item-meta"
                                                title={t.deadline}
                                                style={{ color: deadlineColor(diff), fontWeight: "bold" }}
                                            >
                                                {deadlineLabel(diff)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="dashboard-row-supplement">
                            ※ 期限が今日〜3日以内（期限超過含む）を表示
                        </div>
                    </DashboardCard>
                </div>

                {/* 連絡ボード */}
                <div style={{ gridColumn: "span 6" }}>
                    <DashboardCard title="連絡ボード" actionLabel="連絡ボードへ" onActionClick={onGoBoard}>
                        {dashboardPosts.length === 0 ? (
                            <div style={{ fontSize: "13px", color: "#374151" }}>連絡はありません</div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {dashboardPosts.map((p) => (
                                    <div
                                        key={p.id}
                                        className="dashboard-row"
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => onOpenBoardPost?.(p)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") onOpenBoardPost?.(p);
                                        }}
                                        style={{ cursor: "pointer" }}
                                        title="クリックで詳細を表示"
                                    >
                                        <div style={{ minWidth: 0 }}>
                                            <div className="dashboard-item-title" title={p.title}>
                                                {p.pinned ? "📌 " : ""}{p.title}
                                            </div>
                                            <div className="dashboard-item-sub">
                                                {p.category ? `カテゴリ：${p.category}` : "カテゴリ：未設定"}
                                            </div>
                                        </div>
                                        <div className="dashboard-item-meta" title={p.createdAt}>
                                            {p.createdAt || ""}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="dashboard-row-supplement">※ 連絡を最大5件表示（新しい順）</div>
                    </DashboardCard>
                </div>

                {/* 最近のマニュアル */}
                <div style={{ gridColumn: "span 12" }}>
                    <DashboardCard
                        title="最近更新されたマニュアル"
                        actionLabel="マニュアルへ"
                        onActionClick={onGoManual}
                    >
                        {recentManuals.length === 0 ? (
                            <div style={{ fontSize: "13px", color: "#374151" }}>
                                マニュアルがまだありません 📘
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {recentManuals.map((m) => {
                                    const when = m.updatedAt ?? m.createdAt ?? "";
                                    const categoryText = Array.isArray(m.categoryPath)
                                        ? m.categoryPath.join(" / ")
                                        : "";

                                    return (
                                        <div
                                            key={m.id}
                                            className="dashboard-row"
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => onOpenManual?.(m.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") onOpenManual?.(m.id);
                                            }}
                                            style={{ cursor: "pointer" }}
                                            title="クリックで詳細を表示"
                                        >
                                            <div style={{ minWidth: 0 }}>
                                                <div className="dashboard-item-title" title={m.title}>
                                                    📘 {m.title}
                                                </div>

                                                <div className="dashboard-item-sub">
                                                    {categoryText ? `カテゴリ：${categoryText}` : "カテゴリ：未分類"}
                                                </div>

                                                {Array.isArray(m.tags) && m.tags.length > 0 && (
                                                    <div className="dashboard-item-sub">
                                                        タグ：{m.tags.slice(0, 3).map((t) => `#${t}`).join(" ")}
                                                        {m.tags.length > 3 ? " …" : ""}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="dashboard-item-meta" title={when}>
                                                {when}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="dashboard-row-supplement">※ 最大5件（更新日の新しい順）</div>
                    </DashboardCard>
                </div>
            </div>
        </div>
    );
}

export default DashboardSection;
