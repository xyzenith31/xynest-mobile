import { API_URL } from '../ServiceConfiguration';

export class RegisterService {
  static async register(data: any) {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await response.json();
  }
}