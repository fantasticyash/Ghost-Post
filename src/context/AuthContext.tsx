import { createContext, useContext, useEffect, useState } from "react";

import { IUser } from "@/types";
import { getCurrentUser, signOutAccount } from "@/lib/firebase/api";
import {
  isFamiliarDevice,
  isSessionActive,
  getCachedUser,
  setCachedUser,
  clearCachedUser,
  clearFamiliarDevice,
  setSessionActive,
} from "@/lib/utils/device";

export const INITIAL_USER = {
  id: "",
  name: "",
  username: "",
  email: "",
  imageUrl: "",
  bio: "",
};

const INITIAL_STATE = {
  user: INITIAL_USER,
  isLoading: false,
  isAuthenticated: false,
  setUser: () => {},
  setIsAuthenticated: () => {},
  checkAuthUser: async () => false as boolean,
};

type IContextType = {
  user: IUser;
  isLoading: boolean;
  setUser: React.Dispatch<React.SetStateAction<IUser>>;
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  checkAuthUser: () => Promise<boolean>;
};

const AuthContext = createContext<IContextType>(INITIAL_STATE);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Check if this device is familiar (has cookie / local cache)
  const initialFamiliar = isFamiliarDevice();
  const initialActive = isSessionActive();
  const cachedUser = initialFamiliar ? getCachedUser() : null;

  // On new/unfamiliar devices, stay logged out on launch without unnecessary spinner
  const shouldCheckRemotely = initialFamiliar || initialActive;

  const [user, setUser] = useState<IUser>(cachedUser || INITIAL_USER);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    Boolean(cachedUser?.id)
  );
  const [isLoading, setIsLoading] = useState<boolean>(
    shouldCheckRemotely && !cachedUser?.id
  );

  const checkAuthUser = async () => {
    const familiar = isFamiliarDevice();
    const sessionActive = isSessionActive();

    // On fresh launch on an unfamiliar device, guarantee the app stays logged out
    if (!familiar && !sessionActive) {
      try {
        await signOutAccount();
      } catch (err) {
        console.error("Sign out on unfamiliar device launch:", err);
      }
      clearFamiliarDevice();
      setUser(INITIAL_USER);
      setIsAuthenticated(false);
      setIsLoading(false);
      return false;
    }

    setIsLoading(true);
    try {
      const currentAccount = await getCurrentUser();
      if (currentAccount) {
        const authUser: IUser = {
          id: currentAccount.$id,
          name: currentAccount.name,
          username: currentAccount.username,
          email: currentAccount.email,
          imageUrl: currentAccount.imageUrl,
          bio: currentAccount.bio,
        };

        setUser(authUser);
        setIsAuthenticated(true);
        setSessionActive();

        // Enable instant cache for familiar devices
        if (familiar) {
          setCachedUser(authUser);
        }

        return true;
      }

      // If no active session found, reset state
      clearCachedUser();
      setUser(INITIAL_USER);
      setIsAuthenticated(false);
      return false;
    } catch (error) {
      console.error("Auth check failed:", error);
      clearCachedUser();
      setUser(INITIAL_USER);
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthUser();
  }, []);

  const value = {
    user,
    setUser,
    isLoading,
    isAuthenticated,
    setIsAuthenticated,
    checkAuthUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useUserContext = () => useContext(AuthContext);
