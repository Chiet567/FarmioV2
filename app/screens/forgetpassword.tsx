import { useRouter } from "expo-router";
import { CheckCircle, Mail } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../src/authcontext";

export default function ForgotPasswordScreen() {
  const router = useRouter(); // ✅ déclaré DANS le composant
  const { forgotPassword, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!email.includes("@")) {
      setError("Email invalide");
      return;
    }
    const result = await forgotPassword(email.trim());
    if (result.success) setSent(true);
    else setError(result.message);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Retour */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>

        {!sent ? (
          <>
            {/* Icône */}
            <View style={styles.iconCircle}>
              <Mail width={36} height={36} color="#16a34a" />
            </View>

            <Text style={styles.title}>Mot de passe oublié ?</Text>
            <Text style={styles.subtitle}>
              Entrez votre email, nous vous enverrons un lien de
              réinitialisation.
            </Text>

            {/* Input email */}
            <View style={[styles.inputRow, error ? styles.inputError : null]}>
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
                  setError("");
                }}
              />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Bouton */}
            <TouchableOpacity
              style={[styles.btn, isLoading && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Envoyer le lien</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          /* Succès */
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <CheckCircle width={52} height={52} color="#16a34a" />
            </View>
            <Text style={styles.successTitle}>Email envoyé !</Text>
            <Text style={styles.successText}>
              Vérifiez votre boîte mail pour le lien de réinitialisation.
            </Text>
            <TouchableOpacity
              style={styles.btn}
              onPress={() => router.push("/screens/loginscreen")}
            >
              <Text style={styles.btnText}>Retour à la connexion</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f0fdf4" },
  container: { flex: 1, padding: 24, justifyContent: "center" },
  backBtn: { position: "absolute", top: 20, left: 24 },
  backText: { fontSize: 15, color: "#16a34a", fontWeight: "600" },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#14532d",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#4b7c59",
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  inputError: { borderColor: "#ef4444" },
  input: { flex: 1, fontSize: 15, color: "#111827" },
  errorText: { fontSize: 12, color: "#ef4444", marginBottom: 12 },
  btn: {
    backgroundColor: "#16a34a",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  successContainer: { alignItems: "center" },
  successIcon: { marginBottom: 20 },
  successTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#14532d",
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: "#4b7c59",
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 20,
  },
});
