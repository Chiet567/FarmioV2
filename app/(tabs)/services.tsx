// app/(tabs)/services.tsx
import { useRouter } from "expo-router";
import {
  Briefcase, Clock, DollarSign, MapPin,
  MessageCircle, Phone, Search, Star, User,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Image, Linking,
  RefreshControl, SafeAreaView, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { supabase } from "../../components/lib/supabase";
import { useAuth } from "../../src/authcontext";
import { useTheme } from "../../src/themecontext";

// ─── Types ────────────────────────────────────────────────
interface ProProfile {
  id: string;
  user_id: string;
  role: "veterinaire" | "ingenieur";
  bio: string;
  experience: string;
  services: string[];
  price?: number;
  price_label?: string;
  office_address?: string;
  wilaya?: string;
  work_days?: string[];
  work_hours?: string;
  is_published: boolean;
  photo_url?: string;
  average_rating?: number;
  rating_count?: number;
  profile: {
    nom: string;
    prenom: string;
    telephone: string;
    wilaya: string;
    photo_url?: string;
    average_rating?: number;
    rating_count?: number;
  };
}

type FilterType = "all" | "veterinaire" | "ingenieur";

export default function ServicesScreen() {
  const router  = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();

  const [pros, setPros]           = useState<ProProfile[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState<FilterType>("all");
  const [expanded, setExpanded]   = useState<string | null>(null);

  // Is current user a pro?
  const isPro = user?.role === "veterinaire" || user?.role === "ingenieur";

  // ── Fetch ─────────────────────────────────────────────
  const fetchPros = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("professional_profiles")
        .select(`
          *,
          profile:user_id (
            nom, prenom, telephone, wilaya, photo_url,
            average_rating, rating_count
          )
        `)
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPros((data as any) || []);
    } catch (e) {
      Alert.alert("Erreur", "Impossible de charger les professionnels.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPros(); }, [fetchPros]);
  const onRefresh = () => { setRefreshing(true); fetchPros(); };

  // ── Filter ─────────────────────────────────────────────
  const filtered = pros.filter(p => {
    const matchFilter = filter === "all" || p.role === filter;
    const name = `${p.profile?.prenom} ${p.profile?.nom}`.toLowerCase();
    const matchSearch =
      !search.trim() ||
      name.includes(search.toLowerCase()) ||
      (p.wilaya || p.profile?.wilaya || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.services || []).some(s => s.toLowerCase().includes(search.toLowerCase()));
    return matchFilter && matchSearch;
  });

  // ── Call / WhatsApp ────────────────────────────────────
  const handleCall = (p: ProProfile) => {
    const phone = p.profile?.telephone;
    const name  = `${p.profile?.prenom} ${p.profile?.nom}`;
    if (!phone) { Alert.alert("Numéro introuvable"); return; }
    Alert.alert(`Appeler ${name}`, phone, [
      { text: "Annuler", style: "cancel" },
      { text: "📞 Appeler", onPress: () => Linking.openURL(`tel:${phone}`) },
    ]);
  };

  const handleWhatsApp = (p: ProProfile) => {
    const phone = p.profile?.telephone;
    if (!phone) { Alert.alert("Numéro introuvable"); return; }
    const cleaned = phone.replace(/\s+/g, "").replace(/^0/, "213");
    const name    = `${p.profile?.prenom} ${p.profile?.nom}`;
    const msg     = encodeURIComponent(`Bonjour ${name}, je vous contacte via FermeConnect.`);
    Linking.openURL(`https://wa.me/${cleaned}?text=${msg}`).catch(() =>
      Alert.alert("Erreur", "WhatsApp non installé.")
    );
  };

  const roleColor = (role: string) => role === "veterinaire" ? "#0891b2" : "#7c3aed";
  const roleLabel = (role: string) => role === "veterinaire" ? "🐾 Vétérinaire" : "🔬 Ingénieur Agricole";

  // ─────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.headerBg }}>

      <ScrollView
        style={{ flex: 1, backgroundColor: theme.bg }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#16a34a"]} />}
      >
        {/* ── HEADER ── */}
        <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
          <Text style={styles.headerTitle}>🤝 Services</Text>
          <Text style={styles.headerSub}>Vétérinaires & Ingénieurs Agricoles</Text>

          {/* Pro users: button to manage their profile */}
          {isPro && (
            <TouchableOpacity
              style={styles.manageBtn}
              onPress={() => router.push("/screens/profilpro")}
              activeOpacity={0.85}
            >
              <User width={16} height={16} color="#fff" />
              <Text style={styles.manageBtnText}>
                {user.role === "veterinaire" ? "Mon profil vétérinaire" : "Mon profil ingénieur"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ padding: 16, gap: 12 }}>

          {/* ── SEARCH ── */}
          <View style={[styles.searchRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Search width={18} height={18} color={theme.muted} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Rechercher par nom, wilaya, service..."
              placeholderTextColor={theme.muted}
              value={search} onChangeText={setSearch}
            />
          </View>

          {/* ── FILTER CHIPS ── */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            {([
              { key: "all",         label: "Tous",                  emoji: "👥" },
              { key: "veterinaire", label: "Vétérinaires",          emoji: "🐾" },
              { key: "ingenieur",   label: "Ingénieurs Agricoles",  emoji: "🔬" },
            ] as { key: FilterType; label: string; emoji: string }[]).map(f => {
              const active = filter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.filterChip, {
                    backgroundColor: active ? "#16a34a" : theme.card,
                    borderColor:     active ? "#16a34a" : theme.border,
                  }]}
                  onPress={() => setFilter(f.key)} activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 14 }}>{f.emoji}</Text>
                  <Text style={[styles.filterText, { color: active ? "#fff" : theme.muted }]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── COUNT ── */}
          <Text style={{ fontSize: 13, color: theme.muted }}>
            {filtered.length} professionnel{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}
          </Text>

          {/* ── LIST ── */}
          {loading ? (
            <ActivityIndicator color="#16a34a" size="large" style={{ marginTop: 40 }} />
          ) : filtered.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🔍</Text>
              <Text style={{ fontSize: 16, fontWeight: "700", color: theme.text, marginBottom: 4 }}>
                Aucun professionnel trouvé
              </Text>
              <Text style={{ fontSize: 13, color: theme.muted, textAlign: "center" }}>
                {isPro ? "Créez votre profil pour apparaître ici" : "Modifiez vos filtres"}
              </Text>
              {isPro && (
                <TouchableOpacity
                  style={[styles.emptyBtn, { backgroundColor: roleColor(user!.role) }]}
                  onPress={() => router.push("/screens/profilpro")}
                  activeOpacity={0.85}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Créer mon profil</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={{ gap: 14 }}>
              {filtered.map(pro => {
                const name    = `${pro.profile?.prenom} ${pro.profile?.nom}`;
                const wilaya  = pro.wilaya || pro.profile?.wilaya || "";
                const rating  = pro.profile?.average_rating || 0;
                const rCount  = pro.profile?.rating_count || 0;
                const photo   = pro.photo_url || pro.profile?.photo_url;
                const color   = roleColor(pro.role);
                const isOpen  = expanded === pro.id;

                return (
                  <View key={pro.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>

                    {/* Card header */}
                    <TouchableOpacity
                      style={styles.cardHeader}
                      onPress={() => setExpanded(isOpen ? null : pro.id)}
                      activeOpacity={0.8}
                    >
                      {/* Avatar */}
                      <View style={[styles.avatar, { borderColor: color, backgroundColor: color + "15" }]}>
                        {photo
                          ? <Image source={{ uri: photo }} style={styles.avatarImg} />
                          : <User width={30} height={30} color={color} />
                        }
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={[styles.cardName, { color: theme.text }]}>{name}</Text>
                        <View style={[styles.rolePill, { backgroundColor: color + "15" }]}>
                          <Text style={{ fontSize: 11, fontWeight: "700", color }}>{roleLabel(pro.role)}</Text>
                        </View>

                        {/* Rating */}
                        {rating > 0 && (
                          <View style={styles.ratingRow}>
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} width={12} height={12}
                                color="#f59e0b" fill={s <= Math.round(rating) ? "#f59e0b" : "transparent"} />
                            ))}
                            <Text style={{ fontSize: 11, color: theme.muted, marginLeft: 4 }}>
                              {rating.toFixed(1)} ({rCount})
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Location + experience */}
                      <View style={{ alignItems: "flex-end", gap: 4 }}>
                        {wilaya && (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                            <MapPin width={11} height={11} color={theme.muted} />
                            <Text style={{ fontSize: 11, color: theme.muted }}>{wilaya}</Text>
                          </View>
                        )}
                        {pro.experience && (
                          <Text style={{ fontSize: 11, color: color, fontWeight: "600" }}>
                            {pro.experience}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>

                    {/* Expanded details */}
                    {isOpen && (
                      <View style={[styles.cardBody, { borderTopColor: theme.divider }]}>

                        {/* Bio */}
                        {pro.bio && (
                          <Text style={{ fontSize: 13, color: theme.text, lineHeight: 20, marginBottom: 10 }}>
                            {pro.bio}
                          </Text>
                        )}

                        {/* Services */}
                        {pro.services?.length > 0 && (
                          <View style={{ marginBottom: 10 }}>
                            <Text style={[styles.detailLabel, { color: theme.muted }]}>Services</Text>
                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                              {pro.services.map(s => (
                                <View key={s} style={[styles.serviceTag, { backgroundColor: color + "15", borderColor: color + "40" }]}>
                                  <Text style={{ fontSize: 11, color, fontWeight: "600" }}>{s}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}

                        {/* Price */}
                        {pro.price && (
                          <View style={styles.detailRow}>
                            <DollarSign width={14} height={14} color={color} />
                            <Text style={{ fontSize: 13, color: theme.text, fontWeight: "600" }}>
                              {pro.price.toLocaleString()} {pro.price_label || "DA"}
                            </Text>
                          </View>
                        )}

                        {/* Office */}
                        {pro.office_address && (
                          <View style={styles.detailRow}>
                            <Briefcase width={14} height={14} color={theme.muted} />
                            <Text style={{ fontSize: 13, color: theme.text }}>{pro.office_address}</Text>
                          </View>
                        )}

                        {/* Work days & hours */}
                        {pro.work_days && pro.work_days.length > 0 && (
                          <View style={styles.detailRow}>
                            <Clock width={14} height={14} color={theme.muted} />
                            <Text style={{ fontSize: 13, color: theme.text }}>
                              {pro.work_days.join(", ")}
                              {pro.work_hours && ` · ${pro.work_hours.replace("-", " → ")}`}
                            </Text>
                          </View>
                        )}

                        {/* Action buttons */}
                        <View style={styles.cardActions}>
                          <TouchableOpacity
                            style={[styles.btnCall, { backgroundColor: color }]}
                            onPress={() => handleCall(pro)} activeOpacity={0.85}
                          >
                            <Phone width={15} height={15} color="#fff" />
                            <Text style={styles.btnCallText}>Appeler</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.btnWhatsapp}
                            onPress={() => handleWhatsApp(pro)} activeOpacity={0.85}
                          >
                            <MessageCircle width={15} height={15} color="#fff" />
                            <Text style={styles.btnCallText}>WhatsApp</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24, gap: 6 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#fff" },
  headerSub:   { fontSize: 13, color: "#dcfce7" },
  manageBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    alignSelf: "flex-start", marginTop: 8,
  },
  manageBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  searchRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  searchInput: { flex: 1, fontSize: 15 },
  filterChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 999, borderWidth: 1, flex: 1, justifyContent: "center",
  },
  filterText: { fontSize: 11, fontWeight: "700" },
  card: {
    borderRadius: 20, borderWidth: 1,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    overflow: "hidden",
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  avatar: {
    width: 60, height: 60, borderRadius: 30, borderWidth: 2,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  avatarImg:  { width: 60, height: 60 },
  cardName:   { fontSize: 15, fontWeight: "800", marginBottom: 4 },
  rolePill:   { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, alignSelf: "flex-start" },
  ratingRow:  { flexDirection: "row", alignItems: "center", marginTop: 4 },
  cardBody:   { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 12, borderTopWidth: 1, gap: 6 },
  detailLabel:{ fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  detailRow:  { flexDirection: "row", alignItems: "center", gap: 8 },
  serviceTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  cardActions:{ flexDirection: "row", gap: 8, marginTop: 8 },
  btnCall: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, borderRadius: 12,
  },
  btnWhatsapp: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: "#25D366",
  },
  btnCallText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  emptyBox: { alignItems: "center", paddingVertical: 60, gap: 4 },
  emptyBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
});
