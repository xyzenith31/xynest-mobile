import { API_URL } from '../ServiceConfiguration';

export class BannedService {
  static async submitAppeal(identifier: string, appeal_reason: string, appeal_text: string) {
    const endpoint = `${API_URL}/api/admin/appeal`;
    
    try {
      console.log(`[BannedService] Mengirim banding ke: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ identifier, appeal_reason, appeal_text }),
      });

      const textResponse = await response.text();
      
      let data;
      try {
        data = JSON.parse(textResponse);
      } catch (parseError) {
        return { 
          success: false, 
          error: `Server error (Status: ${response.status}). Cek console.` 
        };
      }

      if (!response.ok) {
        return { 
          success: false, 
          error: data.message || data.error || `Error dari server (Status ${response.status})` 
        };
      }

      return data;
    } catch (error: any) {
      return { 
        success: false, 
        error: 'Gagal terhubung ke server.' 
      };
    }
  }
}