import { API_URL } from './ServiceConfiguration';
import { authDb } from '../databases/AuthDatabase';

export class UserService {
  static async logout() {
    const token = await authDb.getToken();
    
    if (token) {
      try {
        const response = await fetch(`${API_URL}/logout`, {
          method: 'POST',
          headers: { 
            // HAPUS 'Content-Type': 'application/json' KARENA KITA TIDAK NGIRIM BODY JSON
            'Authorization': `Bearer ${token}` 
          },
        });
        
        const result = await response.json();
        console.log("Response Logout dari Backend:", result);
        return result;
      } catch (err) {
        console.error("Gagal menembak API logout:", err);
        return { success: false, error: 'Kesalahan jaringan saat logout.' };
      }
    }
    return { success: false, error: 'Tidak ada sesi lokal.' };
  }

  static async deleteAccount() {
    const token = await authDb.getToken();
    
    if (token) {
      try {
        const response = await fetch(`${API_URL}/account`, {
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${token}` 
          },
        });
        
        const result = await response.json();
        console.log("Response Hapus Akun dari Backend:", result);
        return result;
      } catch (err) {
        console.error("Gagal menembak API hapus akun:", err);
        return { success: false, error: 'Terjadi kesalahan jaringan.' };
      }
    }
    return { success: false, error: 'Sesi lokal tidak valid.' };
  }
}