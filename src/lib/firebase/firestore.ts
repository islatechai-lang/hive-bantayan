// ============================================================
// Bantayan Hub — Firestore CRUD Helpers
// ============================================================

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  type DocumentData,
  type QueryConstraint,
  type DocumentSnapshot,
  type QuerySnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./config";

/**
 * Get a single document by ID
 */
export async function getDocument<T>(
  collectionName: string,
  docId: string
): Promise<T | null> {
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as T;
}

/**
 * Get multiple documents with optional query constraints
 */
export async function getDocuments<T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  const q = query(collection(db, collectionName), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T);
}

/**
 * Get paginated documents
 */
export async function getPaginatedDocuments<T>(
  collectionName: string,
  constraints: QueryConstraint[],
  pageSize: number,
  lastDoc?: DocumentSnapshot
): Promise<{ data: T[]; lastDoc: DocumentSnapshot | null; hasMore: boolean }> {
  const allConstraints = [...constraints, limit(pageSize + 1)];
  if (lastDoc) allConstraints.push(startAfter(lastDoc));

  const q = query(collection(db, collectionName), ...allConstraints);
  const snapshot = await getDocs(q);

  const hasMore = snapshot.docs.length > pageSize;
  const docs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs;
  const data = docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T);
  const newLastDoc = docs.length > 0 ? docs[docs.length - 1] : null;

  return { data, lastDoc: newLastDoc, hasMore };
}

/**
 * Add a new document (auto-generated ID)
 */
export async function addDocument(
  collectionName: string,
  data: DocumentData
): Promise<string> {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Set a document with a specific ID
 */
export async function setDocument(
  collectionName: string,
  docId: string,
  data: DocumentData,
  merge = true
): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  await setDoc(docRef, data, { merge });
}

/**
 * Update specific fields in a document
 */
export async function updateDocument(
  collectionName: string,
  docId: string,
  data: Partial<DocumentData>
): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
}

/**
 * Delete a document
 */
export async function removeDocument(
  collectionName: string,
  docId: string
): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  await deleteDoc(docRef);
}

/**
 * Subscribe to real-time updates on a single document
 */
export function subscribeToDocument<T>(
  collectionName: string,
  docId: string,
  callback: (data: T | null) => void
): Unsubscribe {
  const docRef = doc(db, collectionName, docId);
  return onSnapshot(docRef, (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    callback({ id: snap.id, ...snap.data() } as T);
  });
}

/**
 * Subscribe to real-time updates on a collection query
 */
export function subscribeToCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[],
  callback: (data: T[]) => void
): Unsubscribe {
  const q = query(collection(db, collectionName), ...constraints);
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T);
    callback(data);
  });
}

/**
 * Subscribe to a subcollection
 */
export function subscribeToSubcollection<T>(
  parentCollection: string,
  parentId: string,
  subcollection: string,
  constraints: QueryConstraint[],
  callback: (data: T[]) => void
): Unsubscribe {
  const q = query(
    collection(db, parentCollection, parentId, subcollection),
    ...constraints
  );
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T);
    callback(data);
  });
}

// Re-export commonly used Firestore utilities
export {
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  collection,
  doc,
  query,
};
