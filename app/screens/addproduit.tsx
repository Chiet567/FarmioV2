import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Camera,
  ChevronDown,
  DollarSign,
  FileText,
  MapPin,
  Package,
  Phone,
  X,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
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

// ── Catégories ──
const CATEGORIES = [
  { label: "🌾 Céréales", value: "Céréales" },
  { label: "🥕 Légumes", value: "Légumes" },
  { label: "🍎 Fruits", value: "Fruits" },
  { label: "🥛 Produits laitiers", value: "Produits laitiers" },
  { label: "🥩 Viandes", value: "Viandes" },
  { label: "🥚 Œufs", value: "Œufs" },
  { label: "💧 Huiles", value: "Huiles" },
  { label: "🌴 Dattes", value: "Dattes" },
  { label: "🍯 Miel", value: "Miel" },
  { label: "🌱 Fourrage", value: "Fourrage" },
];

const UNITES = ["kg", "tonne", "quintal", "unité", "litre", "boîte", "plateau"];

const WILAYAS = [
  "Adrar",
  "Chlef",
  "Laghouat",
  "Oum El Bouaghi",
  "Batna",
  "Béjaïa",
  "Biskra",
  "Béchar",
  "Blida",
  "Bouira",
  "Tamanrasset",
  "Tébessa",
  "Tlemcen",
  "Tiaret",
  "Tizi Ouzou",
  "Alger",
  "Djelfa",
  "Jijel",
  "Sétif",
  "Saïda",
  "Skikda",
  "Sidi Bel Abbès",
  "Annaba",
  "Guelma",
  "Constantine",
  "Médéa",
  "Mostaganem",
  "M'Sila",
  "Mascara",
  "Ouargla",
  "Oran",
  "El Bayadh",
  "Illizi",
  "Bordj Bou Arréridj",
  "Boumerdès",
  "El Tarf",
  "Tindouf",
  "Tissemsilt",
  "El Oued",
  "Khenchela",
  "Souk Ahras",
  "Tipaza",
  "Mila",
  "Aïn Defla",
  "Naâma",
  "Aïn Témouchent",
  "Ghardaïa",
  "Relizane",
];

export default function AddProduit() {
  const router = useRouter();
  const { user } = useAuth();

  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [prix, setPrix] = useState("");
  const [unite, setUnite] = useState("kg");
  const [quantite, setQuantite] = useState("");
  const [categorie, setCategorie] = useState("");
  const [wilaya, setWilaya] = useState(user?.location || "");
  const [telephone, setTelephone] = useState(user?.phone || "");
  const [negociable, setNegociable] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [showCategories, setShowCategories] = useState(false);
  const [showUnites, setShowUnites] = useState(false);
  const [showWilayas, setShowWilayas] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Choisir une image ──
  const pickImage = async () => {
    if (images.length >= 4) {
      Alert.alert("Maximum", "Tu peux ajouter maximum 4 images.");
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission requise", "Autorise l'accès à la galerie.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.4,
    });

    if (!result.canceled && result.assets[0]) {
      setImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Validation ──
  const validate = () => {
    const e: Record<string, string> = {};
    if (!telephone.trim()) e.telephone = "Téléphone requis";
    if (!titre.trim()) e.titre = "Titre requis";
    if (!prix.trim() || isNaN(Number(prix))) e.prix = "Prix valide requis";
    if (!quantite.trim() || isNaN(Number(quantite)))
      e.quantite = "Quantité requise";
    if (!categorie) e.categorie = "Catégorie requise";
    if (!wilaya) e.wilaya = "Wilaya requise";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Upload images vers Supabase Storage ──
  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = [];

    for (const uri of images) {
      try {
        const resized = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 800 } }],
          { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG },
        );

        const fileName = `${user?.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;

        const formData = new FormData();
        formData.append("", {
          uri: resized.uri,
          name: fileName,
          type: "image/jpeg",
        } as any);

        const { data, error } = await supabase.storage
          .from("produit-images")
          .upload(fileName, formData, {
            contentType: "multipart/form-data",
            upsert: false,
          });

        if (error) {
          console.error("Upload error:", error);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("produit-images")
          .getPublicUrl(data.path);

        urls.push(urlData.publicUrl);
      } catch (err) {
        console.error("Upload failed:", err);
      }
    }

    return urls;
  };

  // ── Soumettre ──
  const handleSubmit = async () => {
    if (!validate()) return;
    if (!user) {
      Alert.alert("Erreur", "Tu dois être connecté pour publier.");
      return;
    }

    setLoading(true);
    try {
      // 1. Upload images si présentes
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadImages();
      }

      // 2. Récupérer l'ID de la catégorie
      const { data: catData } = await supabase
        .from("categories")
        .select("id")
        .eq("nom", categorie)
        .single();

      // 3. Insérer le produit
      const { data, error } = await supabase
        .from("produits")
        .insert({
          vendeur_id: user.id,
          categorie_id: catData?.id || null,
          titre: titre.trim(),
          description: description.trim() || null,
          prix: parseFloat(prix),
          unite: unite,
          quantite_disponible: parseFloat(quantite),
          wilaya: wilaya,
          images: imageUrls,
          statut: "actif",
          est_negociable: negociable,
        })
        .select()
        .single();

      if (telephone.trim()) {
        await supabase
          .from("profiles")
          .update({ telephone: telephone.trim() })
          .eq("id", user.id);
      }

      if (error) {
        console.error("Insert error:", error);
        Alert.alert("Erreur", "Impossible de publier l'annonce.");
        return;
      }

      Alert.alert("Succès", "Ton annonce a été publiée !", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      console.error("Submit error:", err);
      Alert.alert("Erreur", "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft width={22} height={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouvelle annonce</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* IMAGES */}
          <View style={styles.section}>
            <Text style={styles.label}>Photos (max 4)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.imagesRow}>
                {images.map((uri, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <Image source={{ uri }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={styles.removeImageBtn}
                      onPress={() => removeImage(index)}
                    >
                      <X width={14} height={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
                {images.length < 4 && (
                  <TouchableOpacity
                    style={styles.addImageBtn}
                    onPress={pickImage}
                  >
                    <Camera width={24} height={24} color="#9ca3af" />
                    <Text style={styles.addImageText}>Ajouter</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>

          {/* TITRE */}
          <View style={styles.section}>
            <Text style={styles.label}>Titre *</Text>
            <View style={[styles.inputRow, errors.titre && styles.inputError]}>
              <Package width={18} height={18} color="#9ca3af" />
              <TextInput
                style={styles.input}
                placeholder="Ex: Tomates fraîches bio"
                placeholderTextColor="#d1d5db"
                value={titre}
                onChangeText={(t) => {
                  setTitre(t);
                  setErrors((e) => ({ ...e, titre: "" }));
                }}
              />
            </View>
            {errors.titre ? (
              <Text style={styles.errorText}>{errors.titre}</Text>
            ) : null}
          </View>

          {/* DESCRIPTION */}
          <View style={styles.section}>
            <Text style={styles.label}>Description</Text>
            <View style={styles.inputRow}>
              <FileText width={18} height={18} color="#9ca3af" />
              <TextInput
                style={[
                  styles.input,
                  { minHeight: 80, textAlignVertical: "top" },
                ]}
                placeholder="Décris ton produit..."
                placeholderTextColor="#d1d5db"
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
              />
            </View>
          </View>

          {/* CATÉGORIE */}
          <View style={styles.section}>
            <Text style={styles.label}>Catégorie *</Text>
            <TouchableOpacity
              style={[styles.dropdown, errors.categorie && styles.inputError]}
              onPress={() => {
                setShowCategories(!showCategories);
                setShowUnites(false);
                setShowWilayas(false);
              }}
            >
              <Text
                style={
                  categorie ? styles.dropdownText : styles.dropdownPlaceholder
                }
              >
                {categorie
                  ? CATEGORIES.find((c) => c.value === categorie)?.label
                  : "Choisir une catégorie"}
              </Text>
              <ChevronDown width={18} height={18} color="#9ca3af" />
            </TouchableOpacity>
            {errors.categorie ? (
              <Text style={styles.errorText}>{errors.categorie}</Text>
            ) : null}

            {showCategories && (
              <View style={styles.dropdownList}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.dropdownItem,
                      categorie === cat.value && styles.dropdownItemActive,
                    ]}
                    onPress={() => {
                      setCategorie(cat.value);
                      setShowCategories(false);
                      setErrors((e) => ({ ...e, categorie: "" }));
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{cat.label}</Text>
                    {categorie === cat.value && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* PRIX + UNITÉ */}
          <View style={styles.section}>
            <Text style={styles.label}>Prix et unité *</Text>
            <View style={styles.priceRow}>
              <View
                style={[
                  styles.inputRow,
                  { flex: 1 },
                  errors.prix && styles.inputError,
                ]}
              >
                <DollarSign width={18} height={18} color="#9ca3af" />
                <TextInput
                  style={styles.input}
                  placeholder="Prix en DA"
                  placeholderTextColor="#d1d5db"
                  keyboardType="numeric"
                  value={prix}
                  onChangeText={(t) => {
                    setPrix(t);
                    setErrors((e) => ({ ...e, prix: "" }));
                  }}
                />
              </View>

              <TouchableOpacity
                style={styles.uniteBtn}
                onPress={() => {
                  setShowUnites(!showUnites);
                  setShowCategories(false);
                  setShowWilayas(false);
                }}
              >
                <Text style={styles.uniteBtnText}>{unite}</Text>
                <ChevronDown width={14} height={14} color="#16a34a" />
              </TouchableOpacity>
            </View>
            {errors.prix ? (
              <Text style={styles.errorText}>{errors.prix}</Text>
            ) : null}

            {showUnites && (
              <View style={styles.dropdownList}>
                {UNITES.map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[
                      styles.dropdownItem,
                      unite === u && styles.dropdownItemActive,
                    ]}
                    onPress={() => {
                      setUnite(u);
                      setShowUnites(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{u}</Text>
                    {unite === u && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* QUANTITÉ */}
          <View style={styles.section}>
            <Text style={styles.label}>Quantité disponible *</Text>
            <View
              style={[styles.inputRow, errors.quantite && styles.inputError]}
            >
              <TextInput
                style={styles.input}
                placeholder="Ex: 500"
                placeholderTextColor="#d1d5db"
                keyboardType="numeric"
                value={quantite}
                onChangeText={(t) => {
                  setQuantite(t);
                  setErrors((e) => ({ ...e, quantite: "" }));
                }}
              />
              <Text style={styles.uniteLabel}>({unite})</Text>
            </View>
            {errors.quantite ? (
              <Text style={styles.errorText}>{errors.quantite}</Text>
            ) : null}
          </View>

          {/* WILAYA */}
          <View style={styles.section}>
            <Text style={styles.label}>Wilaya *</Text>
            <TouchableOpacity
              style={[styles.dropdown, errors.wilaya && styles.inputError]}
              onPress={() => {
                setShowWilayas(!showWilayas);
                setShowCategories(false);
                setShowUnites(false);
              }}
            >
              <MapPin width={18} height={18} color="#9ca3af" />
              <Text
                style={
                  wilaya ? styles.dropdownText : styles.dropdownPlaceholder
                }
              >
                {wilaya || "Choisir une wilaya"}
              </Text>
              <ChevronDown width={18} height={18} color="#9ca3af" />
            </TouchableOpacity>
            {errors.wilaya ? (
              <Text style={styles.errorText}>{errors.wilaya}</Text>
            ) : null}

            {showWilayas && (
              <View style={[styles.dropdownList, { maxHeight: 200 }]}>
                <ScrollView nestedScrollEnabled>
                  {WILAYAS.map((w) => (
                    <TouchableOpacity
                      key={w}
                      style={[
                        styles.dropdownItem,
                        wilaya === w && styles.dropdownItemActive,
                      ]}
                      onPress={() => {
                        setWilaya(w);
                        setShowWilayas(false);
                        setErrors((e) => ({ ...e, wilaya: "" }));
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{w}</Text>
                      {wilaya === w && <Text style={styles.checkmark}>✓</Text>}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* TÉLÉPHONE */}
          <View style={styles.section}>
            <Text style={styles.label}>Téléphone de contact *</Text>
            <View
              style={[styles.inputRow, errors.telephone && styles.inputError]}
            >
              <Phone width={18} height={18} color="#9ca3af" />
              <TextInput
                style={styles.input}
                placeholder="Ex: 0550123456"
                placeholderTextColor="#d1d5db"
                keyboardType="phone-pad"
                value={telephone}
                onChangeText={(t) => {
                  setTelephone(t);
                  setErrors((e) => ({ ...e, telephone: "" }));
                }}
              />
            </View>
            {errors.telephone ? (
              <Text style={styles.errorText}>{errors.telephone}</Text>
            ) : null}
          </View>

          {/* NÉGOCIABLE */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setNegociable(!negociable)}
            >
              <View style={[styles.toggle, negociable && styles.toggleActive]}>
                <View
                  style={[
                    styles.toggleDot,
                    negociable && styles.toggleDotActive,
                  ]}
                />
              </View>
              <Text style={styles.toggleLabel}>Prix négociable</Text>
            </TouchableOpacity>
          </View>

          {/* BOUTON PUBLIER */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Publier l'annonce</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f9fafb" },
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
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  scroll: { padding: 16 },

  section: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputError: { borderColor: "#ef4444" },
  input: { flex: 1, fontSize: 15, color: "#111827" },
  errorText: { fontSize: 12, color: "#ef4444", marginTop: 4 },

  // Images
  imagesRow: { flexDirection: "row", gap: 12 },
  imageWrapper: { position: "relative" },
  imagePreview: { width: 100, height: 100, borderRadius: 12 },
  removeImageBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
  },
  addImageBtn: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  addImageText: { fontSize: 11, color: "#9ca3af" },

  // Dropdown
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  dropdownText: { flex: 1, fontSize: 15, color: "#111827" },
  dropdownPlaceholder: { flex: 1, fontSize: 15, color: "#d1d5db" },
  dropdownList: {
    marginTop: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  dropdownItemActive: { backgroundColor: "#f0fdf4" },
  dropdownItemText: { fontSize: 14, color: "#374151" },
  checkmark: { color: "#16a34a", fontSize: 16, fontWeight: "bold" },

  // Prix row
  priceRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  uniteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#16a34a",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  uniteBtnText: { fontSize: 14, fontWeight: "600", color: "#16a34a" },
  uniteLabel: { fontSize: 13, color: "#9ca3af" },

  // Toggle
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  toggleActive: { backgroundColor: "#16a34a" },
  toggleDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
  },
  toggleDotActive: { alignSelf: "flex-end" },
  toggleLabel: { fontSize: 15, color: "#374151", fontWeight: "500" },

  // Submit
  submitBtn: {
    backgroundColor: "#16a34a",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
