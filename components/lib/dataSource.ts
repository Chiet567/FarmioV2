// lib/dataSource.ts
import { getProduits as getProduitsAPI } from "./api";
import { getAllPosts } from "./mockdata";

const USE_SUPABASE = true; 

export async function getProduits(params?: any) {
  if (USE_SUPABASE) {
    return getProduitsAPI(params);
  }
  // Retourner les données mock formatées pareil
  const mockData = getAllPosts();
  return {
    data: mockData,
    error: null,
    count: mockData.length,
  };
}
