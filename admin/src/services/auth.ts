import axios from 'axios';

interface LoginResponse {
  token: string;
}

interface User {
  username: string;
  password: string;
  isAdmin?: boolean;
}

export const auth = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await axios.post<LoginResponse>('/auth/login', { username, password });
    if (response.data.token) {
      localStorage.setItem('adminToken', response.data.token);
    }
    return response.data;
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