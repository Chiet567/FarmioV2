import { MapPin, Phone, Tag, Trash2 } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ProductCardProps {
  post: any;
  onContact: (post: any) => void;
  onDelete?: (post: any) => void;
  currentUserId?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  post,
  onContact,
  onDelete,
  currentUserId,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  // ── Adapter les deux formats (mock + Supabase) ──
  const titre = post.titre || post.title || "Sans titre";
  const description = post.description || "";
  const prix = post.prix || post.price || 0;
  const unite = post.unite || post.unit || "kg";
  const lieu = post.wilaya || post.location || "";
  const categorie = post.categorie?.nom || post.category || "Autre";
  const sellerName = post.vendeur
    ? `${post.vendeur.prenom || ""} ${post.vendeur.nom || ""}`.trim()
    : post.seller?.name || "Vendeur";

  // Image : Supabase = tableau d'URLs, Mock = require() ou string
  const getImage = () => {
    if (post.images && post.images.length > 0) {
      return { uri: post.images[0] };
    }
    if (post.image) {
      return typeof post.image === "string" ? { uri: post.image } : post.image;
    }
    return null;
  };

  const imageSource = getImage();

  const getCategoryColor = (category: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      Légumes: { bg: "#dcfce7", text: "#16a34a" },
      Fruits: { bg: "#fef9c3", text: "#ca8a04" },
      "Produits naturels": { bg: "#fce7f3", text: "#db2777" },
      Céréales: { bg: "#ffedd5", text: "#ea580c" },
      "Produits laitiers": { bg: "#e0e7ff", text: "#4f46e5" },
      Viandes: { bg: "#fee2e2", text: "#dc2626" },
      Œufs: { bg: "#fef3c7", text: "#d97706" },
      Huiles: { bg: "#d1fae5", text: "#059669" },
      Dattes: { bg: "#fde68a", text: "#92400e" },
      Miel: { bg: "#fef9c3", text: "#a16207" },
      Fourrage: { bg: "#d9f99d", text: "#4d7c0f" },
    };
    return colors[category] ?? { bg: "#f3f4f6", text: "#6b7280" };
  };

  const categoryColor = getCategoryColor(categorie);

  return (
    <View style={styles.card}>
      {/* IMAGE */}
      {imageSource && (
        <View style={styles.imageContainer}>
          {!imageLoaded && (
            <ActivityIndicator
              style={styles.imageLoader}
              color="#16a34a"
              size="small"
            />
          )}
          <Image
            source={imageSource}
            style={{ width: "100%", height: 160 }}
            resizeMode="cover"
            onLoad={() => setImageLoaded(true)}
            fadeDuration={300}
          />
        </View>
      )}

      {/* En-tête */}
      <View style={styles.cardHeader}>
        <Text style={styles.title} numberOfLines={1}>
          {titre}
        </Text>
        <View
          style={[styles.categoryBadge, { backgroundColor: categoryColor.bg }]}
        >
          <Text style={[styles.categoryText, { color: categoryColor.text }]}>
            {categorie}
          </Text>
        </View>
      </View>

      {/* Description */}
      {description ? (
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
      ) : null}

      {/* Prix */}
      <View style={styles.priceRow}>
        <Tag width={14} height={14} color="#16a34a" />
        <Text style={styles.price}>
          {prix} DA / {unite}
        </Text>
      </View>

      {/* Localisation */}
      <View style={styles.infoRow}>
        <MapPin width={14} height={14} color="#6b7280" />
        <Text style={styles.infoText}>{lieu}</Text>
      </View>

      {/* Footer */}
      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.sellerInfo}>
          <View style={styles.sellerAvatar}>
            <Text style={styles.sellerAvatarText}>
              {sellerName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.sellerName}>{sellerName}</Text>
        </View>

        <View style={{ flexDirection: "row", gap: 8 }}>
          {onDelete &&
            currentUserId &&
            (post.vendeur_id === currentUserId ||
              post.seller?.id === currentUserId) && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => onDelete(post)}
                activeOpacity={0.8}
              >
                <Trash2 width={14} height={14} color="#ef4444" />
              </TouchableOpacity>
            )}

          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => onContact(post)}
            activeOpacity={0.8}
          >
            <Phone width={14} height={14} color="#fff" />
            <Text style={styles.contactButtonText}>Contacter</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    gap: 8,
  },
  imageContainer: {
    width: "100%",
    height: 160,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  imageLoader: {
    position: "absolute",
    zIndex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginRight: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  categoryText: { fontSize: 11, fontWeight: "600" },
  description: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
  },
  price: { fontSize: 15, fontWeight: "700", color: "#16a34a" },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 16,
  },
  infoText: { fontSize: 12, color: "#9ca3af" },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  sellerInfo: { flexDirection: "row", alignItems: "center", gap: 8 },
  sellerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
  },
  sellerAvatarText: { fontSize: 13, fontWeight: "700", color: "#16a34a" },
  sellerName: { fontSize: 13, fontWeight: "500", color: "#374151" },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#16a34a",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  contactButtonText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
  },
});
