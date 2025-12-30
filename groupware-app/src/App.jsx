// src/App.jsx
import { useEffect, useMemo, useState } from "react";

import TodoSection from "./components/TodoSection";
import BoardSection from "./components/BoardSection";
import ManualSection from "./components/ManualSection";
import DashboardSection from "./components/dashboard/DashboardSection";
import { buildAiKnowledge } from "./aiData";
import BoardPostDetailModal from "./components/board/BoardPostDetailModal";
import AiChatSection from "./components/chat/AiChatSection";
import GlobalSearchResults from "./components/search/GlobalSearchResults";




const menuItems = [
  { id: "home", label: "ダッシュボード" },
  { id: "todo", label: "TODOリスト" },
  { id: "board", label: "連絡ボード" },
  { id: "manual", label: "マニュアル" },
  { id: "chat", label: "AIチャット" },
];

const generateId = () =>
  String(Date.now()) + Math.random().toString(36).slice(2, 8);

const formatNow = () => {
  const now = new Date();
  return now.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

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

  const [activeMenu, setActiveMenu] = useState("home");
  const [globalQuery, setGlobalQuery] = useState("");
  const [isGlobalSearching, setIsGlobalSearching] = useState(false);

  // ★ AIチャットの履歴保管（消えないようにする）
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");





  const [todos, setTodos] = useState([]);

  const [showCompletedTodos, setShowCompletedTodos] = useState(false);
  const [selectedBoardPost, setSelectedBoardPost] = useState(null);
  const [openManualId, setOpenManualId] = useState(null);
  const [openedFromDashboard, setOpenedFromDashboard] = useState(false);
  const [manualReturnMenu, setManualReturnMenu] = useState("home");





  const [boardPosts, setBoardPosts] = useState([
    {
      id: generateId(),
      title: "今週の生産スケジュールについて",
      category: "お知らせ",
      content:
        "今週の生産スケジュールを共有します。詳細は添付のExcelを参照してください。質問があればグループチャットまで。",
      pinned: true,
      createdAt: formatNow(),
    },
    {
      id: generateId(),
      title: "週次清掃当番の確認",
      category: "清掃",
      content: "今週の清掃当番表を更新しました。担当者は休憩室の掲示をご確認ください。",
      pinned: false,
      createdAt: formatNow(),
    },
  ]);

  const [manuals, setManuals] = useState([
    {
      id: generateId(),
      title: "ライン停止時の初動対応",
      categoryPath: ["製造ライン", "トラブル対応"],
      tags: ["停止", "トラブル", "安全"],
      content:
        "1. 非常停止ボタンが押されていないか確認\n2. アラームパネルのエラーコードを確認\n3. 作業者の安全確保を最優先とし、危険箇所には近づかない\n4. 原因が不明な場合はリーダーに報告し、指示をあおぐ\n5. 復旧後は必ず試運転を行う。",
      createdAt: formatNow(),
    },
    {
      id: generateId(),
      title: "日次清掃マニュアル（製造室）",
      categoryPath: ["共通マニュアル", "清掃"],
      tags: ["日次", "清掃"],
      content:
        "1. 機械の電源がOFFであることを確認\n2. 床の異物・粉塵を除去\n3. アルコールを用いて接触部を重点的に拭き上げ\n4. 清掃チェックリストに実施者・日時を記入する。",
      createdAt: formatNow(),
    },
  ]);

  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/todos");
        const data = await res.json();
        setTodos(data);
      } catch (e) {
        console.error("TODOの取得に失敗しました", e);
      }
    };

    fetchTodos();
  }, []);

  // ---- TODO handlers ----
  const handleAddTodo = async (newTodo) => {
    try {
      const res = await fetch("http://localhost:3001/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newTodo.title,
          deadline: newTodo.deadline,
          priority: newTodo.priority,
        }),
      });

      if (!res.ok) {
        console.error("TODOの追加に失敗しました");
        return;
      }

      const created = await res.json();

      // DBから返ってきたデータをそのままstateに追加
      setTodos((prev) => [created, ...prev]);
    } catch (e) {
      console.error("TODOの追加に失敗しました", e);
    }
  };




  const handleToggleTodo = async (id) => {
    try {
      const res = await fetch(`http://localhost:3001/api/todos/${id}/toggle`, {
        method: "PATCH",
      });

      if (!res.ok) {
        console.error("TODOの更新に失敗しました");
        return;
      }

      const result = await res.json(); // { id, completed }

      setTodos((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
              ...t,
              completed: result.completed,
            }
            : t
        )
      );
    } catch (e) {
      console.error("TODOの更新に失敗しました", e);
    }
  };


  const handleToggleShowCompleted = () => {
    setShowCompletedTodos((prev) => !prev);
  };

  // ---- Board handlers ----
  const handleAddPost = (newPost) => {
    setBoardPosts((prev) => [
      {
        ...newPost,
        id: generateId(),
        createdAt: formatNow(),
      },
      ...prev,
    ]);
  };

  const handleTogglePin = (id) => {
    setBoardPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
            ...p,
            pinned: !p.pinned,
          }
          : p
      )
    );
  };

  const handleUpdatePost = (id, updatedFields) => {
    setBoardPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
            ...p,
            ...updatedFields,
          }
          : p
      )
    );
  };

  const handleDeletePost = (id) => {
    setBoardPosts((prev) => prev.filter((p) => p.id !== id));
  };

  // ---- Manual handlers ----
  const handleAddManual = (manualInput) => {
    setManuals((prev) => [
      ...prev,
      {
        ...manualInput,
        id: generateId(),
        createdAt: formatNow(),
      },
    ]);
  };

  const handleUpdateManual = (id, updatedFields) => {
    setManuals((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
            ...m,
            ...updatedFields,
            createdAt: formatNow(),
          }
          : m
      )
    );
  };

  const handleDeleteManual = (id) => {
    setManuals((prev) => prev.filter((m) => m.id !== id));
  };

  // ===== 全体検索結果（表示用）=====
  const searchResults = useMemo(() => {
    const q = globalQuery.trim();
    if (!q) return [];

    const results = [];

    // TODO
    todos.forEach((t) => {
      if (includesAllTerms(t.title, q)) {
        results.push({
          type: "todo",
          id: t.id,
          title: t.title,
          meta: t.deadline ? `期限：${t.deadline}` : "",
        });
      }
    });

    // 連絡
    boardPosts.forEach((p) => {
      const text = [p.title, p.content].join(" ");
      if (includesAllTerms(text, q)) {
        results.push({
          type: "board",
          id: p.id,
          title: p.title,
          meta: p.category ? `カテゴリ：${p.category}` : "",
        });
      }
    });

    // マニュアル
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
  }, [globalQuery, todos, boardPosts, manuals]);


  const aiKnowledge = useMemo(
    () => buildAiKnowledge(todos, boardPosts, manuals),
    [todos, boardPosts, manuals]
  );

  const getPageTitle = () => {
    const item = menuItems.find((m) => m.id === activeMenu);
    return item ? item.label : "";
  };

  // 検索結果クリック時の処理
  const handleClickSearchResult = (result) => {
    if (!result) return;

    // TODO
    if (result.type === "todo") {
      setActiveMenu("todo");
      setIsGlobalSearching(false);
      return;
    }

    // 連絡
    if (result.type === "board") {
      const post = boardPosts.find((p) => p.id === result.id);
      if (post) {
        setSelectedBoardPost(post);
      }
      setIsGlobalSearching(false);
      return;
    }

    // マニュアル
    if (result.type === "manual") {
      setOpenedFromDashboard(true);
      setManualReturnMenu("home"); // 検索バーはダッシュボード共通なので home に戻す想定
      setOpenManualId(result.id);
      setActiveMenu("manual");
      setIsGlobalSearching(false);
      return;
    }
  };



  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#F4F8FF", // 青寄りの背景
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
          社内グループウェア
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "#5B7DB1",
            marginBottom: "16px",
          }}
        >
          TODO / 連絡 / マニュアル / AI をひとつにまとめた社内ポータル
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
                <span>
                  {item.id === "home" && "🏠"}
                  {item.id === "todo" && "✅"}
                  {item.id === "board" && "📋"}
                  {item.id === "manual" && "📁"}
                  {item.id === "chat" && "🤖"}
                </span>
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
          width: "100%",          // ★ 明示的に全幅
          minWidth: 0,
          padding: "16px",        // 横paddingを少し減らす
          boxSizing: "border-box",
          overflowX: "hidden",    // 横スクロール防止
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

          {/* 全体検索（UIのみ：まずは入力できる状態にする） */}
          {/* 全体検索（結果表示付き） */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              flex: 1,
              minWidth: 0,
            }}
          >
            {/* 検索枠（この中に「🔍」「入力」「クリア」「ドロップダウン」を全部入れる） */}
            <div
              style={{
                position: "relative",
                width: "100%",
                maxWidth: "520px",   // ★ 最大は520
                minWidth: "240px",   // ★ 最小はこれくらい（好みで調整OK）
              }}
            >
              {/* 🔍 アイコン */}
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

              {/* クリア（入力がある時だけ表示） */}
              {globalQuery.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    setGlobalQuery("");
                    setIsGlobalSearching(false);   // ★ 結果も閉じる
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
                onChange={(e) => {
                  setGlobalQuery(e.target.value);
                  // 入力中はまだ結果を出さない場合はここでは何もしない
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setIsGlobalSearching(true);  // ★ Enter で検索結果を表示
                  }
                }}
                placeholder="全体検索（TODO / 連絡 / マニュアル）"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  border: "1px solid #D7E3F7",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "10px",
                  padding: globalQuery.trim()
                    ? "8px 72px 8px 30px" // ★ 右にクリア分の余白
                    : "8px 10px 8px 30px",
                  fontSize: "13px",
                  outline: "none",
                }}
              />

              {/* 検索結果ドロップダウン（入力がある時だけ） */}
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
                            backgroundColor:
                              r.type === "todo"
                                ? "#EAF2FF"
                                : r.type === "board"
                                  ? "#FFF4E5"
                                  : "#EAF7EA",
                            color:
                              r.type === "todo"
                                ? "#1F5FBF"
                                : r.type === "board"
                                  ? "#B45309"
                                  : "#2F7D32",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {r.type === "todo" && "TODO"}
                          {r.type === "board" && "連絡"}
                          {r.type === "manual" && "マニュアル"}
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

        {isGlobalSearching && globalQuery.trim() && (
          <GlobalSearchResults
            query={globalQuery}
            todos={todos}
            boardPosts={boardPosts}
            manuals={manuals}
            onClickResult={handleClickSearchResult}
          />
        )}


        {/* ダッシュボード（旧homeを差し替え） */}
        {activeMenu === "home" && (
          <DashboardSection
            todos={todos}
            boardPosts={boardPosts}
            manuals={manuals}
            onGoTodo={() => setActiveMenu("todo")}
            onGoBoard={() => setActiveMenu("board")}
            onGoManual={() => setActiveMenu("manual")}
            onOpenBoardPost={(post) => setSelectedBoardPost(post)}
            onOpenManual={(id) => {
              setOpenedFromDashboard(true);
              setManualReturnMenu("home");   // ★ ダッシュボードから来たので home に戻す
              setOpenManualId(id);
              setActiveMenu("manual");
            }}
          />
        )}

        {activeMenu === "todo" && (
          <TodoSection
            todos={todos}
            onToggleTodo={handleToggleTodo}
            showCompleted={showCompletedTodos}
            onToggleShowCompleted={handleToggleShowCompleted}
            onAddTodo={handleAddTodo}
          />
        )}

        {activeMenu === "board" && (
          <BoardSection
            posts={boardPosts}
            onAddPost={handleAddPost}
            onTogglePin={handleTogglePin}
            onUpdatePost={handleUpdatePost}
            onDeletePost={handleDeletePost}
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
            openedFromDashboard={openedFromDashboard}
            onBackToDashboard={() => {
              setOpenedFromDashboard(false);
              setActiveMenu(manualReturnMenu);   // ★ home or chat に戻る
            }}
          />
        )}

        {activeMenu === "chat" && (
          <AiChatSection
            todos={todos}
            boardPosts={boardPosts}
            manuals={manuals}
            onOpenTodo={(id) => {
              setActiveMenu("todo");
            }}
            onOpenBoard={(id) => {
              const post = boardPosts.find((p) => p.id === id);
              if (post) setSelectedBoardPost(post);
              // activeMenu は "chat" のまま
            }}
            onOpenManual={(id) => {
              setOpenedFromDashboard(true);
              setManualReturnMenu("chat");   // ★ チャットから来たので chat に戻す
              setOpenManualId(id);
              setActiveMenu("manual");
            }}
          />
        )}


      </main>

      <BoardPostDetailModal
        open={!!selectedBoardPost}
        post={selectedBoardPost}
        onClose={() => setSelectedBoardPost(null)}
      />

    </div>
  );
}

export default App;
