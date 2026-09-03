import { createContext, useContext } from "react";

/* Shared auth state, provided by AuthGate and consumed inside Presubly.
   value: { user, profile, credits, isPro, isAdmin, getToken, refreshProfile, signOut } */
export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);
