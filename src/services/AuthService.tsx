import { API_URL } from './ServiceConfiguration';
import { authDb } from '../databases/AuthDatabase';

export class AuthService {
  
  static async register(data: {
    email: string;
    username: string;
    full_name: string;
    gender: string;
    birth_date: string;
    phone_number: string;
  }) {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await response.json();
  }

  static async verifyRegister(email: string, otpCode: string) {
    const response = await fetch(`${API_URL}/verify-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp_code: otpCode }),
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      const mockToken = "session_token_from_web_cookie"; 
      await authDb.saveSession(result.data, mockToken);
    }
    return result;
  }

  static async requestLogin(identifier: string) {
    const response = await fetch(`${API_URL}/login-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    });
    return await response.json();
  }

  static async verifyLogin(identifier: string, otpCode: string) {
    const response = await fetch(`${API_URL}/login-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, otp_code: otpCode }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      const mockToken = "session_token_from_web_cookie";
      await authDb.saveSession(result.user, mockToken);
    }
    return result;
  }

  static async resendOTP(email: string) {
    const response = await fetch(`${API_URL}/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return await response.json();
  }

  static async logout() {
    try {
      const response = await fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      
      await authDb.clearSession();
      return result;
    } catch (error) {
      await authDb.clearSession();
      return { success: true, message: "Sesi lokal dihapus karena gagal terhubung ke server." };
    }
  }

  static async checkSessionValidity(): Promise<boolean> {
    const isLoggedIn = await authDb.isAuthenticated();
    if (!isLoggedIn) {
      await authDb.clearSession();
      return false;
    }
    return true;
  }
}