import { useEffect, useState, useRef } from "react";
import { FaTrash, FaEdit, FaTimes } from "react-icons/fa";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const PRODUCTS_API_URL = `${API_BASE_URL}/products`;

// Predefined category suggestions (drinks-focused)
const CATEGORY_SUGGESTIONS = [
  "Whiskey",
  "Spirit",
  "Wine",
  "Softdrinks",
  "Brandy",
  "Beer",
  "Cocktails",
  "Juices",
  "Water",
  "Energy Drinks"
];

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${sessionStorage.getItem("token")}`,
});

function Products() {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("");
  const [price, setPrice] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Ref for scrolling
  const pageShellRef = useRef(null);

  // Scroll to top when page changes
  useEffect(() => {
    // Try to scroll the page-shell container first
    if (pageShellRef.current) {
      pageShellRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Fallback: try to find .page-shell class
      const scrollContainer = document.querySelector('.page-shell');
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Last resort: scroll window
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [currentPage]);

  const fetchProducts = async () => {
    try {
      setErrorMessage("");
      const response = await fetch(PRODUCTS_API_URL, { headers: getHeaders() });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.message || "Failed to load products");
      }
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isActive = true;
    fetch(PRODUCTS_API_URL, { headers: getHeaders() })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load products");
        return response.json();
      })
      .then((data) => {
        if (isActive) setProducts(data);
      })
      .catch((error) => {
        if (isActive) setErrorMessage(error.message);
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });
    return () => { isActive = false; };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setCurrentPage(1), 0);
    return () => clearTimeout(timer);
  }, [searchTerm, products.length]);

  const resetForm = () => {
    setName("");
    setCategory("");
    setStock("");
    setPrice("");
    setEditingId(null);
  };

  const handleAddProduct = async () => {
    try {
      setErrorMessage("");
      const response = await fetch(PRODUCTS_API_URL, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ name, category, stock, price }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.message || "Failed to save product");
      }
      await fetchProducts();
      resetForm();
      setShowForm(false);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleEditProduct = (product) => {
    setName(product.name);
    setCategory(product.category || "");
    setStock(product.stock);
    setPrice(product.price);
    setEditingId(product.id);
    setShowEditModal(true);
  };

  const handleDeleteProduct = async (id) => {
    try {
      setErrorMessage("");
      const response = await fetch(`${PRODUCTS_API_URL}/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.message || "Failed to delete product");
      }
      setProducts((currentProducts) =>
        currentProducts.filter((product) => product.id !== id)
      );
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleUpdateProduct = async () => {
    try {
      setErrorMessage("");
      const response = await fetch(`${PRODUCTS_API_URL}/${editingId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ name, category, stock, price }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.message || "Failed to update product");
      }
      await fetchProducts();
      resetForm();
      setShowEditModal(false);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleCancelForm = () => {
    resetForm();
    setShowForm(false);
    setShowEditModal(false);
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="page-shell products-page" style={pageStyle} ref={pageShellRef}>
      <div className="page-header-row" style={pageHeaderStyle}>
        <div>
          <h1 style={titleStyle}>Products</h1>
          <p style={subtitleStyle}>
            Manage inventory items, stock levels, and product pricing.
          </p>
        </div>
      </div>

      {errorMessage && <div style={errorStyle}>{errorMessage}</div>}

      <div className="responsive-toolbar" style={toolbarStyle}>
        <button
          onClick={() => {
            if (showForm) {
              handleCancelForm();
              return;
            }
            setShowForm(true);
          }}
          style={primaryButtonStyle}
        >
          {showForm ? "Close Form" : "Add Product"}
        </button>

        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={searchInputStyle}
        />
      </div>

      {showForm && (
        <div className="panel-card" style={formPanelStyle}>
          <h3 style={sectionTitleStyle}>New Product Form</h3>
          <div className="responsive-form-grid" style={formGridStyle}>
            <input type="text" placeholder="Product Name" style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
            
            {/* Category Input with Datalist */}
            <div style={{ position: "relative" }}>
              <input
                type="text"
                list="category-suggestions"
                placeholder="Category (e.g. Beer, Wine)"
                style={inputStyle}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
              <datalist id="category-suggestions">
                {CATEGORY_SUGGESTIONS.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
            
            <input type="number" placeholder="Stock Quantity" style={inputStyle} value={stock} onChange={(e) => setStock(e.target.value)} />
            <input type="number" placeholder="Price" style={inputStyle} value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div style={formActionsStyle}>
            <button onClick={handleAddProduct} style={primaryButtonStyle}>Save Product</button>
            <button onClick={handleCancelForm} style={secondaryButtonStyle}>Cancel</button>
          </div>
        </div>
      )}

      <div className="responsive-table-card" style={tableCardStyle}>
        <table className="responsive-table" style={tableStyle}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>#</th>
              <th style={tableHeaderStyle}>Name</th>
              <th style={tableHeaderStyle}>Category</th>
              <th style={tableHeaderStyle}>Stock</th>
              <th style={tableHeaderStyle}>Price</th>
              <th style={tableHeaderStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!isLoading && currentProducts.map((product, index) => (
              <tr
                key={product.id}
                style={tableRowStyle}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#faf9f6"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <td style={tableCellStyle}>{indexOfFirstItem + index + 1}</td>
                <td style={tableCellStyle}><strong>{product.name}</strong></td>
                <td style={tableCellStyle}>
                  <span style={categoryBadgeStyle}>{product.category || "Uncategorized"}</span>
                </td>
                <td style={tableCellStyle}>{product.stock}</td>
                <td style={tableCellStyle}>KES {Number(product.price).toFixed(2)}</td>
                <td style={tableCellStyle}>
                  <div style={actionGroupStyle}>
                    <button onClick={() => handleEditProduct(product)} style={iconButtonStyle} title="Edit product">
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDeleteProduct(product.id)} style={dangerButtonStyle} title="Delete product">
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {isLoading && <div style={emptyStateStyle}>Loading products...</div>}
        {!isLoading && filteredProducts.length === 0 && (
          <div style={emptyStateStyle}>No products found. Try a different search term.</div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={paginationStyle}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ ...pageButtonStyle, opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
            >
              Previous
            </button>
            <span style={{ padding: "0 12px", color: "#475569", fontWeight: "500" }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ ...pageButtonStyle, opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Modular Overlay for Edit */}
      {showEditModal && (
        <div style={overlayStyle} onClick={handleCancelForm}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <button onClick={handleCancelForm} style={closeButtonStyle}><FaTimes /></button>
            <h3 style={sectionTitleStyle}>Edit Product</h3>
            <div className="responsive-form-grid" style={formGridStyle}>
              <input type="text" placeholder="Product Name" style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
              
              {/* Category Input with Datalist (Edit Modal) */}
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  list="category-suggestions"
                  placeholder="Category (e.g. Beer, Wine)"
                  style={inputStyle}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
                <datalist id="category-suggestions">
                  {CATEGORY_SUGGESTIONS.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
              
              <input type="number" placeholder="Stock Quantity" style={inputStyle} value={stock} onChange={(e) => setStock(e.target.value)} />
              <input type="number" placeholder="Price" style={inputStyle} value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div style={formActionsStyle}>
              <button onClick={handleUpdateProduct} style={primaryButtonStyle}>Update Product</button>
              <button onClick={handleCancelForm} style={secondaryButtonStyle}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ================= Styles =================
const pageStyle = { color: "#17202a" };
const pageHeaderStyle = { display: "flex", justifyContent: "space-between", gap: "20px", alignItems: "center", marginBottom: "20px" };
const titleStyle = { fontSize: "30px", marginBottom: "6px" };
const subtitleStyle = { color: "#6b7280", fontSize: "15px" };
const toolbarStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "15px", marginBottom: "20px" };
const errorStyle = { background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: "6px", padding: "12px 14px", marginBottom: "20px" };
const primaryButtonStyle = { padding: "11px 16px", background: "#1f2a36", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" };
const secondaryButtonStyle = { padding: "11px 16px", background: "#eef1f5", color: "#1f2a36", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontWeight: "600" };
const searchInputStyle = { width: "280px", padding: "11px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", outline: "none" };
const formPanelStyle = { background: "white", padding: "22px", marginBottom: "20px", borderRadius: "8px", border: "1px solid #dde3ea", boxShadow: "0 10px 24px rgba(31, 42, 54, 0.06)" };
const sectionTitleStyle = { marginBottom: "15px", fontSize: "18px" };
const formGridStyle = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "14px" };
const formActionsStyle = { display: "flex", gap: "10px", marginTop: "16px" };
const tableCardStyle = { background: "white", border: "1px solid #dde3ea", borderRadius: "8px", overflow: "hidden", boxShadow: "0 10px 24px rgba(31, 42, 54, 0.06)" };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const tableHeaderStyle = { background: "#f8fafc", borderBottom: "1px solid #dde3ea", color: "#475569", fontSize: "13px", padding: "13px 14px", textAlign: "left" };
const tableCellStyle = { borderBottom: "1px solid #eef1f5", padding: "14px", textAlign: "left", verticalAlign: "middle" };
const tableRowStyle = { transition: "background 0.15s ease" };
const categoryBadgeStyle = { display: "inline-block", background: "#edf7f3", color: "#0f766e", borderRadius: "999px", padding: "5px 10px", fontSize: "13px", fontWeight: "600" };
const actionGroupStyle = { display: "flex", gap: "8px" };
const iconButtonStyle = { background: "#1f2a36", color: "white", border: "none", width: "36px", height: "34px", borderRadius: "6px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" };
const dangerButtonStyle = { ...iconButtonStyle, background: "#dc2626" };
const emptyStateStyle = { padding: "28px", textAlign: "center", color: "#6b7280" };
const inputStyle = { width: "100%", padding: "11px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", outline: "none" };
const paginationStyle = { display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", marginTop: "20px", padding: "16px" };
const pageButtonStyle = { padding: "10px 14px", background: "#eef1f5", color: "#1f2a36", border: "1px solid #cbd5e1", borderRadius: "6px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" };
const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  backdropFilter: "blur(2px)",
};
const modalStyle = {
  background: "white",
  padding: "28px",
  borderRadius: "10px",
  width: "90%",
  maxWidth: "600px",
  boxShadow: "0 12px 28px rgba(0, 0, 0, 0.2)",
  position: "relative",
};
const closeButtonStyle = {
  position: "absolute",
  top: "16px",
  right: "16px",
  background: "none",
  border: "none",
  color: "#6b7280",
  fontSize: "18px",
  cursor: "pointer",
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export default Products;