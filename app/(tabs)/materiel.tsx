// app/(tabs)/materiel.tsx
import { useRouter } from "expo-router";
import { Info, MapPin, MessageCircle, Phone, Plus, Search, Tag, Trash2 } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  RefreshControl,
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
import { useTheme } from "../../src/themecontext";

// ─── Types ────────────────────────────────────────────────
interface Proprietaire {
  nom: string;
  prenom: string;
  telephone: string;
  wilaya: string;
  photo_url?: string;
}

interface Materiel {
  id: string;
  nom: string;
  categorie: string;
  description: string;
  prix: number;
  unite: string;
  duree?: string;
  type: "location" | "vente" | "les deux";
  wilaya: string;
  disponible: boolean;
  prix_negociable: boolean;
  emoji: string;
  photo_url?: string;
  proprietaire_id: string;
  created_at: string;
  proprietaire?: Proprietaire;
}

// ─── Categories ───────────────────────────────────────────
const CATEGORIES = [
  { label: "Tous",                emoji: "🔍" },
  { label: "Tracteur",            emoji: "🚜" },
  { label: "Charrue",             emoji: "🪚" },
  { label: "Herse",               emoji: "⚙️" },
  { label: "Semoir",              emoji: "🌱" },
  { label: "Pulvérisateur",       emoji: "🧴" },
  { label: "Remorque agricole",   emoji: "🚛" },
  { label: "Pièces détachées",    emoji: "🔧" },
];

export default function MaterielScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();

  const [materiels, setMateriels] = useState<Materiel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategorie, setSelectedCategorie] = useState("Tous");
  const [selectedMateriel, setSelectedMateriel] = useState<Materiel | null>(null);

  // ── Fetch ─────────────────────────────────────────────
  const fetchMateriels = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("materiels")
        .select(`*, proprietaire:proprietaire_id (nom, prenom, telephone, wilaya, photo_url)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setMateriels((data as any) || []);
    } catch {
      Alert.alert("Erreur", "Impossible de charger les matériels.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchMateriels(); }, [fetchMateriels]);
  const onRefresh = () => { setRefreshing(true); fetchMateriels(); };

  // ── Delete ────────────────────────────────────────────
  const handleDelete = (m: Materiel) => {
    if (m.proprietaire_id !== user?.id) {
      Alert.alert("Refusé", "Vous ne pouvez supprimer que vos propres annonces."); return;
    }
    Alert.alert(
      "Supprimer l'annonce",
      `Voulez-vous vraiment supprimer "${m.nom}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.from("materiels").delete().eq("id", m.id);
            if (error) { Alert.alert("Erreur", "Impossible de supprimer."); return; }
            setMateriels((prev) => prev.filter((x) => x.id !== m.id));
            if (selectedMateriel?.id === m.id) setSelectedMateriel(null);
            Alert.alert("Supprimé", "L'annonce a été supprimée.");
          },
        },
      ]
    );
  };

  // ── WhatsApp ──────────────────────────────────────────
  const handleWhatsApp = (m: Materiel) => {
    const phone = m.proprietaire?.telephone;
    if (!phone) { Alert.alert("Numéro introuvable"); return; }
    const cleaned = phone.replace(/\s+/g, "").replace(/^0/, "213");
    const nom = m.nom;
    const msg = encodeURIComponent(`Bonjour, je suis intéressé par votre annonce : ${nom}`);
    Linking.openURL(`https://wa.me/${cleaned}?text=${msg}`).catch(() =>
      Alert.alert("Erreur", "WhatsApp n'est pas installé.")
    );
  };

  // ── Call ──────────────────────────────────────────────
  const handleAppeler = (m: Materiel) => {
    const phone = m.proprietaire?.telephone;
    const nom = `${m.proprietaire?.prenom || ""} ${m.proprietaire?.nom || ""}`.trim();
    if (!phone) { Alert.alert("Numéro introuvable"); return; }
    Alert.alert(`Contacter ${nom}`, `Appeler le ${phone} ?`, [
      { text: "Annuler", style: "cancel" },
      { text: "📞 Appeler", onPress: () => Linking.openURL(`tel:${phone}`) },
    ]);
  };

  // ── Filter ────────────────────────────────────────────
  const filtered = useMemo(() => {
    return materiels.filter((m) => {
      const matchSearch =
        m.nom.toLowerCase().includes(search.toLowerCase()) ||
        (m.description || "").toLowerCase().includes(search.toLowerCase()) ||
        (m.wilaya || "").toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCategorie === "Tous" || m.categorie === selectedCategorie;
      return matchSearch && matchCat;
    });
  }, [search, selectedCategorie, materiels]);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "location": return { label: "Location",         bg: "#dbeafe", text: "#2563eb" };
      case "vente":    return { label: "Vente",            bg: "#dcfce7", text: "#16a34a" };
      case "les deux": return { label: "Location & Vente", bg: "#fef9c3", text: "#ca8a04" };
      default:         return { label: type,               bg: "#f3f4f6", text: "#6b7280" };
    }
  };

  const formatPrix = (m: Materiel) => {
    const base = `${m.prix.toLocaleString()} DA`;
    if (m.unite === "au choix" && m.duree) return `${base} / ${m.duree}`;
    return `${base} / ${m.unite}`;
  };

  // ─────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>

      {/* ── DETAIL MODAL ── */}
      {selectedMateriel && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: theme.card }]}>
            {/* Modal header */}
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={styles.modalEmoji}>{selectedMateriel.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>{selectedMateriel.nom}</Text>
                <Text style={[styles.modalCategorie, { color: theme.muted }]}>{selectedMateriel.categorie}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedMateriel(null)} style={[styles.modalClose, { backgroundColor: theme.bg }]}>
                <Text style={{ fontSize: 14, color: theme.muted, fontWeight: "700" }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false}>
              {selectedMateriel.photo_url && (
                <Image source={{ uri: selectedMateriel.photo_url }} style={styles.modalImage} resizeMode="cover" />
              )}

              {selectedMateriel.description ? (
                <Text style={[styles.modalDescription, { color: theme.muted }]}>
                  {selectedMateriel.description}
                </Text>
              ) : null}

              {/* Prix */}
              <View style={styles.modalRow}>
                <Tag width={16} height={16} color="#16a34a" />
                <Text style={styles.modalPrice}>{formatPrix(selectedMateriel)}</Text>
                {selectedMateriel.prix_negociable && (
                  <View style={styles.negoBadge}>
                    <Text style={styles.negoText}>Prix négociable</Text>
                  </View>
                )}
              </View>

              {/* Type */}
              <View style={styles.modalRow}>
                <View style={[styles.typeBadge, { backgroundColor: getTypeBadge(selectedMateriel.type).bg }]}>
                  <Text style={[styles.typeBadgeText, { color: getTypeBadge(selectedMateriel.type).text }]}>
                    {getTypeBadge(selectedMateriel.type).label}
                  </Text>
                </View>
              </View>

              {/* Wilaya */}
              <View style={styles.modalRow}>
                <MapPin width={16} height={16} color={theme.muted} />
                <Text style={[styles.modalInfo, { color: theme.text }]}>{selectedMateriel.wilaya}</Text>
              </View>

              {/* Proprietaire */}
              <View style={styles.modalRow}>
                <Text style={[{ fontSize: 13, color: theme.muted }]}>Propriétaire : </Text>
                <Text style={[{ fontSize: 14, fontWeight: "600", color: theme.text }]}>
                  {selectedMateriel.proprietaire?.prenom} {selectedMateriel.proprietaire?.nom}
                </Text>
              </View>

              {/* Disponibilite */}
              <View style={[styles.disponibilite, { backgroundColor: selectedMateriel.disponible ? "#dcfce7" : "#fee2e2" }]}>
                <Text style={{ color: selectedMateriel.disponible ? "#16a34a" : "#ef4444", fontWeight: "700", fontSize: 13 }}>
                  {selectedMateriel.disponible ? "✅ Disponible" : "❌ Non disponible"}
                </Text>
              </View>
            </ScrollView>

            {/* Action buttons */}
            {selectedMateriel.disponible && (
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCallBtn}
                  onPress={() => { setSelectedMateriel(null); handleAppeler(selectedMateriel); }}
                  activeOpacity={0.8}
                >
                  <Phone width={18} height={18} color="#fff" />
                  <Text style={styles.modalCallText}>Appeler</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalWhatsappBtn}
                  onPress={() => { setSelectedMateriel(null); handleWhatsApp(selectedMateriel); }}
                  activeOpacity={0.8}
                >
                  <MessageCircle width={18} height={18} color="#fff" />
                  <Text style={styles.modalCallText}>WhatsApp</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#16a34a"]} />}
      >
        {/* ── HEADER ── */}
        <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
          <Text style={styles.headerTitle}>🚜 Matériel Agricole</Text>
          <Text style={styles.headerSubtitle}>Location & Vente • Algérie</Text>
        </View>

        <View style={styles.content}>
          {/* ── SEARCH ── */}
          <View style={[styles.searchRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Search width={18} height={18} color={theme.muted} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Rechercher un matériel..."
              placeholderTextColor={theme.muted}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* ── CATEGORY CHIPS ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 16 }}
            contentContainerStyle={{ gap: 10, paddingHorizontal: 2 }}
          >
            {CATEGORIES.map((cat) => {
              const active = selectedCategorie === cat.label;
              return (
                <TouchableOpacity
                  key={cat.label}
                  style={[
                    styles.categoryChip,
                    { backgroundColor: active ? "#16a34a" : theme.card, borderColor: active ? "#16a34a" : theme.border },
                  ]}
                  onPress={() => setSelectedCategorie(cat.label)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                  <Text style={[styles.categoryLabel, { color: active ? "#fff" : theme.muted }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ── COUNT ── */}
          <Text style={[styles.resultsText, { color: theme.muted }]}>
            {filtered.length} matériel{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}
          </Text>

          {/* ── LIST ── */}
          {loading ? (
            <ActivityIndicator color="#16a34a" size="large" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.list}>
              {filtered.length > 0 ? (
                filtered.map((m) => {
                  const badge = getTypeBadge(m.type);
                  const isOwner = m.proprietaire_id === user?.id;
                  return (
                    <View key={m.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      {m.photo_url && (
                        <Image source={{ uri: m.photo_url }} style={styles.materielImage} resizeMode="cover" />
                      )}

                      <View style={styles.cardHeader}>
                        <View style={styles.cardEmojiContainer}>
                          <Text style={styles.cardEmoji}>{m.emoji}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.cardTitle, { color: theme.text }]}>{m.nom}</Text>
                          <Text style={[styles.cardCategorie, { color: theme.muted }]}>{m.categorie}</Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <View style={[styles.disponBadge, { backgroundColor: m.disponible ? "#dcfce7" : "#fee2e2" }]}>
                            <Text style={{ fontSize: 10, fontWeight: "700", color: m.disponible ? "#16a34a" : "#ef4444" }}>
                              {m.disponible ? "Dispo" : "Indispo"}
                            </Text>
                          </View>
                          {isOwner && (
                            <TouchableOpacity onPress={() => handleDelete(m)} activeOpacity={0.7}>
                              <Trash2 width={18} height={18} color="#ef4444" />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>

                      <Text style={[styles.cardDescription, { color: theme.muted }]} numberOfLines={2}>
                        {m.description}
                      </Text>

                      <View style={styles.cardPriceRow}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Tag width={14} height={14} color="#16a34a" />
                          <Text style={styles.cardPrice}>{formatPrix(m)}</Text>
                          {m.prix_negociable && (
                            <View style={styles.negoBadge}>
                              <Text style={styles.negoText}>Négociable</Text>
                            </View>
                          )}
                        </View>
                        <View style={[styles.typeBadge, { backgroundColor: badge.bg }]}>
                          <Text style={[styles.typeBadgeText, { color: badge.text }]}>{badge.label}</Text>
                        </View>
                      </View>

                      <View style={styles.locationRow}>
                        <MapPin width={12} height={12} color={theme.muted} />
                        <Text style={[styles.locationText, { color: theme.muted }]}>{m.wilaya}</Text>
                      </View>

                      <View style={[styles.cardFooter, { borderTopColor: theme.divider }]}>
                        <TouchableOpacity
                          style={[styles.btnDetails, { borderColor: "#16a34a" }]}
                          onPress={() => setSelectedMateriel(m)}
                          activeOpacity={0.8}
                        >
                          <Info width={14} height={14} color="#16a34a" />
                          <Text style={styles.btnDetailsText}>Détails</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.btnWhatsapp, !m.disponible && styles.btnDisabled]}
                          onPress={() => m.disponible && handleWhatsApp(m)}
                          activeOpacity={0.8}
                          disabled={!m.disponible}
                        >
                          <MessageCircle width={14} height={14} color="#fff" />
                          <Text style={styles.btnCallText}>WhatsApp</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.btnCall, !m.disponible && styles.btnDisabled]}
                          onPress={() => m.disponible && handleAppeler(m)}
                          activeOpacity={0.8}
                          disabled={!m.disponible}
                        >
                          <Phone width={14} height={14} color="#fff" />
                          <Text style={styles.btnCallText}>Appeler</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyEmoji}>🔍</Text>
                  <Text style={[styles.emptyText, { color: theme.muted }]}>Aucun matériel trouvé</Text>
                  <Text style={[styles.emptySubtext, { color: theme.muted }]}>Modifiez vos filtres</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/screens/addmateriel")}
        activeOpacity={0.85}
      >
        <Plus width={28} height={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 28 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#fff", marginBottom: 4 },
  headerSubtitle: { fontSize: 13, color: "#dcfce7" },
  content: { padding: 16 },
  searchRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 15 },
  categoryChip: {
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 14, borderWidth: 1, gap: 4, minWidth: 70,
  },
  categoryEmoji: { fontSize: 20 },
  categoryLabel: { fontSize: 10, fontWeight: "600", textAlign: "center" },
  resultsText: { fontSize: 13, marginBottom: 12 },
  list: { gap: 12 },
  card: {
    borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    borderWidth: 1, gap: 8,
  },
  materielImage: { width: "100%", height: 160, borderRadius: 12 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardEmojiContainer: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: "#f0fdf4", alignItems: "center", justifyContent: "center",
  },
  cardEmoji: { fontSize: 24 },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  cardCategorie: { fontSize: 11, marginTop: 2 },
  disponBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  cardDescription: { fontSize: 13, lineHeight: 18 },
  cardPriceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardPrice: { fontSize: 15, fontWeight: "700", color: "#16a34a" },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  typeBadgeText: { fontSize: 11, fontWeight: "600" },
  negoBadge: { backgroundColor: "#fef3c7", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  negoText: { fontSize: 10, fontWeight: "600", color: "#d97706" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: { fontSize: 12 },
  cardFooter: {
    flexDirection: "row", gap: 6, marginTop: 4,
    paddingTop: 12, borderTopWidth: 1,
  },
  btnDetails: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 4, paddingVertical: 9,
    borderRadius: 10, borderWidth: 1.5,
  },
  btnDetailsText: { fontSize: 12, fontWeight: "600", color: "#16a34a" },
  btnWhatsapp: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 4, paddingVertical: 9,
    borderRadius: 10, backgroundColor: "#25D366",
  },
  btnCall: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 4, paddingVertical: 9,
    borderRadius: 10, backgroundColor: "#16a34a",
  },
  btnDisabled: { backgroundColor: "#d1d5db" },
  btnCallText: { fontSize: 12, fontWeight: "600", color: "#fff" },
  emptyContainer: { alignItems: "center", paddingVertical: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  emptySubtext: { fontSize: 13 },
  // Modal
  modalOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center",
    alignItems: "center", zIndex: 999, padding: 20,
  },
  modal: { borderRadius: 20, width: "100%", maxHeight: "85%", overflow: "hidden" },
  modalHeader: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 20, borderBottomWidth: 1,
  },
  modalEmoji: { fontSize: 32 },
  modalTitle: { fontSize: 17, fontWeight: "800" },
  modalCategorie: { fontSize: 12, marginTop: 2 },
  modalClose: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
  },
  modalImage: { width: "100%", height: 160, borderRadius: 12, marginBottom: 12 },
  modalDescription: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  modalRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  modalPrice: { fontSize: 17, fontWeight: "800", color: "#16a34a" },
  modalInfo: { fontSize: 14 },
  disponibilite: { borderRadius: 10, padding: 10, alignItems: "center", marginTop: 4, marginBottom: 8 },
  modalActions: {
    flexDirection: "row", gap: 10,
    margin: 16, marginTop: 4,
  },
  modalCallBtn: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8,
    backgroundColor: "#16a34a", paddingVertical: 13, borderRadius: 14,
  },
  modalWhatsappBtn: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8,
    backgroundColor: "#25D366", paddingVertical: 13, borderRadius: 14,
  },
  modalCallText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  fab: {
    position: "absolute", bottom: 24, right: 24,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: "#16a34a", alignItems: "center", justifyContent: "center",
    shadowColor: "#16a34a", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
});
