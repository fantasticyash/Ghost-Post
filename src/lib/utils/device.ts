import { IUser } from "@/types";

export const FAMILIAR_COOKIE_NAME = "gp_familiar_device";
export const FAMILIAR_STORAGE_KEY = "gp_familiar_device_token";
export const FAMILIAR_FLAG_KEY = "gp_familiar_device";
export const CACHED_USER_KEY = "gp_cached_user";
export const SESSION_ACTIVE_KEY = "gp_session_active";
const FAMILIAR_DAYS = 90; // 90 days expiration for familiar devices

/**
 * Cookie Helpers
 */
export function setCookie(name: string, value: string, days: number = FAMILIAR_DAYS) {
  try {
    if (typeof document === "undefined") return;
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(
      value
    )};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  } catch (error) {
    console.error("Failed to set cookie:", error);
  }
}

export function getCookie(name: string): string | null {
  try {
    if (typeof document === "undefined") return null;
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      }
    }
  } catch (error) {
    console.error("Failed to read cookie:", error);
  }
  return null;
}

export function deleteCookie(name: string) {
  try {
    if (typeof document === "undefined") return;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax`;
  } catch (error) {
    console.error("Failed to delete cookie:", error);
  }
}

/**
 * Session Lifecycle Tracking
 */
export function isSessionActive(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(SESSION_ACTIVE_KEY) === "true";
  } catch {
    return false;
  }
}

export function setSessionActive() {
  try {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(SESSION_ACTIVE_KEY, "true");
  } catch (error) {
    console.error("Failed to set active session:", error);
  }
}

export function clearSessionActive() {
  try {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(SESSION_ACTIVE_KEY);
  } catch (error) {
    console.error("Failed to clear active session:", error);
  }
}

/**
 * Device Familiarity & Token Generation
 */
function generateDeviceToken(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Marks current device as a familiar device using both cookies and localStorage cache.
 */
export function markDeviceAsFamiliar(userId?: string) {
  try {
    const token = generateDeviceToken();
    setCookie(FAMILIAR_COOKIE_NAME, "true", FAMILIAR_DAYS);

    if (typeof window !== "undefined") {
      localStorage.setItem(FAMILIAR_FLAG_KEY, "true");
      localStorage.setItem(FAMILIAR_STORAGE_KEY, token);
      localStorage.setItem("gp_device_timestamp", Date.now().toString());
      if (userId) {
        localStorage.setItem("gp_device_user_id", userId);
      }
    }
    setSessionActive();
  } catch (error) {
    console.error("Failed to mark familiar device:", error);
  }
}

/**
 * Checks whether this device has been registered as familiar.
 * Checks both browser cookie and localStorage cache for resilience.
 */
export function isFamiliarDevice(): boolean {
  try {
    const cookieVal = getCookie(FAMILIAR_COOKIE_NAME);
    let storageVal: string | null = null;
    let tokenVal: string | null = null;

    if (typeof window !== "undefined") {
      storageVal = localStorage.getItem(FAMILIAR_FLAG_KEY);
      tokenVal = localStorage.getItem(FAMILIAR_STORAGE_KEY);
    }

    return Boolean(cookieVal === "true" || storageVal === "true" || tokenVal);
  } catch {
    return false;
  }
}

/**
 * Clears familiar device tokens, cookies, and local session cache.
 */
export function clearFamiliarDevice() {
  try {
    deleteCookie(FAMILIAR_COOKIE_NAME);
    if (typeof window !== "undefined") {
      localStorage.removeItem(FAMILIAR_FLAG_KEY);
      localStorage.removeItem(FAMILIAR_STORAGE_KEY);
      localStorage.removeItem("gp_device_timestamp");
      localStorage.removeItem("gp_device_user_id");
    }
    clearCachedUser();
    clearSessionActive();
  } catch (error) {
    console.error("Failed to clear familiar device:", error);
  }
}

/**
 * Caches user profile in localStorage for instant rendering on familiar devices.
 */
export function setCachedUser(user: IUser) {
  try {
    if (typeof window !== "undefined" && user && user.id) {
      localStorage.setItem(CACHED_USER_KEY, JSON.stringify(user));
    }
  } catch (error) {
    console.error("Failed to cache user:", error);
  }
}

/**
 * Retrieves the cached user profile if present.
 */
export function getCachedUser(): IUser | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(CACHED_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.id) {
      return parsed as IUser;
    }
  } catch (error) {
    console.error("Failed to read cached user:", error);
  }
  return null;
}

/**
 * Clears the cached user profile from localStorage.
 */
export function clearCachedUser() {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem(CACHED_USER_KEY);
    }
  } catch (error) {
    console.error("Failed to clear cached user:", error);
  }
}
