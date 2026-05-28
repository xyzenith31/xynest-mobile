import Constants from 'expo-constants';
import { Platform } from 'react-native';

const PRODUCTION_URL = ""; 

const getDevelopmentBaseUrl = (): string => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3000';
  }

  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;
  const localhost = debuggerHost?.split(':').shift();

  if (localhost) {
    return `http://${localhost}:3000`;
  }
  
  return 'http://localhost:3000';
};

export const ENVIRONMENT = PRODUCTION_URL ? 'production' : 'development';
export const BASE_URL = ENVIRONMENT === 'production' ? PRODUCTION_URL : getDevelopmentBaseUrl();
export const API_URL = `${BASE_URL}/api/auth`;

console.log(`[XyNest Config] Mode: ${ENVIRONMENT} | Base API: ${API_URL}`);