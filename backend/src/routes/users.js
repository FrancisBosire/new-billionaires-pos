// routes/users.js
import express from "express";
import bcrypt from "bcrypt";
import db from "../config/db.js";

const router = express.Router();

// GET ALL USERS
router.get("/", async (req, res) => {
  try {
    // 🔒 Hide 'owner' role from sudo_admin and Admin (but owner sees everyone)
    const hideOwner = req.user?.role !== "owner" ? "AND role != 'owner'" : "";
    
    const [users] = await db.query(
      `SELECT id, name, email, role, created_at 
       FROM users 
       WHERE 1=1 ${hideOwner}
       ORDER BY created_at DESC`
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users." });
  }
});

// CREATE USER
router.post("/", async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "All fields are required." });
  }

  // 🔑 Owner can create ANY role; others are restricted
  const validRoles = req.user?.role === "owner" 
    ? ["owner", "sudo_admin", "admin", "cashier"] 
    : ["sudo_admin", "admin", "cashier"];
    
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: "Invalid role." });
  }

  // 🔑 Admins can only create cashiers (unless owner is creating)
  if (req.user.role === "admin" && role !== "cashier" && req.user.role !== "owner") {
    return res.status(403).json({ error: "Admins can only create cashier accounts." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role]
    );
    res.status(201).json({ message: "User created successfully.", userId: result.insertId });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "This email is already registered." });
    }
    res.status(500).json({ error: "Failed to create user." });
  }
});

// UPDATE USER
// UPDATE USER
router.put("/:id", async (req, res) => {
  const { name, email, password, role } = req.body;
  const { id } = req.params;

  // 🔒 Prevent modifying own account (safety feature)
  if (Number(id) === req.user.id) {
    return res.status(400).json({ error: "You cannot modify your own account. Ask another Owner to make changes." });
  }

  // 🔑 Owner can promote to ANY role; others are restricted
  if (role && req.user.role !== "owner") {
    const allowedPromotions = {
      "sudo_admin": ["admin", "cashier"],
      "admin": ["cashier"],
    };
    const userAllowed = allowedPromotions[req.user.role] || [];
    if (!userAllowed.includes(role) && role !== req.user.role) {
      return res.status(403).json({ error: "You cannot assign this role." });
    }
  }

  try {
    // Build dynamic update query (only update fields that are provided)
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push("name = ?");
      values.push(name);
    }
    if (email !== undefined) {
      updates.push("email = ?");
      values.push(email);
    }
    if (password !== undefined && password !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push("password = ?");
      values.push(hashedPassword);
    }
    if (role !== undefined) {
      updates.push("role = ?");
      values.push(role);
    }

    // If nothing to update, return early
    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update." });
    }

    values.push(id); // for WHERE clause

    await db.query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      values
    );
    
    res.json({ message: "User updated successfully." });
  } catch (err) {
    console.error("Update user error:", err); // Log for debugging
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "This email is already registered." });
    }
    res.status(500).json({ error: "Failed to update user." });
  }
});

// DELETE USER
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

if (req.user.role !== "owner" && req.user.role !== "sudo_admin") {
  return res.status(403).json({ error: "Only Owner and Sudo Admin can delete users." });
}

  if (Number(id) === req.user.id) {
    return res.status(400).json({ error: "You cannot delete your own account." });
  }

  try {
    await db.query("DELETE FROM users WHERE id = ?", [id]);
    res.json({ message: "User deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user." });
  }
});

export default router;