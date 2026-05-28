import * as SQLite from 'expo-sqlite';

export interface UserSession {
  id: string;
  email: string;
  username: string;
  full_name: string;
  gender: string;
  birth_date: string;
  phone_number: string;
}

class AuthDatabase {
  private static instance: AuthDatabase;
  private db: SQLite.SQLiteDatabase | null = null;

  private constructor() {
    this.initDatabase();
  }

  public static getInstance(): AuthDatabase {
    if (!AuthDatabase.instance) {
      AuthDatabase.instance = new AuthDatabase();
    }
    return AuthDatabase.instance;
  }

  private async initDatabase() {
    try {
      this.db = await SQLite.openDatabaseAsync('xynest_auth.db');
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS session (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_data TEXT,
          session_token TEXT
        );
      `);
      console.log("💾 [AuthDatabase] SQLite Berhasil Diinisialisasi.");
    } catch (error) {
      console.error("❌ [AuthDatabase] Gagal memuat SQLite:", error);
    }
  }

  private async getDbConnection(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db) {
      this.db = await SQLite.openDatabaseAsync('xynest_auth.db');
    }
    return this.db;
  }

  public async saveSession(user: UserSession, token: string): Promise<void> {
    const db = await this.getDbConnection();
    await db.runAsync('DELETE FROM session');
    
    const userDataStr = JSON.stringify(user);
    await db.runAsync(
      'INSERT INTO session (user_data, session_token) VALUES (?, ?)',
      [userDataStr, token]
    );
    console.log("💾 [AuthDatabase] Sesi disimpan ke SQLite.");
  }

  public async getSession(): Promise<UserSession | null> {
    const db = await this.getDbConnection();
    const row = await db.getFirstAsync<{ user_data: string }>('SELECT user_data FROM session LIMIT 1');
    
    if (row && row.user_data) {
      return JSON.parse(row.user_data) as UserSession;
    }
    return null;
  }

  public async getToken(): Promise<string | null> {
    const db = await this.getDbConnection();
    const row = await db.getFirstAsync<{ session_token: string }>('SELECT session_token FROM session LIMIT 1');
    return row ? row.session_token : null;
  }

  public async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null;
  }

  public async clearSession(): Promise<void> {
    const db = await this.getDbConnection();
    await db.runAsync('DELETE FROM session');
    console.log("❌ [AuthDatabase] Sesi di SQLite berhasil dikosongkan.");
  }
}

export const authDb = AuthDatabase.getInstance();