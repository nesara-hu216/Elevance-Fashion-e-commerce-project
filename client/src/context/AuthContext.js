import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('@auth_token');
      if (storedToken) {
        setToken(storedToken);
        const res = await api.get('/auth/me');
        if (res.data && res.data.user) {
          setUser(res.data.user);
        }
      }
    } catch (e) {
      console.error('[Auth] Error loading session', e);
      await AsyncStorage.removeItem('@auth_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data && res.data.token) {
        setToken(res.data.token);
        setUser(res.data.user);
        await AsyncStorage.setItem('@auth_token', res.data.token);
        return { success: true };
      }
      return { success: false, message: 'Invalid response' };
    } catch (e) {
      return {
        success: false,
        message: e.response?.data?.message || 'Login failed. Please check credentials.',
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await api.post('/auth/register', { name, email, password });
      if (res.data && res.data.token) {
        setToken(res.data.token);
        setUser(res.data.user);
        await AsyncStorage.setItem('@auth_token', res.data.token);
        return { success: true };
      }
      return { success: false, message: 'Invalid response' };
    } catch (e) {
      return {
        success: false,
        message: e.response?.data?.message || 'Registration failed.',
      };
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem('@auth_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
