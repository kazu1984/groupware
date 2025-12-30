// src/components/dashboard/DashboardCard.jsx
function DashboardCard({
    title,
    actionLabel,
    onActionClick,
    children,
}) {
    return (
        <div
            style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "12px",
                border: "1px solid #E5EAF1",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
            }}
        >
            {/* ヘッダー */}
            <div
                style={{
                    padding: "12px 16px",
                    backgroundColor: "#F5F9FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: "1px solid #E5EAF1",
                }}
            >
                <div
                    style={{
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: "#2F80ED",
                    }}
                >
                    {title}
                </div>

                {actionLabel && onActionClick && (
                    <button
                        type="button"
                        onClick={onActionClick}
                        style={{
                            border: "none",
                            background: "transparent",
                            color: "#2F80ED",
                            fontSize: "12px",
                            cursor: "pointer",
                            padding: 0,
                        }}
                    >
                        {actionLabel} →
                    </button>
                )}
            </div>

            {/* コンテンツ */}
            <div
                style={{
                    padding: "12px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                }}
            >
                {children}
            </div>
        </div>
    );
}

export default DashboardCard;
