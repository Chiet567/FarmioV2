import { useRouter } from "expo-router";
import {
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react-native";
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
import { RegisterData, useAuth, UserRole } from "../../src/authcontext"; // ✅ bon chemin

const ROLES: {
  value: UserRole;
  label: string;
  description: string;
  color: string;
}[] = [
  {
    value: "agriculteur",
    label: "🌾 Agriculteur",
    description: "Je vends mes produits agricoles",
    color: "#16a34a",
  },
  {
    value: "utilisateur",
    label: "🛒 Utilisateur",
    description: "Je cherche des produits frais",
    color: "#2563eb",
  },
  {
    value: "admin",
    label: "⚙️ Administrateur",
    description: "Je gère la plateforme",
    color: "#7c3aed",
  },
];

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuth();

  const [form, setForm] = useState<RegisterData>({
    name: "",
    email: "",
    password: "",
    phone: "",
    location: "",
    role: "utilisateur",
  });
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showRoles, setShowRoles] = useState(false);
  const [errors, setErrors] = useState<
    // ✅ < ajouté ici
    Partial<Record<keyof RegisterData | "confirmPass", string>>
  >({});

  const update = (key: keyof RegisterData, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };
  // ------------------------------------------
  // VALIDATION
  // ------------------------------------------
  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Nom requis";
    if (!form.email.includes("@")) e.email = "Email invalide";
    if (form.password.length < 4) e.password = "Minimum 4 caractères";
    if (form.password !== confirmPass)
      e.confirmPass = "Les mots de passe ne correspondent pas";
    if (!form.phone.trim()) e.phone = "Téléphone requis";
    if (!form.location.trim()) e.location = "Wilaya requise";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ------------------------------------------
  // SUBMIT
  // ------------------------------------------
  const handleRegister = async () => {
    if (!validate()) return;
    const result = await register(form);
    if (!result.success) Alert.alert("Erreur", result.message);
    // Si succès → _layout.tsx redirige automatiquement vers /
  };

  const selectedRole = ROLES.find((r) => r.value === form.role)!;

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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
            >
              <Text style={styles.backText}>← Retour</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Créer un compte</Text>
            <Text style={styles.headerSub}>
              Rejoignez la communauté agricole
            </Text>
          </View>

          <View style={styles.card}>
            {/* RÔLE */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Je suis...</Text>
              <TouchableOpacity
                style={[
                  styles.roleSelector,
                  { borderColor: selectedRole.color },
                ]}
                onPress={() => setShowRoles((v) => !v)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.roleSelectorText,
                    { color: selectedRole.color },
                  ]}
                >
                  {selectedRole.label}
                </Text>
                <ChevronDown
                  width={18}
                  height={18}
                  color={selectedRole.color}
                />
              </TouchableOpacity>

              {showRoles && (
                <View style={styles.rolesDropdown}>
                  {ROLES.map((role) => (
                    <TouchableOpacity
                      key={role.value}
                      style={[
                        styles.roleOption,
                        form.role === role.value && {
                          backgroundColor: role.color + "15",
                        },
                      ]}
                      onPress={() => {
                        update("role", role.value);
                        setShowRoles(false);
                      }}
                    >
                      <View
                        style={[
                          styles.roleOptionDot,
                          { backgroundColor: role.color },
                        ]}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.roleOptionLabel,
                            { color: role.color },
                          ]}
                        >
                          {role.label}
                        </Text>
                        <Text style={styles.roleOptionDesc}>
                          {role.description}
                        </Text>
                      </View>
                      {form.role === role.value && (
                        <Text style={{ color: role.color, fontSize: 18 }}>
                          ✓
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* NOM */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nom complet</Text>
              <View style={[styles.inputRow, errors.name && styles.inputError]}>
                <User width={18} height={18} color="#9ca3af" />
                <TextInput
                  style={styles.input}
                  placeholder="Prénom et Nom"
                  placeholderTextColor="#d1d5db"
                  value={form.name}
                  onChangeText={(t) => update("name", t)}
                />
              </View>
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>

            {/* EMAIL */}
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
                  value={form.email}
                  onChangeText={(t) => update("email", t)}
                />
              </View>
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            {/* TÉLÉPHONE */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Téléphone</Text>
              <View
                style={[styles.inputRow, errors.phone && styles.inputError]}
              >
                <Phone width={18} height={18} color="#9ca3af" />
                <TextInput
                  style={styles.input}
                  placeholder="05XX XX XX XX"
                  placeholderTextColor="#d1d5db"
                  keyboardType="phone-pad"
                  value={form.phone}
                  onChangeText={(t) => update("phone", t)}
                />
              </View>
              {errors.phone && (
                <Text style={styles.errorText}>{errors.phone}</Text>
              )}
            </View>

            {/* WILAYA */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Wilaya</Text>
              <View
                style={[styles.inputRow, errors.location && styles.inputError]}
              >
                <MapPin width={18} height={18} color="#9ca3af" />
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Tlemcen, Oran, Alger..."
                  placeholderTextColor="#d1d5db"
                  value={form.location}
                  onChangeText={(t) => update("location", t)}
                />
              </View>
              {errors.location && (
                <Text style={styles.errorText}>{errors.location}</Text>
              )}
            </View>

            {/* MOT DE PASSE */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <View
                style={[styles.inputRow, errors.password && styles.inputError]}
              >
                <Lock width={18} height={18} color="#9ca3af" />
                <TextInput
                  style={styles.input}
                  placeholder="Minimum 4 caractères"
                  placeholderTextColor="#d1d5db"
                  secureTextEntry={!showPass}
                  value={form.password}
                  onChangeText={(t) => update("password", t)}
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

            {/* CONFIRMER MDP */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Confirmer le mot de passe</Text>
              <View
                style={[
                  styles.inputRow,
                  errors.confirmPass && styles.inputError,
                ]}
              >
                <Lock width={18} height={18} color="#9ca3af" />
                <TextInput
                  style={styles.input}
                  placeholder="Répétez le mot de passe"
                  placeholderTextColor="#d1d5db"
                  secureTextEntry={!showPass}
                  value={confirmPass}
                  onChangeText={(t) => {
                    setConfirmPass(t);
                    setErrors((e) => ({ ...e, confirmPass: undefined }));
                  }}
                />
              </View>
              {errors.confirmPass && (
                <Text style={styles.errorText}>{errors.confirmPass}</Text>
              )}
            </View>

            {/* BOUTON */}
            <TouchableOpacity
              style={[styles.btnPrimary, isLoading && styles.btnDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnPrimaryText}>Créer mon compte</Text>
              )}
            </TouchableOpacity>

            {/* Lien login */}
            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => router.push('/screens/loginscreen')}
            >
              <Text style={styles.loginLinkText}>
                Déjà un compte ?{" "}
                <Text style={styles.loginLinkBold}>Se connecter</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f0fdf4" },
  scroll: { flexGrow: 1, padding: 24 },

  header: { marginBottom: 24 },
  backBtn: { marginBottom: 12 },
  backText: { fontSize: 15, color: "#16a34a", fontWeight: "600" },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#14532d" },
  headerSub: { fontSize: 13, color: "#4b7c59", marginTop: 4 },

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

  roleSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#f9fafb",
  },
  roleSelectorText: { fontSize: 15, fontWeight: "700" },
  rolesDropdown: {
    marginTop: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  roleOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  roleOptionDot: { width: 10, height: 10, borderRadius: 5 },
  roleOptionLabel: { fontSize: 14, fontWeight: "700" },
  roleOptionDesc: { fontSize: 12, color: "#9ca3af", marginTop: 2 },

  btnPrimary: {
    backgroundColor: "#16a34a",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnPrimaryText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  loginLink: { alignItems: "center", marginTop: 16 },
  loginLinkText: { fontSize: 14, color: "#6b7280" },
  loginLinkBold: { color: "#16a34a", fontWeight: "700" },
});
