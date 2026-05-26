import { FaMoon, FaSun } from "react-icons/fa";

function Header({ currentUser, onLogout, theme, onToggleTheme }) {
  const isDark = theme === "dark";

  return (
    <div
      className="app-header"
      style={{
        height: "72px",
        background: isDark ? "#0d0824" : "white",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 28px",
        borderBottom: isDark ? "1px solid rgba(168, 85, 247, 0.22)" : "1px solid #e5e7eb",
      }}
    >
      {/* LEFT — Welcome */}
      <div className="app-header-copy">
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: isDark ? "#f8f7ff" : "#1a1a2e" }}>
          Welcome back, {currentUser.name}
        </h3>
        <p style={{ color: isDark ? "#a8a3c7" : "#6b7280", fontSize: "14px", marginTop: "4px" }}>
          New Billionaires Bar & Restaurant
        </p>
      </div>

      {/* RIGHT — Logout + Brand together */}
      <div className="app-header-actions" style={{ display: "flex", alignItems: "center", gap: "16px" }}>

        <button
          onClick={onToggleTheme}
          title={isDark ? "Switch to light theme" : "Switch to dark purple theme"}
          aria-label={isDark ? "Switch to light theme" : "Switch to dark purple theme"}
          style={{
            width: "42px",
            height: "34px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: isDark ? "#25104a" : "#eef1f5",
            color: isDark ? "#d66cff" : "#1a1a2e",
            border: isDark ? "1px solid #7c2dff" : "1px solid #d0cdc6",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          {isDark ? <FaSun /> : <FaMoon />}
        </button>

        <button
          onClick={onLogout}
          style={{
  padding: "8px 16px",
  background: isDark ? "#170a33" : "#1a1a2e",
  color: isDark ? "#ff6ee7" : "#c9a84c",
  border: isDark ? "1px solid #7c2dff" : "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "13px",
}}
         
        >
          Logout
        </button>

        <div className="app-header-brand" style={brandStyle}>
          <div style={{ ...brandLogoStyle, background: isDark ? "#14062d" : "#111827", borderColor: isDark ? "#7c2dff" : "#111827", color: isDark ? "#ff6ee7" : "#ffffff" }}>NB</div>
          <div>
            <strong style={{ ...brandNameStyle, color: isDark ? "#f8f7ff" : "#111827" }}>NEW BILLIONAIRES</strong>
            <p style={{ ...brandSubtitleStyle, color: isDark ? "#a8a3c7" : "#111827" }}>BAR & RESTAURANT</p>
          </div>
        </div>

      </div>
    </div>
  );
}

const brandStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const brandLogoStyle = {
  width: "36px",
  height: "36px",
  background: "#111827",
  border: "2px solid #111827",
  borderRadius: "50%",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "800",
  fontFamily: "Georgia, serif",
  fontSize: "15px",
};

const brandNameStyle = {
  display: "block",
  color: "#111827",
  fontFamily: "Georgia, serif",
  fontSize: "15px",
  lineHeight: "1",
};

const brandSubtitleStyle = {
  color: "#111827",
  fontSize: "10px",
  fontWeight: "700",
  letterSpacing: "1px",
  marginTop: "3px",
};

export default Header;
