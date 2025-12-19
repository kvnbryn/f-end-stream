'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { v4 as uuidv4 } from 'uuid';
import { getBackendUrl } from '@/lib/config'; 

interface AuthContextType {
  token: string | null;
  role: string | null;
  deviceId: string | null;
  login: (token: string, role: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const backendUrl = getBackendUrl();

  useEffect(() => {
    // 1. Restore sesi dari penyimpanan
    const storedToken = Cookies.get('session_token');
    const storedRole = localStorage.getItem('user_role');
    let storedDeviceId = localStorage.getItem('device_id');

    if (storedToken) {
      setToken(storedToken);
      if (storedRole) setRole(storedRole);
    }
    
    // 2. Generate Device ID jika belum ada
    if (!storedDeviceId) {
      storedDeviceId = uuidv4();
      localStorage.setItem('device_id', storedDeviceId);
    }
    setDeviceId(storedDeviceId);

    setIsLoading(false);

    // --- SECURITY PROTOCOL: DISABLE RIGHT CLICK GLOBAL ---
    // Ini script genius-nya. Kita matikan event 'contextmenu' (klik kanan)
    // di level document utama.
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // Matikan menu bawaan browser
      return false;
    };

    document.addEventListener('contextmenu', handleContextMenu);

    // Cleanup saat component unmount (opsional, tapi good practice)
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };

  }, []);

  const login = (token: string, role: string) => {
    Cookies.set('session_token', token, { expires: 7, path: '/' }); 
    localStorage.setItem('user_role', role);
    setToken(token);
    setRole(role);
  };

  const logout = async () => {
    const currentToken = Cookies.get('session_token');
    if (currentToken) {
      try {
        await fetch(`${backendUrl}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`
          }
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    
    Cookies.remove('session_token', { path: '/' });
    localStorage.removeItem('user_role');
    
    setToken(null);
    setRole(null);
  };

  const value = { token, role, deviceId, login, logout, isLoading };

  if (isLoading) return <div className="min-h-screen bg-black"></div>;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};