// app/screens/registerscreen.tsx
import { useRouter } from "expo-router";
import {
  ChevronDown, Eye, EyeOff, Leaf,
  Lock, Mail, MapPin, Phone, User,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  SafeAreaView, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from "react-native";
import { RegisterData, useAuth, UserRole } from "../../src/authcontext";

const ROLES: { value: UserRole; label: string; description: string; color: string; emoji: string }[] = [
  { value: "agriculteur",  label: "Agriculteur",              description: "Je cultive et vends mes produits", color: "#16a34a", emoji: "🌾" },
  { value: "utilisateur",  label: "Acheteur / Utilisateur",   description: "Je cherche des produits frais",    color: "#2563eb", emoji: "🛒" },
  { value: "veterinaire",  label: "Vétérinaire",              description: "Je soigne les animaux agricoles",  color: "#0891b2", emoji: "🐾" },
  { value: "ingenieur",    label: "Ingénieur Agricole",       description: "Je conseille les agriculteurs",    color: "#7c3aed", emoji: "🔬" },
];

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuth();

  const [form, setForm] = useState<RegisterData>({
    name: "", email: "", password: "", phone: "", location: "", role: "utilisateur",
  });
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showRoles, setShowRoles] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterData | "confirmPass", string>>>({});

  const update = (key: keyof RegisterData, value: string) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Nom requis";
    if (!form.email.includes("@")) e.email = "Email invalide";
    if (form.password.length < 6) e.password = "Minimum 6 caractères";
    if (form.password !== confirmPass) e.confirmPass = "Les mots de passe ne correspondent pas";
    if (!form.phone.trim()) e.phone = "Téléphone requis";
    if (!form.location.trim()) e.location = "Wilaya requise";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    const result = await register(form);
    if (!result.success) Alert.alert("Erreur", result.message);
  };

  const selectedRole = ROLES.find(r => r.value === form.role)!;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>← Retour</Text>
            </TouchableOpacity>
            <View style={styles.logoRow}>
              <View style={styles.logoCircle}>
                <Leaf width={28} height={28} color="#fff" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Créer un compte</Text>
                <Text style={styles.headerSub}>Rejoignez FermeConnect</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>

            {/* ── ROLE SELECTOR ── */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Je suis...</Text>

              {/* Role grid */}
              <View style={styles.roleGrid}>
                {ROLES.map(role => {
                  const active = form.role === role.value;
                  return (
                    <TouchableOpacity
                      key={role.value}
                      style={[
                        styles.roleCard,
                        { borderColor: active ? role.color : "#e5e7eb" },
                        active && { backgroundColor: role.color + "12" },
                      ]}
                      onPress={() => update("role", role.value)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.roleEmoji}>{role.emoji}</Text>
                      <Text style={[styles.roleCardLabel, { color: active ? role.color : "#374151" }]}>
                        {role.label}
                      </Text>
                      <Text style={styles.roleCardDesc} numberOfLines={2}>
                        {role.description}
                      </Text>
                      {active && (
                        <View style={[styles.roleCheck, { backgroundColor: role.color }]}>
                          <Text style={{ color: "#fff", fontSize: 10, fontWeight: "800" }}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Pro info banner */}
            {(form.role === "veterinaire" || form.role === "ingenieur") && (
              <View style={[styles.infoBanner, { backgroundColor: form.role === "veterinaire" ? "#ecfeff" : "#f5f3ff", borderColor: form.role === "veterinaire" ? "#0891b2" : "#7c3aed" }]}>
                <Text style={[styles.infoBannerText, { color: form.role === "veterinaire" ? "#0e7490" : "#6d28d9" }]}>
                  {form.role === "veterinaire"
                    ? "🐾 Après inscription, complétez votre profil professionnel pour apparaître dans les services."
                    : "🔬 Après inscription, complétez votre profil professionnel pour être visible des agriculteurs."}
                </Text>
              </View>
            )}

            {/* NOM */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nom complet</Text>
              <View style={[styles.inputRow, errors.name && styles.inputError]}>
                <User width={18} height={18} color="#9ca3af" />
                <TextInput
                  style={styles.input} placeholder="Prénom et Nom"
                  placeholderTextColor="#d1d5db" value={form.name}
                  onChangeText={t => update("name", t)}
                />
              </View>
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            {/* EMAIL */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputRow, errors.email && styles.inputError]}>
                <Mail width={18} height={18} color="#9ca3af" />
                <TextInput
                  style={styles.input} placeholder="vous@exemple.dz"
                  placeholderTextColor="#d1d5db" keyboardType="email-address"
                  autoCapitalize="none" value={form.email}
                  onChangeText={t => update("email", t)}
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* TÉLÉPHONE */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Téléphone</Text>
              <View style={[styles.inputRow, errors.phone && styles.inputError]}>
                <Phone width={18} height={18} color="#9ca3af" />
                <TextInput
                  style={styles.input} placeholder="05XX XX XX XX"
                  placeholderTextColor="#d1d5db" keyboardType="phone-pad"
                  value={form.phone} onChangeText={t => update("phone", t)}
                />
              </View>
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            {/* WILAYA */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Wilaya</Text>
              <View style={[styles.inputRow, errors.location && styles.inputError]}>
                <MapPin width={18} height={18} color="#9ca3af" />
                <TextInput
                  style={styles.input} placeholder="Ex: Tlemcen, Oran, Alger..."
                  placeholderTextColor="#d1d5db" value={form.location}
                  onChangeText={t => update("location", t)}
                />
              </View>
              {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
            </View>

            {/* MOT DE PASSE */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={[styles.inputRow, errors.password && styles.inputError]}>
                <Lock width={18} height={18} color="#9ca3af" />
                <TextInput
                  style={styles.input} placeholder="Minimum 6 caractères"
                  placeholderTextColor="#d1d5db" secureTextEntry={!showPass}
                  value={form.password} onChangeText={t => update("password", t)}
                />
                <TouchableOpacity onPress={() => setShowPass(v => !v)}>
                  {showPass ? <EyeOff width={18} height={18} color="#9ca3af" /> : <Eye width={18} height={18} color="#9ca3af" />}
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            {/* CONFIRM */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Confirmer le mot de passe</Text>
              <View style={[styles.inputRow, errors.confirmPass && styles.inputError]}>
                <Lock width={18} height={18} color="#9ca3af" />
                <TextInput
                  style={styles.input} placeholder="Répétez le mot de passe"
                  placeholderTextColor="#d1d5db" secureTextEntry={!showPass}
                  value={confirmPass}
                  onChangeText={t => { setConfirmPass(t); setErrors(e => ({ ...e, confirmPass: undefined })); }}
                />
              </View>
              {errors.confirmPass && <Text style={styles.errorText}>{errors.confirmPass}</Text>}
            </View>

            {/* SUBMIT */}
            <TouchableOpacity
              style={[styles.btnPrimary, { backgroundColor: selectedRole.color }, isLoading && styles.btnDisabled]}
              onPress={handleRegister} disabled={isLoading} activeOpacity={0.8}
            >
              {isLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnPrimaryText}>{selectedRole.emoji} Créer mon compte</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginLink} onPress={() => router.push("/screens/loginscreen")}>
              <Text style={styles.loginLinkText}>
                Déjà un compte ? <Text style={styles.loginLinkBold}>Se connecter</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: "#f0fdf4" },
  scroll: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  header: { marginBottom: 24 },
  backBtn:    { marginBottom: 16 },
  backText:   { fontSize: 15, color: "#16a34a", fontWeight: "600" },
  logoRow:    { flexDirection: "row", alignItems: "center", gap: 14 },
  logoCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#16a34a", alignItems: "center", justifyContent: "center" },
  headerTitle:{ fontSize: 22, fontWeight: "800", color: "#14532d" },
  headerSub:  { fontSize: 13, color: "#4b7c59", marginTop: 2 },
  card: {
    backgroundColor: "#fff", borderRadius: 24, padding: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 },
  inputRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb",
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
  },
  inputError: { borderColor: "#ef4444" },
  input:      { flex: 1, fontSize: 15, color: "#111827" },
  errorText:  { fontSize: 12, color: "#ef4444", marginTop: 4 },

  // Role grid
  roleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  roleCard: {
    width: "47%", borderWidth: 2, borderRadius: 16, padding: 12,
    backgroundColor: "#f9fafb", position: "relative",
  },
  roleEmoji:     { fontSize: 26, marginBottom: 6 },
  roleCardLabel: { fontSize: 13, fontWeight: "700", marginBottom: 3 },
  roleCardDesc:  { fontSize: 11, color: "#9ca3af", lineHeight: 16 },
  roleCheck: {
    position: "absolute", top: 8, right: 8,
    width: 20, height: 20, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },

  infoBanner: {
    borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 16,
  },
  infoBannerText: { fontSize: 12, lineHeight: 18, fontWeight: "500" },

  btnPrimary:     { borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 8 },
  btnDisabled:    { opacity: 0.6 },
  btnPrimaryText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  loginLink:      { alignItems: "center", marginTop: 16 },
  loginLinkText:  { fontSize: 14, color: "#6b7280" },
  loginLinkBold:  { color: "#16a34a", fontWeight: "700" },
});
