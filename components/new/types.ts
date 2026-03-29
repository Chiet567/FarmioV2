export type UserRole = 'veterinaire' | 'ingenieur';

export interface Professional {
  id: string;
  name: string;
  role: UserRole;
  specialty?: string;
  location?: string;
  phone?: string;
}