import { useEffect, useMemo, useState, useRef } from "react";
import { FaPlus, FaSearch, FaEdit, FaTrash, FaWarehouse, FaMinusCircle } from "react-icons/fa";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const ING_URL = `${API_BASE_URL}/ingredient-stock/ingredients`;
const ING_BASE_URL = `${API_BASE_URL}/ingredient-stock`;

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${sessionStorage.getItem("token")}`,
});

const formatMoney = (v) =>
  `KES ${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const formatQty = (v, unit) =>
  `${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${unit || ""}`.trim();

const thStyle = {
  padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: "600",
  color: "#6b6b6b", borderBottom: "2px solid #e0ddd5", background: "#f5f3ee",
  textTransform: "uppercase", letterSpacing: "0.05em",
};
const tdStyle = { padding: "12px 14px", fontSize: "14px", borderBottom: "1px solid #e8e5de", color: "#2d2d2d" };
const labelStyle = { display: "block", fontSize: "13px", fontWeight: "600", color: "#1a1a2e", marginBottom: "6px" };
const inputStyle = { width: "100%", padding: "10px 12px", border: "1px solid #d0cdc6", borderRadius: "8px", fontSize: "14px", outline: "none", background: "#faf9f6", boxSizing: "border-box" };
const iconBtnStyle = { border: "none", borderRadius: "6px", cursor: "pointer", width: "32px", height: "30px", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" };
const primaryBtn = { padding: "10px 20px", background: "#1a1a2e", color: "#c9a84c", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" };
const secondaryBtn = { padding: "10px 20px", background: "#eef1f5", color: "#1a1a2e", border: "1px solid #d0cdc6", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" };

const RELEASE_REASONS = ["Usage", "Wastage", "Spoilage", "Other"];

// ── SEARCHABLE INGREDIENT DROPDOWN ───────────────────────────
function IngredientSearch({ ingredients, value, onChange }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = ingredients.find((i) => i.id === value);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = ingredients.filter((i) =>
    i.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div onClick={() => { setOpen(!open); setQuery(""); }}
        style={{ ...inputStyle, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: selected ? "#1a1a2e" : "#9ca3af" }}>
          {selected ? `${selected.name} (${selected.default_unit})` : "Search or select an ingredient..."}
        </span>
        <FaSearch style={{ color: "#9ca3af", fontSize: "12px" }} />
      </div>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #d0cdc6", borderRadius: "8px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 100, maxHeight: "260px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "8px" }}>
            <input autoFocus type="text" placeholder="Type to search..." value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ ...inputStyle, padding: "8px 12px", fontSize: "13px" }} />
          </div>
          <div style={{ overflowY: "auto", maxHeight: "200px" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "12px 14px", color: "#888", fontSize: "13px" }}>No ingredients found</div>
            ) : filtered.map((i) => {
              const isLow = Number(i.current_quantity) <= Number(i.minimum_quantity);
              const isOut = Number(i.current_quantity) === 0;
              return (
                <div key={i.id} onClick={() => { onChange(i.id); setOpen(false); setQuery(""); }}
                  style={{ padding: "10px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", background: value === i.id ? "#f5f3ee" : "transparent", borderLeft: value === i.id ? "3px solid #c9a84c" : "3px solid transparent" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#faf9f6"}
                  onMouseLeave={(e) => e.currentTarget.style.background = value === i.id ? "#f5f3ee" : "transparent"}>
                  <div>
                    <p style={{ margin: 0, fontWeight: "600", fontSize: "14px", color: "#1a1a2e" }}>{i.name}</p>
                    <p style={{ margin: 0, fontSize: "12px", color: "#6b6b6b" }}>
                      Stock: {formatQty(i.current_quantity, i.default_unit)} · Min: {formatQty(i.minimum_quantity, i.default_unit)}
                    </p>
                  </div>
                  <span style={{
                    background: isOut ? "#fef2f2" : isLow ? "#fff8e1" : "#e8f5e9",
                    color: isOut ? "#dc2626" : isLow ? "#d97706" : "#2e7d32",
                    border: `1px solid ${isOut ? "#fecaca" : isLow ? "#fde68a" : "#c8e6c9"}`,
                    padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: "600", whiteSpace: "nowrap",
                  }}>
                    {isOut ? "Out" : isLow ? "Low" : "OK"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────
export default function IngredientStock() {
  const defaultRange = useMemo(() => {
    const now = new Date();
    return {
      monthStart: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`,
      today: now.toISOString().split("T")[0],
    };
  }, []);

  const [ingredients, setIngredients] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState(defaultRange.monthStart);
  const [to, setTo] = useState(defaultRange.today);

  // ── FORM VISIBILITY ──
  const [showStockInForm, setShowStockInForm] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showReleaseForm, setShowReleaseForm] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);

  // ── STOCK-IN FORM ──
  const [stockIngredientId, setStockIngredientId] = useState(null);
  const [stockQty, setStockQty] = useState("");
  const [stockCostPerUnit, setStockCostPerUnit] = useState("");
  const [stockNotes, setStockNotes] = useState("");

  // ── STOCK RELEASE FORM ──
  const [releaseIngredientId, setReleaseIngredientId] = useState(null);
  const [releaseQty, setReleaseQty] = useState("");
  const [releaseReason, setReleaseReason] = useState("");
  const [releaseCustomNote, setReleaseCustomNote] = useState("");

  // ── NEW INGREDIENT FORM ──
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("kg");
  const [newMinQty, setNewMinQty] = useState("5");
  const [newNotes, setNewNotes] = useState("");

  // ── EDIT FORM ──
  const [editName, setEditName] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editMinQty, setEditMinQty] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // ── DATA FETCHING ─────────────────────────────────────────
  const fetchIngredients = async () => {
    try {
      const res = await fetch(ING_URL, { headers: getAuthHeaders() });
      const data = await res.json();
      setIngredients(Array.isArray(data) ? data : []);
    } catch { setErrorMessage("Failed to load ingredients."); }
    finally { setLoading(false); }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${ING_BASE_URL}/history?from=${from}&to=${to}`, { headers: getAuthHeaders() });
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch { setErrorMessage("Failed to load ingredient history."); }
    finally { setHistoryLoading(false); }
  };

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      try {
        const [ingRes, histRes] = await Promise.all([
          fetch(ING_URL, { headers: getAuthHeaders() }),
          fetch(`${ING_BASE_URL}/history?from=${defaultRange.monthStart}&to=${defaultRange.today}`, { headers: getAuthHeaders() }),
        ]);
        const [ingData, histData] = await Promise.all([ingRes.json(), histRes.json()]);
        if (isActive) {
          setIngredients(Array.isArray(ingData) ? ingData : []);
          setHistory(Array.isArray(histData) ? histData : []);
        }
      } catch (err) {
        if (isActive) setErrorMessage("Failed to load ingredient data: " + err.message);
      } finally {
        if (isActive) { setLoading(false); setHistoryLoading(false); }
      }
    };
    load();
    return () => { isActive = false; };
  }, [defaultRange]);

  useEffect(() => {
    if (!successMessage) return;
    const t = setTimeout(() => setSuccessMessage(""), 4000);
    return () => clearTimeout(t);
  }, [successMessage]);

  useEffect(() => {
    if (!errorMessage) return;
    const t = setTimeout(() => setErrorMessage(""), 4000);
    return () => clearTimeout(t);
  }, [errorMessage]);

  // ── HELPERS ──────────────────────────────────────────────
  const closeAllForms = () => {
    setShowStockInForm(false);
    setShowNewForm(false);
    setShowReleaseForm(false);
    setEditingIngredient(null);
  };

  const resetStockInForm = () => { setStockIngredientId(null); setStockQty(""); setStockCostPerUnit(""); setStockNotes(""); };
  const resetReleaseForm = () => { setReleaseIngredientId(null); setReleaseQty(""); setReleaseReason(""); setReleaseCustomNote(""); };
  const resetNewForm = () => { setNewName(""); setNewUnit("kg"); setNewMinQty("5"); setNewNotes(""); };

  // ── HANDLERS ─────────────────────────────────────────────
  const handleStockIn = async () => {
    if (!stockIngredientId || !stockQty) { setErrorMessage("Ingredient and quantity are required."); return; }
    try {
      const res = await fetch(`${ING_BASE_URL}/stock-in`, {
        method: "POST", headers: getAuthHeaders(),
        body: JSON.stringify({ ingredientId: stockIngredientId, quantity: Number(stockQty), costPerUnit: Number(stockCostPerUnit || 0), notes: stockNotes || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessMessage("Stock recorded successfully!");
      resetStockInForm(); setShowStockInForm(false);
      await fetchIngredients(); await fetchHistory();
    } catch (err) { setErrorMessage(err.message); }
  };

  const handleRelease = async () => {
    if (!releaseIngredientId || !releaseQty) { setErrorMessage("Ingredient and quantity are required."); return; }

    const releaseIngredient = ingredients.find((i) => i.id === releaseIngredientId);
    if (Number(releaseQty) > Number(releaseIngredient?.current_quantity)) {
      setErrorMessage("Cannot release more than available stock."); return;
    }

    // Build notes from reason + custom note
    const noteParts = [];
    if (releaseReason) noteParts.push(releaseReason);
    if (releaseCustomNote) noteParts.push(releaseCustomNote);
    const notes = noteParts.join(" — ") || undefined;

    try {
      const res = await fetch(`${ING_BASE_URL}/stock-out`, {
        method: "POST", headers: getAuthHeaders(),
        body: JSON.stringify({ ingredientId: releaseIngredientId, quantity: Number(releaseQty), notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessMessage("Stock released successfully!");
      resetReleaseForm(); setShowReleaseForm(false);
      await fetchIngredients(); await fetchHistory();
    } catch (err) { setErrorMessage(err.message); }
  };

  const handleNewIngredient = async () => {
    if (!newName) { setErrorMessage("Ingredient name is required."); return; }
    try {
      const res = await fetch(ING_URL, {
        method: "POST", headers: getAuthHeaders(),
        body: JSON.stringify({ name: newName, defaultUnit: newUnit, minimumQuantity: Number(newMinQty || 0), notes: newNotes || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessMessage("Ingredient created successfully!");
      resetNewForm(); setShowNewForm(false);
      await fetchIngredients();
    } catch (err) { setErrorMessage(err.message); }
  };

  const startEdit = (ing) => {
    closeAllForms();
    setEditingIngredient(ing);
    setEditName(ing.name);
    setEditUnit(ing.default_unit || "kg");
    setEditMinQty(ing.minimum_quantity);
    setEditNotes(ing.notes || "");
  };

  const handleEdit = async () => {
    if (!editName) { setErrorMessage("Ingredient name is required."); return; }
    try {
      const res = await fetch(`${ING_URL}/${editingIngredient.id}`, {
        method: "PUT", headers: getAuthHeaders(),
        body: JSON.stringify({ name: editName, defaultUnit: editUnit, minimumQuantity: Number(editMinQty || 0), notes: editNotes || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessMessage("Ingredient updated successfully!");
      setEditingIngredient(null);
      await fetchIngredients();
    } catch (err) { setErrorMessage(err.message); }
  };

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Deactivate "${name}"? It will no longer appear in active inventory but will remain in purchase history.`)) return;
    try {
      const res = await fetch(`${ING_URL}/${id}`, { method: "DELETE", headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessMessage(`"${name}" deactivated successfully.`);
      await fetchIngredients();
    } catch (err) { setErrorMessage(err.message); }
  };

  // ── DERIVED DATA ─────────────────────────────────────────
  const filteredIngredients = ingredients.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );
  const selectedStockIngredient = ingredients.find((i) => i.id === stockIngredientId);
  const selectedReleaseIngredient = ingredients.find((i) => i.id === releaseIngredientId);
  const totalInventoryValue = ingredients.reduce((sum, i) =>
    sum + Number(i.current_quantity || 0) * Number(i.average_cost || 0), 0
  );
  const totalHistoryCost = history
    .filter((h) => h.movement_type === "IN")
    .reduce((s, h) => s + Number(h.total_cost || 0), 0);
  const lowStockCount = ingredients.filter(
    (i) => Number(i.current_quantity) > 0 && Number(i.current_quantity) <= Number(i.minimum_quantity)
  ).length;
  const outOfStockCount = ingredients.filter((i) => Number(i.current_quantity) === 0).length;

  // ── RENDER ───────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", color: "#1a1a2e" }}>

      {/* ACTION BAR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => { closeAllForms(); setShowNewForm(!showNewForm); resetNewForm(); }}
            style={{ ...primaryBtn, display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <FaPlus /> {showNewForm ? "Cancel" : "New Ingredient"}
          </button>
          <button
            onClick={() => { closeAllForms(); setShowStockInForm(!showStockInForm); resetStockInForm(); }}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "#f5f3ee", color: "#1a1a2e", border: "1px solid #d0cdc6", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}>
            <FaWarehouse size={13} /> {showStockInForm ? "Cancel" : "Record Stock In"}
          </button>
          <button
            onClick={() => { closeAllForms(); setShowReleaseForm(!showReleaseForm); resetReleaseForm(); }}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: showReleaseForm ? "#fef2f2" : "#fff8e1", color: "#b45309", border: "1px solid #fde68a", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}>
            <FaMinusCircle size={13} /> {showReleaseForm ? "Cancel" : "Release to Kitchen"}
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        {[
          { label: "Total Ingredients", value: ingredients.length, color: "#1a1a2e", bg: "#f5f3ee" },
          { label: "Low Stock", value: lowStockCount, color: "#d97706", bg: "#fff8e1", border: "#fde68a" },
          { label: "Out of Stock", value: outOfStockCount, color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
          { label: "Inventory Value", value: formatMoney(totalInventoryValue), color: "#2e7d32", bg: "#e8f5e9", border: "#c8e6c9" },
        ].map((card) => (
          <div key={card.label} style={{ background: card.bg, border: `1px solid ${card.border || "#e0ddd5"}`, borderRadius: "10px", padding: "14px 18px" }}>
            <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{card.label}</p>
            <p style={{ margin: 0, fontSize: "22px", fontWeight: "700", color: card.color }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* MESSAGES */}
      {errorMessage && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: "8px", padding: "12px 14px", marginBottom: "16px" }}>{errorMessage}</div>}
      {successMessage && <div style={{ background: "#ecfdf5", border: "1px solid #bbf7d0", color: "#166534", borderRadius: "8px", padding: "12px 14px", marginBottom: "16px" }}>{successMessage}</div>}

      {/* NEW INGREDIENT FORM */}
      {showNewForm && (
        <div style={{ background: "#fff", border: "1px solid #c9a84c", borderRadius: "12px", padding: "24px", marginBottom: "24px" }}>
          <h3 style={{ margin: "0 0 18px", fontSize: "16px", fontWeight: "700" }}>✨ Add New Ingredient</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={labelStyle}>Ingredient Name *</label>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Chicken Breast" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Unit of Measurement</label>
              <select value={newUnit} onChange={(e) => setNewUnit(e.target.value)} style={inputStyle}>
                {["kg", "g", "litres", "ml", "pcs", "pieces", "dozen", "trays", "bags", "boxes"].map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Minimum Stock Level</label>
              <input type="number" min="0" step="0.01" value={newMinQty} onChange={(e) => setNewMinQty(e.target.value)} placeholder="e.g. 5" style={inputStyle} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Notes (optional)</label>
              <input type="text" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="e.g. Store in freezer" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={handleNewIngredient} style={primaryBtn}>Create Ingredient</button>
            <button onClick={() => { setShowNewForm(false); resetNewForm(); }} style={secondaryBtn}>Cancel</button>
          </div>
        </div>
      )}

      {/* STOCK-IN FORM */}
      {showStockInForm && (
        <div style={{ background: "#fff", border: "1px solid #e0ddd5", borderRadius: "12px", padding: "24px", marginBottom: "24px" }}>
          <h3 style={{ margin: "0 0 18px", fontSize: "16px", fontWeight: "700" }}>📦 Record Stock In</h3>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={labelStyle}>Ingredient</label>
              <IngredientSearch ingredients={ingredients} value={stockIngredientId} onChange={setStockIngredientId} />
            </div>
            <div>
              <label style={labelStyle}>Quantity Received{selectedStockIngredient ? ` (${selectedStockIngredient.default_unit})` : ""}</label>
              <input type="number" min="0.01" step="0.01" value={stockQty} onChange={(e) => setStockQty(e.target.value)} placeholder="e.g. 20" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Cost Per Unit (KES)</label>
              <input type="number" min="0" step="0.01" value={stockCostPerUnit} onChange={(e) => setStockCostPerUnit(e.target.value)} placeholder="e.g. 650" style={inputStyle} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Notes (optional)</label>
              <input type="text" value={stockNotes} onChange={(e) => setStockNotes(e.target.value)} placeholder="e.g. Supplier: XYZ Distributors" style={inputStyle} />
            </div>
          </div>
          {selectedStockIngredient && stockQty && (
            <div style={{ background: "#f5f3ee", border: "1px solid #e0ddd5", borderRadius: "8px", padding: "14px 18px", marginBottom: "16px", display: "flex", gap: "28px", flexWrap: "wrap" }}>
              {[
                { label: "Ingredient", value: selectedStockIngredient.name },
                { label: "Current Stock", value: formatQty(selectedStockIngredient.current_quantity, selectedStockIngredient.default_unit) },
                { label: "Adding", value: `+${formatQty(stockQty, selectedStockIngredient.default_unit)}`, color: "#2e7d32" },
                { label: "New Stock", value: formatQty(Number(selectedStockIngredient.current_quantity) + Number(stockQty), selectedStockIngredient.default_unit), color: "#2e7d32" },
                ...(stockCostPerUnit ? [{ label: "Total Cost", value: formatMoney(Number(stockQty) * Number(stockCostPerUnit)) }] : []),
              ].map((item) => (
                <div key={item.label}>
                  <p style={{ margin: 0, fontSize: "11px", color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</p>
                  <p style={{ margin: 0, fontWeight: "700", fontSize: "15px", color: item.color || "#1a1a2e" }}>{item.value}</p>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={handleStockIn} style={primaryBtn}>Confirm Stock In</button>
            <button onClick={() => { setShowStockInForm(false); resetStockInForm(); }} style={secondaryBtn}>Cancel</button>
          </div>
        </div>
      )}

      {/* STOCK RELEASE FORM */}
      {showReleaseForm && (
        <div style={{ background: "#fff", border: "1px solid #fde68a", borderRadius: "12px", padding: "24px", marginBottom: "24px" }}>
          <h3 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: "700" }}>🍳 Release to Kitchen</h3>
          <p style={{ margin: "0 0 18px", fontSize: "13px", color: "#6b6b6b" }}>Record ingredients being released for kitchen use. This will deduct from current stock.</p>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={labelStyle}>Ingredient</label>
              <IngredientSearch ingredients={ingredients} value={releaseIngredientId} onChange={setReleaseIngredientId} />
            </div>
            <div>
              <label style={labelStyle}>Quantity{selectedReleaseIngredient ? ` (${selectedReleaseIngredient.default_unit})` : ""}</label>
              <input type="number" min="0.01" step="0.01" value={releaseQty} onChange={(e) => setReleaseQty(e.target.value)} placeholder="e.g. 2" style={inputStyle} />
            </div>
          </div>

          {/* REASON SELECTOR */}
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Reason (optional)</label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
              {RELEASE_REASONS.map((r) => (
                <button key={r} onClick={() => setReleaseReason(releaseReason === r ? "" : r)}
                  style={{
                    padding: "6px 16px", borderRadius: "20px", fontSize: "13px", cursor: "pointer", fontWeight: "600", border: "1px solid",
                    background: releaseReason === r ? "#1a1a2e" : "#fff",
                    color: releaseReason === r ? "#c9a84c" : "#4a4a4a",
                    borderColor: releaseReason === r ? "#1a1a2e" : "#d0cdc6",
                  }}>
                  {r}
                </button>
              ))}
            </div>
            <input type="text" value={releaseCustomNote} onChange={(e) => setReleaseCustomNote(e.target.value)}
              placeholder="Additional notes e.g. used for lunch service..." style={inputStyle} />
          </div>

          {/* RELEASE PREVIEW */}
          {selectedReleaseIngredient && releaseQty && (
            <div style={{ background: "#fff8e1", border: "1px solid #fde68a", borderRadius: "8px", padding: "14px 18px", marginBottom: "16px", display: "flex", gap: "28px", flexWrap: "wrap" }}>
              {[
                { label: "Ingredient", value: selectedReleaseIngredient.name },
                { label: "Current Stock", value: formatQty(selectedReleaseIngredient.current_quantity, selectedReleaseIngredient.default_unit) },
                { label: "Releasing", value: `-${formatQty(releaseQty, selectedReleaseIngredient.default_unit)}`, color: "#dc2626" },
                {
                  label: "Remaining",
                  value: formatQty(Math.max(0, Number(selectedReleaseIngredient.current_quantity) - Number(releaseQty)), selectedReleaseIngredient.default_unit),
                  color: Number(selectedReleaseIngredient.current_quantity) - Number(releaseQty) <= Number(selectedReleaseIngredient.minimum_quantity) ? "#d97706" : "#2e7d32"
                },
              ].map((item) => (
                <div key={item.label}>
                  <p style={{ margin: 0, fontSize: "11px", color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</p>
                  <p style={{ margin: 0, fontWeight: "700", fontSize: "15px", color: item.color || "#1a1a2e" }}>{item.value}</p>
                </div>
              ))}
              {/* Low stock warning */}
              {Number(selectedReleaseIngredient.current_quantity) - Number(releaseQty) <= Number(selectedReleaseIngredient.minimum_quantity) && Number(releaseQty) > 0 && (
                <div style={{ width: "100%", background: "#fff3cd", border: "1px solid #fde68a", borderRadius: "6px", padding: "8px 12px", fontSize: "13px", color: "#b45309", fontWeight: "600" }}>
                  ⚠️ This will bring stock below the minimum level ({formatQty(selectedReleaseIngredient.minimum_quantity, selectedReleaseIngredient.default_unit)})
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={handleRelease}
              style={{ padding: "10px 20px", background: "#b45309", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}>
              Confirm Release
            </button>
            <button onClick={() => { setShowReleaseForm(false); resetReleaseForm(); }} style={secondaryBtn}>Cancel</button>
          </div>
        </div>
      )}

      {/* EDIT FORM */}
      {editingIngredient && (
        <div style={{ background: "#fff", border: "1px solid #c9a84c", borderRadius: "12px", padding: "24px", marginBottom: "24px" }}>
          <h3 style={{ margin: "0 0 18px", fontSize: "16px", fontWeight: "700" }}>✏️ Edit Ingredient — {editingIngredient.name}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={labelStyle}>Ingredient Name *</label>
              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Unit of Measurement</label>
              <select value={editUnit} onChange={(e) => setEditUnit(e.target.value)} style={inputStyle}>
                {["kg", "g", "litres", "ml", "pcs", "pieces", "dozen", "trays", "bags", "boxes"].map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Minimum Stock Level</label>
              <input type="number" min="0" step="0.01" value={editMinQty} onChange={(e) => setEditMinQty(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Notes (optional)</label>
              <input type="text" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="e.g. Store in freezer" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={handleEdit} style={primaryBtn}>Save Changes</button>
            <button onClick={() => setEditingIngredient(null)} style={secondaryBtn}>Cancel</button>
          </div>
        </div>
      )}

      {/* CURRENT INVENTORY TABLE */}
      <div style={{ background: "#fff", border: "1px solid #e0ddd5", borderRadius: "12px", overflow: "hidden", marginBottom: "24px" }}>
        <div style={{ padding: "14px 20px", borderBottom: "2px solid #e0ddd5", background: "#f5f3ee", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FaWarehouse style={{ color: "#c9a84c" }} />
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>Current Ingredient Inventory</h3>
          </div>
          <div style={{ position: "relative" }}>
            <FaSearch style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: "12px" }} />
            <input type="text" placeholder="Search ingredients..." value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ padding: "7px 12px 7px 30px", border: "1px solid #d0cdc6", borderRadius: "7px", fontSize: "13px", outline: "none", width: "210px" }} />
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Ingredient</th>
              <th style={thStyle}>Unit</th>
              <th style={thStyle}>Current Qty</th>
              <th style={thStyle}>Min Stock</th>
              <th style={thStyle}>Avg Cost / Unit</th>
              <th style={thStyle}>Stock Value</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ ...tdStyle, textAlign: "center", color: "#888" }}>Loading...</td></tr>
            ) : filteredIngredients.length === 0 ? (
              <tr><td colSpan={8} style={{ ...tdStyle, textAlign: "center", color: "#888" }}>No ingredients found</td></tr>
            ) : filteredIngredients.map((ing) => {
              const isOut = Number(ing.current_quantity) === 0;
              const isLow = !isOut && Number(ing.current_quantity) <= Number(ing.minimum_quantity);
              const stockValue = Number(ing.current_quantity) * Number(ing.average_cost || 0);
              return (
                <tr key={ing.id}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#faf9f6"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  style={{ transition: "background 0.15s" }}>
                  <td style={{ ...tdStyle, fontWeight: "600" }}>
                    {ing.name}
                    {ing.notes && <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#6b6b6b", fontWeight: "400", fontStyle: "italic" }}>{ing.notes}</p>}
                  </td>
                  <td style={tdStyle}>
                    <span style={{ background: "#f0ede6", color: "#6b6b6b", padding: "2px 8px", borderRadius: "20px", fontSize: "12px" }}>
                      {ing.default_unit}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: "700", color: isOut ? "#dc2626" : isLow ? "#d97706" : "#2e7d32" }}>
                    {Number(ing.current_quantity).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ ...tdStyle, color: "#6b6b6b" }}>
                    {Number(ing.minimum_quantity).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  </td>
                  <td style={tdStyle}>
                    {Number(ing.average_cost) > 0
                      ? formatMoney(ing.average_cost)
                      : <span style={{ color: "#9ca3af", fontSize: "12px" }}>Not set</span>}
                  </td>
                  <td style={{ ...tdStyle, fontWeight: "600" }}>
                    {Number(ing.average_cost) > 0
                      ? formatMoney(stockValue)
                      : <span style={{ color: "#9ca3af", fontSize: "12px" }}>—</span>}
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      background: isOut ? "#fef2f2" : isLow ? "#fff8e1" : "#e8f5e9",
                      color: isOut ? "#dc2626" : isLow ? "#d97706" : "#2e7d32",
                      border: `1px solid ${isOut ? "#fecaca" : isLow ? "#fde68a" : "#c8e6c9"}`,
                      padding: "2px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600",
                    }}>
                      {isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => startEdit(ing)}
                        style={{ ...iconBtnStyle, background: "#1a1a2e", color: "#c9a84c" }} title="Edit ingredient">
                        <FaEdit size={12} />
                      </button>
                      <button onClick={() => handleDeactivate(ing.id, ing.name)}
                        style={{ ...iconBtnStyle, background: "#fef2f2", color: "#dc2626" }} title="Deactivate ingredient">
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {!loading && filteredIngredients.length > 0 && (
            <tfoot>
              <tr style={{ background: "#f5f3ee" }}>
                <td colSpan={5} style={{ ...tdStyle, fontWeight: "700", fontSize: "13px", color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "none" }}>
                  Total Inventory Value
                </td>
                <td colSpan={3} style={{ ...tdStyle, fontWeight: "700", fontSize: "15px", color: "#1a1a2e", borderBottom: "none" }}>
                  {formatMoney(totalInventoryValue)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* MOVEMENT HISTORY */}
      <div style={{ background: "#fff", border: "1px solid #e0ddd5", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "2px solid #e0ddd5", background: "#f5f3ee", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>Stock Movement History</h3>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              style={{ padding: "7px 10px", border: "1px solid #d0cdc6", borderRadius: "7px", fontSize: "13px", outline: "none" }} />
            <span style={{ color: "#888", fontSize: "13px" }}>to</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              style={{ padding: "7px 10px", border: "1px solid #d0cdc6", borderRadius: "7px", fontSize: "13px", outline: "none" }} />
            <button onClick={fetchHistory}
              style={{ padding: "7px 14px", background: "#1a1a2e", color: "#c9a84c", border: "none", borderRadius: "7px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
              Filter
            </button>
          </div>
        </div>

        {!historyLoading && history.length > 0 && (
          <div style={{ padding: "12px 20px", background: "#faf9f6", borderBottom: "1px solid #e0ddd5", display: "flex", gap: "24px", flexWrap: "wrap" }}>
            <div>
              <span style={{ fontSize: "12px", color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Purchased: </span>
              <span style={{ fontWeight: "700", color: "#1a1a2e" }}>{formatMoney(totalHistoryCost)}</span>
            </div>
            <div>
              <span style={{ fontSize: "12px", color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Stock-In Records: </span>
              <span style={{ fontWeight: "700", color: "#2e7d32" }}>{history.filter((h) => h.movement_type === "IN").length}</span>
            </div>
            <div>
              <span style={{ fontSize: "12px", color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Release Records: </span>
              <span style={{ fontWeight: "700", color: "#b45309" }}>{history.filter((h) => h.movement_type === "OUT").length}</span>
            </div>
          </div>
        )}

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Ingredient</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Qty</th>
              <th style={thStyle}>Unit</th>
              <th style={thStyle}>Cost / Unit</th>
              <th style={thStyle}>Total Cost</th>
              <th style={thStyle}>Notes / Reason</th>
              <th style={thStyle}>Date</th>
            </tr>
          </thead>
          <tbody>
            {historyLoading ? (
              <tr><td colSpan={8} style={{ ...tdStyle, textAlign: "center", color: "#888" }}>Loading...</td></tr>
            ) : history.length === 0 ? (
              <tr><td colSpan={8} style={{ ...tdStyle, textAlign: "center", color: "#888" }}>No records in this period</td></tr>
            ) : history.map((h) => (
              <tr key={h.id}
                onMouseEnter={(e) => e.currentTarget.style.background = "#faf9f6"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                style={{ transition: "background 0.15s" }}>
                <td style={{ ...tdStyle, fontWeight: "600" }}>{h.ingredientName}</td>
                <td style={tdStyle}>
                  <span style={{
                    background: h.movement_type === "IN" ? "#e8f5e9" : "#fff8e1",
                    color: h.movement_type === "IN" ? "#2e7d32" : "#b45309",
                    border: `1px solid ${h.movement_type === "IN" ? "#c8e6c9" : "#fde68a"}`,
                    padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: "600",
                  }}>
                    {h.movement_type === "IN" ? "Stock In" : "Kitchen Release"}
                  </span>
                </td>
                <td style={{ ...tdStyle, fontWeight: "600", color: h.movement_type === "IN" ? "#2e7d32" : "#b45309" }}>
                  {h.movement_type === "IN" ? "+" : "-"}{Number(h.quantity).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </td>
                <td style={tdStyle}>{h.unit || "—"}</td>
                <td style={tdStyle}>{Number(h.cost_per_unit) > 0 ? formatMoney(h.cost_per_unit) : <span style={{ color: "#9ca3af" }}>—</span>}</td>
                <td style={{ ...tdStyle, fontWeight: "600" }}>{Number(h.total_cost) > 0 ? formatMoney(h.total_cost) : <span style={{ color: "#9ca3af" }}>—</span>}</td>
                <td style={{ ...tdStyle, color: "#6b6b6b", fontSize: "13px", fontStyle: h.notes ? "italic" : "normal" }}>{h.notes || <span style={{ color: "#9ca3af" }}>—</span>}</td>
                <td style={{ ...tdStyle, color: "#6b6b6b", fontSize: "13px" }}>{new Date(h.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}