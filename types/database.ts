// types/database.ts
export type Role = 'agriculteur' | 'acheteur' | 'admin';
export type Unite = 'kg' | 'tonne' | 'quintal' | 'unite'
  | 'litre' | 'boite' | 'plateau';
export type StatutProduit = 'actif' | 'vendu'
  | 'suspendu' | 'brouillon';
export type StatutCommande = 'en_attente' | 'acceptee'
  | 'refusee' | 'en_livraison' | 'livree' | 'annulee';

export interface Profile {
  id: string;
  nom: string;
  prenom: string;
  telephone?: string;
  wilaya: string;
  commune?: string;
  role: Role;
  photo_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface Produit {
  id: string;
  vendeur_id: string;
  categorie_id?: string;
  titre: string;
  description?: string;
  prix: number;
  unite: Unite;
  quantite_disponible: number;
  wilaya: string;
  commune?: string;
  images: string[];
  statut: StatutProduit;
  est_negociable: boolean;
  created_at: string;
  updated_at: string;
  // Relation jointe
  vendeur?: Profile;
  categorie?: { id: string; nom: string; icone: string };
}

export interface Commande {
  id: string;
  acheteur_id: string;
  vendeur_id: string;
  produit_id: string;
  quantite: number;
  prix_unitaire: number;
  prix_total: number;
  statut: StatutCommande;
  message?: string;
  created_at: string;
}
