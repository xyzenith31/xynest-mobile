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
    } catch (error) {
      console.error("Gagal memuat SQLite:", error);
    }
  }

  public async saveSession(user: UserSession, token: string): Promise<void> {
    if (!this.db) return;
    await this.db.runAsync('DELETE FROM session'); // Hapus sesi lama
    await this.db.runAsync(
      'INSERT INTO session (user_data, session_token) VALUES (?, ?)',
      [JSON.stringify(user), token]
    );
  }

  public async getSession(): Promise<UserSession | null> {
    if (!this.db) return null;
    const result: any = await this.db.getFirstAsync('SELECT user_data FROM session LIMIT 1');
    return result ? JSON.parse(result.user_data) : null;
  }

  public async getToken(): Promise<string | null> {
    if (!this.db) return null;
    const result: any = await this.db.getFirstAsync('SELECT session_token FROM session LIMIT 1');
    return result ? result.session_token : null;
  }

  public async clearSession(): Promise<void> {
    if (!this.db) return;
    await this.db.runAsync('DELETE FROM session');
  }
}

export const authDb = AuthDatabase.getInstance();