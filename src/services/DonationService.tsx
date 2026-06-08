import { API_URL } from './ServiceConfiguration';
import { syncDonationsToLocal, getLocalDonations, deleteDonationLocal } from '../databases/DonationDatabase';
import { authDb } from '../databases/AuthDatabase'; 

const DONATION_API = API_URL.replace('/auth', '');

export class DonationService {
  static async getHeaders() {
    const token = await authDb.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token || ''}`
    };
  }

  static async createDonationRequest(payload: { amount: number; message?: string }) {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${DONATION_API}/donation/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      
      const isJson = response.headers.get('content-type')?.includes('application/json');
      if (!isJson) throw new Error(`Endpoint tidak ditemukan atau server membalas dengan HTML`);

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Gagal membuat request donasi');
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async getDonationHistory() {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${DONATION_API}/donation/history`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) throw new Error(`Server Error`);
      const isJson = response.headers.get('content-type')?.includes('application/json');
      if (!isJson) throw new Error('Respons server bukan JSON');

      const result = await response.json();

      if (result.success) {
        syncDonationsToLocal(result.data);
        return result.data; 
      }
      return getLocalDonations();
    } catch (error) {
      return getLocalDonations(); 
    }
  }

  static async updateDonationStatus(id: string, newStatus: string) {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${DONATION_API}/donation/${id}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus }),
      });
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  static async deleteDonation(id: string) {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${DONATION_API}/donation/${id}`, {
        method: 'DELETE',
        headers,
      });
      
      const result = await response.json();
      if (response.ok && result.success) {
         deleteDonationLocal(id);
      }
      return result;
    } catch (error) {
      throw error;
    }
  }
}