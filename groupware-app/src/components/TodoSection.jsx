// src/components/TodoSection.jsx
import { useMemo } from "react";
import TodoForm from "./todo/TodoForm";
import TodoList from "./todo/TodoList";

/**
 * props:
 * - todos
 * - onToggleTodo(id)
 * - showCompleted
 * - onToggleShowCompleted()
 * - onAddTodo(newTodo)
 */
function TodoSection({
    todos,
    onToggleTodo,
    showCompleted,
    onToggleShowCompleted,
    onAddTodo,
}) {
    // 表示対象TODO（完了表示ON/OFF＋期限の近い順ソート）
    const visibleTodos = useMemo(() => {
        const filtered = todos.filter((todo) =>
            showCompleted ? true : !todo.completed
        );

        return [...filtered].sort((a, b) => {
            const aTime = a.deadline ? Date.parse(a.deadline) : Infinity;
            const bTime = b.deadline ? Date.parse(b.deadline) : Infinity;
            return aTime - bTime;
        });
    }, [todos, showCompleted]);

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr)",
                gap: "12px",
            }}
        >
            <TodoForm
                onAddTodo={onAddTodo}
                showCompleted={showCompleted}
                onToggleShowCompleted={onToggleShowCompleted}
            />

            <TodoList todos={visibleTodos} onToggleTodo={onToggleTodo} />
        </div>
    );
}

export default TodoSection;
