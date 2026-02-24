import { createContext } from 'react';
import type { UserProfile } from '../types/user.types';

// إعادة التصدير لتجنب كسر الملفات الموجودة
export type { UserProfile };

export interface AuthContextType {
  loggedIn: boolean;
  setLoggedIn: (value: boolean) => void;
  jwt: string | null;
  setJwt: (value: string | null) => void;
  user: UserProfile | null;
  setUser: (value: UserProfile | null) => void;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  getProfileImageUrl: (imageUrl?: string | null) => string;
}

export const AuthContext = createContext<AuthContextType>({
  loggedIn: false,
  setLoggedIn: () => {},
  jwt: null,
  setJwt: () => {},
  user: null,
  setUser: () => {},
  logout: async () => {},
  fetchProfile: async () => {},
  getProfileImageUrl: () => '',
});
