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
}