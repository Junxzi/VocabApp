
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  userId: string | null;
  userName: string | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already authenticated
    checkAuthStatus();
    
    // Listen for auth events
    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, []);

  const handleAuthMessage = (event: MessageEvent) => {
    if (event.origin === 'https://auth.util.repl.co' && event.data.type === 'auth') {
      if (event.data.success) {
        checkAuthStatus();
      }
    }
  };

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status');
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        setUserId(data.userId);
        setUserName(data.userName);
      } else {
        setIsAuthenticated(false);
        setUserId(null);
        setUserName(null);
      }
    } catch (error) {
      setIsAuthenticated(false);
      setUserId(null);
      setUserName(null);
    }
  };

  const login = () => {
    // Replit Auth handles the login flow
    window.location.reload();
  };

  const logout = () => {
    // For Replit Auth, we can redirect to clear session
    window.location.href = '/api/auth/logout';
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      userId,
      userName,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
