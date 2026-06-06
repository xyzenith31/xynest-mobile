import { API_URL } from './ServiceConfiguration';
import { authDb } from '../databases/AuthDatabase';

export interface DeviceSession {
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

export class DeviceService {
  static async checkSessionValidity(): Promise<boolean | 'offline'> {
    const token = await authDb.getToken();
    if (!token) return false;
    
    try {
      const response = await fetch(`${API_URL}/devices`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.status === 401 || response.status === 403) return false;
      return response.ok;
    } catch (error) {
      console.log("Status Offline terdeteksi, mempertahankan sesi lokal");
      return 'offline';
    }
  }

  static async getActiveDevices(): Promise<{ success: boolean; data?: DeviceSession[]; error?: string }> {
    const token = await authDb.getToken();
    if (!token) return { success: false, error: 'Tidak ada sesi lokal.' };
    
    try {
      const response = await fetch(`${API_URL}/devices`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const result = await response.json();
      
      if (response.ok) {
        const devices = result.data || result;
        await authDb.saveDevicesCache(devices);
        return { success: true, data: devices };
      }
      return { success: false, error: result.message || 'Gagal mengambil data perangkat' };
    } catch (err) {
      const cachedDevices = await authDb.getDevicesCache();
      if (cachedDevices && cachedDevices.length > 0) return { success: true, data: cachedDevices };
      return { success: false, error: 'Kesalahan jaringan saat mengambil perangkat.' };
    }
  }

  static async removeDevice(deviceId: string | number): Promise<{ success: boolean; error?: string }> {
    const token = await authDb.getToken();
    if (!token) return { success: false, error: 'Tidak ada sesi lokal.' };
    
    try {
      const response = await fetch(`${API_URL}/devices/${deviceId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      
      if (response.status === 204) return { success: true };

      let result = {};
      try { result = await response.json(); } catch (e) {}

      if (response.ok) return { success: true };
      
      return { success: false, error: (result as any).message || 'Gagal menghapus perangkat.' };
    } catch (err) {
      return { success: false, error: 'Kesalahan jaringan saat menghapus perangkat.' };
    }
  }

  static async authorizeQRLogin(
    qrToken: string, 
    deviceModel?: string, 
    platform?: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const token = await authDb.getToken();
    if (!token) return { success: false, error: 'Tidak ada sesi lokal.' };

    try {
      const response = await fetch(`${API_URL}/qr/authorize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          qr_token: qrToken,
          device_model: deviceModel,
          platform: platform
        })
      });
      
      const result = await response.json();

      if (response.ok && result.success) {
        return { success: true, message: result.message };
      }
      
      return { success: false, error: result.error || 'Gagal mengotorisasi perangkat.' };
    } catch (err) {
      console.error("❌ Gagal authorizeQRLogin:", err);
      return { success: false, error: 'Kesalahan jaringan saat mengotorisasi QR.' };
    }
  }
}