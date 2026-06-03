import { useState, useEffect } from "react";
import { FaDatabase, FaServer, FaUsers, FaDownload, FaClock, FaPlus, FaShieldAlt, FaTools } from "react-icons/fa";

const API_URL = `${import.meta.env.VITE_API_URL}/owner`;

const getHeaders = () => ({
  Authorization: `Bearer ${sessionStorage.getItem("token")}`,
});

const formatBytes = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatUptime = (seconds) => {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${mins}m`;
};

export default function OwnerDashboard() {
  const [info, setInfo] = useState(null);
  const [backups, setBackups] = useState([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [backuping, setBackuping] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const fetchData = async () => {
    try {
      const [infoRes, backupRes, maintenanceRes] = await Promise.all([
        fetch(`${API_URL}/info`, { headers: getHeaders() }),
        fetch(`${API_URL}/backups`, { headers: getHeaders() }),
        fetch(`${API_URL}/maintenance`, { headers: getHeaders() }),
      ]);
      
      if (!infoRes.ok || !backupRes.ok || !maintenanceRes.ok) {
        throw new Error("Failed to load data");
      }
      
      setInfo(await infoRes.json());
      setBackups((await backupRes.json()).backups);
      setMaintenanceMode((await maintenanceRes.json()).isActive);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleManualBackup = async () => {
    setBackuping(true);
    setMessage({ type: "", text: "" });
    try {
      const res = await fetch(`${API_URL}/backup`, { method: "POST", headers: getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: "success", text: `✅ Backup created: ${data.filename}` });
      await fetchData();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setBackuping(false);
    }
  };

  const handleToggleMaintenance = async () => {
  const newState = !maintenanceMode;
  setMessage({ type: "", text: "" });
  
  try {
    const res = await fetch(`${API_URL}/maintenance`, { 
      method: "PUT", 
      headers: {
        ...getHeaders(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ isActive: newState })
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || "Failed to toggle maintenance mode");
    }
    
    setMaintenanceMode(newState);
    setMessage({ 
      type: "success", 
      text: `✅ Maintenance mode is now ${newState ? 'ON' : 'OFF'}` 
    });
  } catch (err) {
    setMessage({ type: "error", text: err.message });
  }
};

  const handleDownload = (filename) => {
    fetch(`${API_URL}/backups/${filename}`, { headers: getHeaders() })
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      })
      .catch(err => setMessage({ type: "error", text: "Download failed." }));
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Loading System Data...</div>;

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", color: "#1a1a2e" }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 30, margin: "0 0 6px", fontWeight: 700, display: "flex", alignItems: "center", gap: 12 }}>
            <FaShieldAlt style={{ color: "#c9a84c" }} /> Owner System Dashboard
          </h1>
          <p style={{ color: "#6b7280", fontSize: 15, margin: 0 }}>Database management, backups, and system oversight.</p>
        </div>
      </div>

      {message.text && (
        <div style={{ 
          background: message.type === "error" ? "#fef2f2" : "#ecfdf5", 
          border: `1px solid ${message.type === "error" ? "#fecaca" : "#bbf7d0"}`, 
          color: message.type === "error" ? "#991b1b" : "#166534",
          borderRadius: 8, padding: "12px 16px", marginBottom: 20 
        }}>{message.text}</div>
      )}

      {/* SYSTEM CONTROL CARD */}
      <div style={{ 
        background: "#fff", 
        border: maintenanceMode ? "2px solid #dc2626" : "1px solid #e0ddd5", 
        borderRadius: 10, 
        padding: "24px", 
        marginBottom: 24,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: maintenanceMode ? "0 0 20px rgba(220, 38, 38, 0.2)" : "none"
      }}>
        <div>
          <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
            <FaTools style={{ color: maintenanceMode ? "#dc2626" : "#6b7280" }} /> 
            System Maintenance Mode
          </h3>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>
            {maintenanceMode 
              ? "🔒 POS is frozen. Cashiers cannot make sales." 
              : "✅ System is live. Cashiers can process transactions normally."}
          </p>
        </div>

        <button 
          onClick={handleToggleMaintenance}
          style={{ 
            padding: "12px 24px", 
            borderRadius: 8, 
            border: "none", 
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 14,
            background: maintenanceMode ? "#dc2626" : "#10b981",
            color: "white",
            transition: "all 0.2s",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}
        >
          {maintenanceMode ? "🔓 DISABLE MAINTENANCE" : "🔧 ENABLE MAINTENANCE"}
        </button>
      </div>

      {/* SYSTEM INFO CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Database Size", value: `${info?.dbSize || 0} MB`, icon: <FaDatabase />, color: "#1a1a2e", bg: "#f5f3ee" },
          { label: "Total Users", value: info?.totalUsers || 0, icon: <FaUsers />, color: "#1565c0", bg: "#e0e7ff" },
          { label: "Server Uptime", value: formatUptime(info?.uptime || 0), icon: <FaClock />, color: "#2e7d32", bg: "#e8f5e9" },
          { label: "Node Version", value: info?.nodeVersion || "—", icon: <FaServer />, color: "#c9a84c", bg: "#fff8e1" },
        ].map((card, i) => (
          <div key={i} style={{ background: card.bg, border: "1px solid #e0ddd5", borderRadius: 10, padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: "0 0 6px", fontSize: 12, color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{card.label}</p>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: card.color }}>{card.value}</p>
            </div>
            <div style={{ fontSize: 24, color: card.color, opacity: 0.8 }}>{card.icon}</div>
          </div>
        ))}
      </div>

      {/* BACKUP SECTION */}
      <div style={{ background: "#fff", border: "1px solid #e0ddd5", borderRadius: 10, overflow: "hidden", marginBottom: 24 }}>
        <div style={{ padding: "16px 24px", background: "#f5f3ee", borderBottom: "2px solid #e0ddd5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>🗄️ Database Backups</h3>
          <button 
            onClick={handleManualBackup} 
            disabled={backuping}
            style={{ 
              display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", 
              background: backuping ? "#9ca3af" : "#1a1a2e", color: "#c9a84c", border: "none", borderRadius: 6, 
              cursor: backuping ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 13 
            }}
          >
            <FaPlus size={12} /> {backuping ? "Creating Backup..." : "Create Manual Backup"}
          </button>
        </div>

        <div style={{ padding: "12px 24px", background: "#fff8e1", borderBottom: "1px solid #e0ddd5", fontSize: 13, color: "#92400e" }}>
          ⏰ <strong>Auto-Backup Active:</strong> Daily at 2:00 AM & Weekly on Sundays at 3:00 AM. (Keeps last 7 daily & 4 weekly backups automatically).
        </div>

        {backups.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#888" }}>No backups found. Click "Create Manual Backup" to start.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ padding: "12px 24px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#6b6b6b", borderBottom: "1px solid #e0ddd5", textTransform: "uppercase" }}>Filename</th>
                <th style={{ padding: "12px 24px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#6b6b6b", borderBottom: "1px solid #e0ddd5", textTransform: "uppercase" }}>Size</th>
                <th style={{ padding: "12px 24px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#6b6b6b", borderBottom: "1px solid #e0ddd5", textTransform: "uppercase" }}>Created At</th>
                <th style={{ padding: "12px 24px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "#6b6b6b", borderBottom: "1px solid #e0ddd5", textTransform: "uppercase" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((b) => (
                <tr key={b.filename} style={{ transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#faf9f6"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "14px 24px", fontSize: 14, fontWeight: 600, color: "#1a1a2e", borderBottom: "1px solid #e8e5de" }}>{b.filename}</td>
                  <td style={{ padding: "14px 24px", fontSize: 14, color: "#6b6b6b", borderBottom: "1px solid #e8e5de" }}>{formatBytes(b.size)}</td>
                  <td style={{ padding: "14px 24px", fontSize: 14, color: "#6b6b6b", borderBottom: "1px solid #e8e5de" }}>{new Date(b.created).toLocaleString()}</td>
                  <td style={{ padding: "14px 24px", textAlign: "right", borderBottom: "1px solid #e8e5de" }}>
                    <button 
                      onClick={() => handleDownload(b.filename)}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#1a1a2e", color: "#c9a84c", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                      <FaDownload size={10} /> Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}