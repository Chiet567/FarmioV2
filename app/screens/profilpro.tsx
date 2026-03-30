// app/screens/profilpro.tsx
// Professional profile setup for veterinaire & ingenieur
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  ArrowLeft, Briefcase, Camera, Check, ChevronDown,
  Clock, DollarSign, MapPin, Plus, Save, Trash2, User, X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Image, Modal, SafeAreaView,
  ScrollView, StyleSheet, Switch, Text, TextInput,
  TouchableOpacity, View,
} from "react-native";
import { supabase } from "../../components/lib/supabase";
import { useAuth } from "../../src/authcontext";
import { useTheme } from "../../src/themecontext";

// ─── Constants ────────────────────────────────────────────
const VET_SERVICES = [
  "Vaccination", "Chirurgie", "Consultation générale", "Urgences",
  "Reproduction", "Analyses laboratoire", "Radiologie", "Dentisterie",
  "Nutrition animale", "Maladies infectieuses", "Dermatologie",
  "Orthopédie", "Ophtalmologie", "Visite à domicile",
];

const ING_SERVICES = [
  "Analyse du sol", "Plan de fertilisation", "Irrigation", "Semences",
  "Lutte antiparasitaire", "Agriculture biologique", "Audit agricole",
  "Formation agriculteurs", "Gestion des cultures", "Certification",
  "Arboriculture", "Maraîchage", "Céréaliculture", "Élevage intensif",
];

const EXPERIENCES = [
  "Moins d'1 an", "1-3 ans", "3-5 ans", "5-10 ans",
  "10-15 ans", "15-20 ans", "Plus de 20 ans",
];

const WORK_DAYS = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];

const WILAYAS = [
  "Adrar","Chlef","Laghouat","Oum El Bouaghi","Batna","Béjaïa","Biskra",
  "Béchar","Blida","Bouira","Tamanrasset","Tébessa","Tlemcen","Tiaret",
  "Tizi Ouzou","Alger","Djelfa","Jijel","Sétif","Saïda","Skikda",
  "Sidi Bel Abbès","Annaba","Guelma","Constantine","Médéa","Mostaganem",
  "M'Sila","Mascara","Ouargla","Oran","El Bayadh","Illizi",
  "Bordj Bou Arréridj","Boumerdès","El Tarf","Tindouf","Tissemsilt",
  "El Oued","Khenchela","Souk Ahras","Tipaza","Mila","Aïn Defla",
  "Naâma","Aïn Témouchent","Ghardaïa","Relizane",
];

// ─── Picker Modal ─────────────────────────────────────────
function PickerModal({ visible, title, options, onSelect, onClose, theme }: {
  visible: boolean; title: string;
  options: string[]; onSelect: (v: string) => void;
  onClose: () => void; theme: any;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "65%", paddingBottom: 32 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: theme.border }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text }}>{title}</Text>
            <TouchableOpacity onPress={onClose}><X width={22} height={22} color={theme.muted} /></TouchableOpacity>
          </View>
          <ScrollView>
            {options.map(opt => (
              <TouchableOpacity
                key={opt}
                style={{ paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: theme.divider }}
                onPress={() => { onSelect(opt); onClose(); }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 15, color: theme.text }}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Section ──────────────────────────────────────────────
function Section({ title, emoji, children, theme }: { title: string; emoji: string; children: React.ReactNode; theme: any }) {
  return (
    <View style={{ backgroundColor: theme.card, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: theme.border, gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text style={{ fontSize: 20 }}>{emoji}</Text>
        <Text style={{ fontSize: 16, fontWeight: "800", color: theme.text }}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

// ─── Field Label ──────────────────────────────────────────
function FieldLabel({ text, theme, required }: { text: string; theme: any; required?: boolean }) {
  return (
    <Text style={{ fontSize: 12, fontWeight: "700", color: theme.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
      {text}{required && <Text style={{ color: "#ef4444" }}> *</Text>}
    </Text>
  );
}

// ═════════════════════════════════════════════════════════
export default function ProfilProScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { theme } = useTheme();

  const isPro = user?.role === "veterinaire" || user?.role === "ingenieur";
  const isVet = user?.role === "veterinaire";
  const accentColor = isVet ? "#0891b2" : "#7c3aed";
  const services    = isVet ? VET_SERVICES : ING_SERVICES;

  // Form state
  const [bio, setBio]                 = useState("");
  const [experience, setExperience]   = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [price, setPrice]             = useState("");
  const [priceLabel, setPriceLabel]   = useState("DA/consultation");
  const [officeAddress, setOfficeAddress] = useState("");
  const [wilaya, setWilaya]           = useState(user?.location || "");
  const [workDays, setWorkDays]       = useState<string[]>([]);
  const [workHoursFrom, setWorkHoursFrom] = useState("08:00");
  const [workHoursTo, setWorkHoursTo]     = useState("17:00");
  const [isPublished, setIsPublished] = useState(false);
  const [photoUri, setPhotoUri]       = useState<string | null>(null);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(user?.profile_image || null);

  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);

  // Pickers
  const [showExp, setShowExp]       = useState(false);
  const [showWilaya, setShowWilaya] = useState(false);

  // ── Load existing profile ─────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    loadProfile();
  }, [user?.id]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("professional_profiles")
        .select("*").eq("user_id", user!.id).single();

      if (data) {
        setExistingId(data.id);
        setBio(data.bio || "");
        setExperience(data.experience || "");
        setSelectedServices(data.services || []);
        setPrice(data.price ? String(data.price) : "");
        setPriceLabel(data.price_label || "DA/consultation");
        setOfficeAddress(data.office_address || "");
        setWilaya(data.wilaya || user?.location || "");
        setWorkDays(data.work_days || []);
        if (data.work_hours) {
          const [from, to] = data.work_hours.split("-");
          setWorkHoursFrom(from || "08:00");
          setWorkHoursTo(to || "17:00");
        }
        setIsPublished(data.is_published || false);
        setCurrentPhotoUrl(data.photo_url || user?.profile_image || null);
      }
    } catch { /* no profile yet */ }
    finally { setLoading(false); }
  };

  // ── Pick photo ────────────────────────────────────────
  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission refusée"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const uploadPhoto = async (uri: string): Promise<string | null> => {
    try {
      const ext = uri.split(".").pop() || "jpg";
      const fileName = `pro_${user!.id}_${Date.now()}.${ext}`;
      const response = await fetch(uri);
      const blob = await response.blob();
      const buf = await new Response(blob).arrayBuffer();
      const { error } = await supabase.storage.from("avatars").upload(fileName, buf, { contentType: `image/${ext}`, upsert: true });
      if (error) throw error;
      return supabase.storage.from("avatars").getPublicUrl(fileName).data.publicUrl;
    } catch { return null; }
  };

  // ── Toggle service ────────────────────────────────────
  const toggleService = (s: string) => {
    setSelectedServices(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  // ── Toggle work day ───────────────────────────────────
  const toggleDay = (d: string) => {
    setWorkDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  // ── Save ──────────────────────────────────────────────
  const handleSave = async () => {
    if (selectedServices.length === 0) {
      Alert.alert("Services requis", "Sélectionnez au moins un service."); return;
    }
    setSaving(true);
    try {
      let photoUrl = currentPhotoUrl;
      if (photoUri) {
        const uploaded = await uploadPhoto(photoUri);
        if (uploaded) {
          photoUrl = uploaded;
          await supabase.from("profiles").update({ photo_url: uploaded }).eq("id", user!.id);
          await refreshUser();
        }
      }

      const payload = {
        user_id:        user!.id,
        role:           user!.role,
        bio:            bio.trim(),
        experience,
        services:       selectedServices,
        price:          price ? Number(price) : null,
        price_label:    priceLabel,
        office_address: officeAddress.trim(),
        wilaya,
        work_days:      workDays,
        work_hours:     `${workHoursFrom}-${workHoursTo}`,
        is_published:   isPublished,
        photo_url:      photoUrl,
        updated_at:     new Date().toISOString(),
      };

      if (existingId) {
        await supabase.from("professional_profiles").update(payload).eq("id", existingId);
      } else {
        const { data } = await supabase.from("professional_profiles").insert(payload).select().single();
        if (data) setExistingId(data.id);
      }

      Alert.alert("Succès !", isPublished
        ? "Votre profil est maintenant visible par les agriculteurs."
        : "Profil enregistré. Activez la publication pour être visible.");
    } catch (e: any) {
      Alert.alert("Erreur", e.message || "Impossible de sauvegarder.");
    } finally { setSaving(false); }
  };

  // ── Delete profile ────────────────────────────────────
  const handleDelete = () => {
    Alert.alert(
      "Supprimer le profil professionnel",
      "Cette action est irréversible. Votre profil ne sera plus visible.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: async () => {
          setDeleting(true);
          try {
            if (existingId) {
              await supabase.from("professional_profiles").delete().eq("id", existingId);
            }
            Alert.alert("Supprimé", "Votre profil professionnel a été supprimé.", [
              { text: "OK", onPress: () => router.back() },
            ]);
          } catch { Alert.alert("Erreur", "Impossible de supprimer."); }
          finally { setDeleting(false); }
        }},
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.headerBg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    );
  }

  const displayPhoto = photoUri || currentPhotoUrl;

  // ─────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.headerBg }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.bg }}
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── HEADER ── */}
        <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <ArrowLeft width={22} height={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>
              {isVet ? "🐾 Profil Vétérinaire" : "🔬 Profil Ingénieur Agricole"}
            </Text>
            <Text style={styles.headerSub}>
              {existingId ? "Modifier votre profil" : "Créer votre profil professionnel"}
            </Text>
          </View>
        </View>

        <View style={{ padding: 16, gap: 14 }}>

          {/* ── PHOTO + NOM ── */}
          <Section title="Identité" emoji="👤" theme={theme}>
            <View style={{ alignItems: "center", gap: 12 }}>
              <TouchableOpacity onPress={pickPhoto} activeOpacity={0.85} style={{ position: "relative" }}>
                <View style={{
                  width: 100, height: 100, borderRadius: 50,
                  backgroundColor: accentColor + "22",
                  alignItems: "center", justifyContent: "center",
                  overflow: "hidden", borderWidth: 3, borderColor: accentColor,
                }}>
                  {displayPhoto
                    ? <Image source={{ uri: displayPhoto }} style={{ width: 100, height: 100 }} />
                    : <User width={44} height={44} color={accentColor} />
                  }
                </View>
                <View style={[styles.cameraBtn, { backgroundColor: accentColor }]}>
                  <Camera width={14} height={14} color="#fff" />
                </View>
              </TouchableOpacity>

              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 18, fontWeight: "800", color: theme.text }}>{user?.name}</Text>
                <View style={[styles.rolePill, { backgroundColor: accentColor + "20" }]}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: accentColor }}>
                    {isVet ? "🐾 Vétérinaire" : "🔬 Ingénieur Agricole"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Bio */}
            <View>
              <FieldLabel text="Bio / Présentation" theme={theme} />
              <TextInput
                style={[styles.textArea, { borderColor: theme.border, color: theme.text, backgroundColor: theme.bg }]}
                placeholder="Décrivez votre parcours, vos spécialités, votre approche..."
                placeholderTextColor={theme.muted}
                multiline numberOfLines={4}
                value={bio} onChangeText={setBio}
              />
            </View>

            {/* Experience */}
            <View>
              <FieldLabel text="Années d'expérience" theme={theme} required />
              <TouchableOpacity
                style={[styles.selector, { borderColor: theme.border, backgroundColor: theme.bg }]}
                onPress={() => setShowExp(true)} activeOpacity={0.8}
              >
                <Text style={{ fontSize: 14, color: experience ? theme.text : theme.muted }}>
                  {experience || "Choisir votre expérience..."}
                </Text>
                <ChevronDown width={16} height={16} color={theme.muted} />
              </TouchableOpacity>
            </View>
          </Section>

          {/* ── SERVICES ── */}
          <Section title="Services proposés" emoji="💼" theme={theme}>
            <FieldLabel text="Sélectionnez vos services" theme={theme} required />
            <Text style={{ fontSize: 12, color: theme.muted, marginBottom: 10 }}>
              {selectedServices.length} service{selectedServices.length > 1 ? "s" : ""} sélectionné{selectedServices.length > 1 ? "s" : ""}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {services.map(s => {
                const active = selectedServices.includes(s);
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.serviceChip,
                      { borderColor: active ? accentColor : theme.border,
                        backgroundColor: active ? accentColor + "15" : theme.bg }
                    ]}
                    onPress={() => toggleService(s)} activeOpacity={0.8}
                  >
                    {active && <Check width={12} height={12} color={accentColor} />}
                    <Text style={{ fontSize: 12, fontWeight: "600", color: active ? accentColor : theme.muted }}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Section>

          {/* ── TARIF ── */}
          <Section title="Tarification" emoji="💰" theme={theme}>
            <View>
              <FieldLabel text="Prix (optionnel)" theme={theme} />
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TextInput
                  style={[styles.input, { flex: 1, borderColor: theme.border, backgroundColor: theme.bg, color: theme.text }]}
                  placeholder="Ex: 2000" placeholderTextColor={theme.muted}
                  keyboardType="numeric" value={price} onChangeText={setPrice}
                />
                <TextInput
                  style={[styles.input, { flex: 1.4, borderColor: theme.border, backgroundColor: theme.bg, color: theme.text }]}
                  placeholder="DA/consultation" placeholderTextColor={theme.muted}
                  value={priceLabel} onChangeText={setPriceLabel}
                />
              </View>
            </View>
          </Section>

          {/* ── LOCALISATION ── */}
          <Section title="Localisation" emoji="📍" theme={theme}>
            <View>
              <FieldLabel text="Wilaya" theme={theme} required />
              <TouchableOpacity
                style={[styles.selector, { borderColor: theme.border, backgroundColor: theme.bg }]}
                onPress={() => setShowWilaya(true)} activeOpacity={0.8}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <MapPin width={16} height={16} color={theme.muted} />
                  <Text style={{ fontSize: 14, color: wilaya ? theme.text : theme.muted }}>
                    {wilaya || "Choisir votre wilaya..."}
                  </Text>
                </View>
                <ChevronDown width={16} height={16} color={theme.muted} />
              </TouchableOpacity>
            </View>

            <View>
              <FieldLabel text="Adresse cabinet / bureau (optionnel)" theme={theme} />
              <TextInput
                style={[styles.input, { borderColor: theme.border, backgroundColor: theme.bg, color: theme.text }]}
                placeholder="Ex: 12 Rue de la Paix, Centre-ville"
                placeholderTextColor={theme.muted}
                value={officeAddress} onChangeText={setOfficeAddress}
              />
            </View>
          </Section>

          {/* ── HORAIRES ── */}
          <Section title="Jours & Horaires" emoji="🕐" theme={theme}>
            <FieldLabel text="Jours de travail" theme={theme} />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {WORK_DAYS.map(day => {
                const active = workDays.includes(day);
                return (
                  <TouchableOpacity
                    key={day}
                    style={[styles.dayChip,
                      { borderColor: active ? accentColor : theme.border,
                        backgroundColor: active ? accentColor : theme.bg }
                    ]}
                    onPress={() => toggleDay(day)} activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "700", color: active ? "#fff" : theme.muted }}>
                      {day.substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
              <View style={{ flex: 1 }}>
                <FieldLabel text="De" theme={theme} />
                <TextInput
                  style={[styles.input, { borderColor: theme.border, backgroundColor: theme.bg, color: theme.text }]}
                  placeholder="08:00" placeholderTextColor={theme.muted}
                  value={workHoursFrom} onChangeText={setWorkHoursFrom}
                />
              </View>
              <View style={{ flex: 1 }}>
                <FieldLabel text="À" theme={theme} />
                <TextInput
                  style={[styles.input, { borderColor: theme.border, backgroundColor: theme.bg, color: theme.text }]}
                  placeholder="17:00" placeholderTextColor={theme.muted}
                  value={workHoursTo} onChangeText={setWorkHoursTo}
                />
              </View>
            </View>
          </Section>

          {/* ── PUBLICATION ── */}
          <View style={{
            flexDirection: "row", alignItems: "center", justifyContent: "space-between",
            backgroundColor: isPublished ? accentColor + "15" : theme.card,
            borderRadius: 20, padding: 18, borderWidth: 1,
            borderColor: isPublished ? accentColor : theme.border,
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: theme.text }}>
                {isPublished ? "✅ Profil publié" : "🔒 Profil non publié"}
              </Text>
              <Text style={{ fontSize: 12, color: theme.muted, marginTop: 3 }}>
                {isPublished
                  ? "Votre profil est visible par les agriculteurs"
                  : "Activez pour être visible dans les services"}
              </Text>
            </View>
            <Switch
              value={isPublished} onValueChange={setIsPublished}
              trackColor={{ false: "#e5e7eb", true: accentColor + "99" }}
              thumbColor={isPublished ? accentColor : "#f9fafb"}
            />
          </View>

          {/* ── SAVE BUTTON ── */}
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: accentColor }, saving && { opacity: 0.7 }]}
            onPress={handleSave} disabled={saving} activeOpacity={0.85}
          >
            {saving ? <ActivityIndicator color="#fff" /> : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Save width={20} height={20} color="#fff" />
                <Text style={styles.saveBtnText}>Enregistrer le profil</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* ── DELETE BUTTON ── */}
          {existingId && (
            <TouchableOpacity
              style={[styles.deleteBtn, { borderColor: "#fee2e2" }, deleting && { opacity: 0.7 }]}
              onPress={handleDelete} disabled={deleting} activeOpacity={0.85}
            >
              {deleting ? <ActivityIndicator color="#ef4444" /> : (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Trash2 width={18} height={18} color="#ef4444" />
                  <Text style={styles.deleteBtnText}>Supprimer le profil professionnel</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Pickers */}
      <PickerModal
        visible={showExp} title="Années d'expérience"
        options={EXPERIENCES} onSelect={setExperience}
        onClose={() => setShowExp(false)} theme={theme}
      />
      <PickerModal
        visible={showWilaya} title="Choisir une wilaya"
        options={WILAYAS} onSelect={setWilaya}
        onClose={() => setShowWilaya(false)} theme={theme}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  headerSub:   { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  cameraBtn: {
    position: "absolute", bottom: 2, right: 2,
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#fff",
  },
  rolePill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, marginTop: 4 },
  selector: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
  },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  textArea: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, minHeight: 90, textAlignVertical: "top",
  },
  serviceChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1.5,
  },
  dayChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5,
  },
  saveBtn: {
    borderRadius: 16, paddingVertical: 16, alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  saveBtnText:   { color: "#fff", fontSize: 16, fontWeight: "700" },
  deleteBtn: {
    backgroundColor: "#fff", borderRadius: 16, paddingVertical: 14,
    alignItems: "center", borderWidth: 1,
  },
  deleteBtnText: { color: "#ef4444", fontSize: 14, fontWeight: "700" },
});
