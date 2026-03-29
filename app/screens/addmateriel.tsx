// app/screens/addmateriel.tsx
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ArrowLeft, Camera, Check, ChevronDown } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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

// ─── Constants ────────────────────────────────────────────
const CATEGORIES = [
  { label: "Tracteur",          emoji: "🚜" },
  { label: "Charrue",           emoji: "🪚" },
  { label: "Herse",             emoji: "⚙️" },
  { label: "Semoir",            emoji: "🌱" },
  { label: "Pulvérisateur",     emoji: "🧴" },
  { label: "Remorque agricole", emoji: "🚛" },
  { label: "Pièces détachées",  emoji: "🔧" },
];

const TYPES = [
  { label: "Location",         value: "location",  emoji: "🔑" },
  { label: "Vente",            value: "vente",     emoji: "💰" },
  { label: "Location & Vente", value: "les deux",  emoji: "🔑💰" },
];

const UNITES = [
  { label: "À l'heure",       value: "heure" },
  { label: "Demi-journée",    value: "demi-journée" },
  { label: "Par jour",        value: "jour" },
  { label: "Au choix",        value: "au choix" },
];

const WILAYAS = [
  "Adrar","Chlef","Laghouat","Oum El Bouaghi","Batna","Béjaïa","Biskra",
  "Béchar","Blida","Bouira","Tamanrasset","Tébessa","Tlemcen","Tiaret",
  "Tizi Ouzou","Alger","Djelfa","Jijel","Sétif","Saïda","Skikda",
  "Sidi Bel Abbès","Annaba","Guelma","Constantine","Médéa","Mostaganem",
  "M'Sila","Mascara","Ouargla","Oran","El Bayadh","Illizi","Bordj Bou Arréridj",
  "Boumerdès","El Tarf","Tindouf","Tissemsilt","El Oued","Khenchela",
  "Souk Ahras","Tipaza","Mila","Aïn Defla","Naâma","Aïn Témouchent",
  "Ghardaïa","Relizane","Timimoun","Bordj Badji Mokhtar","Ouled Djellal",
  "Béni Abbès","In Salah","In Guezzam","Touggourt","Djanet","El M'Ghair","El Meniaa",
];

// ─── Picker Modal ─────────────────────────────────────────
function PickerModal({
  visible,
  options,
  onSelect,
  onClose,
  theme,
  title = "Choisir",
}: {
  visible: boolean;
  options: { label: string; value?: string; emoji?: string }[];
  onSelect: (val: string) => void;
  onClose: () => void;
  theme: any;
  title?: string;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={pickerStyles.overlay}>
        <View style={[pickerStyles.box, { backgroundColor: theme.card }]}>
          <View style={[pickerStyles.header, { borderBottomColor: theme.border }]}>
            <Text style={[pickerStyles.title, { color: theme.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: "#16a34a", fontWeight: "700", fontSize: 15 }}>Fermer</Text>
            </TouchableOpacity>
          </View>
          <ScrollView>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt.value ?? opt.label}
                style={[pickerStyles.item, { borderBottomColor: theme.divider }]}
                onPress={() => { onSelect(opt.value ?? opt.label); onClose(); }}
                activeOpacity={0.7}
              >
                {opt.emoji && <Text style={{ fontSize: 20 }}>{opt.emoji}</Text>}
                <Text style={[pickerStyles.itemText, { color: theme.text }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  box: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "70%", paddingBottom: 32 },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 20, borderBottomWidth: 1,
  },
  title: { fontSize: 17, fontWeight: "700" },
  item: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1,
  },
  itemText: { fontSize: 15 },
});

// ─── Checkbox ─────────────────────────────────────────────
function Checkbox({ value, onValueChange, label, theme }: {
  value: boolean; onValueChange: (v: boolean) => void; label: string; theme: any;
}) {
  return (
    <TouchableOpacity
      style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
      onPress={() => onValueChange(!value)}
      activeOpacity={0.7}
    >
      <View style={{
        width: 22, height: 22, borderRadius: 6, borderWidth: 2,
        borderColor: value ? "#16a34a" : theme.border,
        backgroundColor: value ? "#16a34a" : "transparent",
        alignItems: "center", justifyContent: "center",
      }}>
        {value && <Check width={14} height={14} color="#fff" />}
      </View>
      <Text style={{ fontSize: 14, color: theme.text, fontWeight: "500" }}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Main Screen ─────────────────────────────────────────
export default function AddMaterielScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();

  // Form state
  const [nom, setNom] = useState("");
  const [categorie, setCategorie] = useState("");
  const [description, setDescription] = useState("");
  const [prix, setPrix] = useState("");
  const [unite, setUnite] = useState("jour");
  const [dureeCustom, setDureeCustom] = useState("");
  const [type, setType] = useState("");
  const [wilaya, setWilaya] = useState(user?.location || "");
  const [disponible, setDisponible] = useState(true);
  const [prixNegociable, setPrixNegociable] = useState(false);
  const [emoji, setEmoji] = useState("🚜");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Pickers
  const [showUnite, setShowUnite] = useState(false);
  const [showWilaya, setShowWilaya] = useState(false);

  // ── Pick image ──────────────────────────────────────
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée", "Accès à la galerie requis."); return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [16, 9], quality: 0.7,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  // ── Upload image ─────────────────────────────────────
  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      const ext = uri.split(".").pop() || "jpg";
      const fileName = `materiel_${Date.now()}.${ext}`;
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();
      const { error } = await supabase.storage
        .from("materiels")
        .upload(fileName, arrayBuffer, { contentType: `image/${ext}` });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("materiels").getPublicUrl(fileName);
      return urlData.publicUrl;
    } catch (e) {
      console.error("Upload error:", e);
      return null;
    }
  };

  // ── Category select ───────────────────────────────────
  const handleSelectCategorie = (val: string) => {
    setCategorie(val);
    const found = CATEGORIES.find((c) => c.label === val);
    if (found) setEmoji(found.emoji);
  };

  // ── Unite label ───────────────────────────────────────
  const uniteLabel = UNITES.find((u) => u.value === unite)?.label || unite;

  // ── Submit ────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!nom.trim())  { Alert.alert("Champ requis", "Veuillez saisir le nom."); return; }
    if (!categorie)   { Alert.alert("Champ requis", "Veuillez choisir une catégorie."); return; }
    if (!type)        { Alert.alert("Champ requis", "Veuillez choisir le type."); return; }
    if (!prix.trim() || isNaN(Number(prix))) { Alert.alert("Prix invalide", "Veuillez saisir un prix valide."); return; }
    if (!wilaya)      { Alert.alert("Champ requis", "Veuillez choisir votre wilaya."); return; }
    if (unite === "au choix" && !dureeCustom.trim()) {
      Alert.alert("Durée requise", "Veuillez préciser la durée."); return;
    }

    setLoading(true);
    try {
      let photoUrl: string | null = null;
      if (photoUri) photoUrl = await uploadImage(photoUri);

      const { error } = await supabase.from("materiels").insert({
        nom:              nom.trim(),
        categorie,
        description:      description.trim(),
        prix:             Number(prix),
        unite:            unite === "au choix" ? "au choix" : unite,
        duree:            unite === "au choix" ? dureeCustom.trim() : null,
        type,
        wilaya,
        disponible,
        prix_negociable:  prixNegociable,
        emoji,
        photo_url:        photoUrl,
        proprietaire_id:  user!.id,
      });

      if (error) throw error;

      Alert.alert("Succès !", "Votre matériel a été publié.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Erreur", e.message || "Impossible d'ajouter le matériel.");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.headerBg }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.bg }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── HEADER with working back button ── */}
        <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <ArrowLeft width={22} height={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ajouter un matériel</Text>
        </View>

        <View style={styles.content}>

          {/* ── PHOTO ── */}
          <TouchableOpacity
            style={[styles.photoBox, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={pickImage}
            activeOpacity={0.8}
          >
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Camera width={32} height={32} color={theme.muted} />
                <Text style={[styles.photoPlaceholderText, { color: theme.muted }]}>
                  Ajouter une photo
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* ── NOM ── */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.muted }]}>Nom du matériel *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              placeholder="Ex: Tracteur John Deere 5075E"
              placeholderTextColor={theme.muted}
              value={nom}
              onChangeText={setNom}
            />
          </View>

          {/* ── CATEGORIES GRID ── */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.muted }]}>Catégorie *</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const active = categorie === cat.label;
                return (
                  <TouchableOpacity
                    key={cat.label}
                    style={[
                      styles.categoryGridItem,
                      {
                        backgroundColor: active ? "#16a34a" : theme.card,
                        borderColor: active ? "#16a34a" : theme.border,
                      },
                    ]}
                    onPress={() => handleSelectCategorie(cat.label)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.categoryGridEmoji}>{cat.emoji}</Text>
                    <Text style={[styles.categoryGridLabel, { color: active ? "#fff" : theme.muted }]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── TYPE ── */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.muted }]}>Type *</Text>
            <View style={styles.typeRow}>
              {TYPES.map((t) => {
                const active = type === t.value;
                return (
                  <TouchableOpacity
                    key={t.value}
                    style={[
                      styles.typeChip,
                      { backgroundColor: active ? "#16a34a" : theme.card, borderColor: active ? "#16a34a" : theme.border },
                    ]}
                    onPress={() => setType(t.value)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.typeEmoji}>{t.emoji}</Text>
                    <Text style={[styles.typeLabel, { color: active ? "#fff" : theme.muted }]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── PRIX ── */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.muted }]}>Prix *</Text>
            <View style={styles.priceRow}>
              <TextInput
                style={[styles.input, { flex: 1, backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                placeholder="Ex: 5000"
                placeholderTextColor={theme.muted}
                keyboardType="numeric"
                value={prix}
                onChangeText={setPrix}
              />
              <TouchableOpacity
                style={[styles.unitePicker, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => setShowUnite(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.uniteText, { color: theme.text }]}>DA / {uniteLabel}</Text>
                <ChevronDown width={16} height={16} color={theme.muted} />
              </TouchableOpacity>
            </View>

            {/* Custom duration input when "au choix" */}
            {unite === "au choix" && (
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text, marginTop: 8 }]}
                placeholder="Précisez la durée (ex: 3 heures, 2 jours...)"
                placeholderTextColor={theme.muted}
                value={dureeCustom}
                onChangeText={setDureeCustom}
              />
            )}

            {/* Prix négociable checkbox */}
            <View style={{ marginTop: 10 }}>
              <Checkbox
                value={prixNegociable}
                onValueChange={setPrixNegociable}
                label="Prix négociable"
                theme={theme}
              />
            </View>
          </View>

          {/* ── WILAYA ── */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.muted }]}>Wilaya *</Text>
            <TouchableOpacity
              style={[styles.selector, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => setShowWilaya(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.selectorText, { color: wilaya ? theme.text : theme.muted }]}>
                {wilaya || "Choisir votre wilaya..."}
              </Text>
              <ChevronDown width={16} height={16} color={theme.muted} />
            </TouchableOpacity>
          </View>

          {/* ── DESCRIPTION ── */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.muted }]}>Description</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              placeholder="Décrivez votre matériel (état, caractéristiques, conditions...)."
              placeholderTextColor={theme.muted}
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* ── DISPONIBILITÉ ── */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.muted }]}>Disponibilité</Text>
            <View style={styles.disponRow}>
              {[
                { val: true,  label: "✅ Disponible" },
                { val: false, label: "❌ Non disponible" },
              ].map(({ val, label }) => (
                <TouchableOpacity
                  key={String(val)}
                  style={[
                    styles.disponChip,
                    {
                      backgroundColor: disponible === val
                        ? (val ? "#dcfce7" : "#fee2e2")
                        : theme.card,
                      borderColor: disponible === val
                        ? (val ? "#16a34a" : "#ef4444")
                        : theme.border,
                    },
                  ]}
                  onPress={() => setDisponible(val)}
                  activeOpacity={0.8}
                >
                  {disponible === val && (
                    <Check width={14} height={14} color={val ? "#16a34a" : "#ef4444"} />
                  )}
                  <Text style={{
                    fontSize: 13, fontWeight: "600",
                    color: disponible === val ? (val ? "#16a34a" : "#ef4444") : theme.muted,
                  }}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── SUBMIT ── */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Publier le matériel</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── PICKERS ── */}
      <PickerModal
        visible={showUnite}
        title="Unité de prix"
        options={UNITES}
        onSelect={setUnite}
        onClose={() => setShowUnite(false)}
        theme={theme}
      />
      <PickerModal
        visible={showWilaya}
        title="Choisir une wilaya"
        options={WILAYAS.map((w) => ({ label: w, value: w }))}
        onSelect={setWilaya}
        onClose={() => setShowWilaya(false)}
        theme={theme}
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
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  content: { padding: 20, gap: 20 },
  photoBox: {
    width: "100%", height: 180, borderRadius: 16,
    borderWidth: 2, borderStyle: "dashed", overflow: "hidden",
  },
  photoPreview: { width: "100%", height: "100%" },
  photoPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  photoPlaceholderText: { fontSize: 14, fontWeight: "600" },
  fieldGroup: { gap: 8 },
  label: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 15,
  },
  textArea: {
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, minHeight: 100, textAlignVertical: "top",
  },
  selector: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
  },
  selectorText: { fontSize: 15 },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  categoryGridItem: {
    width: "30%", alignItems: "center", justifyContent: "center",
    paddingVertical: 12, borderRadius: 14, borderWidth: 1, gap: 4,
  },
  categoryGridEmoji: { fontSize: 26 },
  categoryGridLabel: { fontSize: 10, fontWeight: "600", textAlign: "center" },
  typeRow: { flexDirection: "row", gap: 8 },
  typeChip: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingVertical: 12, borderRadius: 14, borderWidth: 1, gap: 4,
  },
  typeEmoji: { fontSize: 20 },
  typeLabel: { fontSize: 11, fontWeight: "600", textAlign: "center" },
  priceRow: { flexDirection: "row", gap: 10 },
  unitePicker: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 13,
  },
  uniteText: { fontSize: 13, fontWeight: "600" },
  disponRow: { flexDirection: "row", gap: 10 },
  disponChip: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 6,
    paddingVertical: 12, borderRadius: 14, borderWidth: 1,
  },
  submitBtn: {
    backgroundColor: "#16a34a", borderRadius: 14, paddingVertical: 16,
    alignItems: "center", shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3,
    shadowRadius: 8, elevation: 4, marginTop: 4,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
