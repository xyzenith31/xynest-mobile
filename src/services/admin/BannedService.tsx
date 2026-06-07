import { API_URL } from '../ServiceConfiguration';

export class BannedService {
  static async submitAppeal(identifier: string, appeal_reason: string, appeal_text: string) {
    const endpoint = API_URL.replace('/auth', '/admin/appeal');

    try {
      console.log(`[BannedService] Menembak URL: ${endpoint}`);
      
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
          error: `Server Error 500/404. URL yang ditembak: ${endpoint}` 
        };
      }

      if (!response.ok) {
        return { 
          success: false, 
          error: data.message || data.error || `Error dari server (Status: ${response.status})` 
        };
      }

      return data;
    } catch (error: any) {
      console.error("[BannedService] Fetch gagal:", error.message);
      return { 
        success: false, 
        error: `Gagal terhubung ke server. Pastikan koneksi aman.` 
      };
    }
  }
}