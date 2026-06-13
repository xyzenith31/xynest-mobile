import Constants from 'expo-constants';
import { Platform } from 'react-native';

const PRODUCTION_URL = ""; 

const getDevelopmentBaseUrl = (): string => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3000';
  }

  const hostUri = 
    Constants.expoConfig?.hostUri || 
    (Constants.manifest2 as any)?.extra?.expoGo?.debuggerHost ||
    (Constants.manifest as any)?.debuggerHost;

  if (hostUri) {
    const localhost = hostUri.split(':').shift();
    if (localhost) {
      return `http://${localhost}:3000`;
    }
  }
  
  const FALLBACK_IP = '192.168.1.4';
  return `http://${FALLBACK_IP}:3000`;
};

export const ENVIRONMENT = PRODUCTION_URL ? 'production' : 'development';
export const BASE_URL = ENVIRONMENT === 'production' ? PRODUCTION_URL : getDevelopmentBaseUrl();
export const API_URL = `${BASE_URL}/api/auth`;

console.log(`[XyNest Config] Mode: ${ENVIRONMENT} | Base API: ${API_URL}`);