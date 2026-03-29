import { useRouter } from "expo-router";
import { ArrowLeft, Plus, Search } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../components/lib/supabase";
import { useAuth } from "../../src/authcontext";

import { getProduits } from "../../components/lib/dataSource";
import { ProductCard } from "../../components/productcard";

export default function Market() {
  const router = useRouter();
  const { user } = useAuth();

  const handleDelete = (post: any) => {
    const titre = post.titre || post.title || "ce produit";
    Alert.alert(
      "Supprimer l'annonce",
      `Veux-tu vraiment supprimer "${titre}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            const id = post.id;
            const { error } = await supabase
              .from("produits")
              .delete()
              .eq("id", id);

            if (error) {
              Alert.alert("Erreur", "Impossible de supprimer l'annonce.");
            } else {
              // Recharger les produits
              loadProduits();
            }
          },
        },
      ],
    );
  };
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [produits, setProduits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProduits();
  }, []);

  async function loadProduits() {
    setLoading(true);
    const { data, error } = await getProduits();
    if (data) setProduits(data);
    if (error) console.error("Erreur chargement:", error);
    setLoading(false);
  }

  const categories = [
    "Tous",
    ...new Set(produits.map((p) => p.categorie?.nom || p.category || "Autre")),
  ];

  const filteredPosts = produits.filter((post) => {
    const titre = post.titre || post.title || "";
    const lieu = post.wilaya || post.location || "";
    const cat = post.categorie?.nom || post.category || "";

    const matchSearch =
      titre.toLowerCase().includes(search.toLowerCase()) ||
      lieu.toLowerCase().includes(search.toLowerCase());

    const matchCategory =
      selectedCategory === "Tous" || cat === selectedCategory;

    return matchSearch && matchCategory;
  });

  const handleContact = (post: any) => {
    const phone = post.vendeur?.telephone || post.seller?.phone || "";
    const name = post.vendeur
      ? `${post.vendeur.prenom} ${post.vendeur.nom}`
      : post.seller?.name || "Vendeur";

    Alert.alert(`Contacter ${name}`, `Appeler le ${phone} ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "📞 Appeler",
        onPress: () => Linking.openURL(`tel:${phone}`),
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <ArrowLeft width={22} height={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🛒 Marché</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft width={22} height={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🛒 Marché</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* SEARCH */}
      <View style={styles.searchContainer}>
        <Search size={18} color="#9ca3af" />
        <TextInput
          placeholder="Rechercher..."
          placeholderTextColor="#9ca3af"
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* CATEGORIES */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categories}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((cat, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.categoryBtn,
              selectedCategory === cat && styles.categoryActive,
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === cat && styles.categoryTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* RÉSULTATS */}
      <Text style={styles.resultsText}>
        {filteredPosts.length} produit{filteredPosts.length > 1 ? "s" : ""}{" "}
        trouvé{filteredPosts.length > 1 ? "s" : ""}
      </Text>

      {/* PRODUITS */}
      <ScrollView contentContainerStyle={styles.listContent}>
        {filteredPosts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}> Aucun produit trouvé</Text>
          </View>
        ) : (
          filteredPosts.map((post, index) => (
            <ProductCard
              key={index}
              post={post}
              onContact={() => handleContact(post)}
              onDelete={handleDelete}
              currentUserId={user?.id}
            />
          ))
        )}
      </ScrollView>

      {/* BOUTON AJOUTER */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.navigate("/screens/addproduit")}
        activeOpacity={0.8}
      >
        <Plus width={28} height={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#16a34a",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#15803d",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#9ca3af",
  },
  loadingText: {
    marginTop: 12,
    color: "#9ca3af",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    margin: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  searchInput: {
    marginLeft: 8,
    color: "#111827",
    flex: 1,
    fontSize: 15,
  },
  categories: {
    paddingHorizontal: 16,
    backgroundColor: "#f9fafb",
    maxHeight: 52,
    marginBottom: 4,
  },
  categoriesContent: {
    alignItems: "center",
    paddingVertical: 8,
    gap: 8,
  },
  categoryBtn: {
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryActive: {
    backgroundColor: "#16a34a",
    borderColor: "#16a34a",
  },
  categoryText: {
    color: "#374151",
    fontSize: 13,
    fontWeight: "400",
  },
  categoryTextActive: {
    color: "#fff",
    fontWeight: "400",
  },
  resultsText: {
    fontSize: 13,
    color: "#9ca3af",
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    gap: 16,
    paddingBottom: 40,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#16a34a",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});
