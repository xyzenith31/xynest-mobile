import { API_URL } from './ServiceConfiguration';
import { authDb } from '../databases/AuthDatabase';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export class VerifyService {
  static async verifyRegister(email: string, otpCode: string) {
    const response = await fetch(`${API_URL}/verify-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
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

  static async resendOTP(identifier: string) {
    const response = await fetch(`${API_URL}/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: identifier }),
    });
    return await response.json();
  }
}