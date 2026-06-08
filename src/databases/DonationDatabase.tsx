import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('xynest_local.db');

export const initDonationDB = () => {
  try {
    db.execSync(`
      DROP TABLE IF EXISTS donations;
      CREATE TABLE IF NOT EXISTS donations (
        id TEXT PRIMARY KEY,
        order_id TEXT UNIQUE,
        amount INTEGER,
        message TEXT,
        status TEXT,
        full_name TEXT,
        payment_url TEXT, -- TAMBAHAN KOLOM BARU
        created_at DATETIME
      );
    `);
    console.log("Donation SQLite table verified/initialized with payment_url.");
  } catch (error) {
    console.error("Gagal inisialisasi tabel donasi:", error);
  }
};

initDonationDB();

export const syncDonationsToLocal = (donations: any[]) => {
  try {
    db.withTransactionSync(() => {
      donations.forEach((d) => {
        const statement = db.prepareSync(
          'INSERT OR REPLACE INTO donations (id, order_id, amount, message, status, full_name, payment_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        statement.executeSync([
          d.id, d.order_id, d.amount, d.message || '', d.status, d.full_name || 'Hamba Allah', d.payment_url || '', d.created_at
        ]);
      });
    });
  } catch (error) {
    console.error("Gagal sinkronisasi SQLite:", error);
  }
};

export const deleteDonationLocal = (id: string) => {
  try {
    const statement = db.prepareSync('DELETE FROM donations WHERE id = ?');
    statement.executeSync([id]);
  } catch (error) {
    console.error("Gagal hapus data lokal:", error);
  }
};

export const getLocalDonations = () => {
  try {
    return db.getAllSync('SELECT * FROM donations ORDER BY created_at DESC');
  } catch (error) {
    console.error("Gagal mengambil data lokal:", error);
    return []; 
  }
};