import { atom, computed } from 'nanostores';

export interface Session {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  user_metadata?: { full_name?: string };
}

export const $session = atom<Session | null>(null);
export const $user = atom<User | null>(null);
export const $credits = atom<number>(0);
export const $isAdmin = atom<boolean>(false);
export const $fullName = atom<string>('');

export const $isLoggedIn = computed($user, (user) => !!user);
export const $displayName = computed([$fullName, $user], (name, user) => {
  return name || user?.email?.split('@')[0] || '';
});
export const $initials = computed($displayName, (name) => {
  return (name[0] || '?').toUpperCase();
});
