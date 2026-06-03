// routes/owner.js
import express from "express";
import fs from "fs";
import path from "path";
import db from "../config/db.js";

const router = express.Router();

// ── 1. CREATE DATABASE BACKUP (JavaScript-based) ────────
router.post("/backup", async (req, res) => {
  try {
    const mysqldump = (await import('mysqldump')).default;
    
    const backupDir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup_${process.env.DB_NAME}_${timestamp}.sql`;
    const filepath = path.join(backupDir, filename);
    
    // Create backup using JavaScript library
    await mysqldump({
      connection: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT) || 3306,
      },
      dumpToFile: filepath,
    });
    
    const stats = fs.statSync(filepath);
    res.json({ message: "Backup created successfully", filename, size: stats.size });
  } catch (err) {
    console.error("Backup error:", err);
    res.status(500).json({ error: "Failed to create backup: " + err.message });
  }
});

// ── 2. LIST BACKUPS ───────────────────────────────────────
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
    console.error("System info error:", err);
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

// ── GET MAINTENANCE MODE STATUS ───────────────────────────
router.get("/maintenance", (req, res) => {
  res.json({ isActive: global.isMaintenanceMode || false });
});

// ── 5. TOGGLE MAINTENANCE MODE (OWNER ONLY) ───────────────
router.put("/maintenance", async (req, res) => {
  const { isActive } = req.body;
  
  // Debug log
  console.log("🔧 Maintenance toggle request received:", { isActive, type: typeof isActive });
  
  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ error: "isActive must be a boolean." });
  }

  try {
    await db.query(
      "INSERT INTO settings (setting_key, setting_value) VALUES ('maintenance_mode', ?) ON DUPLICATE KEY UPDATE setting_value = ?",
      [isActive.toString(), isActive.toString()]
    );
    
    global.isMaintenanceMode = isActive;
    
    console.log(`✅ Maintenance mode ${isActive ? 'ENABLED' : 'DISABLED'}`);
    
    res.json({ 
      message: `Maintenance mode is now ${isActive ? 'ON' : 'OFF'}.`,
      isActive 
    });
  } catch (err) {
    console.error("Maintenance toggle error:", err);
    res.status(500).json({ error: "Failed to update maintenance mode." });
  }
});

export default router;