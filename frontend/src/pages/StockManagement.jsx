import { useEffect, useMemo, useState, useRef } from "react";
import { FaPlus, FaBoxOpen, FaSearch, FaEdit, FaTrash, FaChevronLeft, FaChevronRight, FaExclamationTriangle, FaTimesCircle, FaTimes } from "react-icons/fa";
import IngredientStock from "../components/IngredientStock";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const STOCK_URL = `${API_BASE_URL}/stock`;
const ITEMS_PER_PAGE = 20;

// ── CATEGORY SUGGESTIONS (Dropdown + Free Typing) ────────────
const CATEGORY_SUGGESTIONS = [
  "Beer", "Whiskey", "Brandy", "Spirit", "Wine", "Softdrinks", 
  "Cocktails", "Juices", "Water", "Energy Drinks"
];

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${sessionStorage.getItem("token")}`,
});

const formatMoney = (v) =>
  `KES ${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

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

// ─ SUMMARY CARD ──────────────────────────────────────────────
function SummaryCard({ label, value, color, bg, border, icon }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? (bg === "#f5f3ee" ? "#ece9e0" : bg) : bg,
        border: `1px solid ${hovered ? color : (border || "#e0ddd5")}`,
        borderRadius: "10px", padding: "16px 18px",
        transition: "all 0.2s", cursor: "default",
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered ? "0 4px 12px rgba(0,0,0,0.08)" : "none",
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <p style={{ margin: "0 0 6px", fontSize: "11px", color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
        {icon && <span style={{ fontSize: "16px", opacity: 0.7 }}>{icon}</span>}
      </div>
      <p style={{ margin: 0, fontSize: "22px", fontWeight: "700", color }}>{value}</p>
    </div>
  );
}

// ── PAGINATION ────────────────────────────────────────────────
function Pagination({ total, page, perPage, onChange }) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderTop: "1px solid #e0ddd5", background: "#faf9f6" }}>
      <span style={{ fontSize: "13px", color: "#6b6b6b" }}>
        Showing {Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} of {total}
      </span>
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        <button onClick={() => onChange(page - 1)} disabled={page === 1}
          style={{ ...iconBtnStyle, background: page === 1 ? "#f5f3ee" : "#1a1a2e", color: page === 1 ? "#ccc" : "#c9a84c", cursor: page === 1 ? "not-allowed" : "pointer" }}>
          <FaChevronLeft size={11} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce((acc, p, idx, arr) => {
            if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
            acc.push(p);
            return acc;
          }, [])
          .map((p, idx) =>
            p === "..." ? (
              <span key={`ellipsis-${idx}`} style={{ fontSize: "13px", color: "#9ca3af", padding: "0 4px" }}>…</span>
            ) : (
              <button key={p} onClick={() => onChange(p)}
                style={{ width: "32px", height: "30px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "13px", background: p === page ? "#1a1a2e" : "#f5f3ee", color: p === page ? "#c9a84c" : "#4a4a4a" }}>
                {p}
              </button>
            )
          )}
        <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
          style={{ ...iconBtnStyle, background: page === totalPages ? "#f5f3ee" : "#1a1a2e", color: page === totalPages ? "#ccc" : "#c9a84c", cursor: page === totalPages ? "not-allowed" : "pointer" }}>
          <FaChevronRight size={11} />
        </button>
      </div>
    </div>
  );
}

// ── EDIT PRODUCT MODAL ────────────────────────────────────────
function EditProductModal({ product, onSave, onClose }) {
  const [editName, setEditName] = useState(product.name);
  const [editCategory, setEditCategory] = useState(product.category || "");
  const [editSellingPrice, setEditSellingPrice] = useState(product.selling_price);
  const [editCostPrice, setEditCostPrice] = useState(product.cost_price || "");
  const [editMinStock, setEditMinStock] = useState(product.minimum_stock);
  const [error, setError] = useState("");

  const handleSave = () => {
    if (!editName || !editSellingPrice) { setError("Name and selling price are required."); return; }
    onSave({ name: editName, category: editCategory, sellingPrice: Number(editSellingPrice), costPrice: Number(editCostPrice || 0), minimumStock: Number(editMinStock || 5) });
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: "14px", padding: "28px", width: "100%", maxWidth: "580px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700" }}>✏️ Edit Product — {product.name}</h3>
          <button onClick={onClose} style={{ ...iconBtnStyle, background: "#f5f3ee", color: "#6b6b6b", width: "34px", height: "34px" }}>
            <FaTimes size={14} />
          </button>
        </div>
        {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "13px" }}>{error}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Product Name *</label>
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Category</label>
            <input 
              type="text" 
              list="edit-category-options"
              value={editCategory} 
              onChange={(e) => setEditCategory(e.target.value)} 
              placeholder="e.g. Beer, Food" 
              style={inputStyle} 
            />
            <datalist id="edit-category-options">
              {CATEGORY_SUGGESTIONS.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>
          <div>
            <label style={labelStyle}>Min Stock Level</label>
            <input type="number" min="0" value={editMinStock} onChange={(e) => setEditMinStock(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Selling Price (KES) *</label>
            <input type="number" min="0" step="0.01" value={editSellingPrice} onChange={(e) => setEditSellingPrice(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Cost Price per Unit (KES)</label>
            <input type="number" min="0" step="0.01" value={editCostPrice} onChange={(e) => setEditCostPrice(e.target.value)} style={inputStyle} />
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={secondaryBtn}>Cancel</button>
          <button onClick={handleSave} style={primaryBtn}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

// ── SEARCHABLE PRODUCT DROPDOWN ─────────────────────────────
function ProductSearch({ products, value, onChange }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = products.find((p) => p.id === value);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div onClick={() => { setOpen(!open); setQuery(""); }}
        style={{ ...inputStyle, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: selected ? "#1a1a2e" : "#9ca3af" }}>
          {selected ? `${selected.name} ${selected.category ? `(${selected.category})` : ""}` : "Search or select a product..."}
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
              <div style={{ padding: "12px 14px", color: "#888", fontSize: "13px" }}>No products found</div>
            ) : filtered.map((p) => (
              <div key={p.id} onClick={() => { onChange(p.id); setOpen(false); setQuery(""); }}
                style={{ padding: "10px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", background: value === p.id ? "#f5f3ee" : "transparent", borderLeft: value === p.id ? "3px solid #c9a84c" : "3px solid transparent" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#faf9f6"}
                onMouseLeave={(e) => e.currentTarget.style.background = value === p.id ? "#f5f3ee" : "transparent"}>
                <div>
                  <p style={{ margin: 0, fontWeight: "600", fontSize: "14px", color: "#1a1a2e" }}>{p.name}</p>
                  <p style={{ margin: 0, fontSize: "12px", color: "#6b6b6b" }}>{p.category || "Uncategorized"} · Stock: {p.stock_quantity}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: "#1a1a2e" }}>{formatMoney(p.selling_price)}</p>
                  <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>selling price</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────
export default function StockManagement() {
  const defaultRange = useMemo(() => {
    const now = new Date();
    return {
      monthStart: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`,
      today: now.toISOString().split("T")[0],
    };
  }, []);

  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [stockSearch, setStockSearch] = useState("");
  
  // Pagination states
  const [productsPage, setProductsPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);

  // - Scroll to top when pagination changes
  useEffect(() => {
    const scrollContainer = document.querySelector('.app-content');
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [productsPage, historyPage]);

  // ✅ NEW: Scroll to top when success or error message appears
  useEffect(() => {
    if (successMessage || errorMessage) {
      const scrollContainer = document.querySelector('.app-content');
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [successMessage, errorMessage]);
  
  const [editingProduct, setEditingProduct] = useState(null);
  const [productId, setProductId] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  
  // New product form
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newSellingPrice, setNewSellingPrice] = useState("");
  const [newCostPrice, setNewCostPrice] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [newMinStock, setNewMinStock] = useState("5");
  
  const [from, setFrom] = useState(defaultRange.monthStart);
  const [to, setTo] = useState(defaultRange.today);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${STOCK_URL}/products`, { headers: getAuthHeaders() });
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch { setErrorMessage("Failed to load products."); }
    finally { setLoading(false); }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    setHistoryPage(1);
    try {
      const res = await fetch(`${STOCK_URL}/history?from=${from}&to=${to}`, { headers: getAuthHeaders() });
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch { setErrorMessage("Failed to load stock history."); }
    finally { setHistoryLoading(false); }
  };

  useEffect(() => {
    let isActive = true;
    const loadInitialStockData = async () => {
      try {
        const [productsRes, historyRes] = await Promise.all([
          fetch(`${STOCK_URL}/products`, { headers: getAuthHeaders() }),
          fetch(`${STOCK_URL}/history?from=${defaultRange.monthStart}&to=${defaultRange.today}`, { headers: getAuthHeaders() }),
        ]);
        const [productsData, historyData] = await Promise.all([productsRes.json(), historyRes.json()]);
        if (isActive) {
          setProducts(Array.isArray(productsData) ? productsData : []);
          setHistory(Array.isArray(historyData) ? historyData : []);
        }
      } catch {
        if (isActive) setErrorMessage("Failed to load stock data.");
      } finally {
        if (isActive) { setLoading(false); setHistoryLoading(false); }
      }
    };
    loadInitialStockData();
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

  useEffect(() => {
    const timer = setTimeout(() => setProductsPage(1), 0);
    return () => clearTimeout(timer);
  }, [stockSearch]);

  useEffect(() => {
    const timer = setTimeout(() => setHistoryPage(1), 0);
    return () => clearTimeout(timer);
  }, [from, to]);

  const handleProductSelect = (id) => {
    setProductId(id);
    const p = products.find((p) => p.id === id);
    if (p) {
      if (p.cost_price > 0) setCostPrice(p.cost_price);
      else setCostPrice("");
      setSellingPrice(p.selling_price || "");
    } else {
      setCostPrice("");
      setSellingPrice("");
    }
  };

  const resetForm = () => {
    setProductId(null); setQuantity(""); setCostPrice(""); setSellingPrice("");
    setNewName(""); setNewCategory(""); setNewSellingPrice("");
    setNewCostPrice(""); setNewQuantity(""); setNewMinStock("5");
  };

  const handleStockIn = async () => {
    if (!productId || !quantity || costPrice === "") { setErrorMessage("All fields are required."); return; }
    try {
      const payload = { productId, quantity: Number(quantity), costPrice: Number(costPrice) };
      if (sellingPrice && sellingPrice !== "") {
        payload.sellingPrice = Number(sellingPrice);
      }
      const res = await fetch(`${STOCK_URL}/in`, {
        method: "POST", headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessMessage("Stock recorded successfully!");
      resetForm(); setShowForm(false);
      await fetchProducts(); await fetchHistory();
    } catch (err) { setErrorMessage(err.message); }
  };

  const handleNewProduct = async () => {
    if (!newName || !newSellingPrice || !newQuantity) { setErrorMessage("Name, selling price and quantity are required."); return; }
    try {
      const res = await fetch(`${STOCK_URL}/new-product`, {
        method: "POST", headers: getAuthHeaders(),
        body: JSON.stringify({ name: newName, category: newCategory, sellingPrice: Number(newSellingPrice), costPrice: Number(newCostPrice || 0), quantity: Number(newQuantity), minimumStock: Number(newMinStock || 5) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessMessage("Product created and stock recorded!");
      resetForm(); setShowForm(false); setIsNewProduct(false);
      await fetchProducts(); await fetchHistory();
    } catch (err) { setErrorMessage(err.message); }
  };

  const handleEditSave = async (payload) => {
    try {
      const res = await fetch(`${STOCK_URL}/products/${editingProduct.id}`, {
        method: "PUT", headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessMessage("Product updated successfully!");
      setEditingProduct(null);
      await fetchProducts();
    } catch (err) { setErrorMessage(err.message); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Deactivate "${name}"? It will no longer appear in POS or stock.`)) return;
    try {
      const res = await fetch(`${STOCK_URL}/products/${id}`, { method: "DELETE", headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessMessage(`"${name}" deactivated successfully.`);
      await fetchProducts();
    } catch (err) { setErrorMessage(err.message); }
  };

  const selectedProduct = products.find((p) => p.id === productId);
  const totalCostThisPeriod = history.reduce((s, h) => s + Number(h.totalCost || 0), 0);
  
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(stockSearch.toLowerCase())
  );
  const paginatedProducts = filteredProducts.slice(
    (productsPage - 1) * ITEMS_PER_PAGE,
    productsPage * ITEMS_PER_PAGE
  );
  const paginatedHistory = history.slice(
    (historyPage - 1) * ITEMS_PER_PAGE,
    historyPage * ITEMS_PER_PAGE
  );

  const lowStockCount = products.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= p.minimum_stock).length;
  const outOfStockCount = products.filter((p) => p.stock_quantity === 0).length;
  const totalStockValue = products.reduce((s, p) => s + Number(p.stock_quantity || 0) * Number(p.cost_price || 0), 0);

  return (
    <div className="page-shell stock-page" style={{ fontFamily: "'Segoe UI', sans-serif", color: "#1a1a2e" }}>

      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onSave={handleEditSave}
          onClose={() => setEditingProduct(null)}
        />
      )}

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <h1 style={{ fontSize: "30px", fontWeight: "700", margin: "0 0 4px" }}>Stock Management</h1>
          <p style={{ color: "#6b7280", fontSize: "15px", margin: 0 }}>Record stock purchases and track inventory costs.</p>
        </div>
        {activeTab === "products" && (
          <button onClick={() => { setShowForm(!showForm); resetForm(); setIsNewProduct(false); setEditingProduct(null); }}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "11px 18px", background: "#1a1a2e", color: "#c9a84c", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}>
            <FaPlus /> {showForm ? "Cancel" : "Record Stock In"}
          </button>
        )}
      </div>

      {/* TAB SWITCHER */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "24px", background: "#f5f3ee", padding: "4px", borderRadius: "10px", width: "fit-content", border: "1px solid #e0ddd5" }}>
        {[
          { key: "products", label: " Products & Drinks" },
          { key: "ingredients", label: "🥕 Food Ingredients" },
        ].map((tab) => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); setShowForm(false); setEditingProduct(null); resetForm(); }}
            style={{ padding: "8px 20px", borderRadius: "7px", fontWeight: "600", fontSize: "13px", cursor: "pointer", border: "none", transition: "all 0.15s", background: activeTab === tab.key ? "#1a1a2e" : "transparent", color: activeTab === tab.key ? "#c9a84c" : "#6b6b6b", boxShadow: activeTab === tab.key ? "0 1px 4px rgba(0,0,0,0.15)" : "none" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "products" && (
        <>
          {/* SUMMARY CARDS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginBottom: "24px" }}>
            <SummaryCard label="Total Products" value={products.length} color="#1a1a2e" bg="#f5f3ee" icon="" />
            <SummaryCard label="Low Stock" value={lowStockCount} color="#d97706" bg="#fff8e1" border="#fde68a" icon={<FaExclamationTriangle size={14} style={{ color: "#d97706" }} />} />
            <SummaryCard label="Out of Stock" value={outOfStockCount} color="#dc2626" bg="#fef2f2" border="#fecaca" icon={<FaTimesCircle size={14} style={{ color: "#dc2626" }} />} />
            <SummaryCard label="Stock Value" value={formatMoney(totalStockValue)} color="#2e7d32" bg="#e8f5e9" border="#c8e6c9" icon="💰" />
          </div>

          {errorMessage && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: "8px", padding: "12px 14px", marginBottom: "16px" }}>{errorMessage}</div>}
          {successMessage && <div style={{ background: "#ecfdf5", border: "1px solid #bbf7d0", color: "#166534", borderRadius: "8px", padding: "12px 14px", marginBottom: "16px" }}>{successMessage}</div>}

          {/* STOCK IN FORM */}
          {showForm && (
            <div style={{ background: "#fff", border: "1px solid #e0ddd5", borderRadius: "12px", padding: "24px", marginBottom: "24px" }}>
              <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                {["existing", "new"].map((type) => (
                  <button key={type} onClick={() => { setIsNewProduct(type === "new"); resetForm(); }}
                    style={{ padding: "8px 18px", borderRadius: "8px", fontWeight: "600", fontSize: "13px", cursor: "pointer", background: (type === "new") === isNewProduct ? "#1a1a2e" : "#fff", color: (type === "new") === isNewProduct ? "#c9a84c" : "#4a4a4a", border: (type === "new") === isNewProduct ? "1px solid #1a1a2e" : "1px solid #d0cdc6" }}>
                    {type === "existing" ? "📦 Existing Product" : "✨ New Product"}
                  </button>
                ))}
              </div>

              {!isNewProduct && (
                <>
                  <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "700" }}>Stock In — Existing Product</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                    <div><label style={labelStyle}>Product</label><ProductSearch products={products} value={productId} onChange={handleProductSelect} /></div>
                    <div><label style={labelStyle}>Quantity Received</label><input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="e.g. 24" style={inputStyle} /></div>
                    <div><label style={labelStyle}>Cost Price per Unit (KES)</label><input type="number" min="0" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="e.g. 150" style={inputStyle} /></div>
                    <div><label style={labelStyle}>Selling Price (KES) <span style={{color:"#9ca3af",fontWeight:"400"}}>(optional update)</span></label><input type="number" min="0" step="0.01" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} placeholder={selectedProduct ? `Current: ${formatMoney(selectedProduct.selling_price)}` : "e.g. 300"} style={inputStyle} /></div>
                  </div>
                  {selectedProduct && quantity && costPrice !== "" && (
                    <div style={{ background: "#f5f3ee", border: "1px solid #e0ddd5", borderRadius: "8px", padding: "14px 18px", marginBottom: "16px", display: "flex", gap: "28px", flexWrap: "wrap" }}>
                      {[
                        { label: "Current Stock", value: selectedProduct.stock_quantity },
                        { label: "Adding", value: `+${quantity}`, color: "#2e7d32" },
                        { label: "New Stock", value: Number(selectedProduct.stock_quantity) + Number(quantity), color: "#2e7d32" },
                        { label: "Total Cost", value: formatMoney(Number(quantity) * Number(costPrice)) },
                        { label: "Selling Price", value: sellingPrice ? formatMoney(sellingPrice) : formatMoney(selectedProduct.selling_price), color: sellingPrice && sellingPrice !== selectedProduct.selling_price ? "#b45309" : undefined },
                        { label: "Profit/Unit", value: formatMoney((sellingPrice || selectedProduct.selling_price) - Number(costPrice)), color: (sellingPrice || selectedProduct.selling_price) - Number(costPrice) >= 0 ? "#2e7d32" : "#dc2626" },
                      ].map((item) => (
                        <div key={item.label}>
                          <p style={{ margin: 0, fontSize: "11px", color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</p>
                          <p style={{ margin: 0, fontWeight: "700", fontSize: "15px", color: item.color || "#1a1a2e" }}>{item.value}</p>
                        </div>
                      ))}
                      {sellingPrice && Number(sellingPrice) < Number(costPrice) && (
                        <div style={{ width: "100%", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", padding: "8px 12px", fontSize: "13px", color: "#dc2626", fontWeight: "600" }}>
                          ⚠️ Selling price is lower than cost price — this will result in a loss per unit
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={handleStockIn} style={primaryBtn}>Confirm Stock In</button>
                    <button onClick={() => { setShowForm(false); resetForm(); }} style={secondaryBtn}>Cancel</button>
                  </div>
                </>
              )}

              {isNewProduct && (
                <>
                  <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "700" }}>Add New Product + Initial Stock</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                    <div><label style={labelStyle}>Product Name *</label><input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Heineken" style={inputStyle} /></div>
                    
                    {/* Category Dropdown */}
                    <div>
                      <label style={labelStyle}>Category</label>
                      <input 
                        type="text" 
                        list="new-category-options"
                        value={newCategory} 
                        onChange={(e) => setNewCategory(e.target.value)} 
                        placeholder="e.g. Beer, Spirits" 
                        style={inputStyle} 
                      />
                      <datalist id="new-category-options">
                        {CATEGORY_SUGGESTIONS.map((cat) => (
                          <option key={cat} value={cat} />
                        ))}
                      </datalist>
                    </div>
                    
                    <div><label style={labelStyle}>Minimum Stock Level</label><input type="number" min="0" value={newMinStock} onChange={(e) => setNewMinStock(e.target.value)} placeholder="5" style={inputStyle} /></div>
                    <div><label style={labelStyle}>Selling Price (KES) *</label><input type="number" min="0" step="0.01" value={newSellingPrice} onChange={(e) => setNewSellingPrice(e.target.value)} placeholder="e.g. 300" style={inputStyle} /></div>
                    <div><label style={labelStyle}>Cost Price per Unit (KES)</label><input type="number" min="0" step="0.01" value={newCostPrice} onChange={(e) => setNewCostPrice(e.target.value)} placeholder="e.g. 180" style={inputStyle} /></div>
                    <div><label style={labelStyle}>Initial Stock Quantity *</label><input type="number" min="1" value={newQuantity} onChange={(e) => setNewQuantity(e.target.value)} placeholder="e.g. 50" style={inputStyle} /></div>
                  </div>
                  {newName && newSellingPrice && newCostPrice && newQuantity && (
                    <div style={{ background: "#f5f3ee", border: "1px solid #e0ddd5", borderRadius: "8px", padding: "14px 18px", marginBottom: "16px", display: "flex", gap: "28px", flexWrap: "wrap" }}>
                      {[
                        { label: "Product", value: newName },
                        { label: "Initial Stock", value: newQuantity, color: "#2e7d32" },
                        { label: "Total Cost", value: formatMoney(Number(newQuantity) * Number(newCostPrice)) },
                        { label: "Selling Price", value: formatMoney(newSellingPrice) },
                        { label: "Profit/Unit", value: formatMoney(Number(newSellingPrice) - Number(newCostPrice)), color: Number(newSellingPrice) - Number(newCostPrice) >= 0 ? "#2e7d32" : "#dc2626" },
                        { label: "Margin", value: `${newSellingPrice > 0 ? (((newSellingPrice - newCostPrice) / newSellingPrice) * 100).toFixed(0) : 0}%`, color: "#1565c0" },
                      ].map((item) => (
                        <div key={item.label}>
                          <p style={{ margin: 0, fontSize: "11px", color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</p>
                          <p style={{ margin: 0, fontWeight: "700", fontSize: "15px", color: item.color || "#1a1a2e" }}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={handleNewProduct} style={primaryBtn}>Create Product & Record Stock</button>
                    <button onClick={() => { setShowForm(false); resetForm(); setIsNewProduct(false); }} style={secondaryBtn}>Cancel</button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* CURRENT STOCK LEVELS */}
          <div style={{ background: "#fff", border: "1px solid #e0ddd5", borderRadius: "12px", overflow: "hidden", marginBottom: "24px" }}>
            <div style={{ padding: "14px 20px", borderBottom: "2px solid #e0ddd5", background: "#f5f3ee", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FaBoxOpen style={{ color: "#c9a84c" }} />
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>Current Stock Levels</h3>
                <span style={{ background: "#1a1a2e", color: "#c9a84c", borderRadius: "20px", padding: "1px 10px", fontSize: "12px", fontWeight: "600" }}>{filteredProducts.length}</span>
              </div>
              <div style={{ position: "relative" }}>
                <FaSearch style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: "12px" }} />
                <input type="text" placeholder="Search products..." value={stockSearch} onChange={(e) => setStockSearch(e.target.value)}
                  style={{ padding: "7px 12px 7px 30px", border: "1px solid #d0cdc6", borderRadius: "7px", fontSize: "13px", outline: "none", width: "200px" }} />
              </div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Product</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>In Stock</th>
                  <th style={thStyle}>Min Stock</th>
                  <th style={thStyle}>Cost Price</th>
                  <th style={thStyle}>Selling Price</th>
                  <th style={thStyle}>Margin</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ ...tdStyle, textAlign: "center", color: "#888" }}>Loading...</td></tr>
                ) : paginatedProducts.length === 0 ? (
                  <tr><td colSpan={9} style={{ ...tdStyle, textAlign: "center", color: "#888" }}>No products found</td></tr>
                ) : paginatedProducts.map((p) => {
                  const margin = Number(p.selling_price) - Number(p.cost_price);
                  const marginPct = Number(p.selling_price) > 0 ? ((margin / Number(p.selling_price)) * 100).toFixed(0) : 0;
                  const isLow = p.stock_quantity <= p.minimum_stock && p.stock_quantity > 0;
                  const isOut = p.stock_quantity === 0;
                  return (
                    <tr key={p.id}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#faf9f6"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      style={{ transition: "background 0.15s" }}>
                      <td style={{ ...tdStyle, fontWeight: "600" }}>{p.name}</td>
                      <td style={tdStyle}><span style={{ background: "#f0ede6", color: "#6b6b6b", padding: "2px 8px", borderRadius: "20px", fontSize: "12px" }}>{p.category || "Uncategorized"}</span></td>
                      <td style={{ ...tdStyle, fontWeight: "700", color: isOut ? "#dc2626" : isLow ? "#d97706" : "#2e7d32" }}>{p.stock_quantity}</td>
                      <td style={{ ...tdStyle, color: "#6b6b6b" }}>{p.minimum_stock}</td>
                      <td style={tdStyle}>{p.cost_price > 0 ? formatMoney(p.cost_price) : <span style={{ color: "#9ca3af", fontSize: "12px" }}>Not set</span>}</td>
                      <td style={tdStyle}>{formatMoney(p.selling_price)}</td>
                      <td style={{ ...tdStyle, fontWeight: "600", color: margin >= 0 ? "#2e7d32" : "#dc2626" }}>
                        {p.cost_price > 0 ? `${formatMoney(margin)} (${marginPct}%)` : <span style={{ color: "#9ca3af", fontSize: "12px" }}>Set cost price</span>}
                      </td>
                      <td style={tdStyle}>
                        <span style={{ background: isOut ? "#fef2f2" : isLow ? "#fff8e1" : "#e8f5e9", color: isOut ? "#dc2626" : isLow ? "#d97706" : "#2e7d32", border: `1px solid ${isOut ? "#fecaca" : isLow ? "#fde68a" : "#c8e6c9"}`, padding: "2px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>
                          {isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button onClick={() => setEditingProduct(p)} style={{ ...iconBtnStyle, background: "#1a1a2e", color: "#c9a84c" }} title="Edit product"><FaEdit size={12} /></button>
                          <button onClick={() => handleDelete(p.id, p.name)} style={{ ...iconBtnStyle, background: "#fef2f2", color: "#dc2626" }} title="Deactivate product"><FaTrash size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination total={filteredProducts.length} page={productsPage} perPage={ITEMS_PER_PAGE} onChange={setProductsPage} />
          </div>

          {/* STOCK IN HISTORY */}
          <div style={{ background: "#fff", border: "1px solid #e0ddd5", borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "2px solid #e0ddd5", background: "#f5f3ee", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>Stock In History</h3>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ padding: "7px 10px", border: "1px solid #d0cdc6", borderRadius: "7px", fontSize: "13px", outline: "none" }} />
                <span style={{ color: "#888", fontSize: "13px" }}>to</span>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ padding: "7px 10px", border: "1px solid #d0cdc6", borderRadius: "7px", fontSize: "13px", outline: "none" }} />
                <button onClick={fetchHistory} style={{ padding: "7px 14px", background: "#1a1a2e", color: "#c9a84c", border: "none", borderRadius: "7px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>Filter</button>
              </div>
            </div>
            {!historyLoading && history.length > 0 && (
              <div style={{ padding: "12px 20px", background: "#faf9f6", borderBottom: "1px solid #e0ddd5", display: "flex", gap: "24px" }}>
                <div><span style={{ fontSize: "12px", color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Spent: </span><span style={{ fontWeight: "700", color: "#1a1a2e" }}>{formatMoney(totalCostThisPeriod)}</span></div>
                <div><span style={{ fontSize: "12px", color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Records: </span><span style={{ fontWeight: "700", color: "#1a1a2e" }}>{history.length}</span></div>
              </div>
            )}
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Product</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Qty Received</th>
                  <th style={thStyle}>Cost per Unit</th>
                  <th style={thStyle}>Total Cost</th>
                  <th style={thStyle}>Date</th>
                </tr>
              </thead>
              <tbody>
                {historyLoading ? (
                  <tr><td colSpan={6} style={{ ...tdStyle, textAlign: "center", color: "#888" }}>Loading...</td></tr>
                ) : paginatedHistory.length === 0 ? (
                  <tr><td colSpan={6} style={{ ...tdStyle, textAlign: "center", color: "#888" }}>No stock records in this period</td></tr>
                ) : paginatedHistory.map((h, i) => (
                  <tr key={i}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#faf9f6"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    style={{ transition: "background 0.15s" }}>
                    <td style={{ ...tdStyle, fontWeight: "600" }}>{h.productName}</td>
                    <td style={tdStyle}><span style={{ background: "#f0ede6", color: "#6b6b6b", padding: "2px 8px", borderRadius: "20px", fontSize: "12px" }}>{h.category || "Uncategorized"}</span></td>
                    <td style={{ ...tdStyle, fontWeight: "600", color: "#2e7d32" }}>+{h.quantity}</td>
                    <td style={tdStyle}>{formatMoney(h.costPrice)}</td>
                    <td style={{ ...tdStyle, fontWeight: "600" }}>{formatMoney(h.totalCost)}</td>
                    <td style={{ ...tdStyle, color: "#6b6b6b", fontSize: "13px" }}>{new Date(h.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination total={history.length} page={historyPage} perPage={ITEMS_PER_PAGE} onChange={setHistoryPage} />
          </div>
        </>
      )}

      {activeTab === "ingredients" && <IngredientStock />}
    </div>
  );
}
