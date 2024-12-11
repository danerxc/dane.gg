import axios from 'axios';
import { auth } from './auth';

const axiosInstance = axios.create();

axiosInstance.interceptors.request.use(config => {
  const token = auth.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;