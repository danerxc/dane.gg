import axios from 'axios';
import { NavigateFunction } from 'react-router-dom';

interface LoginResponse {
  token?: string;
  requiresTOTP?: boolean;
  message?: string;
}

let navigate: NavigateFunction;

export const setNavigate = (nav: NavigateFunction) => {
  navigate = nav;
};

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 || error.response?.status === 400) {
      if (error.response.data.message === 'Invalid token' || 
          error.response.data.message === 'Access denied') {
        auth.logout();
        if (navigate) {
          navigate('/admin/login');
        }
      }
    }
    return Promise.reject(error);
  }
);

export const auth = {
  login: async (username: string, password: string, totpToken?: string): Promise<boolean> => {
    const response = await axios.post<LoginResponse>('/auth/login', { 
      username, 
      password,
      totpToken 
    });

    if (response.data.requiresTOTP) {
      return false;
    }

    if (response.data.token) {
      localStorage.setItem('adminToken', response.data.token);
      return true;
    }

    return false;
  },

  logout: () => {
    localStorage.removeItem('adminToken');
  },

  getToken: (): string | null => {
    return localStorage.getItem('adminToken');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('adminToken');
  }
};