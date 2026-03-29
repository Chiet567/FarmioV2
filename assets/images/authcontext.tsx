import React, { createContext, useContext, useState, ReactNode } from 'react';

// --------------------------------------------
// TYPES
// --------------------------------------------
export type UserRole = 'agriculteur' | 'utilisateur' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  location?: string;
  profile_image?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  location: string;
  role: UserRole;
}

// --------------------------------------------
// MOCK USERS (base de données simulée)
// --------------------------------------------
const mockUsers: (User & { password: string })[] = [
  {
    id: '1',
    name: 'Ahmed Benali',
    email: 'agriculteur@farm.dz',
    password: '1234',
    role: 'agriculteur',
    phone: '0550123456',
    location: 'Tlemcen',
  },
  {
    id: '2',
    name: 'Super Admin',
    email: 'admin@farm.dz',
    password: '1234',
    role: 'admin',
    phone: '0660000000',
    location: 'Alger',
  },
  {
    id: '3',
    name: 'Karim Acheteur',
    email: 'user@farm.dz',
    password: '1234',
    role: 'utilisateur',
    phone: '0771234567',
    location: 'Oran',
  },
];

// --------------------------------------------
// CONTEXT
// --------------------------------------------
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --------------------------------------------
// PROVIDER
// --------------------------------------------
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // On garde les users en mémoire (mock)
  const [users, setUsers] = useState(mockUsers);

  // ------------------------------------------
  // LOGIN
  // ------------------------------------------
  const login = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    try {
      await new Promise(r => setTimeout(r, 900)); // simulation réseau

      const found = users.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
      );

      if (!found) {
        return { success: false, message: 'Email ou mot de passe incorrect.' };
      }

      const { password: _, ...userWithoutPassword } = found;
      setUser(userWithoutPassword);
      return { success: true, message: 'Connexion réussie !' };
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------------------------------
  // REGISTER
  // ------------------------------------------
  const register = async (
    data: RegisterData,
  ): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    try {
      await new Promise(r => setTimeout(r, 900));

      const exists = users.find(
        u => u.email.toLowerCase() === data.email.toLowerCase(),
      );
      if (exists) {
        return { success: false, message: 'Cet email est déjà utilisé.' };
      }

      const newUser = {
        id: String(users.length + 1),
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        phone: data.phone,
        location: data.location,
      };

      setUsers(prev => [...prev, newUser]);
      const { password: _, ...userWithoutPassword } = newUser;
      setUser(userWithoutPassword);
      return { success: true, message: 'Compte créé avec succès !' };
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------------------------------
  // FORGOT PASSWORD
  // ------------------------------------------
  const forgotPassword = async (
    email: string,
  ): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    try {
      await new Promise(r => setTimeout(r, 900));

      const found = users.find(
        u => u.email.toLowerCase() === email.toLowerCase(),
      );
      if (!found) {
        return { success: false, message: 'Aucun compte trouvé avec cet email.' };
      }
      return {
        success: true,
        message: 'Un lien de réinitialisation a été envoyé à votre email.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------------------------------
  // LOGOUT
  // ------------------------------------------
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, forgotPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

// --------------------------------------------
// HOOK
// --------------------------------------------
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return context;
};