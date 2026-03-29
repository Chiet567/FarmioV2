export type TypeTransaction = "location" | "vente" | "les deux";

export interface Materiel {
  id: string;
  nom: string;
  categorie: string;
  description: string;
  prix: number;
  unite: string; // 'jour' | 'semaine' | 'unité'
  type: TypeTransaction;
  disponible: boolean;
  proprietaire: {
    nom: string;
    phone: string;
    wilaya: string;
  };
  emoji: string;
  image?: number;
}

export const CATEGORIES = [
  "Tous",
  "🚜 Tracteurs & Véhicules",
  "🌱 Semis & Plantation",
  "💧 Irrigation",
  "🌾 Récolte",
  "🔧 Pièces détachées",
];

export const materiels: Materiel[] = [
  // ====== TRACTEURS & VÉHICULES ======
  {
    id: "1",
    nom: "Tracteur avec Charrue",
    categorie: "🚜 Tracteurs & Véhicules",
    description:
      "Tracteur puissant équipé d'une charrue pour le labour profond. Idéal pour préparer les sols argileux.",
    prix: 3500,
    unite: "jour",
    type: "location",
    disponible: true,
    proprietaire: {
      nom: "Mostfakara nihel ",
      phone: "0552384611",
      wilaya: "Tlemcen",
    },
    emoji: "🚜",
    image: require("../../assets/images/tracteurcharue.jpg"),
  },
  {
    id: "2",
    nom: "Tracteur avec Cultivateur",
    categorie: "🚜 Tracteurs & Véhicules",
    description:
      "Tracteur avec cultivateur pour ameublir et aérer le sol avant les semailles.",
    prix: 3000,
    unite: "jour",
    type: "location",
    disponible: true,
    proprietaire: {
      nom: "belkaid chiet ",
      phone: "0661234567",
      wilaya: "Mascara",
    },
    emoji: "🚜",
    image: require("../../assets/images/tracteurcultivateur.jpg"),
  },
  {
    id: "3",
    nom: "Véhicule de Transport Agricole",
    categorie: "🚜 Tracteurs & Véhicules",
    description:
      "Camionnette robuste pour le transport des récoltes et des équipements.",
    prix: 2500,
    unite: "jour",
    type: "les deux",
    disponible: true,
    proprietaire: {
      nom: "Derfouf cherif",
      phone: "0771234567",
      wilaya: "Oran",
    },
    emoji: "🛻",
  },

  // ====== SEMIS & PLANTATION ======
  {
    id: "4",
    nom: "Semoir Mécanique",
    categorie: "🌱 Semis & Plantation",
    description:
      "Semoir universel pour différents types de graines. Réglage de la profondeur et de l'espacement.",
    prix: 1800,
    unite: "jour",
    type: "les deux",
    disponible: true,
    proprietaire: {
      nom: "beloufa safaa",
      phone: "0550987654",
      wilaya: "Sidi Bel Abbès",
    },
    emoji: "🌱",
    image: require("../../assets/images/semoirmecanique.jpg"),
  },
  {
    id: "5",
    nom: "Semoir Maïs / Blé / Légumes",
    categorie: "🌱 Semis & Plantation",
    description:
      "Semoir de précision adapté au maïs, blé et légumes. Garantit un semis uniforme.",
    prix: 2200,
    unite: "jour",
    type: "location",
    disponible: true,
    proprietaire: {
      nom: "oukebdane Houssam",
      phone: "0550123456",
      wilaya: "Tlemcen",
    },
    emoji: "🌽",
    image: require("../../assets/images/semoirmais.jpg"),
  },
  {
    id: "6",
    nom: "Planteuse de Pommes de Terre",
    categorie: "🌱 Semis & Plantation",
    description:
      "Machine spécialisée pour la plantation automatique des pommes de terre. Grande capacité.",
    prix: 4000,
    unite: "jour",
    type: "location",
    disponible: false,
    proprietaire: {
      nom: "Lynda Ouali",
      phone: "0662345678",
      wilaya: "Aïn Temouchent",
    },
    emoji: "🥔",
  },

  // ====== IRRIGATION ======
  {
    id: "7",
    nom: "Pompe à Eau Diesel",
    categorie: "💧 Irrigation",
    description:
      "Pompe puissante diesel pour les zones sans électricité. Débit élevé, idéale pour les grandes surfaces.",
    prix: 1500,
    unite: "jour",
    type: "les deux",
    disponible: true,
    proprietaire: { nom: "Omar Hadj", phone: "0770123456", wilaya: "Béjaïa" },
    emoji: "⛽",
  },
  {
    id: "8",
    nom: "Pompe à Eau Électrique",
    categorie: "💧 Irrigation",
    description:
      "Pompe électrique silencieuse et économique pour l'irrigation régulière.",
    prix: 1200,
    unite: "jour",
    type: "les deux",
    disponible: true,
    proprietaire: { nom: "Samir Khelif", phone: "0551234567", wilaya: "Blida" },
    emoji: "💧",
  },
  {
    id: "9",
    nom: "Système d'Irrigation Mobile",
    categorie: "💧 Irrigation",
    description:
      "Kit d'irrigation mobile complet avec asperseurs et tuyaux. Facile à déplacer.",
    prix: 2800,
    unite: "semaine",
    type: "les deux",
    disponible: true,
    proprietaire: {
      nom: "Fatima Zahra",
      phone: "0660987654",
      wilaya: "Relizane",
    },
    emoji: "🌊",
  },
  {
    id: "10",
    nom: "Tuyaux d'Irrigation (lot 100m)",
    categorie: "💧 Irrigation",
    description:
      "Lot de 100m de tuyaux d'irrigation résistants aux UV. Diamètre 32mm.",
    prix: 8500,
    unite: "unité",
    type: "vente",
    disponible: true,
    proprietaire: { nom: "Hicham Store", phone: "0550111222", wilaya: "Alger" },
    emoji: "🔵",
  },

  // ====== RÉCOLTE ======
  {
    id: "11",
    nom: "Moissonneuse-Batteuse",
    categorie: "🌾 Récolte",
    description:
      "Moissonneuse pour blé, orge et maïs. Location à la saison. Grande efficacité sur terrains plats.",
    prix: 12000,
    unite: "jour",
    type: "location",
    disponible: true,
    proprietaire: {
      nom: "Nabil Agricole",
      phone: "0661111222",
      wilaya: "Tiaret",
    },
    emoji: "🌾",
    image: require("../../assets/images/moison.webp"),
  },
  {
    id: "12",
    nom: "Ensileuse",
    categorie: "🌾 Récolte",
    description:
      "Ensileuse pour maïs et fourrage. Idéale pour les éleveurs cherchant à stocker l'alimentation animale.",
    prix: 9000,
    unite: "jour",
    type: "location",
    disponible: false,
    proprietaire: { nom: "Rachid Ferme", phone: "0770555666", wilaya: "Sétif" },
    emoji: "🌿",
    image: require("../../assets/images/ensi.jpg"),
  },

  // ====== PIÈCES DÉTACHÉES ======
  {
    id: "13",
    nom: "Filtre à Huile Tracteur",
    categorie: "🔧 Pièces détachées",
    description:
      "Filtre à huile compatible avec la majorité des tracteurs agricoles. Marque certifiée.",
    prix: 850,
    unite: "unité",
    type: "vente",
    disponible: true,
    proprietaire: {
      nom: "Pièces Agri DZ",
      phone: "0550333444",
      wilaya: "Oran",
    },
    emoji: "🔧",
  },
  {
    id: "14",
    nom: "Courroie de Transmission",
    categorie: "🔧 Pièces détachées",
    description:
      "Courroie de transmission universelle pour moissonneuses et tracteurs. Résistante.",
    prix: 1200,
    unite: "unité",
    type: "vente",
    disponible: true,
    proprietaire: {
      nom: "Pièces Agri DZ",
      phone: "0550333444",
      wilaya: "Oran",
    },
    emoji: "⚙️",
  },
  {
    id: "15",
    nom: "Soc de Charrue",
    categorie: "🔧 Pièces détachées",
    description:
      "Soc de charrue en acier traité haute résistance. Compatible avec les charrues standards.",
    prix: 2500,
    unite: "unité",
    type: "vente",
    disponible: true,
    proprietaire: {
      nom: "Ferrouk Matériel",
      phone: "0661444555",
      wilaya: "Tlemcen",
    },
    emoji: "🔩",
  },
  {
    id: "16",
    nom: "Batterie Tracteur 12V",
    categorie: "🔧 Pièces détachées",
    description:
      "Batterie 12V haute capacité pour tracteurs et engins agricoles.",
    prix: 4500,
    unite: "unité",
    type: "vente",
    disponible: true,
    proprietaire: {
      nom: "ElecAgri Store",
      phone: "0770888999",
      wilaya: "Alger",
    },
    emoji: "🔋",
  },
];

export const getMaterielsByCategorie = (categorie: string): Materiel[] => {
  if (categorie === "Tous") return materiels.filter((m) => m.disponible);
  return materiels.filter((m) => m.categorie === categorie);
};

export const getAllMateriels = (): Materiel[] => materiels;
