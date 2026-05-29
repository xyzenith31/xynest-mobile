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
}

export class DeviceService {
  static async checkSessionValidity(): Promise<boolean> {
    const token = await authDb.getToken();
    if (!token) return false;
    
    try {
      const response = await fetch(`${API_URL}/devices`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}` 
        }
      });
      return response.ok;
    } catch {
      return false;
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
      console.log("📥 Data Devices dari Backend:", result); 
      
      if (response.ok) {
        return { success: true, data: result.data || result };
      }
      return { success: false, error: result.message || 'Gagal mengambil data perangkat' };
    } catch (err) {
      console.error("❌ Gagal getActiveDevices:", err);
      return { success: false, error: 'Kesalahan jaringan saat mengambil perangkat.' };
    }
  }

  static async removeDevice(deviceId: string | number): Promise<{ success: boolean; error?: string }> {
    const token = await authDb.getToken();
    if (!token) return { success: false, error: 'Tidak ada sesi lokal.' };
    
    try {
      console.log(`🚀 Mencoba DELETE perangkat dengan ID: ${deviceId}`);
      
      const response = await fetch(`${API_URL}/devices/${deviceId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.status === 204) {
        console.log("✅ Berhasil dihapus (204 No Content)");
        return { success: true };
      }

      let result = {};
      try {
        result = await response.json();
      } catch (e) {
        console.log("Info: Response body tidak berupa JSON atau kosong.");
      }
      
      console.log("📥 Response DELETE Device:", result);

      if (response.ok) {
        return { success: true };
      }
      
      return { success: false, error: (result as any).message || 'Gagal menghapus perangkat dari server.' };
    } catch (err) {
      console.error("❌ Gagal removeDevice:", err);
      return { success: false, error: 'Kesalahan jaringan saat menghapus perangkat.' };
    }
  }
}