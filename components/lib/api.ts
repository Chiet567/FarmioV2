// lib/api.ts
import { Produit } from "../../types/database";
import { supabase } from "./supabase";

// Lister les produits avec filtres
export async function getProduits(params?: {
  categorie?: string;
  wilaya?: string;
  recherche?: string;
  page?: number;
  limit?: number;
}) {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("produits")
    .select(
      `
      *,
      vendeur:profiles!vendeur_id(id, nom, prenom, wilaya,telephone),
      categorie:categories!categorie_id(id, nom, icone)
    `,
      { count: "exact" },
    )
    .eq("statut", "actif")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (params?.categorie) query = query.eq("categorie_id", params.categorie);
  if (params?.wilaya) query = query.eq("wilaya", params.wilaya);
  if (params?.recherche)
    query = query.textSearch("search_vector", params.recherche, {
      type: "websearch",
      config: "french",
    });

  const { data, error, count } = await query;
  return { data: data as Produit[], error, count };
}
// Créer un produit
export async function createProduit(
  produit: Omit<
    Produit,
    "id" | "created_at" | "updated_at" | "vendeur" | "categorie"
  >,
) {
  const { data, error } = await supabase
    .from("produits")
    .insert(produit)
    .select()
    .single();
  return { data, error };
}

// Modifier un produit
export async function updateProduit(id: string, updates: Partial<Produit>) {
  const { data, error } = await supabase
    .from("produits")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  return { data, error };
}

// Supprimer un produit
export async function deleteProduit(id: string) {
  const { error } = await supabase.from("produits").delete().eq("id", id);
  return { error };
}
// Créer une commande
export async function createCommande(params: {
  produit_id: string;
  vendeur_id: string;
  quantite: number;
  prix_unitaire: number;
  message?: string;
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data, error } = await supabase
    .from("commandes")
    .insert({
      acheteur_id: user.id,
      vendeur_id: params.vendeur_id,
      produit_id: params.produit_id,
      quantite: params.quantite,
      prix_unitaire: params.prix_unitaire,
      prix_total: params.quantite * params.prix_unitaire,
      message: params.message,
    })
    .select()
    .single();
  return { data, error };
}

// Lister ses commandes
export async function getCommandes(type: "acheteur" | "vendeur") {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const column = type === "acheteur" ? "acheteur_id" : "vendeur_id";

  const { data, error } = await supabase
    .from("commandes")
    .select(
      `
      *,
      produit:produits(id, titre, images, prix),
      acheteur:profiles!acheteur_id(nom, prenom),
      vendeur:profiles!vendeur_id(nom, prenom)
    `,
    )
    .eq(column, user.id)
    .order("created_at", { ascending: false });
  return { data, error };
}
