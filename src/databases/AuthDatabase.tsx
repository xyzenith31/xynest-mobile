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

export interface DeviceData {
  id: string | number;
  device_id?: string | number;
  device_model: string;
  platform: string;
  os_version: string;
  is_current_device?: boolean;
  last_active?: string;
  email?: string;
  username?: string;
}

class AuthDatabase {
  private static instance: AuthDatabase;
  private db: SQLite.SQLiteDatabase | null = null;

  private constructor() {
    this.initDatabase();
  }

  private async ensureDbReady() {
    if (!this.db) {
      await this.initDatabase();
    }
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
        CREATE TABLE IF NOT EXISTS devices_cache (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          device_data TEXT
        );
      `);
    } catch (error) {
      console.error("Gagal memuat SQLite:", error);
    }
  }

  public async saveSession(user: UserSession, token: string): Promise<void> {
    await this.ensureDbReady();
    if (!this.db) return;
    await this.db.runAsync('DELETE FROM session');
    await this.db.runAsync(
      'INSERT INTO session (user_data, session_token) VALUES (?, ?)',
      [JSON.stringify(user), token]
    );
  }

  public async getSession(): Promise<UserSession | null> {
    await this.ensureDbReady();
    if (!this.db) return null;
    const result: any = await this.db.getFirstAsync('SELECT user_data FROM session LIMIT 1');
    return result ? JSON.parse(result.user_data) : null;
  }

  public async getToken(): Promise<string | null> {
    await this.ensureDbReady();
    if (!this.db) return null;
    const result: any = await this.db.getFirstAsync('SELECT session_token FROM session LIMIT 1');
    return result ? result.session_token : null;
  }

  public async clearSession(): Promise<void> {
    if (!this.db) return;
    await this.db.runAsync('DELETE FROM session');
    await this.db.runAsync('DELETE FROM devices_cache');
  }
  
  public async saveDevicesCache(devices: DeviceData[]): Promise<void> {
    await this.ensureDbReady();
    if (!this.db) return;
    await this.db.runAsync('DELETE FROM devices_cache');
    await this.db.runAsync(
      'INSERT INTO devices_cache (device_data) VALUES (?)',
      [JSON.stringify(devices)]
    );
  }

  public async getDevicesCache(): Promise<DeviceData[]> {
    await this.ensureDbReady();
    if (!this.db) return [];
    const result: any = await this.db.getFirstAsync('SELECT device_data FROM devices_cache LIMIT 1');
    return result ? JSON.parse(result.device_data) : [];
  }
}

export const authDb = AuthDatabase.getInstance();