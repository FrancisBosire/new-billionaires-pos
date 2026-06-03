// services/backupScheduler.js
import cron from "node-cron";
import fs from "fs";
import path from "path";

const setupBackupScheduler = async () => {
  const mysqldump = (await import('mysqldump')).default;
  
  const backupDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  // ── DAILY BACKUP (2:00 AM) ──────────────────────────────
  cron.schedule("0 2 * * *", async () => {
    console.log("🔄 Running scheduled daily backup...");
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `daily_backup_${timestamp}.sql`;
      const filepath = path.join(backupDir, filename);
      
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
      
      console.log(`✅ Daily backup created: ${filename}`);
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
      
      console.log(`✅ Weekly backup created: ${filename}`);
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

  files.slice(keepCount).forEach(file => {
    fs.unlinkSync(path.join(dir, file.name));
    console.log(`🗑️ Deleted old backup: ${file.name}`);
  });
};

export default setupBackupScheduler;