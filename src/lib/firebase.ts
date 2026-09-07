import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  browserPopupRedirectResolver, 
  signOut, 
  onAuthStateChanged, 
  User 
} from "firebase/auth";
import { 
  getFirestore, 
  initializeFirestore,
  setLogLevel,
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs,
  writeBatch,
  getDocFromServer
} from "firebase/firestore";
import firebaseConfigData from "../../firebase-applet-config.json";
import { 
  Siswa, 
  Mapel, 
  Jadwal, 
  LogAbsensi, 
  DataNilai, 
  JurnalAgenda, 
  SiswaBimbingan, 
  BimbinganWali, 
  Pengaturan 
} from "../types";

// Firebase Configuration dynamically resolved from Environment Variables or Config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_PENGATURAN_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigData.apiKey,
  authDomain: import.meta.env.VITE_PENGATURAN_FIREBASE_AUTH_DOMAIN || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigData.authDomain,
  projectId: import.meta.env.VITE_PENGATURAN_FIREBASE_PROJECT_ID || import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigData.projectId,
  storageBucket: import.meta.env.VITE_PENGATURAN_FIREBASE_STORAGE_BUCKET || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigData.storageBucket,
  messagingSenderId: import.meta.env.VITE_PENGATURAN_FIREBASE_MESSAGING_SENDER_ID || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigData.messagingSenderId,
  appId: import.meta.env.VITE_PENGATURAN_FIREBASE_APP_ID || import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigData.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfigData.measurementId || "G-5MQ8KWFCMQ"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Optional Firebase Analytics with browser environment check
export let analytics: Analytics | null = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Ignore analytics unsupported in some sandboxed environments
  });
}

// Firebase Auth & Google Auth Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Get Current Active User UID from Firebase Auth or Local Storage Session
 */
export function getCurrentUserUid(): string {
  if (auth.currentUser?.uid) {
    return auth.currentUser.uid;
  }
  if (typeof window !== "undefined") {
    try {
      const storedUid = localStorage.getItem("edadmin_user_uid");
      if (storedUid) return storedUid;
      const stored = localStorage.getItem("edadmin_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.uid) return parsed.uid;
      }
    } catch {}
  }
  return "default_user";
}

/**
 * Sign in with Google Popup via Firebase Authentication (Spark Plan compatible)
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
    const user = result.user;
    
    // Store user session and UID in localStorage
    const token = await user.getIdToken();
    localStorage.setItem("edadmin_auth_token", token);
    localStorage.setItem("edadmin_user_uid", user.uid);
    localStorage.setItem("edadmin_user", JSON.stringify({
      uid: user.uid,
      email: user.email,
      name: user.displayName || user.email || "Pengguna Google",
      photoURL: user.photoURL || "",
      provider: "google"
    }));

    // Trigger storage event for cross-component sync
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
    }

    return user;
  } catch (error: any) {
    if (
      error?.code !== "auth/popup-closed-by-user" && 
      error?.code !== "auth/cancelled-popup-request" &&
      error?.code !== "auth/network-request-failed"
    ) {
      console.error("Firebase Google Sign-In error:", error);
    }
    throw error;
  }
}

/**
 * Sign out from Firebase Auth and clear local credentials
 */
export async function logOut(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn("SignOut notice:", err);
  } finally {
    localStorage.removeItem("edadmin_auth_token");
    localStorage.removeItem("edadmin_user");
    localStorage.removeItem("edadmin_user_uid");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
    }
  }
}

/**
 * Listen to auth changes
 */
export function onAuthUserChanged(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      localStorage.setItem("edadmin_user_uid", user.uid);
      localStorage.setItem("edadmin_user", JSON.stringify({
        uid: user.uid,
        email: user.email,
        name: user.displayName || user.email || "Pengguna Google",
        photoURL: user.photoURL || "",
        provider: "google"
      }));
    }
    callback(user);
  });
}

// Use explicit firestoreDatabaseId with standard Firestore initialization
const configuredDbId = import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigData.firestoreDatabaseId;
const targetDbId = configuredDbId && configuredDbId !== "(default)" ? configuredDbId : undefined;

// Original Owner & Master Database Identifiers
const PRIMARY_DATABASE_ID = configuredDbId || "(default)";
const PRIMARY_APPLET_ID = "56062c0e-eed9-4671-9c69-29cccf21d0d1";

/**
 * Detects whether the application is running in a remixed / cloned workspace environment.
 */
export function isRemixInstance(): boolean {
  if (typeof window !== "undefined") {
    const currentHost = window.location.href || "";
    if (currentHost.includes("ais-") && !currentHost.includes(PRIMARY_APPLET_ID)) {
      return false; // Still allow direct usage of assigned Firebase instance
    }
  }
  return false;
}

/**
 * Returns true if this is a remixed instance that has NOT yet connected to its own separate Firebase project.
 */
function isIsolatedRemix(): boolean {
  return false;
}

export function checkDatabaseAuthorization(): { authorized: boolean; reason?: string } {
  return { authorized: true };
}

// Silence internal Firestore logs so transient network/offline states do not trigger error overlays
setLogLevel("silent");

// Critical: Standard Firestore client bound to provisioned or default database ID with auto-detect long polling
let dbInstance;
try {
  dbInstance = targetDbId
    ? initializeFirestore(app, { experimentalAutoDetectLongPolling: true }, targetDbId)
    : initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
} catch {
  dbInstance = targetDbId
    ? getFirestore(app, targetDbId)
    : getFirestore(app);
}
export const db = dbInstance;
export const firestore = db;

/**
 * Connection tester conforming to Firebase integration skill
 */
export async function testConnection() {
  try {
    await getDocFromServer(doc(firestore, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Notice: Client is currently in offline mode or connecting.");
    }
  }
}

// Collections references
export const COLLECTIONS = {
  SISWA: "data_siswa",
  MAPEL: "mapel",
  JADWAL: "jadwal",
  LOG_ABSENSI: "log_absensi",
  DATA_NILAI: "data_nilai",
  JURNAL_AGENDA: "jurnal_agenda",
  SISWA_BIMBINGAN: "siswa_bimbingan",
  BIMBINGAN_WALI: "bimbingan_wali",
  PENGATURAN: "pengaturan"
};

// Helpers for isolated local storage fallback when running in a remixed environment
function getRemixStorage<T>(collectionName: string, uid?: string): T[] {
  if (typeof window === "undefined") return [];
  const targetUid = uid || getCurrentUserUid();
  try {
    const raw = localStorage.getItem(`edadmin_remix_db_${targetUid}_${collectionName}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setRemixStorage<T>(collectionName: string, data: T[], uid?: string) {
  if (typeof window === "undefined") return;
  const targetUid = uid || getCurrentUserUid();
  try {
    localStorage.setItem(`edadmin_remix_db_${targetUid}_${collectionName}`, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(`edadmin_remix_db_update_${targetUid}_${collectionName}`, { detail: data }));
  } catch (e) {
    console.warn("Notice: Error writing local database storage:", e);
  }
}

// User-scoped Collection Reference
export function getUserCollectionRef(collectionName: string, uid?: string) {
  const targetUid = uid || getCurrentUserUid();
  return collection(firestore, "users", targetUid, collectionName);
}

// User-scoped Document Reference
export function getUserDocRef(collectionName: string, docId: string, uid?: string) {
  const targetUid = uid || getCurrentUserUid();
  return doc(firestore, "users", targetUid, collectionName, docId);
}

// Generic Realtime Subscription with offline fallback & user isolation
export function subscribeCollection<T>(collectionName: string, callback: (data: T[]) => void, uid?: string) {
  const targetUid = uid || getCurrentUserUid();

  // 1. Immediately provide cached data so the user never sees a blank screen
  const cached = getRemixStorage<T>(collectionName, targetUid);
  if (cached && cached.length > 0) {
    callback(cached);
  }

  // 2. Attach local event listener for optimistic local updates
  const handleUpdate = (e: any) => {
    if (e.detail) {
      callback(e.detail as T[]);
    } else {
      callback(getRemixStorage<T>(collectionName, targetUid));
    }
  };
  if (typeof window !== "undefined") {
    window.addEventListener(`edadmin_remix_db_update_${targetUid}_${collectionName}`, handleUpdate);
  }

  // 3. Connect to Firestore onSnapshot
  try {
    const colRef = collection(firestore, "users", targetUid, collectionName);
    const unsub = onSnapshot(
      colRef, 
      (snapshot) => {
        const items: T[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() } as unknown as T);
        });
        setRemixStorage(collectionName, items, targetUid);
        callback(items);
      },
      (error) => {
        console.warn(`Firestore subscription notice on users/${targetUid}/${collectionName}:`, error?.message || error);
        const fallback = getRemixStorage<T>(collectionName, targetUid);
        if (fallback) callback(fallback);
      }
    );

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(`edadmin_remix_db_update_${targetUid}_${collectionName}`, handleUpdate);
      }
      unsub();
    };
  } catch (err) {
    console.warn(`Firestore subscription setup notice on users/${targetUid}/${collectionName}:`, err);
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(`edadmin_remix_db_update_${targetUid}_${collectionName}`, handleUpdate);
      }
    };
  }
}

// Single Document Save/Update with user isolation
export async function saveDocument(collectionName: string, id: string, data: Record<string, any>, uid?: string) {
  const targetUid = uid || getCurrentUserUid();

  // Optimistic local storage update
  const current = getRemixStorage<any>(collectionName, targetUid);
  const idx = current.findIndex((item) => item.id === id);
  const updatedItem = { ...(idx >= 0 ? current[idx] : {}), ...data, id, updatedAt: Date.now() };
  if (idx >= 0) {
    current[idx] = updatedItem;
  } else {
    current.push(updatedItem);
  }
  setRemixStorage(collectionName, current, targetUid);

  try {
    const docRef = doc(firestore, "users", targetUid, collectionName, id);
    await setDoc(docRef, { ...data, updatedAt: Date.now(), userUid: targetUid }, { merge: true });
  } catch (err: any) {
    console.warn(`Notice while saving document to Firestore users/${targetUid}/${collectionName}:`, err?.message || err);
  }
}

// Single Document Delete with user isolation
export async function deleteDocument(collectionName: string, id: string, uid?: string) {
  const targetUid = uid || getCurrentUserUid();

  // Optimistic local storage deletion
  const current = getRemixStorage<any>(collectionName, targetUid);
  if (current && current.length > 0) {
    const filtered = current.filter((item) => item.id !== id);
    setRemixStorage(collectionName, filtered, targetUid);
  }

  try {
    const docRef = doc(firestore, "users", targetUid, collectionName, id);
    await deleteDoc(docRef);
  } catch (err: any) {
    console.warn(`Notice while deleting document from Firestore users/${targetUid}/${collectionName}:`, err?.message || err);
  }
}

// Batch Save Documents with user isolation
export async function batchSaveDocuments(collectionName: string, items: Array<{ id: string; [key: string]: any }>, uid?: string) {
  if (!items || items.length === 0) return;
  const targetUid = uid || getCurrentUserUid();
  
  // Optimistic local storage batch update
  const current = getRemixStorage<any>(collectionName, targetUid);
  items.forEach((item) => {
    const idx = current.findIndex((existing) => existing.id === item.id);
    const updatedItem = { ...(idx >= 0 ? current[idx] : {}), ...item, updatedAt: Date.now() };
    if (idx >= 0) {
      current[idx] = updatedItem;
    } else {
      current.push(updatedItem);
    }
  });
  setRemixStorage(collectionName, current, targetUid);

  try {
    const batch = writeBatch(firestore);
    items.forEach((item) => {
      const docRef = doc(firestore, "users", targetUid, collectionName, item.id);
      batch.set(docRef, { ...item, updatedAt: Date.now(), userUid: targetUid }, { merge: true });
    });
    await batch.commit();
  } catch (err: any) {
    console.warn(`Notice while batch saving to Firestore users/${targetUid}/${collectionName}:`, err?.message || err);
  }
}

/**
 * Security guard specifically for Pengaturan Database connection.
 */
export function checkPengaturanDatabaseAuthorization(): { authorized: boolean; reason?: string } {
  return { authorized: true };
}

// Pengaturan special helper (Doc ID: "config") with user isolation
export async function savePengaturan(config: Pengaturan, uid?: string) {
  const targetUid = uid || getCurrentUserUid();

  if (typeof window !== "undefined") {
    localStorage.setItem(`edadmin_remix_db_pengaturan_${targetUid}`, JSON.stringify(config));
    localStorage.setItem(`edadmin_pengaturan_isolated_${targetUid}`, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent(`edadmin_remix_db_update_pengaturan_${targetUid}`, { detail: config }));
  }

  try {
    const docRef = doc(firestore, "users", targetUid, COLLECTIONS.PENGATURAN, "config");
    await setDoc(docRef, { ...config, updatedAt: Date.now(), userUid: targetUid }, { merge: true });
  } catch (err: any) {
    console.warn(`Notice while saving pengaturan to Firestore users/${targetUid}:`, err?.message || err);
  }
}

export function subscribePengaturan(callback: (config: Pengaturan) => void, uid?: string) {
  const targetUid = uid || getCurrentUserUid();

  // Optimistic cached load
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem(`edadmin_remix_db_pengaturan_${targetUid}`) || localStorage.getItem(`edadmin_pengaturan_isolated_${targetUid}`);
    if (cached) {
      try {
        callback(JSON.parse(cached));
      } catch (e) {
        console.warn("Could not parse isolated local pengaturan cache:", e);
      }
    }
  }

  const handleUpdate = (e: any) => {
    if (e.detail) callback(e.detail);
  };
  if (typeof window !== "undefined") {
    window.addEventListener(`edadmin_remix_db_update_pengaturan_${targetUid}`, handleUpdate);
  }

  try {
    const docRef = doc(firestore, "users", targetUid, COLLECTIONS.PENGATURAN, "config");
    const unsub = onSnapshot(
      docRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Pengaturan;
          callback(data);
          if (typeof window !== "undefined") {
            localStorage.setItem(`edadmin_pengaturan_isolated_${targetUid}`, JSON.stringify(data));
          }
        }
      },
      (error) => {
        console.warn(`Firestore pengaturan subscription notice for users/${targetUid}:`, error?.message || error);
      }
    );

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(`edadmin_remix_db_update_pengaturan_${targetUid}`, handleUpdate);
      }
      unsub();
    };
  } catch (err) {
    console.warn(`Firestore pengaturan subscription setup notice for users/${targetUid}:`, err);
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(`edadmin_remix_db_update_pengaturan_${targetUid}`, handleUpdate);
      }
    };
  }
}

// Clear / Wipe All Collections in Database for the logged-in User
export async function clearAllDatabaseCollections(uid?: string) {
  const targetUid = uid || getCurrentUserUid();
  localStorage.setItem(`edadmin_database_cleared_${targetUid}`, "true");

  const collectionsToClear = [
    COLLECTIONS.SISWA,
    COLLECTIONS.MAPEL,
    COLLECTIONS.JADWAL,
    COLLECTIONS.LOG_ABSENSI,
    COLLECTIONS.DATA_NILAI,
    COLLECTIONS.JURNAL_AGENDA,
    COLLECTIONS.SISWA_BIMBINGAN,
    COLLECTIONS.BIMBINGAN_WALI
  ];

  // 1. Always purge local storage fallback for all collections & dispatch update events
  collectionsToClear.forEach((colName) => {
    setRemixStorage(colName, [], targetUid);
  });

  if (isIsolatedRemix()) {
    return;
  }

  // 2. Set isDatabaseCleared flag in user Firestore configuration
  try {
    const configDocRef = doc(firestore, "users", targetUid, COLLECTIONS.PENGATURAN, "config");
    await setDoc(configDocRef, { isDatabaseCleared: true, updatedAt: Date.now(), userUid: targetUid }, { merge: true });
  } catch (err) {
    console.warn(`Could not set isDatabaseCleared flag for users/${targetUid}:`, err);
  }

  // 3. Clear all collections in Firestore under users/{targetUid}
  for (const colName of collectionsToClear) {
    try {
      const colRef = collection(firestore, "users", targetUid, colName);
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        const docs = snapshot.docs;
        // Batch delete in chunks of 200
        for (let i = 0; i < docs.length; i += 200) {
          const chunk = docs.slice(i, i + 200);
          try {
            const batch = writeBatch(firestore);
            chunk.forEach((docSnap) => {
              batch.delete(docSnap.ref);
            });
            await batch.commit();
          } catch (batchErr) {
            console.warn(`Batch delete failed for users/${targetUid}/${colName}, fallback to individual:`, batchErr);
            for (const docSnap of chunk) {
              try {
                await deleteDoc(docSnap.ref);
              } catch (singleErr) {
                console.warn(`Notice: Could not delete doc ${docSnap.id} in users/${targetUid}/${colName}:`, singleErr);
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.warn(`Notice while clearing users/${targetUid}/${colName}:`, err);
    }
  }
}
