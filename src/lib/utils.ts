import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const convertFileToUrl = (file: File) => URL.createObjectURL(file);

export function formatDateString(dateString: string) {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };

  const date = new Date(dateString);
  const formattedDate = date.toLocaleDateString("en-US", options);

  const time = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${formattedDate} at ${time}`;
}
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = Math.floor(seconds / 31536000);
  if (interval > 1) return interval + " years ago";

  interval = Math.floor(seconds / 2592000);
  if (interval > 1) return interval + " months ago";

  interval = Math.floor(seconds / 86400);
  if (interval > 1) return interval + " days ago";

  interval = Math.floor(seconds / 3600);
  if (interval > 1) return interval + " hours ago";

  interval = Math.floor(seconds / 60);
  if (interval > 1) return interval + " minutes ago";

  return "Just now";
}

// Usage example

//
export const multiFormatDateString = (timestamp: string = ""): string => {
  const timestampNum = Math.round(new Date(timestamp).getTime() / 1000);
  const date: Date = new Date(timestampNum * 1000);
  const now: Date = new Date();

  const diff: number = now.getTime() - date.getTime();
  const diffInSeconds: number = diff / 1000;
  const diffInMinutes: number = diffInSeconds / 60;
  const diffInHours: number = diffInMinutes / 60;
  const diffInDays: number = diffInHours / 24;

  switch (true) {
    case Math.floor(diffInDays) >= 30:
      return formatDateString(timestamp);
    case Math.floor(diffInDays) === 1:
      return `${Math.floor(diffInDays)} day ago`;
    case Math.floor(diffInDays) > 1 && diffInDays < 30:
      return `${Math.floor(diffInDays)} days ago`;
    case Math.floor(diffInHours) >= 1:
      return `${Math.floor(diffInHours)} hours ago`;
    case Math.floor(diffInMinutes) >= 1:
      return `${Math.floor(diffInMinutes)} minutes ago`;
    default:
      return "Just now";
  }
};

export const checkIsLiked = (likeList: string[], userId: string) => {
  return likeList.includes(userId);
};

export const getFirebaseErrorMessage = (error: any): string => {
  const code = error?.code || "";
  const message = error?.message || "";

  if (code === "auth/operation-not-allowed" || message.includes("operation-not-allowed")) {
    return "Email/Password sign-in is not enabled in Firebase Console (Go to Authentication > Sign-in method > Email/Password > Enable).";
  }
  if (code === "auth/email-already-in-use" || message.includes("email-already-in-use")) {
    return "This email is already in use. Please sign in instead.";
  }
  if (code === "auth/invalid-email" || message.includes("invalid-email")) {
    return "The email address is invalid.";
  }
  if (code === "auth/weak-password" || message.includes("weak-password")) {
    return "Password is too weak. Please use at least 6 characters.";
  }
  if (
    code === "auth/user-not-found" ||
    code === "auth/wrong-password" ||
    code === "auth/invalid-credential" ||
    message.includes("invalid-credential")
  ) {
    return "Invalid email or password.";
  }
  if (code === "auth/too-many-requests") {
    return "Access to this account has been temporarily disabled due to many failed login attempts. Try again later.";
  }
  if (code === "permission-denied" || message.includes("PERMISSION_DENIED")) {
    return "Firestore permission denied. Please check your Firestore Security Rules in Firebase Console.";
  }

  return message || "An unexpected error occurred. Please try again.";
};

