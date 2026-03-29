import { useRouter } from "expo-router";
import {
  LogOut,
  Package,
  TrendingUp,
  Truck,
  Wrench,
} from "lucide-react-native";
import React from "react";
import {
  Alert,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getRecentPosts } from "../../components/lib/mockdata";
import { ProductCard } from "../../components/productcard";
import { useAuth } from "../../src/authcontext";

import { Button } from "react-native";

const SomeTabScreen = () => {
  const router = useRouter();

  return (
    <Button
      title="Mon Profil"
      onPress={() => router.push("../screens/profile")}
    />
  );
};
export default function Home() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const recentPosts = getRecentPosts();

  const getRoleBadge = () => {
    switch (user?.role) {
      case "agriculteur":
        return { bg: "#dcfce7", text: "#16a34a", label: "🌾 Agriculteur" };
      case "admin":
        return { bg: "#ede9fe", text: "#7c3aed", label: "⚙️ Admin" };
      case "utilisateur":
        return { bg: "#dbeafe", text: "#2563eb", label: "🛒 Utilisateur" };
      default:
        return { bg: "#f3f4f6", text: "#6b7280", label: user?.role ?? "" };
    }
  };

  const roleBadge = getRoleBadge();
  // Fonction pour appeler le vendeur
  const handleAppeler = (post: any) => {
    Alert.alert(
      `Contacter ${post.seller.name}`,
      `Appeler le ${post.seller.phone} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "📞 Appeler",
          onPress: () => Linking.openURL(`tel:${post.seller.phone}`),
        },
      ],
    );
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ---- HEADER ---- */}
        <View style={styles.header}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>Bonjour 👋</Text>
            <Text style={styles.welcomeSubtitle}>
              Bienvenue sur FermeConnect
            </Text>
          </View>

          {user && (
            <View style={styles.userCard}>
              <View style={styles.userInfo}>
                <View style={styles.avatar}>
                  {user.profile_image ? (
                    <Image
                      source={{ uri: user.profile_image }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Text style={styles.avatarText}>
                      {user.name?.charAt(0) || "U"}
                    </Text>
                  )}
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userLocation}>📍 {user.location}</Text>
                </View>
                <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                  <LogOut width={18} height={18} color="#fff" />
                </TouchableOpacity>
              </View>
              <View
                style={[styles.roleBadge, { backgroundColor: roleBadge.bg }]}
              >
                <Text style={[styles.roleBadgeText, { color: roleBadge.text }]}>
                  {roleBadge.label}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ---- CONTENU ---- */}
        <View style={styles.content}>
          {/* Bloc Admin */}
          {user?.role === "admin" && (
            <TouchableOpacity
              style={styles.adminBanner}
              onPress={() => console.log("Admin - bientôt disponible")}
              activeOpacity={0.8}
            >
              <Text style={styles.adminBannerText}>
                ⚙️ Accéder au Dashboard Admin →
              </Text>
            </TouchableOpacity>
          )}

          {/* ---- 4 BOUTONS EN 2 LIGNES ---- */}
          <View style={styles.section}>
            {/* Ligne 1 — Marché + Statistiques */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionButtonGreen}
                onPress={() => router.push("/market")}
                activeOpacity={0.8}
              >
                <Package width={26} height={26} color="#fff" />
                <Text style={styles.actionTextWhite}>Marché</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButtonWhite}
                onPress={() => router.push("/statistics")}
                activeOpacity={0.8}
              >
                <TrendingUp width={26} height={26} color="#16a34a" />
                <Text style={styles.actionTextDark}>Statistiques</Text>
              </TouchableOpacity>
            </View>

            {/* Ligne 2 — Services + Matériel */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionButtonWhite}
                onPress={() => router.push("/services")}
                activeOpacity={0.8}
              >
                <Wrench width={26} height={26} color="#16a34a" />
                <Text style={styles.actionTextDark}>Services</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButtonWhite}
                onPress={() => router.push("/materiel")}
                activeOpacity={0.8}
              >
                <Truck width={26} height={26} color="#16a34a" />
                <Text style={styles.actionTextDark}>Matériel</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Annonces récentes */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Annonces récentes</Text>
              <TouchableOpacity onPress={() => router.push("/market")}>
                <Text style={styles.seeAllText}>Voir tout →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.postsList}>
              {recentPosts.map((post) => (
                <ProductCard
                  key={post.id}
                  post={post}
                  onContact={(post) => handleAppeler(post)}
                />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --------------------------------------------
// STYLES
// --------------------------------------------
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#16a34a" },
  container: { flex: 1, backgroundColor: "#f9fafb" },
  scrollContent: { paddingBottom: 80 },

  // Header
  header: {
    backgroundColor: "#16a34a",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  welcomeContainer: { marginBottom: 16 },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  welcomeSubtitle: { fontSize: 14, color: "#dcfce7" },

  // User card
  userCard: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    gap: 12,
  },
  userInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { width: 48, height: 48 },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  userDetails: { flex: 1 },
  userName: { color: "#fff", fontWeight: "700", fontSize: 15 },
  userLocation: { color: "#dcfce7", fontSize: 12, marginTop: 2 },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  roleBadgeText: { fontSize: 12, fontWeight: "700" },

  // Content
  content: { paddingHorizontal: 24, marginTop: 16 },

  // Admin banner
  adminBanner: {
    backgroundColor: "#7c3aed",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    alignItems: "center",
  },
  adminBannerText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // Section
  section: { marginBottom: 28 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
  },
  seeAllText: { fontSize: 13, color: "#16a34a", fontWeight: "600" },

  // Actions
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  actionButtonGreen: {
    flex: 1,
    backgroundColor: "#16a34a",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  actionButtonWhite: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionTextWhite: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    textAlign: "center",
  },
  actionTextDark: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 14,
    textAlign: "center",
  },

  // Posts
  postsList: { gap: 16 },
});
