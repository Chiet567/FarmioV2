import { useRouter } from "expo-router";
import { Eye, EyeOff, Leaf, Lock, Mail } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../src/authcontext";

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  // ------------------------------------------
  // VALIDATION
  // ------------------------------------------
  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = "Email requis";
    else if (!email.includes("@")) newErrors.email = "Email invalide";
    if (!password) newErrors.password = "Mot de passe requis";
    else if (password.length < 4) newErrors.password = "Minimum 4 caractères";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ------------------------------------------
  // SUBMIT
  // ------------------------------------------
  const handleLogin = async () => {
    if (!validate()) return;
    const result = await login(email.trim(), password);
    if (!result.success) {
      Alert.alert("Erreur", result.message);
    }
    // Si succès → Expo Router redirige automatiquement via _layout.tsx
  };

  // ------------------------------------------
  // RENDU
  // ------------------------------------------
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Leaf width={40} height={40} color="#fff" />
            </View>
            <Text style={styles.logoTitle}>FermeConnect</Text>
            <Text style={styles.logoSubtitle}>
              Connectez vos récoltes au marché
            </Text>
          </View>

          {/* Carte formulaire */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Connexion</Text>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <View
                style={[styles.inputRow, errors.email && styles.inputError]}
              >
                <Mail width={18} height={18} color="#9ca3af" />
                <TextInput
                  style={styles.input}
                  placeholder="vous@exemple.dz"
                  placeholderTextColor="#d1d5db"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    setErrors((e) => ({ ...e, email: undefined }));
                  }}
                />
              </View>
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            {/* Mot de passe */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <View
                style={[styles.inputRow, errors.password && styles.inputError]}
              >
                <Lock width={18} height={18} color="#9ca3af" />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#d1d5db"
                  secureTextEntry={!showPass}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    setErrors((e) => ({ ...e, password: undefined }));
                  }}
                />
                <TouchableOpacity onPress={() => setShowPass((v) => !v)}>
                  {showPass ? (
                    <EyeOff width={18} height={18} color="#9ca3af" />
                  ) : (
                    <Eye width={18} height={18} color="#9ca3af" />
                  )}
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            {/* Mot de passe oublié */}
            <TouchableOpacity
              style={styles.forgotRow}
              onPress={() => router.push("/screens/forgetpassword")}
            >
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            {/* Bouton connexion */}
            <TouchableOpacity
              style={[styles.btnPrimary, isLoading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnPrimaryText}>Se connecter</Text>
              )}
            </TouchableOpacity>

            {/* Séparateur */}
            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>ou</Text>
              <View style={styles.separatorLine} />
            </View>

            {/* Lien inscription */}
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => router.push("/screens/registerscreen")}
              activeOpacity={0.8}
            >
              <Text style={styles.btnSecondaryText}>Créer un compte</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --------------------------------------------
// STYLES
// --------------------------------------------
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f0fdf4" },
  scroll: { flexGrow: 1, padding: 24, justifyContent: "center" },

  logoContainer: { alignItems: "center", marginBottom: 32 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoTitle: { fontSize: 26, fontWeight: "800", color: "#14532d" },
  logoSubtitle: { fontSize: 13, color: "#4b7c59", marginTop: 4 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 24,
  },

  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputError: { borderColor: "#ef4444" },
  input: { flex: 1, fontSize: 15, color: "#111827" },
  errorText: { fontSize: 12, color: "#ef4444", marginTop: 4 },

  forgotRow: { alignItems: "flex-end", marginBottom: 20 },
  forgotText: { fontSize: 13, color: "#16a34a", fontWeight: "500" },

  btnPrimary: {
    backgroundColor: "#16a34a",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.6 },
  btnPrimaryText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  btnSecondary: {
    borderWidth: 2,
    borderColor: "#16a34a",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnSecondaryText: { color: "#16a34a", fontSize: 16, fontWeight: "700" },

  separator: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    gap: 12,
  },
  separatorLine: { flex: 1, height: 1, backgroundColor: "#e5e7eb" },
  separatorText: { fontSize: 13, color: "#9ca3af" },

  testAccounts: {
    marginTop: 24,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  testTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6b7280",
    marginBottom: 10,
  },
  testRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  testRole: { fontSize: 13, fontWeight: "600", color: "#374151" },
  testEmail: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
});
