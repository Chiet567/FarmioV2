// src/authcontext.tsx
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "../components/lib/supabase";

// ─── Types ────────────────────────────────────────────────
export type UserRole =
  | "agriculteur"
  | "utilisateur"
  | "admin"
  | "veterinaire"
  | "ingenieur";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  location?: string;
  profile_image?: string;
  photo_url?: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  refreshUser: () => Promise<void>;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  location: string;
  role: UserRole;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Role normalization ───────────────────────────────────
function normalizeRole(role: string): UserRole {
  if (role === "acheteur") return "utilisateur";
  if (["agriculteur","utilisateur","admin","veterinaire","ingenieur"].includes(role))
    return role as UserRole;
  return "utilisateur";
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) fetchProfile(session.user.id, session.user.email || "");
      else setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) fetchProfile(session.user.id, session.user.email || "");
      else { setUser(null); setIsLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string, email: string) {
    try {
      const { data } = await supabase
        .from("profiles").select("*").eq("id", userId).single();
      if (data) {
        setUser({
          id: data.id,
          name: `${data.prenom} ${data.nom}`.trim(),
          email,
          role: normalizeRole(data.role),
          phone: data.telephone,
          location: data.wilaya,
          profile_image: data.photo_url,
          photo_url: data.photo_url,
          created_at: data.created_at,
        });
      }
    } catch (err) {
      console.error("Erreur fetchProfile:", err);
    } finally {
      setIsLoading(false);
    }
  }

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) await fetchProfile(session.user.id, session.user.email || "");
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        let message = "Email ou mot de passe incorrect.";
        if (error.message.includes("Email not confirmed"))
          message = "Veuillez confirmer votre email avant de vous connecter.";
        return { success: false, message };
      }
      return { success: true, message: "Connexion réussie !" };
    } catch {
      return { success: false, message: "Erreur de connexion au serveur." };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    try {
      const parts = data.name.trim().split(" ");
      const prenom = parts[0] || "";
      const nom = parts.slice(1).join(" ") || parts[0] || "";

      // Map role for supabase
      const supabaseRole =
        data.role === "utilisateur" ? "acheteur" : data.role;

      const { error } = await supabase.auth.signUp({
        email: data.email.trim(),
        password: data.password,
        options: {
          data: { nom, prenom, telephone: data.phone, wilaya: data.location, role: supabaseRole },
        },
      });

      if (error) {
        let message = "Erreur lors de la création du compte.";
        if (error.message.includes("already registered")) message = "Cet email est déjà utilisé.";
        else if (error.message.includes("Password")) message = "Minimum 6 caractères requis.";
        return { success: false, message };
      }
      return { success: true, message: "Compte créé avec succès !" };
    } catch {
      return { success: false, message: "Erreur de connexion au serveur." };
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: "fermeconnect://reset-password",
      });
      if (error) return { success: false, message: "Erreur lors de l'envoi du lien." };
      return { success: true, message: "Un lien de réinitialisation a été envoyé à votre email." };
    } catch {
      return { success: false, message: "Erreur de connexion au serveur." };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, forgotPassword, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return context;
};
