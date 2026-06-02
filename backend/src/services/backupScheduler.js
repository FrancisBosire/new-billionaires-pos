// services/backupScheduler.js
import cron from "node-cron";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execAsync = promisify(exec);

const setupBackupScheduler = () => {
  const backupDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  // ── DAILY BACKUP (2:00 AM) ──────────────────────────────
  cron.schedule("0 2 * * *", async () => {
    console.log("🔄 Running scheduled daily backup...");
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `daily_backup_${timestamp}.sql`;
      const filepath = path.join(backupDir, filename);
      
     const cmd = `mysqldump -h${process.env.DB_HOST} -P${process.env.DB_PORT} -u${process.env.DB_USER} -p${process.env.DB_PASSWORD} ${process.env.DB_NAME} > "${filepath}"`;
      await execAsync(cmd);
      
      console.log(`✅ Daily backup created: ${filename}`);
      
      // Cleanup: Keep only last 7 daily backups
      cleanupOldBackups(backupDir, "daily", 7);
    } catch (err) {
      console.error("❌ Daily backup failed:", err.message);
    }
  });

  // ── WEEKLY BACKUP (Sunday 3:00 AM) ─────────────────────
  cron.schedule("0 3 * * 0", async () => {
    console.log("🔄 Running scheduled weekly backup...");
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `weekly_backup_${timestamp}.sql`;
      const filepath = path.join(backupDir, filename);
      
      const cmd = `mysqldump -h${process.env.DB_HOST} -P${process.env.DB_PORT} -u${process.env.DB_USER} -p${process.env.DB_PASSWORD} ${process.env.DB_NAME} > "${filepath}"`;
      await execAsync(cmd);
      
      console.log(`✅ Weekly backup created: ${filename}`);
      
      // Cleanup: Keep only last 4 weekly backups
      cleanupOldBackups(backupDir, "weekly", 4);
    } catch (err) {
      console.error("❌ Weekly backup failed:", err.message);
    }
  });

  console.log("⏰ Backup scheduler initialized (Daily: 2AM, Weekly: Sunday 3AM)");
};

// Helper: Delete old backups
const cleanupOldBackups = (dir, type, keepCount) => {
  const files = fs.readdirSync(dir)
    .filter(f => f.startsWith(`${type}_backup_`) && f.endsWith(".sql"))
    .map(f => ({
      name: f,
      time: fs.statSync(path.join(dir, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);

  // Delete old files
  files.slice(keepCount).forEach(file => {
    fs.unlinkSync(path.join(dir, file.name));
    console.log(`🗑️ Deleted old backup: ${file.name}`);
  });
};

export default setupBackupScheduler;