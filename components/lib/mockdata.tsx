// ============================================
// DONNÉES MOCKÉES - Application Agriculteur
// ============================================

// --------------------------------------------
// TYPES
// --------------------------------------------
export interface Post {
  id: string;
  title: string;
  description: string;
  price: number;
  unit: string;
  category: string;
  location: string;
  seller: {
    id: string;
    name: string;
    phone: string;
  };
  image?: string | number;
  createdAt: string;
  available: boolean;
}

// --------------------------------------------
// DONNÉES
// --------------------------------------------
const mockPosts: Post[] = [
  {
    id: "1",
    title: "Tomates fraîches",
    description: "Tomates bio cultivées sans pesticides, fraîches de la ferme.",
    price: 80,
    unit: "kg",
    category: "Légumes",
    location: "Tlemcen",
    image: require("../../assets/images/tomate.jpg"),
    seller: {
      id: "u1",
      name: "Beloufa safaa",
      phone: "0667398490",
    },
    createdAt: "2024-01-15",
    available: true,
  },
  {
    id: "2",
    title: "Oranges ",
    description: "Oranges juteuses de la région de Mascara, très sucrées.",
    price: 60,
    unit: "kg",
    category: "Fruits",
    location: "tlemcen",
    image: require("../../assets/images/orange.jpg"),
    seller: {
      id: "u2",
      name: "Belkaid chiet",
      phone: "0552285478",
    },
    createdAt: "2024-01-14",
    available: true,
  },
  {
    id: "3",
    title: "Pommes de terre",
    description:
      "Pommes de terre de qualité supérieure, idéales pour la cuisine.",
    price: 45,
    unit: "kg",
    category: "Légumes",
    location: "tlemcen",
    image: require("../../assets/images/pomme.jpg"),
    seller: {
      id: "u3",
      name: "Oukebdane houssam",
      phone: "0540017610",
    },
    createdAt: "2024-01-13",
    available: true,
  },
  {
    id: "4",
    title: "Miel naturel",
    description: "Miel 100% naturel des montagnes de Béjaïa.",
    price: 1200,
    unit: "litre",
    category: "Produits naturels",
    location: "Béjaïa",
    image: require("../../assets/images/miel.jpg"),
    seller: {
      id: "u4",
      name: "Derfouf cherif ",
      phone: "00542304626",
    },
    createdAt: "2024-01-12",
    available: true,
  },
  {
    id: "5",
    title: "Huile d'olive extra vierge",
    description:
      "Huile d'olive première pression à froid, région de Tizi Ouzou.",
    price: 800,
    unit: "litre",
    category: "Produits naturels",
    location: "Tizi Ouzou",
    seller: {
      id: "u5",
      name: "Lynda Ouali",
      phone: "0662345678",
    },
    createdAt: "2024-01-11",
    available: false,
  },
];

// --------------------------------------------
// FONCTIONS
// --------------------------------------------

// Retourner les 3 annonces les plus récentes
export const getRecentPosts = (): Post[] => {
  return mockPosts
    .filter((post) => post.available)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 3);
};

// Retourner toutes les annonces
export const getAllPosts = (): Post[] => {
  return mockPosts.filter((post) => post.available);
};

// Retourner une annonce par ID
export const getPostById = (id: string): Post | undefined => {
  return mockPosts.find((post) => post.id === id);
};

// Retourner les annonces par catégorie
export const getPostsByCategory = (category: string): Post[] => {
  return mockPosts.filter(
    (post) => post.category === category && post.available,
  );
};

// Toutes les catégories disponibles
export const getCategories = (): string[] => {
  return [...new Set(mockPosts.map((post) => post.category))];
};
