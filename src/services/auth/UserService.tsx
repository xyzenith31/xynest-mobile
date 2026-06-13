import { API_URL } from '../ServiceConfiguration';
import { authDb } from '../../databases/AuthDatabase';

export class UserService {
  static async logout() {
    const token = await authDb.getToken();
    if (!token) return { success: false, error: 'Tidak ada sesi lokal.' };
    try {
      const response = await fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return await response.json();
    } catch (err) {
      return { success: false, error: 'Kesalahan jaringan saat logout.' };
    }
  }

  static async deleteAccount() {
    const token = await authDb.getToken();
    if (!token) return { success: false, error: 'Sesi lokal tidak valid.' };
    try {
      const response = await fetch(`${API_URL}/account`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return await response.json();
    } catch (err) {
      return { success: false, error: 'Kesalahan jaringan saat menghapus akun.' };
    }
  }

  static async checkStatus() {
    const token = await authDb.getToken();
    if (!token) return { success: false, error: 'Sesi lokal tidak valid.' };
    try {
      const response = await fetch(`${API_URL}/status`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return await response.json();
    } catch (err) {
      return { success: false, error: 'Kesalahan jaringan saat cek status.' };
    }
  }

  static async getProfile() {
    const token = await authDb.getToken();
    if (!token) return { success: false, error: 'Sesi lokal tidak valid.' };
    try {
      const response = await fetch(`${API_URL}/profile`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success && result.data) {
        await authDb.setUserData(result.data);
      }
      return result;
    } catch (err) {
      return { success: false, error: 'Kesalahan jaringan saat mengambil profil.' };
    }
  }
  
  static async updateProfile(data: { username?: string, full_name?: string, gender?: string, birth_date?: string, phone_number?: string, profile_base64?: string }) {
    const token = await authDb.getToken();
    if (!token) return { success: false, error: 'Sesi lokal tidak valid.' };
    try {
      const response = await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (result.success) {
        const currentCache = await authDb.getUserData();
        await authDb.setUserData({ ...currentCache, ...data });
      }
      return result;
    } catch (err) {
      return { success: false, error: 'Kesalahan jaringan saat update profil.' };
    }
  }

  static async requestOldEmailOtp() {
    const token = await authDb.getToken();
    if (!token) return { success: false, error: 'Sesi lokal tidak valid.' };
    try {
      const response = await fetch(`${API_URL}/email/request-old`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await response.json();
    } catch (err) { return { success: false, error: 'Kesalahan jaringan.' }; }
  }

  static async verifyOldAndRequestNewEmail(otp_old: string, new_email: string) {
    const token = await authDb.getToken();
    if (!token) return { success: false, error: 'Sesi lokal tidak valid.' };
    try {
      const response = await fetch(`${API_URL}/email/verify-old`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp_old, new_email })
      });
      return await response.json();
    } catch (err) { return { success: false, error: 'Kesalahan jaringan.' }; }
  }

  static async verifyNewEmailOtp(otp_new: string) {
    const token = await authDb.getToken();
    if (!token) return { success: false, error: 'Sesi lokal tidak valid.' };
    try {
      const response = await fetch(`${API_URL}/email/verify-new`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp_new })
      });
      return await response.json();
    } catch (err) { return { success: false, error: 'Kesalahan jaringan.' }; }
  }

  static async requestPasswordChange() {
    const token = await authDb.getToken();
    if (!token) return { success: false, error: 'Sesi lokal tidak valid.' };
    try {
      const response = await fetch(`${API_URL}/password/request`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return await response.json();
    } catch (err) {
      return { success: false, error: 'Kesalahan jaringan.' };
    }
  }

  static async verifyPasswordChange(otp_code: string, new_password: string) {
    const token = await authDb.getToken();
    if (!token) return { success: false, error: 'Sesi lokal tidak valid.' };
    try {
      const response = await fetch(`${API_URL}/password/verify`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp_code, new_password })
      });
      return await response.json();
    } catch (err) {
      return { success: false, error: 'Kesalahan jaringan.' };
    }
  }
}