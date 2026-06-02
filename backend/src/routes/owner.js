// routes/owner.js
import express from "express";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import db from "../config/db.js";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();
const execAsync = promisify(exec);

// 🔐 STRICTLY OWNER-ONLY ACCESS
router.use(verifyToken, authorizeRoles("owner"));

// ─ 1. CREATE DATABASE BACKUP ─────────────────────────────
router.post("/backup", async (req, res) => {
  try {
    const backupDir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup_${process.env.DB_NAME}_${timestamp}.sql`;
    const filepath = path.join(backupDir, filename);
    
    // Ensure DB credentials are in your .env file
const cmd = `mysqldump -h${process.env.DB_HOST} -P${process.env.DB_PORT} -u${process.env.DB_USER} -p${process.env.DB_PASSWORD} ${process.env.DB_NAME} > "${filepath}"`;    await execAsync(cmd);
    
    const stats = fs.statSync(filepath);
    res.json({ message: "Backup created successfully", filename, size: stats.size });
  } catch (err) {
    console.error("Backup error:", err);
    res.status(500).json({ error: "Failed to create backup. Ensure mysqldump is installed." });
  }
});

// ─ 2. LIST BACKUPS ───────────────────────────────────────
router.get("/backups", async (req, res) => {
  try {
    const backupDir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(backupDir)) return res.json({ backups: [] });
    
    const backups = fs.readdirSync(backupDir)
      .filter(f => f.endsWith(".sql"))
      .map(f => {
        const stats = fs.statSync(path.join(backupDir, f));
        return { filename: f, size: stats.size, created: stats.mtime };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));
      
    res.json({ backups });
  } catch (err) {
    res.status(500).json({ error: "Failed to list backups." });
  }
});

// ── 3. SYSTEM INFO ────────────────────────────────────────
router.get("/info", async (req, res) => {
  try {
    const [dbSize] = await db.query(`
      SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as size_mb
      FROM information_schema.tables WHERE table_schema = ?
    `, [process.env.DB_NAME]);
    
    const [userCount] = await db.query("SELECT COUNT(*) as count FROM users");
    
    res.json({
      dbSize: dbSize[0].size_mb || 0,
      totalUsers: userCount[0].count,
      uptime: process.uptime(),
      nodeVersion: process.version
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load system info." });
  }
});

// ── 4. DOWNLOAD BACKUP ────────────────────────────────────
router.get("/backups/:filename", (req, res) => {
  try {
    const { filename } = req.params;
    // Security: Prevent directory traversal attacks
    if (filename.includes("..") || filename.includes("/")) {
      return res.status(400).json({ error: "Invalid filename." });
    }
    
    const filepath = path.join(process.cwd(), "backups", filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: "Backup file not found." });
    }
    
    res.download(filepath);
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ error: "Failed to download backup." });
  }
});

export default router;