import { API_URL } from './ServiceConfiguration';
import { authDb } from '../databases/AuthDatabase';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export class LoginService {
  static async requestLogin(identifier: string) {
    const response = await fetch(`${API_URL}/login-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    });
    return await response.json();
  }

  static async verifyLogin(identifier: string, otpCode: string) {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier,
        otp_code: otpCode,
        device_model: Device.modelName || 'Unknown Device',
        platform: Platform.OS === 'android' ? 'Android' : Platform.OS === 'ios' ? 'iOS' : 'Website',
        os_version: Device.osVersion || 'Unknown OS'
      }),
    });
    const result = await response.json();
    if (response.ok && result.success) {
      await authDb.saveSession(result.user, result.session_token);
    }
    return result;
  }

  static async generateQRToken() {
    try {
      const response = await fetch(`${API_URL}/qr/generate`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return await response.json();
    } catch (error) {
      console.error("Gagal generate QR Token:", error);
      return { success: false, error: 'Koneksi ke server gagal' };
    }
  }

  static async checkQRStatus(qrToken: string) {
    try {
      const response = await fetch(`${API_URL}/qr/status/${qrToken}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();

      if (response.status === 400 || data.error === 'QR Token sudah kedaluwarsa.') {
        return { success: false, isExpired: true, error: data.error };
      }

      if (response.ok && data.success && data.status === 'AUTHORIZED') {
        if (data.session_token && data.user) {
          await authDb.saveSession(data.user, data.session_token);
        }
      }

      return data;
    } catch (error) {
      console.log("Polling check error (mungkin network):", error);
      return { success: false, error: 'Koneksi ke server terputus' };
    }
  }
}