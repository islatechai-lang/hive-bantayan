// ============================================================
// Bantayan Hub — Firebase Storage Helpers
// ============================================================

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "./config";
import { generateId } from "@/lib/utils/helpers";

/**
 * Upload a file to Firebase Storage
 */
export async function uploadFile(
  path: string,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${generateId()}.${ext}`;
  const storageRef = ref(storage, `${path}/${fileName}`);

  await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(storageRef);
  return downloadUrl;
}

/**
 * Upload multiple files
 */
export async function uploadMultipleFiles(
  path: string,
  files: File[]
): Promise<string[]> {
  const uploads = files.map((file) => uploadFile(path, file));
  return Promise.all(uploads);
}

/**
 * Delete a file from Storage by its download URL
 */
export async function deleteFile(downloadUrl: string): Promise<void> {
  try {
    const storageRef = ref(storage, downloadUrl);
    await deleteObject(storageRef);
  } catch (error) {
    console.error("Error deleting file:", error);
  }
}

/**
 * Upload a business logo
 */
export async function uploadBusinessLogo(
  businessId: string,
  file: File
): Promise<string> {
  return uploadFile(`businesses/${businessId}/logo`, file);
}

/**
 * Upload a business cover photo
 */
export async function uploadBusinessCover(
  businessId: string,
  file: File
): Promise<string> {
  return uploadFile(`businesses/${businessId}/cover`, file);
}

/**
 * Upload product images
 */
export async function uploadProductImages(
  businessId: string,
  productId: string,
  files: File[]
): Promise<string[]> {
  return uploadMultipleFiles(
    `businesses/${businessId}/products/${productId}`,
    files
  );
}

/**
 * Upload review photos
 */
export async function uploadReviewPhotos(
  reviewId: string,
  files: File[]
): Promise<string[]> {
  return uploadMultipleFiles(`reviews/${reviewId}`, files);
}

/**
 * Upload feed post images
 */
export async function uploadFeedImages(
  postId: string,
  files: File[]
): Promise<string[]> {
  return uploadMultipleFiles(`feed/${postId}`, files);
}

/**
 * Upload chat image
 */
export async function uploadChatImage(
  chatId: string,
  file: File
): Promise<string> {
  return uploadFile(`chats/${chatId}`, file);
}
