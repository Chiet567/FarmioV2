// lib/storage.ts
import * as ImagePicker from "expo-image-picker";
import { supabase } from "./supabase";

export async function pickAndUploadImage(
  userId: string,
): Promise<string | null> {
  // 1. Choisir l'image
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.7,
  });

  if (result.canceled) return null;

  const uri = result.assets[0].uri;
  const ext = uri.split(".").pop() || "jpg";
  const fileName = `${userId}/${Date.now()}.${ext}`;

  // 2. Lire le fichier
  const response = await fetch(uri);
  const blob = await response.blob();

  // 3. Uploader vers Supabase Storage
  const { data, error } = await supabase.storage
    .from("produits-images")
    .upload(fileName, blob, {
      contentType: `image/${ext}`,
      upsert: false,
    });

  if (error) {
    console.error("Upload error:", error);
    return null;
  }

  // 4. Récupérer l'URL publique
  const {
    data: { publicUrl },
  } = supabase.storage.from("produits-images").getPublicUrl(data.path);

  return publicUrl;
}

// Supprimer une image
export async function deleteImage(path: string) {
  const { error } = await supabase.storage
    .from("produits-images")
    .remove([path]);
  return { error };
}
