// src/components/todo/TodoForm.jsx
import { useState } from "react";
import { sectionCard, inputBase, primaryButton } from "../../uiStyles";

/**
 * TODO追加フォーム
 * props:
 *  - onAddTodo({ title, deadline, priority })
 *  - showCompleted: boolean
 *  - onToggleShowCompleted(): void
 */
function TodoForm({ onAddTodo, showCompleted, onToggleShowCompleted }) {
    const [newTitle, setNewTitle] = useState("");
    const [newDeadline, setNewDeadline] = useState("");
    const [newPriority, setNewPriority] = useState("中");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newTitle.trim()) {
            alert("タイトルを入力してください。");
            return;
        }

        onAddTodo({
            title: newTitle.trim(),
            deadline: newDeadline || "",
            priority: newPriority,
            completed: false,
        });

        setNewTitle("");
        setNewDeadline("");
        setNewPriority("中");
    };

    return (
        <form onSubmit={handleSubmit} style={sectionCard}>
            <h2
                style={{
                    fontSize: "14px",
                    margin: 0,
                    marginBottom: "4px",
                    color: "#2f4f10",
                }}
            >
                TODO追加
            </h2>

            <div>
                <label style={{ fontSize: "12px", color: "#555" }}>
                    タスク名
                    <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="例：月次レポートの提出"
                        style={inputBase}
                    />
                </label>
            </div>

            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginTop: "4px",
                }}
            >
                <div style={{ flex: "0 0 160px" }}>
                    <label style={{ fontSize: "12px", color: "#555" }}>
                        期限
                        <input
                            type="date"
                            value={newDeadline}
                            onChange={(e) => setNewDeadline(e.target.value)}
                            style={inputBase}
                        />
                    </label>
                </div>

                <div style={{ flex: "0 0 140px" }}>
                    <label style={{ fontSize: "12px", color: "#555" }}>
                        重要度
                        <select
                            value={newPriority}
                            onChange={(e) => setNewPriority(e.target.value)}
                            style={{
                                ...inputBase,
                                padding: "4px 8px",
                            }}
                        >
                            <option value="高">高</option>
                            <option value="中">中</option>
                            <option value="低">低</option>
                        </select>
                    </label>
                </div>
            </div>

            <div
                style={{
                    marginTop: "8px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "8px",
                }}
            >
                <label
                    style={{
                        fontSize: "12px",
                        color: "#555",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                    }}
                >
                    <input
                        type="checkbox"
                        checked={showCompleted}
                        onChange={onToggleShowCompleted}
                    />
                    完了済みも表示する
                </label>

                <button type="submit" style={primaryButton}>
                    追加する
                </button>
            </div>
        </form>
    );
}

export default TodoForm;
