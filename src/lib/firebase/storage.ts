// ============================================================
// Bantayan Hub — Supabase Storage Helpers
// ============================================================

import { supabase } from "@/lib/supabase/client";
import { generateId } from "@/lib/utils/helpers";

const BUCKET_NAME = "bantayan-hive";

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  path: string,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${generateId()}.${ext}`;
  const filePath = `${path}/${fileName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return publicUrl;
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
    const parts = downloadUrl.split(`/public/${BUCKET_NAME}/`);
    if (parts.length > 1) {
      const filePath = decodeURIComponent(parts[1]);
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);
      if (error) throw error;
    }
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
