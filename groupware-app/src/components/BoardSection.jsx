// src/components/BoardSection.jsx
import { useMemo, useState } from "react";
import BoardForm from "./board/BoardForm";
import BoardFilterBar from "./board/BoardFilterBar";
import BoardPostList from "./board/BoardPostList";

/**
 * 連絡ボード画面（司令塔）
 * props:
 *  - posts
 *  - onAddPost
 *  - onTogglePin
 *  - onUpdatePost
 *  - onDeletePost
 */
function BoardSection({
    posts,
    onAddPost,
    onTogglePin,
    onUpdatePost,
    onDeletePost,
}) {
    const [categoryFilter, setCategoryFilter] = useState("すべて");
    const [searchKeyword, setSearchKeyword] = useState("");

    // カテゴリ一覧（重複排除）
    const categories = useMemo(() => {
        const set = new Set();
        posts.forEach((p) => {
            if (p.category) set.add(p.category);
        });
        return Array.from(set);
    }, [posts]);

    const normalizedKeyword = searchKeyword.trim().toLowerCase();

    // フィルタ＆ソート
    const filteredAndSortedPosts = useMemo(() => {
        const filtered = posts.filter((post) => {
            // カテゴリ絞り込み
            if (
                categoryFilter !== "すべて" &&
                (post.category || "未分類") !== categoryFilter
            ) {
                return false;
            }

            // キーワード検索（タイトル＋本文）
            if (normalizedKeyword) {
                const haystack = `${post.title ?? ""}\n${post.content ?? ""}`.toLowerCase();
                if (!haystack.includes(normalizedKeyword)) {
                    return false;
                }
            }

            return true;
        });

        // ソート：ピン留め → 投稿日時（createdAt 降順）
        return [...filtered].sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;

            const aTime = a.createdAt || "";
            const bTime = b.createdAt || "";
            return bTime.localeCompare(aTime);
        });
    }, [posts, categoryFilter, normalizedKeyword]);

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr)",
                gap: "12px",
            }}
        >
            <BoardForm onAddPost={onAddPost} />

            <BoardFilterBar
                categories={categories}
                categoryFilter={categoryFilter}
                onChangeCategoryFilter={setCategoryFilter}
                searchKeyword={searchKeyword}
                onChangeSearchKeyword={setSearchKeyword}
            />

            <BoardPostList
                posts={filteredAndSortedPosts}
                onTogglePin={onTogglePin}
                onUpdatePost={onUpdatePost}
                onDeletePost={onDeletePost}
            />
        </div>
    );
}

export default BoardSection;
