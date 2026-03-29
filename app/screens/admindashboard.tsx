import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
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
  ChevronLeft,
  Crown,
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
  monthlyProducts: { month: string; count: number }[];
  recentUsers: Profile[];
  recentProducts: Product[];
}

interface Profile {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  wilaya: string;
  commune: string;
  role: string;
  photo_url: string;
  bio: string;
  created_at: string;
  rating: number;
  average_rating: number;
  rating_count: number;
}

interface Product {
  id: string;
  vendeur_id: string;
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
  proprietaire_id: string;
  type: string;
  race: string;
  age: number;
  etat: string;
  created_at: string;
}

interface Material {
  id: string;
  proprietaire_id: string;
  type: string;
  marque: string;
  etat: string;
  created_at: string;
}

type TabType = "overview" | "users" | "products" | "animals" | "materials";

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Users Management
  const [users, setUsers] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    nom: "",
    prenom: "",
    telephone: "",
    wilaya: "",
    role: "acheteur",
  });
  const [ratingInput, setRatingInput] = useState<{ userId: string; rating: string } | null>(null);

  // Products Management
  const [products, setProducts] = useState<Product[]>([]);

  // Animals Management
  const [animals, setAnimals] = useState<Animal[]>([]);

  // Materials Management
  const [materials, setMaterials] = useState<Material[]>([]);

  // Fetch All Data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch Users
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      // Fetch Products
      const { data: productsData } = await supabase
        .from("produits")
        .select("*")
        .order("created_at", { ascending: false });

      // Fetch Animals
      const { data: animalsData } = await supabase
        .from("animals")
        .select("*")
        .order("created_at", { ascending: false });

      // Fetch Materials
      const { data: materialsData } = await supabase
        .from("materiels")
        .select("*")
        .order("created_at", { ascending: false });

      // Fetch Categories
      const { data: categoriesData } = await supabase
        .from("categories")
        .select("*");

      // Calculate Stats
      const usersByRole = processUsersByRole(profilesData || []);
      const productsByCategory = processProductsByCategory(productsData || [], categoriesData || []);
      const monthlySignups = processMonthlyData(profilesData || []);
      const monthlyProducts = processMonthlyData(productsData || []);

      setStats({
        totalUsers: profilesData?.length || 0,
        totalProducts: productsData?.length || 0,
        totalAnimals: animalsData?.length || 0,
        totalMaterials: materialsData?.length || 0,
        usersByRole,
        productsByCategory,
        monthlySignups,
        monthlyProducts,
        recentUsers: (profilesData || []).slice(0, 5),
        recentProducts: (productsData || []).slice(0, 5),
      });

      setUsers(profilesData || []);
      setProducts(productsData || []);
      setAnimals(animalsData || []);
      setMaterials(materialsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Erreur", "Impossible de charger les données");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Process Data for Charts
  const processUsersByRole = (users: Profile[]) => {
    const counts: Record<string, number> = {};
    users.forEach((u) => {
      counts[u.role] = (counts[u.role] || 0) + 1;
    });
    return Object.entries(counts).map(([role, count]) => ({ role, count }));
  };

  const processProductsByCategory = (products: Product[], categories: any[]) => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      const cat = categories.find((c) => c.id === p.categorie_id);
      const catName = cat?.nom || "Autre";
      counts[catName] = (counts[catName] || 0) + 1;
    });
    return Object.entries(counts).map(([category, count]) => ({ category, count }));
  };

  const processMonthlyData = (items: any[]) => {
    const months: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
      months[key] = 0;
    }
    items.forEach((item) => {
      const date = new Date(item.created_at);
      const key = date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
      if (months[key] !== undefined) months[key]++;
    });
    return Object.entries(months).map(([month, count]) => ({ month, count }));
  };

  // Admin Actions
  const handleDeleteUser = async (userId: string) => {
    Alert.alert(
      "Confirmer la suppression",
      "Êtes-vous sûr de vouloir supprimer cet utilisateur?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await supabase.from("profiles").delete().eq("id", userId);
              await supabase.auth.admin.deleteUser(userId);
              fetchData();
              Alert.alert("Succès", "Utilisateur supprimé");
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer l'utilisateur");
            }
          },
        },
      ]
    );
  };

  const handleDeleteProduct = async (productId: string) => {
    Alert.alert(
      "Confirmer la suppression",
      "Êtes-vous sûr de vouloir supprimer ce produit?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await supabase.from("produits").delete().eq("id", productId);
              fetchData();
              Alert.alert("Succès", "Produit supprimé");
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer le produit");
            }
          },
        },
      ]
    );
  };

  const handleDeleteAnimal = async (animalId: string) => {
    Alert.alert(
      "Confirmer la suppression",
      "Êtes-vous sûr de vouloir supprimer cet animal?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await supabase.from("animals").delete().eq("id", animalId);
              fetchData();
              Alert.alert("Succès", "Animal supprimé");
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer l'animal");
            }
          },
        },
      ]
    );
  };

  const handleDeleteMaterial = async (materialId: string) => {
    Alert.alert(
      "Confirmer la suppression",
      "Êtes-vous sûr de vouloir supprimer ce matériel?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await supabase.from("materiels").delete().eq("id", materialId);
              fetchData();
              Alert.alert("Succès", "Matériel supprimé");
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer le matériel");
            }
          },
        },
      ]
    );
  };

  const handleRateUser = async () => {
    if (!ratingInput || !ratingInput.rating) return;
    const rating = parseFloat(ratingInput.rating);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      Alert.alert("Erreur", "La note doit être entre 1 et 5");
      return;
    }
    try {
      await supabase
        .from("profiles")
        .update({
          rating: rating,
          average_rating: rating,
          rating_count: 1,
        })
        .eq("id", ratingInput.userId);
      setRatingInput(null);
      fetchData();
      Alert.alert("Succès", "Note attribuée");
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'attribuer la note");
    }
  };

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.nom) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires");
      return;
    }
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true,
        user_metadata: {
          nom: newUser.nom,
          prenom: newUser.prenom,
          telephone: newUser.telephone,
          wilaya: newUser.wilaya,
          role: newUser.role,
        },
      });

      if (error) throw error;

      await supabase.from("profiles").upsert({
        id: data.user?.id,
        nom: newUser.nom,
        prenom: newUser.prenom,
        telephone: newUser.telephone,
        wilaya: newUser.wilaya,
        role: newUser.role,
        created_at: new Date().toISOString(),
      });

      setShowAddUser(false);
      setNewUser({
        email: "",
        password: "",
        nom: "",
        prenom: "",
        telephone: "",
        wilaya: "",
        role: "acheteur",
      });
      fetchData();
      Alert.alert("Succès", "Utilisateur créé");
    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Impossible de créer l'utilisateur");
    }
  };

  const handleLogout = () => {
    Alert.alert("Déconnexion", "Êtes-vous sûr de vouloir vous déconnecter?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Déconnexion",
        onPress: () => {
          logout();
          router.replace("/screens/loginscreen");
        },
      },
    ]);
  };

  // Filtered Lists
  const filteredUsers = users.filter(
    (u) =>
      `${u.nom} ${u.prenom} ${u.telephone} ${u.wilaya}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const filteredProducts = products.filter(
    (p) =>
      `${p.titre} ${p.description} ${p.wilaya}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  // Helper Functions
  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "#fef3c7";
      case "agriculteur":
        return "#dcfce7";
      case "acheteur":
        return "#dbeafe";
      default:
        return "#f3f4f6";
    }
  };

  const getRoleTextColor = (role: string) => {
    switch (role) {
      case "admin":
        return "#92400e";
      case "agriculteur":
        return "#166534";
      case "acheteur":
        return "#1e40af";
      default:
        return "#374151";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "disponible":
        return "#dcfce7";
      case "vendu":
        return "#fee2e2";
      default:
        return "#f3f4f6";
    }
  };

  // Render Pie Chart (Simple Visual)
  const renderPieChart = (
    data: { role?: string; category?: string; count: number }[],
    title: string
  ) => {
    const colors = ["#16a34a", "#22c55e", "#86efac", "#15803d", "#166534"];
    const total = data.reduce((sum, item) => sum + item.count, 0);

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{title}</Text>
        <View style={styles.pieWrapper}>
          <View style={styles.pieChart}>
            {data.map((item, index) => {
              const percentage = total > 0 ? (item.count / total) * 100 : 0;
              return (
                <View
                  key={index}
                  style={[
                    styles.pieSlice,
                    {
                      backgroundColor: colors[index % colors.length],
                      flex: percentage / 100 || 0.01,
                    },
                  ]}
                />
              );
            })}
          </View>
          <View style={styles.pieLegend}>
            {data.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendColor,
                    { backgroundColor: colors[index % colors.length] },
                  ]}
                />
                <Text style={styles.legendText}>
                  {item.role || item.category}: {item.count}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  // Render Bar Chart
  const renderBarChart = (
    data: { month: string; count: number }[],
    title: string
  ) => {
    const maxCount = Math.max(...data.map((d) => d.count), 1);

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{title}</Text>
        <View style={styles.barChart}>
          {data.map((item, index) => {
            const height = (item.count / maxCount) * 100;
            return (
              <View key={index} style={styles.barWrapper}>
                <Text style={styles.barValue}>{item.count}</Text>
                <View style={styles.barOuter}>
                  <View style={[styles.barInner, { height: `${height}%` }]} />
                </View>
                <Text style={styles.barLabel}>{item.month}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // Tab Button Component
  const TabButton = ({
    tab,
    label,
    icon: Icon,
  }: {
    tab: TabType;
    label: string;
    icon: any;
  }) => (
    <TouchableOpacity
      onPress={() => setActiveTab(tab)}
      style={[styles.tab, activeTab === tab && styles.tabActive]}
    >
      <Icon
        width={20}
        height={20}
        color={activeTab === tab ? "#16a34a" : "#6b7280"}
      />
      <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Crown width={24} height={24} color="#16a34a" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Dashboard Admin</Text>
            <Text style={styles.headerSubtitle}>FermeConnect</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <LogOut width={22} height={22} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Navigation Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabContainer}
      >
        <TabButton tab="overview" label="Aperçu" icon={Home} />
        <TabButton tab="users" label="Utilisateurs" icon={Users} />
        <TabButton tab="products" label="Produits" icon={Package} />
        <TabButton tab="animals" label="Animaux" icon={TrendingUp} />
        <TabButton tab="materials" label="Matériels" icon={Truck} />
      </ScrollView>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#16a34a"]}
          />
        }
      >
        {/* ============ OVERVIEW TAB ============ */}
        {activeTab === "overview" && (
          <View>
            {/* Stats Cards */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Users width={28} height={28} color="#16a34a" />
                <Text style={styles.statValue}>{stats?.totalUsers || 0}</Text>
                <Text style={styles.statLabel}>Utilisateurs</Text>
              </View>
              <View style={styles.statCard}>
                <Package width={28} height={28} color="#22c55e" />
                <Text style={styles.statValue}>{stats?.totalProducts || 0}</Text>
                <Text style={styles.statLabel}>Produits</Text>
              </View>
              <View style={styles.statCard}>
                <TrendingUp width={28} height={28} color="#86efac" />
                <Text style={styles.statValue}>{stats?.totalAnimals || 0}</Text>
                <Text style={styles.statLabel}>Animaux</Text>
              </View>
              <View style={styles.statCard}>
                <Truck width={28} height={28} color="#15803d" />
                <Text style={styles.statValue}>{stats?.totalMaterials || 0}</Text>
                <Text style={styles.statLabel}>Matériels</Text>
              </View>
            </View>

            {/* Charts */}
            {renderPieChart(stats?.usersByRole || [], "Utilisateurs par rôle")}
            {renderBarChart(stats?.monthlySignups || [], "Inscriptions mensuelles")}
            {renderPieChart(stats?.productsByCategory || [], "Produits par catégorie")}
            {renderBarChart(stats?.monthlyProducts || [], "Nouveaux produits")}

            {/* Recent Users */}
            <View style={styles.recentSection}>
              <Text style={styles.sectionTitle}>Derniers utilisateurs</Text>
              {stats?.recentUsers.map((u) => (
                <View key={u.id} style={styles.recentItem}>
                  <View style={styles.recentAvatar}>
                    <Text style={styles.recentAvatarText}>
                      {(u.prenom?.[0] || "") + (u.nom?.[0] || "")}
                    </Text>
                  </View>
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentName}>
                      {u.prenom} {u.nom}
                    </Text>
                    <Text style={styles.recentMeta}>{u.role} • {u.wilaya}</Text>
                  </View>
                  <View
                    style={[
                      styles.recentBadge,
                      { backgroundColor: getRoleColor(u.role) },
                    ]}
                  >
                    <Text
                      style={[
                        styles.recentBadgeText,
                        { color: getRoleTextColor(u.role) },
                      ]}
                    >
                      {u.role}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ============ USERS TAB ============ */}
        {activeTab === "users" && (
          <View>
            {/* Search & Add */}
            <View style={styles.actionRow}>
              <View style={styles.searchContainer}>
                <Search width={18} height={18} color="#9ca3af" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Rechercher un utilisateur..."
                  placeholderTextColor="#9ca3af"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setShowAddUser(true)}
              >
                <Plus width={20} height={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Users List */}
            {filteredUsers.map((u) => (
              <View key={u.id} style={styles.listItem}>
                <View style={styles.listAvatar}>
                  <Text style={styles.listAvatarText}>
                    {(u.prenom?.[0] || "") + (u.nom?.[0] || "")}
                  </Text>
                </View>
                <View style={styles.listInfo}>
                  <Text style={styles.listName}>
                    {u.prenom} {u.nom}
                  </Text>
                  <Text style={styles.listMeta}>
                    {u.telephone} • {u.wilaya}
                  </Text>
                  <View style={styles.ratingRow}>
                    <Star width={14} height={14} color="#fbbf24" fill="#fbbf24" />
                    <Text style={styles.ratingText}>
                      {u.average_rating?.toFixed(1) || "0.0"} ({u.rating_count || 0})
                    </Text>
                  </View>
                </View>
                <View style={styles.listActions}>
                  <View
                    style={[
                      styles.roleBadge,
                      { backgroundColor: getRoleColor(u.role) },
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleBadgeText,
                        { color: getRoleTextColor(u.role) },
                      ]}
                    >
                      {u.role}
                    </Text>
                  </View>
                  <View style={styles.actionBtns}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() =>
                        setRatingInput({ userId: u.id, rating: "" })
                      }
                    >
                      <Star width={18} height={18} color="#fbbf24" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.deleteBtnSmall]}
                      onPress={() => handleDeleteUser(u.id)}
                    >
                      <Trash2 width={18} height={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ============ PRODUCTS TAB ============ */}
        {activeTab === "products" && (
          <View>
            {/* Search */}
            <View style={styles.searchContainer}>
              <Search width={18} height={18} color="#9ca3af" />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un produit..."
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Products List */}
            {filteredProducts.map((p) => (
              <View key={p.id} style={styles.productItem}>
                <View style={styles.productImage}>
                  {p.images?.[0] ? (
                    <Image
                      source={{ uri: p.images[0] }}
                      style={styles.productImg}
                    />
                  ) : (
                    <Package width={30} height={30} color="#9ca3af" />
                  )}
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productTitle}>{p.titre}</Text>
                  <Text style={styles.productPrice}>
                    {p.prix} DA / {p.unite}
                  </Text>
                  <Text style={styles.productLocation}>
                    {p.wilaya} • {p.commune}
                  </Text>
                  <View style={styles.productBadges}>
                    <Text
                      style={[
                        styles.productBadge,
                        { backgroundColor: getStatusColor(p.statut) },
                      ]}
                    >
                      {p.statut}
                    </Text>
                    {p.est_negociable && (
                      <Text
                        style={[styles.productBadge, { backgroundColor: "#dbeafe" }]}
                      >
                        Négociable
                      </Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.deleteProductBtn}
                  onPress={() => handleDeleteProduct(p.id)}
                >
                  <Trash2 width={20} height={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* ============ ANIMALS TAB ============ */}
        {activeTab === "animals" && (
          <View>
            <Text style={styles.sectionTitle}>Gestion des Animaux</Text>
            {animals.length === 0 ? (
              <Text style={styles.emptyText}>Aucun animal trouvé</Text>
            ) : (
              animals.map((a) => (
                <View key={a.id} style={styles.listItem}>
                  <View style={styles.listAvatar}>
                    <Text style={styles.listAvatarText}>
                      {a.type?.[0] || "A"}
                    </Text>
                  </View>
                  <View style={styles.listInfo}>
                    <Text style={styles.listName}>
                      {a.type} - {a.race}
                    </Text>
                    <Text style={styles.listMeta}>
                      Âge: {a.age} ans • État: {a.etat}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtnSmall}
                    onPress={() => handleDeleteAnimal(a.id)}
                  >
                    <Trash2 width={18} height={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* ============ MATERIALS TAB ============ */}
        {activeTab === "materials" && (
          <View>
            <Text style={styles.sectionTitle}>Gestion des Matériels</Text>
            {materials.length === 0 ? (
              <Text style={styles.emptyText}>Aucun matériel trouvé</Text>
            ) : (
              materials.map((m) => (
                <View key={m.id} style={styles.listItem}>
                  <View style={styles.listAvatar}>
                    <Text style={styles.listAvatarText}>
                      {m.type?.[0] || "M"}
                    </Text>
                  </View>
                  <View style={styles.listInfo}>
                    <Text style={styles.listName}>
                      {m.type} - {m.marque}
                    </Text>
                    <Text style={styles.listMeta}>État: {m.etat}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtnSmall}
                    onPress={() => handleDeleteMaterial(m.id)}
                  >
                    <Trash2 width={18} height={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Rating Modal */}
      <Modal visible={!!ratingInput} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Attribuer une note</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Note (1-5)"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={ratingInput?.rating || ""}
              onChangeText={(t) =>
                setRatingInput((prev) => (prev ? { ...prev, rating: t } : null))
              }
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setRatingInput(null)}
              >
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.submitBtn]}
                onPress={handleRateUser}
              >
                <Text style={styles.submitBtnText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add User Modal */}
      <Modal visible={showAddUser} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.addUserModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter un utilisateur</Text>
              <TouchableOpacity onPress={() => setShowAddUser(false)}>
                <ChevronLeft width={24} height={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                style={styles.modalInput}
                placeholder="Email *"
                placeholderTextColor="#9ca3af"
                value={newUser.email}
                onChangeText={(t) =>
                  setNewUser((prev) => ({ ...prev, email: t }))
                }
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Mot de passe *"
                placeholderTextColor="#9ca3af"
                value={newUser.password}
                onChangeText={(t) =>
                  setNewUser((prev) => ({ ...prev, password: t }))
                }
                secureTextEntry
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Nom *"
                placeholderTextColor="#9ca3af"
                value={newUser.nom}
                onChangeText={(t) =>
                  setNewUser((prev) => ({ ...prev, nom: t }))
                }
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Prénom"
                placeholderTextColor="#9ca3af"
                value={newUser.prenom}
                onChangeText={(t) =>
                  setNewUser((prev) => ({ ...prev, prenom: t }))
                }
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Téléphone"
                placeholderTextColor="#9ca3af"
                value={newUser.telephone}
                onChangeText={(t) =>
                  setNewUser((prev) => ({ ...prev, telephone: t }))
                }
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Wilaya"
                placeholderTextColor="#9ca3af"
                value={newUser.wilaya}
                onChangeText={(t) =>
                  setNewUser((prev) => ({ ...prev, wilaya: t }))
                }
              />
              <Text style={styles.roleLabel}>Rôle:</Text>
              <View style={styles.roleButtons}>
                {["acheteur", "agriculteur", "admin"].map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleButton,
                      newUser.role === role && styles.roleButtonActive,
                    ]}
                    onPress={() => setNewUser((prev) => ({ ...prev, role }))}
                  >
                    <Text
                      style={[
                        styles.roleButtonText,
                        newUser.role === role && styles.roleButtonTextActive,
                      ]}
                    >
                      {role}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.submitButton} onPress={handleAddUser}>
                <Text style={styles.submitButtonText}>Créer l'utilisateur</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Styles
const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#dcfce7",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#fee2e2",
    justifyContent: "center",
    alignItems: "center",
  },
  tabContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginHorizontal: 4,
    backgroundColor: "#f3f4f6",
  },
  tabActive: {
    backgroundColor: "#dcfce7",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6b7280",
  },
  tabTextActive: {
    color: "#16a34a",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: (width - 44) / 2,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  pieWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  pieChart: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f3f4f6",
    overflow: "hidden",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  pieSlice: {
    width: "50%",
    height: "50%",
  },
  pieLegend: {
    flex: 1,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 3,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: "#374151",
  },
  barChart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 100,
    paddingTop: 16,
  },
  barWrapper: {
    flex: 1,
    alignItems: "center",
  },
  barValue: {
    fontSize: 10,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  barOuter: {
    width: 20,
    height: 60,
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  barInner: {
    width: "100%",
    backgroundColor: "#16a34a",
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 8,
    color: "#6b7280",
    marginTop: 4,
  },
  recentSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  recentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#16a34a",
    justifyContent: "center",
    alignItems: "center",
  },
  recentAvatarText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  recentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  recentName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  recentMeta: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },
  recentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  recentBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    paddingVertical: 12,
  },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#16a34a",
    justifyContent: "center",
    alignItems: "center",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  listAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#16a34a",
    justifyContent: "center",
    alignItems: "center",
  },
  listAvatarText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  listInfo: {
    flex: 1,
    marginLeft: 12,
  },
  listName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  listMeta: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: "#374151",
  },
  listActions: {
    alignItems: "flex-end",
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  actionBtns: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#fef3c7",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteBtnSmall: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#fee2e2",
    justifyContent: "center",
    alignItems: "center",
  },
  productItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  productImg: {
    width: "100%",
    height: "100%",
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  productPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: "#16a34a",
    marginTop: 4,
  },
  productLocation: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },
  productBadges: {
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
  },
  productBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: "500",
    color: "#374151",
  },
  deleteProductBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: "#fee2e2",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  emptyText: {
    textAlign: "center",
    color: "#6b7280",
    fontSize: 14,
    marginTop: 20,
  },
  bottomPadding: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 320,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  modalInput: {
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "#f3f4f6",
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  submitBtn: {
    backgroundColor: "#16a34a",
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  addUserModal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "90%",
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
  },
  roleButtons: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  roleButtonActive: {
    backgroundColor: "#16a34a",
  },
  roleButtonText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
  },
  roleButtonTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#16a34a",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});
