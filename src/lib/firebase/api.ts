import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

import { auth, db, storage } from "./config";
import {
  INewPost,
  INewUser,
  IUpdatePost,
  IUpdateUser,
  Models,
} from "@/types";

// ============================================================
// HELPERS
// ============================================================

function formatPostDoc(d: DocumentSnapshot): Models.Document {
  const data = d.data() || {};
  return {
    $id: d.id,
    id: d.id,
    ...data,
    $createdAt: data.createdAt || data.$createdAt || new Date().toISOString(),
    $updatedAt: data.updatedAt || data.$updatedAt || new Date().toISOString(),
    caption: data.caption || "",
    imageUrl: data.imageUrl || "",
    imageId: data.imageId || "",
    location: data.location || "",
    tags: Array.isArray(data.tags) ? data.tags : [],
    creator: data.creator || {
      $id: data.creatorId || "",
      name: "User",
      username: "user",
      imageUrl: "/assets/icons/profile-placeholder.svg",
    },
    likes: (data.likes || []).map((userOrId: any) =>
      typeof userOrId === "string" ? { $id: userOrId } : userOrId
    ),
  };
}

// ============================================================
// AUTH
// ============================================================

// ============================== SIGN UP
export async function createUserAccount(user: INewUser) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      user.email,
      user.password
    );

    const avatarUrl =
      user.imageUrl ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user.name
      )}&background=random`;

    await updateProfile(userCredential.user, {
      displayName: user.name,
      photoURL: avatarUrl,
    });

    const newUser = await saveUserToDB({
      accountId: userCredential.user.uid,
      name: user.name,
      email: user.email,
      username: user.username,
      imageUrl: avatarUrl,
    });

    return newUser;
  } catch (error) {
    console.error("Error creating user account:", error);
    throw error;
  }
}

// ============================== SAVE USER TO DB
export async function saveUserToDB(user: {
  accountId: string;
  email: string;
  name: string;
  imageUrl: string | URL;
  username?: string;
}) {
  try {
    const userDocRef = doc(db, "users", user.accountId);
    const userData = {
      $id: user.accountId,
      accountId: user.accountId,
      name: user.name,
      email: user.email,
      username: user.username || user.email.split("@")[0],
      imageUrl:
        typeof user.imageUrl === "string"
          ? user.imageUrl
          : user.imageUrl.toString(),
      bio: "",
      $createdAt: new Date().toISOString(),
    };

    await setDoc(userDocRef, userData, { merge: true });
    return userData;
  } catch (error) {
    console.error("Error saving user to DB:", error);
    throw error;
  }
}

// ============================== SIGN IN
export async function signInAccount(user: { email: string; password: string }) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      user.email,
      user.password
    );

    return userCredential;
  } catch (error) {
    console.error("Sign in error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Authentication failed"
    );
  }
}

// ============================== GET ACCOUNT
export async function getAccount(): Promise<User | null> {
  if (auth.currentUser) return auth.currentUser;

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

// ============================== GET CURRENT USER
export async function getCurrentUser(): Promise<Models.Document | null> {
  try {
    const currentAccount = await getAccount();
    if (!currentAccount) return null;

    const userDocRef = doc(db, "users", currentAccount.uid);
    const userDoc = await getDoc(userDocRef);

    let userData: any;
    if (!userDoc.exists()) {
      userData = await saveUserToDB({
        accountId: currentAccount.uid,
        email: currentAccount.email || "",
        name: currentAccount.displayName || "User",
        imageUrl:
          currentAccount.photoURL ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            currentAccount.displayName || "User"
          )}&background=random`,
      });
    } else {
      userData = userDoc.data();
    }

    // Fetch saves for current user
    const savesList: any[] = [];
    try {
      const savesQuery = query(
        collection(db, "saves"),
        where("user", "==", currentAccount.uid)
      );
      const savesSnapshot = await getDocs(savesQuery);
      for (const saveDoc of savesSnapshot.docs) {
        const sData = saveDoc.data();
        let postData: any = null;
        if (sData.post) {
          if (typeof sData.post === "object") {
            postData = sData.post;
          } else {
            const pDoc = await getDoc(doc(db, "posts", sData.post));
            if (pDoc.exists()) {
              postData = formatPostDoc(pDoc);
            }
          }
        }
        savesList.push({
          $id: saveDoc.id,
          user: sData.user,
          post: postData || { $id: sData.post },
          $createdAt: sData.createdAt || new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn("Could not fetch saves for current user:", e);
    }

    // Fetch liked posts for current user
    const likedList: any[] = [];
    try {
      const likedQuery = query(
        collection(db, "posts"),
        where("likes", "array-contains", currentAccount.uid)
      );
      const likedSnapshot = await getDocs(likedQuery);
      likedSnapshot.docs.forEach((d) => likedList.push(formatPostDoc(d)));
    } catch (e) {
      console.warn("Could not fetch liked posts for current user:", e);
    }

    // Fetch user's own posts
    const userPostsList: any[] = [];
    try {
      const userPostsQuery = query(
        collection(db, "posts"),
        where("creatorId", "==", currentAccount.uid)
      );
      const userPostsSnapshot = await getDocs(userPostsQuery);
      userPostsSnapshot.docs.forEach((d) =>
        userPostsList.push(formatPostDoc(d))
      );
    } catch (e) {
      console.warn("Could not fetch user posts:", e);
    }

    return {
      $id: currentAccount.uid,
      id: currentAccount.uid,
      ...userData,
      save: savesList,
      liked: likedList,
      posts: userPostsList,
    };
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    return null;
  }
}

// ============================== SIGN OUT
export async function signOutAccount() {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
}

// ============================================================
// STORAGE / FILES
// ============================================================

export async function uploadFile(file: File) {
  try {
    const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
    const fileId = `${Date.now()}_${safeName}`;
    const storageRef = ref(storage, `uploads/${fileId}`);
    const uploadResult = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(uploadResult.ref);

    return {
      $id: uploadResult.ref.fullPath,
      name: file.name,
      url: downloadUrl,
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

export function getFilePreview(fileId: string) {
  return fileId;
}

export async function deleteFile(fileId: string) {
  if (!fileId) return { status: "ok" };
  try {
    const storageRef = fileId.startsWith("http")
      ? ref(storage, fileId)
      : ref(storage, fileId);
    await deleteObject(storageRef).catch((e) => {
      console.warn("File already removed or not found in storage:", e);
    });
    return { status: "ok" };
  } catch (error) {
    console.warn("Error deleting file:", error);
    return { status: "ok" };
  }
}

// ============================================================
// POSTS
// ============================================================

export async function createPost(post: INewPost) {
  try {
    if (!post.file?.length) throw new Error("No file provided");

    const uploaded = await uploadFile(post.file[0]);
    if (!uploaded) throw new Error("File upload failed");

    // Retrieve creator info
    let creatorData: any = {
      $id: post.userId,
      name: "User",
      username: "user",
      imageUrl: "/assets/icons/profile-placeholder.svg",
    };

    try {
      const userDoc = await getDoc(doc(db, "users", post.userId));
      if (userDoc.exists()) {
        const u = userDoc.data();
        creatorData = {
          $id: userDoc.id,
          name: u.name || "User",
          username: u.username || "user",
          imageUrl: u.imageUrl || "/assets/icons/profile-placeholder.svg",
        };
      }
    } catch (e) {
      console.warn("Could not fetch user details for post:", e);
    }

    const tags = post.tags?.replace(/ /g, "").split(",") || [];
    const now = new Date().toISOString();

    const postData = {
      creator: creatorData,
      creatorId: post.userId,
      caption: post.caption,
      imageUrl: uploaded.url,
      imageId: uploaded.$id,
      location: post.location || "",
      tags: tags,
      likes: [],
      createdAt: now,
      updatedAt: now,
      $createdAt: now,
      $updatedAt: now,
    };

    const docRef = await addDoc(collection(db, "posts"), postData);

    return {
      $id: docRef.id,
      ...postData,
    };
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
}

export async function getPostById(postId?: string) {
  if (!postId) throw new Error("No post ID provided");

  try {
    const postDoc = await getDoc(doc(db, "posts", postId));
    if (!postDoc.exists()) throw new Error("Post not found");

    return formatPostDoc(postDoc);
  } catch (error) {
    console.error("Error getting post by ID:", error);
    throw error;
  }
}

export async function updatePost(post: IUpdatePost) {
  const hasFileToUpdate = post.file?.length > 0;

  try {
    let image = {
      imageUrl: post.imageUrl,
      imageId: post.imageId,
    };

    if (hasFileToUpdate) {
      const uploaded = await uploadFile(post.file[0]);
      if (!uploaded) throw new Error("File upload failed");
      image = {
        imageUrl: uploaded.url,
        imageId: uploaded.$id,
      };
    }

    const tags = post.tags?.replace(/ /g, "").split(",") || [];
    const now = new Date().toISOString();

    const postDocRef = doc(db, "posts", post.postId);
    const updateData: any = {
      caption: post.caption,
      imageUrl: image.imageUrl,
      imageId: image.imageId,
      location: post.location || "",
      tags: tags,
      updatedAt: now,
      $updatedAt: now,
    };

    await updateDoc(postDocRef, updateData);

    if (hasFileToUpdate && post.imageId) {
      await deleteFile(post.imageId);
    }

    const updatedDoc = await getDoc(postDocRef);
    return formatPostDoc(updatedDoc);
  } catch (error) {
    console.error("Error updating post:", error);
    throw error;
  }
}

export async function deletePost(postId?: string, imageId?: string) {
  if (!postId) return;

  try {
    await deleteDoc(doc(db, "posts", postId));

    if (imageId) {
      await deleteFile(imageId);
    }

    // Clean up saves associated with this post
    try {
      const savesQuery = query(
        collection(db, "saves"),
        where("post", "==", postId)
      );
      const savesSnap = await getDocs(savesQuery);
      savesSnap.forEach((d) => deleteDoc(d.ref));
    } catch (e) {
      console.warn("Could not clean up saves for post:", e);
    }

    return { status: "Ok" };
  } catch (error) {
    console.error("Error deleting post:", error);
    throw error;
  }
}

export async function likePost(postId: string, likesArray: string[]) {
  try {
    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, {
      likes: likesArray,
    });

    const updatedDoc = await getDoc(postRef);
    return formatPostDoc(updatedDoc);
  } catch (error) {
    console.error("Error liking post:", error);
    throw error;
  }
}

export async function savePost(userId: string, postId: string) {
  try {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, "saves"), {
      user: userId,
      post: postId,
      createdAt: now,
    });

    return {
      $id: docRef.id,
      user: userId,
      post: postId,
      $createdAt: now,
    };
  } catch (error) {
    console.error("Error saving post:", error);
    throw error;
  }
}

export async function deleteSavedPost(savedRecordId: string) {
  try {
    await deleteDoc(doc(db, "saves", savedRecordId));
    return { status: "Ok" };
  } catch (error) {
    console.error("Error deleting saved post:", error);
    throw error;
  }
}

export async function getRecentPosts(): Promise<Models.DocumentList> {
  try {
    const postsQuery = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    const snap = await getDocs(postsQuery);
    const documents = snap.docs.map(formatPostDoc);
    return { documents, total: documents.length };
  } catch (error) {
    console.warn("Fallback query for recent posts:", error);
    try {
      const snap = await getDocs(collection(db, "posts"));
      const documents = snap.docs
        .map(formatPostDoc)
        .sort((a, b) =>
          (b.$createdAt || "").localeCompare(a.$createdAt || "")
        );
      return { documents, total: documents.length };
    } catch (e) {
      return { documents: [], total: 0 };
    }
  }
}

export async function getInfinitePosts({
  pageParam,
}: {
  pageParam?: string | number;
}): Promise<Models.DocumentList> {
  try {
    let postsQuery;
    if (pageParam) {
      const cursorDoc = await getDoc(doc(db, "posts", pageParam.toString()));
      if (cursorDoc.exists()) {
        postsQuery = query(
          collection(db, "posts"),
          orderBy("createdAt", "desc"),
          startAfter(cursorDoc),
          limit(9)
        );
      } else {
        postsQuery = query(
          collection(db, "posts"),
          orderBy("createdAt", "desc"),
          limit(9)
        );
      }
    } else {
      postsQuery = query(
        collection(db, "posts"),
        orderBy("createdAt", "desc"),
        limit(9)
      );
    }

    const snap = await getDocs(postsQuery);
    const documents = snap.docs.map(formatPostDoc);
    return { documents, total: documents.length };
  } catch (error) {
    console.warn("Fallback query for infinite posts:", error);
    try {
      const snap = await getDocs(collection(db, "posts"));
      const documents = snap.docs
        .map(formatPostDoc)
        .sort((a, b) =>
          (b.$createdAt || "").localeCompare(a.$createdAt || "")
        );
      return { documents, total: documents.length };
    } catch (e) {
      return { documents: [], total: 0 };
    }
  }
}

export async function searchPosts(
  searchTerm: string
): Promise<Models.DocumentList> {
  try {
    const snap = await getDocs(collection(db, "posts"));
    const term = (searchTerm || "").toLowerCase().trim();
    const documents = snap.docs
      .map(formatPostDoc)
      .filter((post) => {
        if (!term) return true;
        const captionMatch = (post.caption || "").toLowerCase().includes(term);
        const tagsMatch = (post.tags || []).some((tag: string) =>
          tag.toLowerCase().includes(term)
        );
        const locationMatch = (post.location || "")
          .toLowerCase()
          .includes(term);
        return captionMatch || tagsMatch || locationMatch;
      });

    return { documents, total: documents.length };
  } catch (error) {
    console.error("Error searching posts:", error);
    throw error;
  }
}

export async function getUserPosts(
  userId?: string
): Promise<Models.DocumentList | undefined> {
  if (!userId) return undefined;
  try {
    const q = query(
      collection(db, "posts"),
      where("creatorId", "==", userId)
    );
    const snap = await getDocs(q);
    const documents = snap.docs
      .map(formatPostDoc)
      .sort((a, b) =>
        (b.$createdAt || "").localeCompare(a.$createdAt || "")
      );
    return { documents, total: documents.length };
  } catch (error) {
    console.error("Error getting user posts:", error);
    throw error;
  }
}

// ============================================================
// USERS
// ============================================================

export async function getUsers(
  limitCount?: number
): Promise<Models.DocumentList> {
  try {
    const q = limitCount
      ? query(collection(db, "users"), limit(limitCount))
      : collection(db, "users");
    const snap = await getDocs(q);
    const documents = snap.docs.map((d) => {
      const data = d.data() || {};
      return {
        $id: d.id,
        id: d.id,
        $createdAt: data.$createdAt || data.createdAt || new Date().toISOString(),
        $updatedAt: data.$updatedAt || data.updatedAt || new Date().toISOString(),
        ...data,
      };
    });
    return { documents, total: documents.length };
  } catch (error) {
    console.error("Error getting users:", error);
    throw error;
  }
}

export async function getUserById(
  userId: string
): Promise<Models.Document | undefined> {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) throw new Error("User not found");

    const postsQuery = query(
      collection(db, "posts"),
      where("creatorId", "==", userId)
    );
    const postsSnap = await getDocs(postsQuery);
    const posts = postsSnap.docs.map(formatPostDoc);
    const data = userDoc.data() || {};

    return {
      $id: userDoc.id,
      id: userDoc.id,
      $createdAt: data.$createdAt || data.createdAt || new Date().toISOString(),
      $updatedAt: data.$updatedAt || data.updatedAt || new Date().toISOString(),
      ...data,
      posts,
    };
  } catch (error) {
    console.error("Error getting user by ID:", error);
    throw error;
  }
}

export async function updateUser(
  user: IUpdateUser
): Promise<Models.Document | undefined> {
  const hasFileToUpdate = user.file?.length > 0;
  try {
    let image = {
      imageUrl: user.imageUrl,
      imageId: user.imageId,
    };

    if (hasFileToUpdate) {
      const uploaded = await uploadFile(user.file[0]);
      if (!uploaded) throw new Error("File upload failed");
      image = {
        imageUrl: uploaded.url,
        imageId: uploaded.$id,
      };
    }

    const userDocRef = doc(db, "users", user.userId);
    const now = new Date().toISOString();
    const updateData: any = {
      name: user.name,
      bio: user.bio,
      imageUrl: image.imageUrl,
      imageId: image.imageId,
      updatedAt: now,
      $updatedAt: now,
    };

    await updateDoc(userDocRef, updateData);

    if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: user.name,
        photoURL: image.imageUrl,
      });
    }

    if (user.imageId && hasFileToUpdate) {
      await deleteFile(user.imageId);
    }

    const updatedDoc = await getDoc(userDocRef);
    const data = updatedDoc.data() || {};
    return {
      $id: updatedDoc.id,
      $createdAt: data.createdAt || data.$createdAt || now,
      $updatedAt: data.updatedAt || data.$updatedAt || now,
      name: data.name || "",
      bio: data.bio || "",
      imageUrl: data.imageUrl || "",
      ...data,
    };
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}
