// src/App.jsx
import { useEffect, useMemo, useState } from "react";

import ManualSection from "./components/ManualSection";
import AiChatSection from "./components/chat/AiChatSection";
import GlobalSearchResults from "./components/search/GlobalSearchResults";
import { buildAiKnowledge } from "./aiData";
import { apiGet, apiPost, apiPatch, apiDelete } from "./api/client";

const menuItems = [
  { id: "manual", label: "マニュアル" },
  { id: "chat", label: "AIチャット" },
];

// ===== 全体検索 helpers =====
const normalize = (s) => (s ?? "").toString().toLowerCase().trim();

const includesAllTerms = (text, query) => {
  const q = normalize(query);
  if (!q) return false;
  const terms = q.split(/\s+/).filter(Boolean);
  const hay = normalize(text);
  return terms.every((t) => hay.includes(t));
};

function App() {
  const [activeMenu, setActiveMenu] = useState("manual");

  // 全体検索
  const [globalQuery, setGlobalQuery] = useState("");
  const [isGlobalSearching, setIsGlobalSearching] = useState(false);

  // AIチャットの履歴保管（消えないようにする）
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");

  // マニュアル（DB）
  const [manuals, setManuals] = useState([]);

  // マニュアル詳細モーダル用（外部から開く）
  const [openManualId, setOpenManualId] = useState(null);
  const [manualReturnMenu, setManualReturnMenu] = useState("chat");

  // ===== 初回ロード：manuals =====
  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet("/manuals");
        setManuals(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("マニュアルの取得に失敗しました", e);
      }
    })();
  }, []);

  // ===== Manual handlers（DB）=====
  const handleAddManual = async (manualInput) => {
    try {
      const created = await apiPost("/manuals", {
        title: manualInput.title,
        content: manualInput.content,
        categoryPath: manualInput.categoryPath || [],
        tags: manualInput.tags || [],
      });
      setManuals((prev) => [created, ...prev]);
    } catch (e) {
      console.error("マニュアル追加に失敗しました", e);
    }
  };

  const handleUpdateManual = async (id, updatedFields) => {
    try {
      const updated = await apiPatch(`/manuals/${id}`, {
        title: updatedFields.title,
        content: updatedFields.content,
        categoryPath: updatedFields.categoryPath,
        tags: updatedFields.tags,
      });

      setManuals((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...updated } : m))
      );
    } catch (e) {
      console.error("マニュアル更新に失敗しました", e);
    }
  };

  const handleDeleteManual = async (id) => {
    try {
      await apiDelete(`/manuals/${id}`);
      setManuals((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      console.error("マニュアル削除に失敗しました", e);
    }
  };

  // ===== 全体検索結果（表示用）=====
  const searchResults = useMemo(() => {
    const q = globalQuery.trim();
    if (!q) return [];

    const results = [];

    manuals.forEach((m) => {
      const text = [
        m.title,
        m.content,
        (m.tags || []).join(" "),
        Array.isArray(m.categoryPath) ? m.categoryPath.join(" ") : "",
      ].join(" ");

      if (includesAllTerms(text, q)) {
        results.push({
          type: "manual",
          id: m.id,
          title: m.title,
          meta: Array.isArray(m.categoryPath)
            ? `カテゴリ：${m.categoryPath.join(" / ")}`
            : "カテゴリ：未分類",
        });
      }
    });

    return results.slice(0, 10);
  }, [globalQuery, manuals]);

  // 検索結果クリック時
  const handleClickSearchResult = (result) => {
    if (!result) return;

    if (result.type === "manual") {
      // 「検索候補 → マニュアル詳細 → 閉じたら“今いた画面”に戻る」
      setManualReturnMenu(activeMenu);
      setOpenManualId(result.id);
      setActiveMenu("manual");

      setIsGlobalSearching(false);
      return;
    }
  };

  const aiKnowledge = useMemo(
    // いまはマニュアルのみでOK（aiData 側は既存実装をそのまま使えるように空配列渡す）
    () => buildAiKnowledge([], [], manuals),
    [manuals]
  );

  const getPageTitle = () => {
    const item = menuItems.find((m) => m.id === activeMenu);
    return item ? item.label : "";
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#F4F8FF",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* サイドバー */}
      <aside
        style={{
          width: "220px",
          flexShrink: 0,
          borderRight: "1px solid #D7E3F7",
          padding: "16px 12px",
          background:
            "linear-gradient(180deg, #FFFFFF 0%, #F5F9FF 45%, #EEF5FF 100%)",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            fontSize: "16px",
            fontWeight: "bold",
            marginBottom: "12px",
            color: "#1F5FBF",
          }}
        >
          社内マニュアル
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "#5B7DB1",
            marginBottom: "16px",
          }}
        >
          マニュアル管理 + AI検索
        </div>

        <nav>
          {menuItems.map((item) => {
            const isActive = item.id === activeMenu;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveMenu(item.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: "1px solid transparent",
                  borderRadius: "10px",
                  padding: "8px 10px",
                  marginBottom: "6px",
                  cursor: "pointer",
                  backgroundColor: isActive ? "#EAF2FF" : "transparent",
                  color: isActive ? "#1F5FBF" : "#23406B",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>{item.id === "manual" ? "📁" : "🤖"}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* メイン */}
      <main
        style={{
          flex: 1,
          width: "100%",
          minWidth: 0,
          padding: "16px",
          boxSizing: "border-box",
          overflowX: "hidden",
        }}
      >
        <header
          style={{
            marginBottom: "12px",
            borderBottom: "1px solid #D7E3F7",
            paddingBottom: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <h1
            style={{
              fontSize: "18px",
              margin: 0,
              color: "#1F5FBF",
              whiteSpace: "nowrap",
            }}
          >
            {getPageTitle()}
          </h1>

          {/* 全体検索（マニュアルのみ） */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              flex: 1,
              minWidth: 0,
            }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                maxWidth: "520px",
                minWidth: "240px",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "14px",
                  color: "#6B7280",
                  pointerEvents: "none",
                }}
              >
                🔍
              </span>

              {globalQuery.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    setGlobalQuery("");
                    setIsGlobalSearching(false);
                  }}
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: "1px solid #D7E3F7",
                    backgroundColor: "#F5F9FF",
                    color: "#1F5FBF",
                    borderRadius: "999px",
                    padding: "4px 10px",
                    cursor: "pointer",
                    fontSize: "12px",
                    lineHeight: 1,
                  }}
                  title="クリア"
                >
                  クリア
                </button>
              )}

              <input
                value={globalQuery}
                onChange={(e) => setGlobalQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setIsGlobalSearching(true);
                }}
                placeholder="全体検索（マニュアル）"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  border: "1px solid #D7E3F7",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "10px",
                  padding: globalQuery.trim()
                    ? "8px 72px 8px 30px"
                    : "8px 10px 8px 30px",
                  fontSize: "13px",
                  outline: "none",
                }}
              />

              {/* ドロップダウン（入力中の候補） */}
              {globalQuery.trim() && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    marginTop: "6px",
                    backgroundColor: "#fff",
                    border: "1px solid #D7E3F7",
                    borderRadius: "10px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                    zIndex: 3000,
                    maxHeight: "320px",
                    overflowY: "auto",
                  }}
                >
                  {searchResults.length === 0 ? (
                    <div style={{ padding: "10px", fontSize: "13px", color: "#6B7280" }}>
                      該当する結果はありません
                    </div>
                  ) : (
                    searchResults.map((r) => (
                      <div
                        key={`${r.type}-${r.id}`}
                        onClick={() => handleClickSearchResult(r)}
                        style={{
                          padding: "8px 10px",
                          borderBottom: "1px solid #EEF2FF",
                          display: "flex",
                          gap: "8px",
                          alignItems: "center",
                          cursor: "pointer",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "2px 6px",
                            borderRadius: "999px",
                            backgroundColor: "#EAF7EA",
                            color: "#2F7D32",
                            whiteSpace: "nowrap",
                          }}
                        >
                          マニュアル
                        </span>

                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "13px",
                              color: "#111827",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {r.title}
                          </div>
                          {r.meta && (
                            <div style={{ fontSize: "11px", color: "#6B7280" }}>
                              {r.meta}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Enter後の検索結果画面（任意） */}
        {isGlobalSearching && globalQuery.trim() && (
          <GlobalSearchResults
            query={globalQuery}
            todos={[]}          // 使わない（互換のため空配列）
            boardPosts={[]}     // 使わない（互換のため空配列）
            manuals={manuals}
            onClickResult={handleClickSearchResult}
          />
        )}

        {activeMenu === "manual" && (
          <ManualSection
            manuals={manuals}
            onAddManual={handleAddManual}
            onUpdateManual={handleUpdateManual}
            onDeleteManual={handleDeleteManual}
            openManualId={openManualId}
            onConsumedOpenManual={() => setOpenManualId(null)}
            openedFromDashboard={true} // 互換のため true 扱い（戻りを使う）
            onBackToDashboard={() => {
              // 「詳細モーダルを閉じた後」戻り先
              setActiveMenu(manualReturnMenu);
            }}
          />
        )}

        {activeMenu === "chat" && (
          <AiChatSection
            todos={[]} // 互換のため空配列
            boardPosts={[]} // 互換のため空配列
            manuals={manuals}
            aiKnowledge={aiKnowledge}
            chatHistory={chatHistory}
            setChatHistory={setChatHistory}
            chatInput={chatInput}
            setChatInput={setChatInput}
            onOpenTodo={() => { }}
            onOpenBoard={() => { }}
            onOpenManual={(id) => {
              // チャット候補 → マニュアル詳細 → 閉じたらチャットに戻る
              setManualReturnMenu("chat");
              setOpenManualId(id);
              setActiveMenu("manual");
            }}
          />
        )}
      </main>
    </div>
  );
}

export default App;
