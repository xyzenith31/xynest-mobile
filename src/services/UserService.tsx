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

  static async checkStatus() {
    const token = await authDb.getToken();
    
    if (token) {
      try {
        const response = await fetch(`${API_URL}/status`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        const textResponse = await response.text();

        try {
          const result = JSON.parse(textResponse);
          return result;
        } catch (parseError) {
          console.error("Bukan JSON, respons dari server:", textResponse);
          return { success: false, error: `Endpoint /status mengembalikan HTML (Error ${response.status})` };
        }
      } catch (err) {
        console.error("Gagal menembak API cek status:", err);
        return { success: false, error: 'Kesalahan jaringan.' };
      }
    }
    return { success: false, error: 'Sesi lokal tidak valid.' };
  }
}