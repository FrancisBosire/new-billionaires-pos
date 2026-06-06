import { useEffect, useState } from "react";
import { FaMinus, FaPlus, FaTrash, FaLock } from "react-icons/fa";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const PRODUCTS_API_URL = `${API_BASE_URL}/products`;
const MENU_API_URL = `${API_BASE_URL}/menu`;
const SALES_API_URL = `${API_BASE_URL}/sales`;
const OWNER_API_URL = `${API_BASE_URL}/owner`;

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${sessionStorage.getItem("token")}`,
});

const fetchJson = async (url, fallbackMessage) => {
  const response = await fetch(url, { headers: getAuthHeaders() });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || fallbackMessage);
  }

  return data;
};

function Sales({ currentUser }) {
  const [products, setProducts] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("bar");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [productsLoadError, setProductsLoadError] = useState("");

  const refreshProducts = async () => {
    try {
      const response = await fetch(PRODUCTS_API_URL, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error("Failed to refresh products");
      const data = await response.json();
      setProducts(data);
      setProductsLoadError("");
    } catch (err) {
      setProductsLoadError(err.message);
    }
  };

  // Check maintenance mode IMMEDIATELY on load
  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const response = await fetch(`${OWNER_API_URL}/maintenance`, { 
          headers: getAuthHeaders() 
        });
        if (response.ok) {
          const data = await response.json();
          setMaintenanceMode(data.isActive || false);
        }
      } catch (err) {
        console.error("Failed to check maintenance mode:", err);
      }
    };

    checkMaintenanceMode();
    
    // Poll every 10 seconds
    const interval = setInterval(checkMaintenanceMode, 10000);
    return () => clearInterval(interval);
  }, []);

  // Load products and menu
  useEffect(() => {
    let isActive = true;
    setProductsLoadError("");

    Promise.all([
      fetchJson(PRODUCTS_API_URL, "Failed to load products"),
      fetchJson(MENU_API_URL, "Failed to load food menu"),
    ])
      .then(([productsData, menuData]) => {
        if (isActive) {
          setProducts(Array.isArray(productsData) ? productsData : []);
          setMenuItems(Array.isArray(menuData) ? menuData : []);
        }
      })
      .catch((error) => { 
        if (isActive) {
          // Show the error to the user
          setProductsLoadError(error.message);
        }
      })
      .finally(() => { if (isActive) setIsLoading(false); });

    return () => { isActive = false; };
  }, []); // Remove maintenanceMode dependency to avoid reloading

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(""), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    if (!errorMessage) return;
    const timer = setTimeout(() => setErrorMessage(""), 4000);
    return () => clearTimeout(timer);
  }, [errorMessage]);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredMenu = menuItems.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const formatMoney = (amount) => `KES ${Number(amount).toFixed(2)}`;

  const addProductToCart = (product) => {
    if (maintenanceMode) {
      setErrorMessage("System is under maintenance. Cannot add items to cart.");
      return;
    }
    
    const stock = Number(product.stock_quantity ?? product.stock);
    setErrorMessage(""); setSuccessMessage("");

    if (stock <= 0) { setErrorMessage(`${product.name} is out of stock`); return; }

    setCartItems((currentItems) => {
      const existing = currentItems.find((item) => item.id === `p-${product.id}`);
      if (existing) {
        if (existing.quantity >= stock) {
          setErrorMessage(`Only ${stock} ${product.name} in stock`);
          return currentItems;
        }
        return currentItems.map((item) =>
          item.id === `p-${product.id}` ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...currentItems, {
        id: `p-${product.id}`,
        productId: product.id,
        name: product.name,
        price: Number(product.price ?? product.selling_price),
        stock,
        quantity: 1,
        type: "bar",
      }];
    });
  };

  const addMenuToCart = (menuItem) => {
    if (maintenanceMode) {
      setErrorMessage("System is under maintenance. Cannot add items to cart.");
      return;
    }
    
    setErrorMessage(""); setSuccessMessage("");

    setCartItems((currentItems) => {
      const existing = currentItems.find((item) => item.id === `m-${menuItem.id}`);
      if (existing) {
        return currentItems.map((item) =>
          item.id === `m-${menuItem.id}` ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...currentItems, {
        id: `m-${menuItem.id}`,
        productId: menuItem.id,
        name: menuItem.name,
        price: Number(menuItem.price),
        stock: Infinity,
        quantity: 1,
        type: "food",
      }];
    });
  };

  const increaseQuantity = (id) => {
    if (maintenanceMode) return;
    
    setErrorMessage(""); setSuccessMessage("");
    setCartItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== id) return item;
        if (item.stock !== Infinity && item.quantity >= item.stock) {
          setErrorMessage(`Only ${item.stock} ${item.name} in stock`);
          return item;
        }
        return { ...item, quantity: item.quantity + 1 };
      })
    );
  };

  const decreaseQuantity = (id) => {
    if (maintenanceMode) return;
    
    setErrorMessage(""); setSuccessMessage("");
    setCartItems((currentItems) =>
      currentItems
        .map((item) => item.id !== id ? item : { ...item, quantity: item.quantity - 1 })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id) => {
    if (maintenanceMode) return;
    
    setErrorMessage(""); setSuccessMessage("");
    setCartItems((currentItems) => currentItems.filter((item) => item.id !== id));
  };

  const completeSale = async () => {
    setErrorMessage(""); setSuccessMessage("");

    if (maintenanceMode) {
      setErrorMessage("System is under maintenance. Sales are disabled.");
      return;
    }

    if (cartItems.length === 0) {
      setErrorMessage("Add at least one item before checkout");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(SALES_API_URL, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          paymentMethod,
          userId: currentUser.id,
          items: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            type: item.type,
          })),
        }),
      });

      const data = await response.json();
      
      if (response.status === 503) {
        setMaintenanceMode(true);
        setErrorMessage("SYSTEM UNDER MAINTENANCE - Sales are temporarily disabled by the Owner.");
        setIsSubmitting(false);
        return;
      }
      
      if (!response.ok) throw new Error(data.message || "Failed to complete sale");

      setSuccessMessage(`Sale #${data.saleId} completed: ${formatMoney(data.totalAmount)} via ${paymentMethod}`);
      setCartItems([]);
      await refreshProducts();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-shell sales-page">
      <div style={pageHeaderStyle}>
        <div>
          <h1 style={titleStyle}>POS Sales</h1>
          <p style={subtitleStyle}>
            {currentUser.role === "cashier" ? "Cashier checkout workspace" : "Admin checkout workspace"}
          </p>
        </div>
      </div>

      {/* MAINTENANCE MODE ALERT - SHOWS IMMEDIATELY */}
      {maintenanceMode && (
        <div style={maintenanceAlertStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
            <div style={{
              fontSize: "40px",
              background: "white",
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}>
              <FaLock style={{ color: "#dc2626", fontSize: "28px" }} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ 
                margin: 0, 
                color: "white", 
                fontSize: "20px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                🔒 SYSTEM UNDER MAINTENANCE
              </h2>
              <p style={{ 
                margin: "6px 0 0", 
                color: "#fecaca", 
                fontSize: "14px",
                lineHeight: "1.5"
              }}>
                The POS system is temporarily locked by the Owner. All sales are disabled. Please wait for the Owner to restore normal operations.
              </p>
            </div>
          </div>
          
          <div style={{
            background: "rgba(0,0,0,0.3)",
            borderRadius: "8px",
            padding: "12px 16px",
            marginTop: "12px",
            border: "1px solid rgba(255,255,255,0.1)"
          }}>
            <p style={{ 
              margin: 0, 
              color: "#fee2e2", 
              fontSize: "13px",
              fontWeight: "600",
              textAlign: "center"
            }}>
              ⏳ Contact the Owner to restore system access
            </p>
          </div>
        </div>
      )}

      {errorMessage && <div style={errorStyle}>{errorMessage}</div>}
      {successMessage && <div style={successStyle}>{successMessage}</div>}

      {/* WRAPPER WITH BLUR - Applied immediately when maintenance is on */}
      <div style={{
        ...layoutStyle,
        opacity: maintenanceMode ? 0.3 : 1,
        pointerEvents: maintenanceMode ? 'none' : 'auto',
        filter: maintenanceMode ? 'blur(3px)' : 'none',
        transition: 'all 0.3s ease',
        position: 'relative'
      }}>
        {/* PRODUCTS PANEL */}
        <section style={productsPanelStyle}>
          <div style={panelHeaderStyle}>
            <input
              type="text"
              placeholder={activeTab === "bar" ? "Search bar products..." : "Search food items..."}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); }}
              style={{...searchInputStyle, opacity: maintenanceMode ? 0.5 : 1}}
              disabled={maintenanceMode}
            />
          </div>

          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            {[
              { key: "bar", label: "🍺 Bar Products" },
              { key: "food", label: "🍽️ Food Menu" },
            ].map((tab) => (
              <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearchTerm(""); }}
                disabled={maintenanceMode}
                style={{
                  padding: "8px 16px", borderRadius: "7px", fontWeight: "600", fontSize: "13px",
                  background: activeTab === tab.key ? "#1f2a36" : "#eef1f5",
                  color: activeTab === tab.key ? "#f4c85a" : "#4a4a4a",
                  border: activeTab === tab.key ? "1px solid #1f2a36" : "1px solid #cbd5e1",
                  transition: "all 0.15s",
                  cursor: maintenanceMode ? "not-allowed" : "pointer",
                  opacity: maintenanceMode ? 0.5 : 1
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          <div style={productListStyle}>
            {isLoading && <div style={emptyPanelStyle}>Loading products...</div>}
            
            {productsLoadError && !isLoading && (
              <div style={{...emptyPanelStyle, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b"}}>
                <strong>⚠️ {productsLoadError}</strong>
                <p style={{marginTop: "8px", fontSize: "13px"}}>Please refresh the page or contact support.</p>
              </div>
            )}

            {!isLoading && !productsLoadError && activeTab === "bar" && (
              <>
                {filteredProducts.map((product) => (
                  <div key={product.id} style={{...productRowStyle, opacity: maintenanceMode ? 0.5 : 1}}>
                    <div>
                      <strong>{product.name}</strong>
                      <p style={productMetaStyle}>
                        {product.category || "Uncategorized"} • Stock {product.stock_quantity ?? product.stock}
                      </p>
                    </div>
                    <div style={productActionStyle}>
                      <strong>{formatMoney(product.selling_price ?? product.price)}</strong>
                      <button 
                        onClick={() => addProductToCart(product)} 
                        style={{...addButtonStyle, opacity: maintenanceMode ? 0.3 : 1, cursor: maintenanceMode ? 'not-allowed' : 'pointer'}}
                        disabled={maintenanceMode}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
                {filteredProducts.length === 0 && !productsLoadError && (
                  <div style={emptyPanelStyle}>No bar products found.</div>
                )}
              </>
            )}

            {!isLoading && !productsLoadError && activeTab === "food" && (
              <>
                {filteredMenu.map((item) => (
                  <div key={item.id} style={{...productRowStyle, opacity: maintenanceMode ? 0.5 : 1}}>
                    <div>
                      <strong>{item.name}</strong>
                      <p style={productMetaStyle}>Food</p>
                    </div>
                    <div style={productActionStyle}>
                      <strong>{formatMoney(item.price)}</strong>
                      <button 
                        onClick={() => addMenuToCart(item)} 
                        style={{ ...addButtonStyle, background: "#c9a84c", color: "#1a1a2e", opacity: maintenanceMode ? 0.3 : 1, cursor: maintenanceMode ? 'not-allowed' : 'pointer'}}
                        disabled={maintenanceMode}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
                {filteredMenu.length === 0 && !productsLoadError && (
                  <div style={emptyPanelStyle}>
                    {menuItems.length === 0 ? "No food items on the menu yet. Add some from the Food Menu page." : "No food items match your search."}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* CART PANEL */}
        <aside style={cartPanelStyle}>
          <h3>Current Cart</h3>

          {cartItems.length === 0 && <div style={cartEmptyStyle}>No items added yet.</div>}

          {cartItems.length > 0 && (
            <div style={cartListStyle}>
              {cartItems.map((item) => (
                <div key={item.id} style={{...cartItemStyle, opacity: maintenanceMode ? 0.5 : 1}}>
                  <div>
                    <strong>{item.name}</strong>
                    <p style={productMetaStyle}>
                      {formatMoney(item.price)} each
                      <span style={{ marginLeft: "6px", fontSize: "11px", background: item.type === "food" ? "#fff8e1" : "#e3f2fd", color: item.type === "food" ? "#92400e" : "#1565c0", padding: "1px 6px", borderRadius: "10px" }}>
                        {item.type === "food" ? "Food" : "Bar"}
                      </span>
                    </p>
                  </div>
                  <div style={quantityControlsStyle}>
                    <button 
                      onClick={() => decreaseQuantity(item.id)} 
                      style={{...quantityButtonStyle, opacity: maintenanceMode ? 0.3 : 1, cursor: maintenanceMode ? 'not-allowed' : 'pointer'}}
                      disabled={maintenanceMode}
                    >
                      <FaMinus />
                    </button>
                    <span style={quantityValueStyle}>{item.quantity}</span>
                    <button 
                      onClick={() => increaseQuantity(item.id)} 
                      style={{...quantityButtonStyle, opacity: maintenanceMode ? 0.3 : 1, cursor: maintenanceMode ? 'not-allowed' : 'pointer'}}
                      disabled={maintenanceMode}
                    >
                      <FaPlus />
                    </button>
                    <button 
                      onClick={() => removeFromCart(item.id)} 
                      style={{...removeButtonStyle, opacity: maintenanceMode ? 0.3 : 1, cursor: maintenanceMode ? 'not-allowed' : 'pointer'}}
                      disabled={maintenanceMode}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={totalRowStyle}>
            <span>Total</span>
            <strong>{formatMoney(cartTotal)}</strong>
          </div>

          <div style={paymentGroupStyle}>
            <button 
              onClick={() => setPaymentMethod("cash")} 
              style={paymentMethod === "cash" ? activePaymentButtonStyle : paymentButtonStyle}
              disabled={maintenanceMode}
            >
              Cash
            </button>
            <button 
              onClick={() => setPaymentMethod("mpesa")} 
              style={paymentMethod === "mpesa" ? activePaymentButtonStyle : paymentButtonStyle}
              disabled={maintenanceMode}
            >
              M-Pesa
            </button>
          </div>

          <button
            onClick={completeSale}
            disabled={cartItems.length === 0 || isSubmitting || maintenanceMode}
            style={{ 
              ...checkoutButtonStyle, 
              opacity: cartItems.length === 0 || isSubmitting || maintenanceMode ? 0.6 : 1,
              cursor: maintenanceMode ? "not-allowed" : "pointer",
              background: maintenanceMode ? "#6b7280" : "#1f2a36"
            }}
          >
            {maintenanceMode ? "🔒 System Locked" : isSubmitting ? "Completing..." : "Complete Sale"}
          </button>
        </aside>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}

const pageHeaderStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px", marginBottom: "20px" };
const titleStyle = { fontSize: "30px", marginBottom: "6px" };
const subtitleStyle = { color: "#6b7280", fontSize: "15px", textTransform: "capitalize" };
const layoutStyle = { display: "grid", gridTemplateColumns: "1fr 380px", gap: "20px" };
const productsPanelStyle = { background: "white", border: "1px solid #dde3ea", borderRadius: "8px", padding: "20px", minHeight: "420px", boxShadow: "0 10px 24px rgba(31, 42, 54, 0.06)" };
const cartPanelStyle = { background: "white", border: "1px solid #dde3ea", borderRadius: "8px", padding: "20px", minHeight: "420px", boxShadow: "0 10px 24px rgba(31, 42, 54, 0.06)" };
const panelHeaderStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "15px", marginBottom: "12px" };
const searchInputStyle = { width: "100%", padding: "11px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", outline: "none" };
const productListStyle = { display: "grid", gap: "10px" };
const productRowStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px", borderBottom: "1px solid #eef1f5", padding: "13px 0" };
const productMetaStyle = { color: "#6b7280", fontSize: "13px", marginTop: "4px" };
const productActionStyle = { display: "flex", alignItems: "center", gap: "12px" };
const addButtonStyle = { background: "#1f2a36", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "700", padding: "9px 13px" };
const emptyPanelStyle = { border: "1px dashed #cbd5e1", borderRadius: "8px", padding: "40px", color: "#6b7280", textAlign: "center" };
const cartEmptyStyle = { borderBottom: "1px solid #eef1f5", padding: "34px 0", color: "#6b7280", textAlign: "center" };
const cartListStyle = { display: "grid", gap: "12px", borderBottom: "1px solid #eef1f5", padding: "16px 0" };
const cartItemStyle = { display: "grid", gap: "10px" };
const quantityControlsStyle = { display: "flex", alignItems: "center", gap: "8px" };
const quantityButtonStyle = { width: "31px", height: "31px", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#eef1f5", color: "#1f2a36", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer" };
const quantityValueStyle = { minWidth: "28px", textAlign: "center", fontWeight: "700" };
const removeButtonStyle = { ...quantityButtonStyle, color: "#dc2626" };
const totalRowStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 0", fontSize: "18px" };
const paymentGroupStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" };
const paymentButtonStyle = { padding: "11px", background: "#eef1f5", color: "#1f2a36", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontWeight: "600" };
const activePaymentButtonStyle = { ...paymentButtonStyle, background: "#f4c85a", border: "1px solid #d4a432" };
const checkoutButtonStyle = { width: "100%", padding: "12px", background: "#1f2a36", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "700" };
const errorStyle = { background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: "6px", padding: "12px 14px", marginBottom: "20px", animation: "fadeOut 4s forwards" };
const successStyle = { background: "#ecfdf5", border: "1px solid #bbf7d0", color: "#166534", borderRadius: "6px", padding: "12px 14px", marginBottom: "20px", animation: "fadeOut 4s forwards" };
const maintenanceAlertStyle = {
  background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
  border: "3px solid #7f1d1d",
  borderRadius: "12px",
  padding: "24px",
  marginBottom: "20px",
  boxShadow: "0 8px 24px rgba(220, 38, 38, 0.4)",
  animation: "pulse 2s infinite"
};

export default Sales;