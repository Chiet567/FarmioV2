import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../src/authcontext";
import { supabase } from "../../components/lib/supabase";
import {
  Search,
  Plus,
  Trash2,
  Star,
  Users,
  Package,
  Truck,
  TrendingUp,
  Home,
  LogOut,
  X,
  Crown,
  Edit,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";

// Types
interface AdminStats {
  totalUsers: number;
  totalProducts: number;
  totalAnimals: number;
  totalMaterials: number;
  usersByRole: { role: string; count: number }[];
  productsByCategory: { category: string; count: number }[];
  monthlySignups: { month: string; count: number }[];
  recentUsers: Profile[];
}

interface Profile {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  wilaya: string;
  role: string;
  photo_url: string;
  created_at: string;
  average_rating: number;
  rating_count: number;
}

interface Product {
  id: string;
  titre: string;
  description: string;
  prix: number;
  unite: string;
  quantite_disponible: number;
  wilaya: string;
  commune: string;
  images: string[];
  statut: string;
  est_negociable: boolean;
  created_at: string;
}

interface Animal {
  id: string;
  type: string;
  race: string;
  age: number;
  etat: string;
}

interface Material {
  id: string;
  type: string;
  marque: string;
  etat: string;
}

type TabType = "overview" | "users" | "products" | "animals" | "materials";

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data
  const [users, setUsers] = useState<Profile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

  // Search & Modals
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);
  const [showRateModal, setShowRateModal] = useState<{ userId: string; name: string } | null>(null);
  const [ratingValue, setRatingValue] = useState("");
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    nom: "",
    prenom: "",
    telephone: "",
    wilaya: "",
    role: "acheteur",
  });

  // Fetch Data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [profilesData, productsData, animalsData, materialsData, categoriesData] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("produits").select("*").order("created_at", { ascending: false }),
        supabase.from("animals").select("*").order("created_at", { ascending: false }),
        supabase.from("materiels").select("*").order("created_at", { ascending: false }),
        supabase.from("categories").select("*"),
      ]);

      const usersByRole: Record<string, number> = {};
      (profilesData.data || []).forEach((u: any) => {
        usersByRole[u.role] = (usersByRole[u.role] || 0) + 1;
      });

      const productsByCategory: Record<string, number> = {};
      (productsData.data || []).forEach((p: any) => {
        const cat = (categoriesData.data || []).find((c: any) => c.id === p.categorie_id);
        const catName = cat?.nom || "Autre";
        productsByCategory[catName] = (productsByCategory[catName] || 0) + 1;
      });

      setStats({
        totalUsers: profilesData.data?.length || 0,
        totalProducts: productsData.data?.length || 0,
        totalAnimals: animalsData.data?.length || 0,
        totalMaterials: materialsData.data?.length || 0,
        usersByRole: Object.entries(usersByRole).map(([role, count]) => ({ role, count })),
        productsByCategory: Object.entries(productsByCategory).map(([category, count]) => ({ category, count })),
        monthlySignups: [],
        recentUsers: (profilesData.data || []).slice(0, 5),
      });

      setUsers(profilesData.data || []);
      setProducts(productsData.data || []);
      setAnimals(animalsData.data || []);
      setMaterials(materialsData.data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  // Actions
  const handleDeleteUser = async (userId: string) => {
    Alert.alert("Supprimer l'utilisateur", "Êtes-vous sûr?", [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: async () => {
        await supabase.from("profiles").delete().eq("id", userId);
        fetchData();
        Alert.alert("Succès", "Utilisateur supprimé");
      }},
    ]);
  };

  const handleDeleteProduct = async (productId: string) => {
    Alert.alert("Supprimer le produit", "Êtes-vous sûr?", [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: async () => {
        await supabase.from("produits").delete().eq("id", productId);
        fetchData();
        Alert.alert("Succès", "Produit supprimé");
      }},
    ]);
  };

  const handleDeleteAnimal = async (animalId: string) => {
    Alert.alert("Supprimer l'animal", "Êtes-vous sûr?", [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: async () => {
        await supabase.from("animals").delete().eq("id", animalId);
        fetchData();
      }},
    ]);
  };

  const handleDeleteMaterial = async (materialId: string) => {
    Alert.alert("Supprimer le matériel", "Êtes-vous sûr?", [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: async () => {
        await supabase.from("materiels").delete().eq("id", materialId);
        fetchData();
      }},
    ]);
  };

  const handleRateUser = async () => {
    if (!showRateModal || !ratingValue) return;
    const rating = parseFloat(ratingValue);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      Alert.alert("Erreur", "Note entre 1 et 5");
      return;
    }
    await supabase.from("profiles").update({ rating, average_rating: rating, rating_count: 1 }).eq("id", showRateModal.userId);
    setShowRateModal(null);
    setRatingValue("");
    fetchData();
    Alert.alert("Succès", "Note attribuée");
  };

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.nom) {
      Alert.alert("Erreur", "Champs obligatoires manquants");
      return;
    }
    try {
      const { data } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true,
      });
      await supabase.from("profiles").upsert({
        id: data?.user?.id,
        nom: newUser.nom,
        prenom: newUser.prenom,
        telephone: newUser.telephone,
        wilaya: newUser.wilaya,
        role: newUser.role,
      });
      setShowAddUser(false);
      setNewUser({ email: "", password: "", nom: "", prenom: "", telephone: "", wilaya: "", role: "acheteur" });
      fetchData();
      Alert.alert("Succès", "Utilisateur créé");
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
    }
  };

  const handleLogout = () => {
    Alert.alert("Déconnexion", "Voulez-vous vous déconnecter?", [
      { text: "Annuler", style: "cancel" },
      { text: "Déconnexion", onPress: () => { logout(); router.replace("/screens/loginscreen"); }},
    ]);
  };

  // Filtered Data
  const filteredUsers = users.filter(u =>
    `${u.nom} ${u.prenom} ${u.telephone} ${u.wilaya}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProducts = products.filter(p =>
    `${p.titre} ${p.description} ${p.wilaya}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helpers
  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "admin": return { bg: "#fef3c7", text: "#92400e" };
      case "agriculteur": return { bg: "#dcfce7", text: "#166534" };
      case "acheteur": return { bg: "#dbeafe", text: "#1e40af" };
      default: return { bg: "#f3f4f6", text: "#374151" };
    }
  };

  const tabs: { key: TabType; label: string; icon: any }[] = [
    { key: "overview", label: "Aperçu", icon: Home },
    { key: "users", label: "Utilisateurs", icon: Users },
    { key: "products", label: "Produits", icon: Package },
    { key: "animals", label: "Animaux", icon: TrendingUp },
    { key: "materials", label: "Matériels", icon: Truck },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconBg}>
            <Crown size={20} color="#16a34a" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Admin</Text>
            <Text style={styles.headerSubtitle}>FermeConnect</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <LogOut size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
          >
            <tab.icon size={16} color={activeTab === tab.key ? "#16a34a" : "#9ca3af"} />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <View>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Users size={20} color="#16a34a" />
                <Text style={styles.statValue}>{stats?.totalUsers}</Text>
                <Text style={styles.statLabel}>Utilisateurs</Text>
              </View>
              <View style={styles.statCard}>
                <Package size={20} color="#22c55e" />
                <Text style={styles.statValue}>{stats?.totalProducts}</Text>
                <Text style={styles.statLabel}>Produits</Text>
              </View>
              <View style={styles.statCard}>
                <TrendingUp size={20} color="#86efac" />
                <Text style={styles.statValue}>{stats?.totalAnimals}</Text>
                <Text style={styles.statLabel}>Animaux</Text>
              </View>
              <View style={styles.statCard}>
                <Truck size={20} color="#15803d" />
                <Text style={styles.statValue}>{stats?.totalMaterials}</Text>
                <Text style={styles.statLabel}>Matériels</Text>
              </View>
            </View>

            {/* Users by Role */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Utilisateurs par rôle</Text>
              <View style={styles.rolesContainer}>
                {stats?.usersByRole.map((item, i) => {
                  const colors = ["#16a34a", "#22c55e", "#86efac", "#15803d"];
                  const badge = getRoleBadgeStyle(item.role);
                  return (
                    <View key={i} style={styles.roleItem}>
                      <View style={[styles.roleDot, { backgroundColor: colors[i % colors.length] }]} />
                      <Text style={styles.roleName}>{item.role}</Text>
                      <Text style={styles.roleCount}>{item.count}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Recent Users */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Derniers inscrits</Text>
              {stats?.recentUsers.map((u) => {
                const badge = getRoleBadgeStyle(u.role);
                return (
                  <View key={u.id} style={styles.recentItem}>
                    <View style={styles.recentAvatar}>
                      <Text style={styles.recentAvatarText}>{(u.prenom?.[0] || "") + (u.nom?.[0] || "")}</Text>
                    </View>
                    <View style={styles.recentInfo}>
                      <Text style={styles.recentName}>{u.prenom} {u.nom}</Text>
                      <Text style={styles.recentMeta}>{u.wilaya}</Text>
                    </View>
                    <View style={[styles.roleBadge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.roleBadgeText, { color: badge.text }]}>{u.role}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* USERS */}
        {activeTab === "users" && (
          <View style={styles.listContainer}>
            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <Search size={16} color="#9ca3af" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Rechercher..."
                  placeholderTextColor="#9ca3af"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <TouchableOpacity style={styles.addButton} onPress={() => setShowAddUser(true)}>
                <Plus size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const badge = getRoleBadgeStyle(item.role);
                return (
                  <View style={styles.card}>
                    <View style={styles.cardLeft}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{(item.prenom?.[0] || "") + (item.nom?.[0] || "")}</Text>
                      </View>
                      <View style={styles.cardInfo}>
                        <Text style={styles.cardName}>{item.prenom} {item.nom}</Text>
                        <Text style={styles.cardMeta}>{item.telephone} · {item.wilaya}</Text>
                        <View style={styles.ratingRow}>
                          <Star size={12} color="#fbbf24" fill="#fbbf24" />
                          <Text style={styles.ratingText}>{item.average_rating?.toFixed(1) || "0.0"}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.cardActions}>
                      <View style={[styles.roleBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.roleBadgeText, { color: badge.text }]}>{item.role}</Text>
                      </View>
                      <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => setShowRateModal({ userId: item.id, name: `${item.prenom} ${item.nom}` })}>
                          <Star size={14} color="#fbbf24" />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDeleteUser(item.id)}>
                          <Trash2 size={14} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={<Text style={styles.emptyText}>Aucun utilisateur</Text>}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#16a34a"]} />}
            />
          </View>
        )}

        {/* PRODUCTS */}
        {activeTab === "products" && (
          <View style={styles.listContainer}>
            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <Search size={16} color="#9ca3af" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Rechercher un produit..."
                  placeholderTextColor="#9ca3af"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>

            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <View style={styles.cardLeft}>
                    <View style={styles.productImage}>
                      {item.images?.[0] ? (
                        <Image source={{ uri: item.images[0] }} style={styles.productImg} />
                      ) : (
                        <Package size={24} color="#9ca3af" />
                      )}
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardName}>{item.titre}</Text>
                      <Text style={styles.priceText}>{item.prix} DA/{item.unite}</Text>
                      <Text style={styles.cardMeta}>{item.wilaya} · {item.commune}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDeleteProduct(item.id)}>
                    <Trash2 size={14} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>Aucun produit</Text>}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#16a34a"]} />}
            />
          </View>
        )}

        {/* ANIMALS */}
        {activeTab === "animals" && (
          <View style={styles.listContainer}>
            <FlatList
              data={animals}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <View style={styles.cardLeft}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{item.type?.[0] || "A"}</Text>
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardName}>{item.type}</Text>
                      <Text style={styles.cardMeta}>{item.race} · {item.age} ans</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDeleteAnimal(item.id)}>
                    <Trash2 size={14} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>Aucun animal</Text>}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#16a34a"]} />}
            />
          </View>
        )}

        {/* MATERIALS */}
        {activeTab === "materials" && (
          <View style={styles.listContainer}>
            <FlatList
              data={materials}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <View style={styles.cardLeft}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{item.type?.[0] || "M"}</Text>
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardName}>{item.type}</Text>
                      <Text style={styles.cardMeta}>{item.marque} · {item.etat}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDeleteMaterial(item.id)}>
                    <Trash2 size={14} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>Aucun matériel</Text>}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#16a34a"]} />}
            />
          </View>
        )}
      </View>

      {/* Rating Modal */}
      <Modal visible={!!showRateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Noter {showRateModal?.name}</Text>
              <TouchableOpacity onPress={() => setShowRateModal(null)}>
                <X size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="Note (1-5)"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={ratingValue}
              onChangeText={setRatingValue}
            />
            <TouchableOpacity style={styles.modalBtn} onPress={handleRateUser}>
              <Text style={styles.modalBtnText}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add User Modal */}
      <Modal visible={showAddUser} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, styles.addModal]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouvel utilisateur</Text>
              <TouchableOpacity onPress={() => setShowAddUser(false)}>
                <X size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <TextInput style={styles.modalInput} placeholder="Email *" placeholderTextColor="#9ca3af" value={newUser.email} onChangeText={(t) => setNewUser(p => ({ ...p, email: t }))} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={styles.modalInput} placeholder="Mot de passe *" placeholderTextColor="#9ca3af" value={newUser.password} onChangeText={(t) => setNewUser(p => ({ ...p, password: t }))} secureTextEntry />
            <TextInput style={styles.modalInput} placeholder="Nom *" placeholderTextColor="#9ca3af" value={newUser.nom} onChangeText={(t) => setNewUser(p => ({ ...p, nom: t }))} />
            <TextInput style={styles.modalInput} placeholder="Prénom" placeholderTextColor="#9ca3af" value={newUser.prenom} onChangeText={(t) => setNewUser(p => ({ ...p, prenom: t }))} />
            <TextInput style={styles.modalInput} placeholder="Téléphone" placeholderTextColor="#9ca3af" value={newUser.telephone} onChangeText={(t) => setNewUser(p => ({ ...p, telephone: t }))} keyboardType="phone-pad" />
            <TextInput style={styles.modalInput} placeholder="Wilaya" placeholderTextColor="#9ca3af" value={newUser.wilaya} onChangeText={(t) => setNewUser(p => ({ ...p, wilaya: t }))} />
            <Text style={styles.roleLabel}>Rôle:</Text>
            <View style={styles.roleSelector}>
              {["acheteur", "agriculteur", "admin"].map((r) => (
                <TouchableOpacity key={r} style={[styles.roleOpt, newUser.role === r && styles.roleOptActive]} onPress={() => setNewUser(p => ({ ...p, role: r }))}>
                  <Text style={[styles.roleOptText, newUser.role === r && styles.roleOptTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.modalBtn} onPress={handleAddUser}>
              <Text style={styles.modalBtnText}>Créer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Styles
const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f0fdf4" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerIconBg: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#dcfce7", justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  headerSubtitle: { fontSize: 11, color: "#6b7280" },
  logoutBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#fee2e2", justifyContent: "center", alignItems: "center" },

  tabsContainer: { flexDirection: "row", backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  tab: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: "#f3f4f6" },
  tabActive: { backgroundColor: "#dcfce7" },
  tabText: { fontSize: 12, fontWeight: "500", color: "#9ca3af" },
  tabTextActive: { color: "#16a34a", fontWeight: "600" },

  content: { flex: 1, padding: 12 },

  // Overview
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  statCard: { width: (width - 44) / 4, backgroundColor: "#fff", borderRadius: 12, padding: 10, alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "700", color: "#111827", marginTop: 4 },
  statLabel: { fontSize: 9, color: "#6b7280", marginTop: 2 },

  section: { backgroundColor: "#fff", borderRadius: 12, padding: 12, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#111827", marginBottom: 10 },

  rolesContainer: { gap: 8 },
  roleItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  roleDot: { width: 10, height: 10, borderRadius: 5 },
  roleName: { flex: 1, fontSize: 13, color: "#374151", textTransform: "capitalize" },
  roleCount: { fontSize: 13, fontWeight: "600", color: "#111827" },

  recentItem: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  recentAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#16a34a", justifyContent: "center", alignItems: "center" },
  recentAvatarText: { fontSize: 12, fontWeight: "600", color: "#fff" },
  recentInfo: { flex: 1, marginLeft: 10 },
  recentName: { fontSize: 13, fontWeight: "600", color: "#111827" },
  recentMeta: { fontSize: 11, color: "#6b7280" },

  // List Container
  listContainer: { flex: 1 },
  searchRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  searchBox: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 12, gap: 8, height: 40 },
  searchInput: { flex: 1, fontSize: 14, color: "#111827" },
  addButton: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#16a34a", justifyContent: "center", alignItems: "center" },

  // Card
  card: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", borderRadius: 12, padding: 10, marginBottom: 8 },
  cardLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#16a34a", justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 14, fontWeight: "600", color: "#fff" },
  cardInfo: { flex: 1, marginLeft: 10 },
  cardName: { fontSize: 14, fontWeight: "600", color: "#111827" },
  cardMeta: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  priceText: { fontSize: 13, fontWeight: "700", color: "#16a34a", marginTop: 2 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  ratingText: { fontSize: 11, color: "#374151" },

  productImage: { width: 50, height: 50, borderRadius: 8, backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center", overflow: "hidden" },
  productImg: { width: "100%", height: "100%" },

  cardActions: { alignItems: "flex-end", gap: 6 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  roleBadgeText: { fontSize: 10, fontWeight: "600", textTransform: "capitalize" },
  actionButtons: { flexDirection: "row", gap: 4 },
  actionBtn: { width: 28, height: 28, borderRadius: 6, backgroundColor: "#fef3c7", justifyContent: "center", alignItems: "center" },
  deleteBtn: { backgroundColor: "#fee2e2" },

  emptyText: { textAlign: "center", color: "#9ca3af", fontSize: 14, marginTop: 40 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  modal: { backgroundColor: "#fff", borderRadius: 16, padding: 16, width: "100%", maxWidth: 300 },
  addModal: { maxWidth: 360 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  modalInput: { backgroundColor: "#f9fafb", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#111827", marginBottom: 10, borderWidth: 1, borderColor: "#e5e7eb" },
  modalBtn: { backgroundColor: "#16a34a", borderRadius: 8, paddingVertical: 12, alignItems: "center", marginTop: 4 },
  modalBtnText: { fontSize: 14, fontWeight: "600", color: "#fff" },
  roleLabel: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 },
  roleSelector: { flexDirection: "row", gap: 8, marginBottom: 16 },
  roleOpt: { flex: 1, paddingVertical: 8, borderRadius: 6, backgroundColor: "#f3f4f6", alignItems: "center" },
  roleOptActive: { backgroundColor: "#16a34a" },
  roleOptText: { fontSize: 12, color: "#374151", textTransform: "capitalize" },
  roleOptTextActive: { color: "#fff", fontWeight: "600" },
});
