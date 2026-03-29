// app/(tabs)/profile.tsx
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  Bell,
  BellOff,
  Camera,
  ChevronRight,
  Eye,
  EyeOff,
  Info,
  Lock,
  LogOut,
  MapPin,
  MessageCircle,
  Moon,
  Phone,
  Send,
  Star,
  Sun,
  Trash2,
  User,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../components/lib/supabase";
import { useAuth } from "../../src/authcontext";
import { useTheme } from "../../src/themecontext";

// ─── Types ────────────────────────────────────────────────
interface Feedback {
  id: string;
  comment: string;
  stars: number;
  created_at: string;
  author: { nom: string; prenom: string; photo_url?: string };
}

interface Notif {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

// ─── Star Rating ─────────────────────────────────────────
function StarRating({
  value, onChange, size = 28, readonly = false,
}: {
  value: number; onChange?: (v: number) => void; size?: number; readonly?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <TouchableOpacity key={s} disabled={readonly} onPress={() => onChange?.(s)} activeOpacity={0.7}>
          <Star width={size} height={size} color="#f59e0b" fill={s <= value ? "#f59e0b" : "transparent"} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Section Header ───────────────────────────────────────
function SectionTitle({ title, theme }: { title: string; theme: any }) {
  return (
    <Text style={{
      fontSize: 11, fontWeight: "800", letterSpacing: 1.2,
      textTransform: "uppercase", color: theme.muted,
      paddingHorizontal: 4, marginTop: 8, marginBottom: 2,
    }}>
      {title}
    </Text>
  );
}

// ─── Menu Row ─────────────────────────────────────────────
function MenuRow({
  icon, label, subtitle, onPress, right, theme, danger = false,
}: {
  icon: React.ReactNode; label: string; subtitle?: string;
  onPress?: () => void; right?: React.ReactNode; theme: any; danger?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[mStyles.row, { borderBottomColor: theme.divider }]}
      onPress={onPress} activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[mStyles.iconBox, { backgroundColor: danger ? "#fee2e2" : "#dcfce7" }]}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[mStyles.rowLabel, { color: danger ? "#ef4444" : theme.text }]}>{label}</Text>
        {subtitle && <Text style={[mStyles.rowSub, { color: theme.muted }]}>{subtitle}</Text>}
      </View>
      {right ?? (onPress && <ChevronRight width={16} height={16} color={theme.muted} />)}
    </TouchableOpacity>
  );
}

const mStyles = StyleSheet.create({
  row: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingVertical: 14, borderBottomWidth: 1,
  },
  iconBox: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
  },
  rowLabel: { fontSize: 15, fontWeight: "600" },
  rowSub: { fontSize: 12, marginTop: 1 },
});

// ─── Card wrapper ─────────────────────────────────────────
function Card({ children, theme, style }: { children: React.ReactNode; theme: any; style?: any }) {
  return (
    <View style={[{
      backgroundColor: theme.card, borderRadius: 20,
      paddingHorizontal: 16, borderWidth: 1, borderColor: theme.border,
      shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.dark ? 0 : 0.06, shadowRadius: 8, elevation: 2,
      overflow: "hidden",
    }, style]}>
      {children}
    </View>
  );
}

// ═════════════════════════════════════════════════════════
// MAIN SCREEN
// ═════════════════════════════════════════════════════════
export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();

  // Stats
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);

  // Notifications
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifModal, setNotifModal] = useState(false);

  // Modals
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [myStars, setMyStars] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [pwModal, setPwModal] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  // Photo
  const [photoLoading, setPhotoLoading] = useState(false);

  // Animated bell shake
  const bellShake = useRef(new Animated.Value(0)).current;

  const shakeBell = () => {
    Animated.sequence([
      Animated.timing(bellShake, { toValue: 8, duration: 80, useNativeDriver: true }),
      Animated.timing(bellShake, { toValue: -8, duration: 80, useNativeDriver: true }),
      Animated.timing(bellShake, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(bellShake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  // ── Fetch feedbacks + rating ──────────────────────────
  const fetchFeedbacks = useCallback(async () => {
    if (!user?.id) return;
    setLoadingFeedbacks(true);
    try {
      const { data: pd } = await supabase
        .from("profiles").select("average_rating, rating_count")
        .eq("id", user.id).single();
      if (pd) { setAverageRating(pd.average_rating ?? 0); setRatingCount(pd.rating_count ?? 0); }

      const { data: fd } = await supabase
        .from("feedbacks")
        .select("id, comment, stars, created_at, author:author_id(nom, prenom, photo_url)")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false }).limit(20);
      if (fd) setFeedbacks(fd as any);
    } finally { setLoadingFeedbacks(false); }
  }, [user?.id]);

  // ── Fetch notifications ───────────────────────────────
  const fetchNotifs = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    if (data) {
      setNotifs(data);
      const unread = data.filter((n) => !n.read).length;
      setUnreadCount(unread);
      if (unread > 0) shakeBell();
    }
  }, [user?.id]);

  useEffect(() => {
    fetchFeedbacks();
    fetchNotifs();

    // Real-time notifications via Supabase channel
    if (!user?.id) return;
    const channel = supabase
      .channel(`notifs_${user.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifs((prev) => [payload.new as Notif, ...prev]);
        setUnreadCount((c) => c + 1);
        shakeBell();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchFeedbacks, fetchNotifs, user?.id]);

  // ── Mark all notifications as read ───────────────────
  const markAllRead = async () => {
    if (!user?.id) return;
    await supabase.from("notifications").update({ read: true })
      .eq("user_id", user.id).eq("read", false);
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  // ── Delete notification ───────────────────────────────
  const deleteNotif = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  };

  // ── Change profile photo ──────────────────────────────
  const handleChangePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission refusée"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });
    if (result.canceled) return;
    setPhotoLoading(true);
    try {
      const uri = result.assets[0].uri;
      const ext = uri.split(".").pop() || "jpg";
      const fileName = `avatar_${user!.id}_${Date.now()}.${ext}`;
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();
      const { error: upErr } = await supabase.storage
        .from("avatars").upload(fileName, arrayBuffer, { contentType: `image/${ext}`, upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
      await supabase.from("profiles").update({ photo_url: urlData.publicUrl }).eq("id", user!.id);
      Alert.alert("Succès", "Photo mise à jour ! Reconnectez-vous pour voir les changements.");
    } catch (e: any) {
      Alert.alert("Erreur", e.message || "Impossible de mettre à jour la photo.");
    } finally { setPhotoLoading(false); }
  };

  // ── Submit feedback ───────────────────────────────────
  const handleSubmitFeedback = async () => {
    if (myStars === 0) { Alert.alert("Note requise", "Choisissez une note."); return; }
    if (!myComment.trim()) { Alert.alert("Commentaire requis"); return; }
    setSubmitting(true);
    try {
      const { data: sd } = await supabase.auth.getSession();
      const authorId = sd.session?.user?.id;
      if (!authorId) throw new Error("Non connecté");
      if (authorId === user?.id) { Alert.alert("Impossible", "Vous ne pouvez pas vous noter vous-même."); return; }

      const { error } = await supabase.from("feedbacks").insert({
        profile_id: user!.id, author_id: authorId,
        comment: myComment.trim(), stars: myStars,
      });
      if (error) throw error;

      // Recalculate average
      const { data: all } = await supabase.from("feedbacks").select("stars").eq("profile_id", user!.id);
      if (all?.length) {
        const avg = all.reduce((s, r) => s + r.stars, 0) / all.length;
        await supabase.from("profiles")
          .update({ average_rating: avg, rating_count: all.length }).eq("id", user!.id);
      }

      // Notify the profile owner
      await supabase.from("notifications").insert({
        user_id: user!.id, type: "rating",
        title: "Nouvel avis reçu ⭐",
        body: `Quelqu'un vous a laissé un avis ${myStars} étoile${myStars > 1 ? "s" : ""}.`,
      });

      setMyStars(0); setMyComment(""); setFeedbackModal(false);
      fetchFeedbacks();
      Alert.alert("Merci !", "Votre avis a été envoyé.");
    } catch (e: any) {
      Alert.alert("Erreur", e.message || "Impossible d'envoyer l'avis.");
    } finally { setSubmitting(false); }
  };

  // ── Change password ───────────────────────────────────
  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) { Alert.alert("Champs requis"); return; }
    if (newPw !== confirmPw) { Alert.alert("Erreur", "Les mots de passe ne correspondent pas."); return; }
    if (newPw.length < 6) { Alert.alert("Erreur", "Minimum 6 caractères."); return; }
    setPwLoading(true);
    try {
      const { data: sd } = await supabase.auth.getSession();
      const email = sd.session?.user?.email;
      if (!email) throw new Error("Session introuvable");
      const { error: siErr } = await supabase.auth.signInWithPassword({ email, password: currentPw });
      if (siErr) { Alert.alert("Erreur", "Mot de passe actuel incorrect."); return; }
      const { error: upErr } = await supabase.auth.updateUser({ password: newPw });
      if (upErr) throw upErr;
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setPwModal(false);
      Alert.alert("Succès !", "Mot de passe modifié.");
    } catch (e: any) {
      Alert.alert("Erreur", e.message);
    } finally { setPwLoading(false); }
  };

  // ── WhatsApp ──────────────────────────────────────────
  const handleWhatsApp = () => {
    if (!user?.phone) { Alert.alert("Numéro introuvable"); return; }
    const cleaned = user.phone.replace(/\s+/g, "").replace(/^0/, "213");
    Linking.openURL(`https://wa.me/${cleaned}`).catch(() =>
      Alert.alert("Erreur", "WhatsApp n'est pas installé.")
    );
  };

  // ── Logout ────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert("Déconnexion", "Êtes-vous sûr ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Déconnexion", style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/screens/loginscreen");
        },
      },
    ]);
  };

  // ── Role badge ────────────────────────────────────────
  const getRoleBadge = () => {
    switch (user?.role) {
      case "agriculteur": return { bg: "#dcfce7", text: "#16a34a", label: "🌾 Agriculteur" };
      case "admin":       return { bg: "#ede9fe", text: "#7c3aed", label: "⚙️ Admin" };
      case "utilisateur": return { bg: "#dbeafe", text: "#2563eb", label: "🛒 Utilisateur" };
      default:            return { bg: "#f3f4f6", text: "#6b7280", label: user?.role ?? "" };
    }
  };
  const roleBadge = getRoleBadge();

  const fmt = (d?: string) => d
    ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
    : "N/A";

  const notifIcon = (type: string) => {
    switch (type) {
      case "rating":   return "⭐";
      case "view":     return "👁️";
      case "feedback": return "💬";
      case "message":  return "📩";
      default:         return "🔔";
    }
  };

  // ═════════════════════════════════════════════════════
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.headerBg }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.bg }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ══ HEADER ══ */}
        <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
          {/* Notification bell */}
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => { setNotifModal(true); markAllRead(); }}
            activeOpacity={0.8}
          >
            <Animated.View style={{ transform: [{ rotate: bellShake.interpolate({ inputRange: [-10, 10], outputRange: ["-10deg", "10deg"] }) }] }}>
              <Bell width={22} height={22} color="#fff" />
            </Animated.View>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Avatar */}
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={handleChangePhoto}
            activeOpacity={0.85}
            disabled={photoLoading}
          >
            <View style={styles.avatar}>
              {user?.profile_image ? (
                <Image source={{ uri: user.profile_image }} style={styles.avatarImg} />
              ) : (
                <User width={40} height={40} color="rgba(255,255,255,0.9)" />
              )}
              {photoLoading && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color="#fff" />
                </View>
              )}
            </View>
            <View style={styles.cameraBtn}>
              <Camera width={14} height={14} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Name + role */}
          <Text style={styles.userName}>{user?.name || "Utilisateur"}</Text>
          <View style={[styles.roleBadge, { backgroundColor: roleBadge.bg }]}>
            <Text style={[styles.roleBadgeText, { color: roleBadge.text }]}>{roleBadge.label}</Text>
          </View>

          {/* Stars */}
          <View style={styles.starsRow}>
            <StarRating value={Math.round(averageRating)} readonly size={18} />
            <Text style={styles.starsText}>
              {averageRating.toFixed(1)} · {ratingCount} avis
            </Text>
          </View>

          {/* Location */}
          {user?.location && (
            <View style={styles.locationRow}>
              <MapPin width={13} height={13} color="rgba(255,255,255,0.7)" />
              <Text style={styles.locationText}>{user.location}</Text>
            </View>
          )}
        </View>

        {/* ══ CONTENT ══ */}
        <View style={styles.content}>

          {/* ── CONTACT ── */}
          <SectionTitle title="Contact" theme={theme} />
          <Card theme={theme}>
            <MenuRow
              icon={<Phone width={18} height={18} color="#16a34a" />}
              label={user?.phone || "Non renseigné"}
              subtitle="Téléphone"
              theme={theme}
            />
            <MenuRow
              icon={<MessageCircle width={18} height={18} color="#25D366" />}
              label="Contacter via WhatsApp"
              onPress={handleWhatsApp}
              theme={theme}
            />
          </Card>

          {/* ── AVIS ── */}
          <SectionTitle title="Avis & Notes" theme={theme} />
          <Card theme={theme} style={{ paddingBottom: 4 }}>
            <MenuRow
              icon={<Star width={18} height={18} color="#f59e0b" />}
              label="Laisser un avis"
              subtitle="Notez cet utilisateur (0–5 étoiles)"
              onPress={() => setFeedbackModal(true)}
              theme={theme}
            />
          </Card>

          {/* Feedback list */}
          {loadingFeedbacks ? (
            <ActivityIndicator color="#16a34a" style={{ margin: 16 }} />
          ) : feedbacks.length > 0 ? (
            <View style={{ gap: 8 }}>
              {feedbacks.map((fb) => (
                <Card key={fb.id} theme={theme} style={{ padding: 14 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View style={[styles.fbAvatar, { backgroundColor: theme.bg }]}>
                        {fb.author?.photo_url
                          ? <Image source={{ uri: fb.author.photo_url }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                          : <Text style={{ color: "#16a34a", fontWeight: "700" }}>{fb.author?.prenom?.[0] || "?"}</Text>
                        }
                      </View>
                      <View>
                        <Text style={{ fontWeight: "700", fontSize: 13, color: theme.text }}>
                          {fb.author?.prenom} {fb.author?.nom}
                        </Text>
                        <Text style={{ fontSize: 11, color: theme.muted }}>{fmt(fb.created_at)}</Text>
                      </View>
                    </View>
                    <StarRating value={fb.stars} readonly size={14} />
                  </View>
                  <Text style={{ fontSize: 13, color: theme.text, lineHeight: 20 }}>{fb.comment}</Text>
                </Card>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={{ fontSize: 13, color: theme.muted }}>Aucun avis pour le moment</Text>
            </View>
          )}

          {/* ── PARAMÈTRES ── */}
          <SectionTitle title="Paramètres" theme={theme} />
          <Card theme={theme}>
            <MenuRow
              icon={isDark
                ? <Moon width={18} height={18} color="#16a34a" />
                : <Sun width={18} height={18} color="#16a34a" />
              }
              label="Mode sombre"
              subtitle={isDark ? "Thème sombre activé" : "Thème clair activé"}
              theme={theme}
              right={
                <Switch
                  value={isDark} onValueChange={toggleTheme}
                  trackColor={{ false: "#e5e7eb", true: "#86efac" }}
                  thumbColor={isDark ? "#16a34a" : "#f9fafb"}
                />
              }
            />
            <MenuRow
              icon={<Lock width={18} height={18} color="#16a34a" />}
              label="Changer le mot de passe"
              onPress={() => setPwModal(true)}
              theme={theme}
            />
            <MenuRow
              icon={<Info width={18} height={18} color="#16a34a" />}
              label="À propos de FermeConnect"
              subtitle="Version 1.0.0 — © 2026"
              onPress={() => Alert.alert(
                "FermeConnect",
                "Version 1.0.0\n\nPlateforme agricole algérienne connectant agriculteurs, acheteurs et prestataires.\n\n© 2026 FermeConnect. Tous droits réservés.",
                [{ text: "Fermer" }]
              )}
              theme={theme}
            />
          </Card>

          {/* ── DÉCONNEXION ── */}
          <SectionTitle title="Compte" theme={theme} />
          <Card theme={theme}>
            <MenuRow
              icon={<LogOut width={18} height={18} color="#ef4444" />}
              label="Déconnexion"
              subtitle="Quitter votre session"
              onPress={handleLogout}
              theme={theme}
              danger
            />
          </Card>
        </View>
      </ScrollView>

      {/* ══ NOTIFICATIONS MODAL ══ */}
      <Modal visible={notifModal} transparent animationType="slide" onRequestClose={() => setNotifModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </Text>
              <TouchableOpacity onPress={() => setNotifModal(false)}>
                <X width={22} height={22} color={theme.muted} />
              </TouchableOpacity>
            </View>

            {notifs.length === 0 ? (
              <View style={{ padding: 40, alignItems: "center" }}>
                <BellOff width={40} height={40} color={theme.muted} />
                <Text style={{ color: theme.muted, marginTop: 12, fontSize: 14 }}>
                  Aucune notification
                </Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 420 }}>
                {notifs.map((n) => (
                  <View
                    key={n.id}
                    style={[styles.notifRow, {
                      backgroundColor: n.read ? "transparent" : (isDark ? "#1e3a2f" : "#f0fdf4"),
                      borderBottomColor: theme.divider,
                    }]}
                  >
                    <Text style={{ fontSize: 24 }}>{notifIcon(n.type)}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "700", fontSize: 13, color: theme.text }}>{n.title}</Text>
                      <Text style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>{n.body}</Text>
                      <Text style={{ fontSize: 11, color: theme.muted, marginTop: 4 }}>{fmt(n.created_at)}</Text>
                    </View>
                    <TouchableOpacity onPress={() => deleteNotif(n.id)} activeOpacity={0.7}>
                      <Trash2 width={16} height={16} color={theme.muted} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ══ FEEDBACK MODAL ══ */}
      <Modal visible={feedbackModal} transparent animationType="slide" onRequestClose={() => setFeedbackModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Laisser un avis</Text>
              <TouchableOpacity onPress={() => setFeedbackModal(false)}>
                <X width={22} height={22} color={theme.muted} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 20, gap: 16 }}>
              <View>
                <Text style={[styles.fieldLabel, { color: theme.muted }]}>Note</Text>
                <StarRating value={myStars} onChange={setMyStars} size={40} />
              </View>
              <View>
                <Text style={[styles.fieldLabel, { color: theme.muted }]}>Commentaire</Text>
                <TextInput
                  style={[styles.textArea, { borderColor: theme.border, color: theme.text, backgroundColor: theme.inputBg }]}
                  placeholder="Partagez votre expérience..."
                  placeholderTextColor={theme.muted}
                  multiline numberOfLines={4}
                  value={myComment} onChangeText={setMyComment}
                />
              </View>
              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                onPress={handleSubmitFeedback} disabled={submitting} activeOpacity={0.85}
              >
                {submitting ? <ActivityIndicator color="#fff" /> : (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Send width={18} height={18} color="#fff" />
                    <Text style={styles.submitText}>Envoyer</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══ CHANGE PASSWORD MODAL ══ */}
      <Modal visible={pwModal} transparent animationType="slide" onRequestClose={() => setPwModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Changer le mot de passe</Text>
              <TouchableOpacity onPress={() => setPwModal(false)}>
                <X width={22} height={22} color={theme.muted} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 20, gap: 14 }}>
              {[
                { label: "Mot de passe actuel", val: currentPw, set: setCurrentPw, show: showCurrent, toggle: () => setShowCurrent(v => !v) },
                { label: "Nouveau mot de passe", val: newPw,     set: setNewPw,     show: showNew,     toggle: () => setShowNew(v => !v) },
                { label: "Confirmer",            val: confirmPw, set: setConfirmPw, show: showNew,     toggle: () => setShowNew(v => !v) },
              ].map(({ label, val, set, show, toggle }) => (
                <View key={label}>
                  <Text style={[styles.fieldLabel, { color: theme.muted }]}>{label}</Text>
                  <View style={[styles.pwRow, { borderColor: theme.border, backgroundColor: theme.inputBg }]}>
                    <TextInput
                      style={[{ flex: 1, fontSize: 15, color: theme.text }]}
                      secureTextEntry={!show}
                      placeholder="••••••••" placeholderTextColor={theme.muted}
                      value={val} onChangeText={set}
                    />
                    <TouchableOpacity onPress={toggle}>
                      {show
                        ? <EyeOff width={18} height={18} color={theme.muted} />
                        : <Eye width={18} height={18} color={theme.muted} />
                      }
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={[styles.submitBtn, pwLoading && { opacity: 0.7 }]}
                onPress={handleChangePassword} disabled={pwLoading} activeOpacity={0.85}
              >
                {pwLoading ? <ActivityIndicator color="#fff" /> : (
                  <Text style={styles.submitText}>Modifier le mot de passe</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    paddingTop: 20, paddingBottom: 36,
    alignItems: "center", gap: 8, paddingHorizontal: 24, position: "relative",
  },
  bellBtn: {
    position: "absolute", top: 20, right: 20,
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  badge: {
    position: "absolute", top: -4, right: -4,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: "#ef4444", alignItems: "center", justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  avatarWrapper: { marginTop: 8, position: "relative" },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 3, borderColor: "rgba(255,255,255,0.5)",
    overflow: "hidden",
  },
  avatarImg: { width: 96, height: 96 },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center", justifyContent: "center",
  },
  cameraBtn: {
    position: "absolute", bottom: 2, right: 2,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#16a34a", alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#fff",
  },
  userName: { fontSize: 22, fontWeight: "800", color: "#fff", marginTop: 4 },
  roleBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 999 },
  roleBadgeText: { fontSize: 12, fontWeight: "700" },
  starsRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  starsText: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "600" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  locationText: { color: "rgba(255,255,255,0.7)", fontSize: 12 },

  content: { paddingHorizontal: 16, paddingTop: 12, gap: 8 },

  fbAvatar: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  emptyBox: {
    borderRadius: 16, borderWidth: 1, padding: 20, alignItems: "center",
  },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalBox: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 40, overflow: "hidden" },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 20, borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },

  notifRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 14,
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1,
  },

  fieldLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  textArea: {
    borderWidth: 1, borderRadius: 14, padding: 14,
    fontSize: 14, minHeight: 100, textAlignVertical: "top",
  },
  pwRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
  },
  submitBtn: {
    backgroundColor: "#16a34a", borderRadius: 14, paddingVertical: 15,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#16a34a", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
