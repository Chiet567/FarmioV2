import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "../components/lib/supabase";

// --------------------------------------------
// TYPES
// --------------------------------------------
export type UserRole = "agriculteur" | "utilisateur" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  location?: string;
  profile_image?: string;
  photo_url?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; message: string }>;
  register: (
    data: RegisterData,
  ) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  forgotPassword: (
    email: string,
  ) => Promise<{ success: boolean; message: string }>;
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
// CONTEXT
// --------------------------------------------
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --------------------------------------------
// PROVIDER
// --------------------------------------------
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ------------------------------------------
  // VÉRIFIER LA SESSION AU DÉMARRAGE
  // ------------------------------------------
  useEffect(() => {
    // Récupérer la session actuelle
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email || "");
      } else {
        setIsLoading(false);
      }
    });

    // Écouter les changements de session
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email || "");
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ------------------------------------------
  // RÉCUPÉRER LE PROFIL DEPUIS SUPABASE
  // ------------------------------------------
  async function fetchProfile(userId: string, email: string) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (data) {
        setUser({
          id: data.id,
          name: `${data.prenom} ${data.nom}`,
          email: email,
          role: data.role === "acheteur" ? "utilisateur" : data.role,
          phone: data.telephone,
          location: data.wilaya,
          profile_image: data.photo_url,
        });
      }
    } catch (err) {
      console.error("Erreur fetchProfile:", err);
    } finally {
      setIsLoading(false);
    }
  }

  // ------------------------------------------
  // LOGIN
  // ------------------------------------------
  const login = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        // Messages d'erreur en français
        let message = "Email ou mot de passe incorrect.";
        if (error.message.includes("Invalid login")) {
          message = "Email ou mot de passe incorrect.";
        } else if (error.message.includes("Email not confirmed")) {
          message = "Veuillez confirmer votre email avant de vous connecter.";
        }
        return { success: false, message };
      }

      return { success: true, message: "Connexion réussie !" };
    } catch (err) {
      return { success: false, message: "Erreur de connexion au serveur." };
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
      // Séparer le nom en prénom et nom
      const parts = data.name.trim().split(" ");
      const prenom = parts[0] || "";
      const nom = parts.slice(1).join(" ") || parts[0] || "";

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email.trim(),
        password: data.password,
        options: {
          data: {
            nom: nom,
            prenom: prenom,
            telephone: data.phone,
            wilaya: data.location,
            role: data.role === "utilisateur" ? "acheteur" : data.role,
          },
        },
      });

      if (error) {
        let message = "Erreur lors de la création du compte.";
        if (error.message.includes("already registered")) {
          message = "Cet email est déjà utilisé.";
        } else if (error.message.includes("Password")) {
          message = "Le mot de passe doit contenir au moins 6 caractères.";
        }
        return { success: false, message };
      }

      return { success: true, message: "Compte créé avec succès !" };
    } catch (err) {
      return { success: false, message: "Erreur de connexion au serveur." };
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
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: "fermeconnect://reset-password" },
      );

      if (error) {
        return { success: false, message: "Erreur lors de l'envoi du lien." };
      }

      return {
        success: true,
        message: "Un lien de réinitialisation a été envoyé à votre email.",
      };
    } catch (err) {
      return { success: false, message: "Erreur de connexion au serveur." };
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------------------------------
  // LOGOUT
  // ------------------------------------------
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, register, logout, forgotPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// --------------------------------------------
// HOOK
// --------------------------------------------
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return context;
};
