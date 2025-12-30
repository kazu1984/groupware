// src/components/todo/TodoList.jsx
import { sectionCard, filterCard } from "../../uiStyles";

/**
 * TODO一覧表示
 * props:
 *  - todos: 表示対象のTODO配列（すでにフィルタ＆ソート済み）
 *  - onToggleTodo(id)
 */
function TodoList({ todos, onToggleTodo }) {
    // 期限の状態判定
    const getDeadlineStatus = (deadline) => {
        if (!deadline) return "none";
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const d = new Date(deadline);
        if (Number.isNaN(d.getTime())) return "none";

        d.setHours(0, 0, 0, 0);

        if (d.getTime() < today.getTime()) return "past";
        if (d.getTime() === today.getTime()) return "today";
        return "future";
    };

    const formatDeadlineLabel = (deadline) => {
        if (!deadline) return "期限なし";
        const status = getDeadlineStatus(deadline);
        switch (status) {
            case "past":
                return `期限超過 (${deadline})`;
            case "today":
                return `本日締切 (${deadline})`;
            case "future":
                return `期限: ${deadline}`;
            default:
                return deadline;
        }
    };

    const getDeadlineStyle = (deadline) => {
        const status = getDeadlineStatus(deadline);
        if (status === "past") {
            return { color: "#b22222", fontWeight: "bold" };
        }
        if (status === "today") {
            return { color: "#d2691e", fontWeight: "bold" };
        }
        if (status === "future") {
            return { color: "#555" };
        }
        return { color: "#777" };
    };

    const getPriorityBadgeStyle = (priority) => {
        let bg = "#e0e0e0";
        let color = "#333";
        if (priority === "高") {
            bg = "#ffdddd";
            color = "#aa0000";
        } else if (priority === "中") {
            bg = "#fff3cd";
            color = "#8a6d3b";
        } else if (priority === "低") {
            bg = "#e0f3b2";
            color = "#3c763d";
        }
        return {
            display: "inline-block",
            padding: "2px 8px",
            borderRadius: "999px",
            fontSize: "11px",
            backgroundColor: bg,
            color,
        };
    };

    const getCardBorderColor = (todo) => {
        const deadlineStatus = getDeadlineStatus(todo.deadline);
        if (deadlineStatus === "past") return "#ff9999";
        if (deadlineStatus === "today") return "#ffcc66";
        if (todo.priority === "高") return "#ffcc66";
        return "#c5e579";
    };

    return (
        <div style={filterCard}>
            <h2
                style={{
                    fontSize: "14px",
                    margin: 0,
                    marginBottom: "4px",
                    color: "#2f4f10",
                }}
            >
                TODO一覧
            </h2>
            <p
                style={{
                    fontSize: "11px",
                    margin: 0,
                    marginBottom: "4px",
                    color: "#777",
                }}
            >
                期限が近い順に並べています。期限が
                <span style={{ color: "#b22222", fontWeight: "bold" }}>赤色</span>
                のものは期限超過、
                <span style={{ color: "#d2691e", fontWeight: "bold" }}>オレンジ</span>
                は本日締切です。
            </p>

            {todos.length === 0 ? (
                <p style={{ color: "#777", marginTop: "8px" }}>
                    表示できるTODOfffはありません。
                </p>
            ) : (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        marginTop: "8px",
                    }}
                >
                    {todos.map((todo) => {
                        const deadlineLabel = formatDeadlineLabel(todo.deadline);
                        const deadlineStyle = getDeadlineStyle(todo.deadline);
                        const cardBorderColor = getCardBorderColor(todo);

                        return (
                            <article
                                key={todo.id}
                                style={{
                                    ...sectionCard,
                                    marginBottom: 0,
                                    padding: "10px 12px",
                                    borderLeft: `4px solid ${cardBorderColor}`,
                                    opacity: todo.completed ? 0.6 : 1,
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: "8px",
                                    }}
                                >
                                    {/* チェックボックス */}
                                    <input
                                        type="checkbox"
                                        checked={todo.completed}
                                        onChange={() => onToggleTodo(todo.id)}
                                        style={{
                                            marginTop: "2px",
                                        }}
                                    />

                                    {/* 本文 */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                gap: "8px",
                                                alignItems: "center",
                                            }}
                                        >
                                            <h3
                                                style={{
                                                    fontSize: "14px",
                                                    margin: 0,
                                                    color: "#2f4f10",
                                                    textDecoration: todo.completed
                                                        ? "line-through"
                                                        : "none",
                                                    wordBreak: "break-all",
                                                }}
                                            >
                                                {todo.title}
                                            </h3>

                                            <span style={getPriorityBadgeStyle(todo.priority)}>
                                                重要度: {todo.priority}
                                            </span>
                                        </div>

                                        <div
                                            style={{
                                                marginTop: "4px",
                                                fontSize: "12px",
                                            }}
                                        >
                                            <span style={deadlineStyle}>{deadlineLabel}</span>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default TodoList;
