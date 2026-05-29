import { API_URL } from './ServiceConfiguration';
import { authDb } from '../databases/AuthDatabase';

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
}