// src/services/api.js
// import { REACT_NATIVE_API_URL } from '.env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

let onUnauthorized = null;

export const setUnauthorizedHandler = (callback) => {
  onUnauthorized = callback;
};

const axiosInstance = axios.create({
  baseURL: 'http://192.168.0.103:8000/api', 

  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('Access_Token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  Promise.reject
);

axiosInstance.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        await AsyncStorage.clear();
        if (onUnauthorized) {
          onUnauthorized(); // This will navigate to signin
        }
      }
      return Promise.reject(error.response.data);
    }
    return Promise.reject({
      message: error.message || 'Network error',
    });
  }
);

export default axiosInstance;