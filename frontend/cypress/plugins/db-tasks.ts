import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import * as bcrypt from 'bcrypt';
import * as path from 'path';

const DB_PATH = path.join(__dirname, '../../../backend/data/app_test.db');

// Helper to run database queries
class Database {
  private db: sqlite3.Database;

  constructor(dbPath: string) {
    this.db = new sqlite3.Database(dbPath);
  }

  async run(sql: string, params: any[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async all(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  close(): void {
    this.db.close();
  }
}

export const dbTasks = {
  /**
   * Reset database - truncate all tables
   */
  async 'db:reset'(): Promise<null> {
    const db = new Database(DB_PATH);
    try {
      // Delete in correct order (respecting foreign key constraints)
      await db.run('DELETE FROM reminders');
      await db.run('DELETE FROM users');
      await db.run('DELETE FROM sqlite_sequence WHERE name IN ("users", "reminders")'); // Reset auto-increment
      console.log('✓ Database reset successfully');
      return null;
    } catch (error) {
      console.error('✗ Database reset failed:', error);
      throw error;
    } finally {
      db.close();
    }
  },

  /**
   * Seed a test user
   */
  async 'db:seed:user'({ email, password }: { email: string; password: string }): Promise<{ id: number; email: string }> {
    const db = new Database(DB_PATH);
    try {
      // Hash password using bcrypt (same as backend)
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user
      await db.run(
        'INSERT INTO users (email, hashed_password, created_at, updated_at) VALUES (?, ?, datetime("now"), datetime("now"))',
        [email, hashedPassword]
      );

      // Get the inserted user
      const user = await db.get('SELECT id, email FROM users WHERE email = ?', [email]);

      console.log(`✓ Seeded user: ${email} (id: ${user.id})`);
      return { id: user.id, email: user.email };
    } catch (error) {
      console.error('✗ Failed to seed user:', error);
      throw error;
    } finally {
      db.close();
    }
  },

  /**
   * Seed reminders for a user
   */
  async 'db:seed:reminders'({
    userId,
    reminders,
  }: {
    userId: number;
    reminders: Array<{
      title: string;
      message: string;
      phone_number: string;
      date_time: string;
      timezone: string;
      status?: 'scheduled' | 'completed' | 'failed';
    }>;
  }): Promise<number[]> {
    const db = new Database(DB_PATH);
    try {
      const insertedIds: number[] = [];

      for (const reminder of reminders) {
        const status = reminder.status || 'scheduled';

        // Convert date_time to UTC for date_time_utc field
        const localDate = new Date(reminder.date_time);
        const dateTimeUtc = localDate.toISOString();

        await db.run(
          `INSERT INTO reminders (
            user_id, title, message, phone_number,
            date_time, timezone, date_time_utc, status,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime("now"), datetime("now"))`,
          [
            userId,
            reminder.title,
            reminder.message,
            reminder.phone_number,
            reminder.date_time,
            reminder.timezone,
            dateTimeUtc,
            status,
          ]
        );

        // Get the last inserted id
        const result = await db.get('SELECT last_insert_rowid() as id');
        insertedIds.push(result.id);
      }

      console.log(`✓ Seeded ${reminders.length} reminder(s) for user ${userId}`);
      return insertedIds;
    } catch (error) {
      console.error('✗ Failed to seed reminders:', error);
      throw error;
    } finally {
      db.close();
    }
  },

  /**
   * Delete all reminders for a user
   */
  async 'db:cleanup:reminders'({ userId }: { userId: number }): Promise<null> {
    const db = new Database(DB_PATH);
    try {
      await db.run('DELETE FROM reminders WHERE user_id = ?', [userId]);
      console.log(`✓ Cleaned up reminders for user ${userId}`);
      return null;
    } catch (error) {
      console.error('✗ Failed to cleanup reminders:', error);
      throw error;
    } finally {
      db.close();
    }
  },

  /**
   * Update reminder status
   */
  async 'db:update:status'({
    reminderId,
    status,
  }: {
    reminderId: number;
    status: 'scheduled' | 'completed' | 'failed';
  }): Promise<null> {
    const db = new Database(DB_PATH);
    try {
      await db.run(
        'UPDATE reminders SET status = ?, updated_at = datetime("now") WHERE id = ?',
        [status, reminderId]
      );
      console.log(`✓ Updated reminder ${reminderId} status to ${status}`);
      return null;
    } catch (error) {
      console.error('✗ Failed to update reminder status:', error);
      throw error;
    } finally {
      db.close();
    }
  },

  /**
   * Get user by email (for debugging)
   */
  async 'db:get:user'({ email }: { email: string }): Promise<any> {
    const db = new Database(DB_PATH);
    try {
      const user = await db.get('SELECT id, email, created_at FROM users WHERE email = ?', [email]);
      return user || null;
    } catch (error) {
      console.error('✗ Failed to get user:', error);
      throw error;
    } finally {
      db.close();
    }
  },

  /**
   * Get all reminders for a user (for debugging)
   */
  async 'db:get:reminders'({ userId }: { userId: number }): Promise<any[]> {
    const db = new Database(DB_PATH);
    try {
      const reminders = await db.all(
        'SELECT id, title, message, status, date_time, timezone FROM reminders WHERE user_id = ? ORDER BY id',
        [userId]
      );
      return reminders;
    } catch (error) {
      console.error('✗ Failed to get reminders:', error);
      throw error;
    } finally {
      db.close();
    }
  },
};
