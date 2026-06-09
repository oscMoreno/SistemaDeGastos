'use client';

import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirebaseApp } from './config';
import { getFirebaseAuth } from './auth';

export async function uploadReceiptImage(file: File): Promise<{ downloadURL: string; storagePath: string }> {
  const auth = getFirebaseAuth();
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');

  const storage = getStorage(getFirebaseApp());
  const timestamp = Date.now();
  const ext = file.name.split('.').pop() || 'jpg';
  const storagePath = `receipts/${userId}/${timestamp}.${ext}`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return { downloadURL, storagePath };
}

export function getStoragePathFromUrl(imageUrl: string): string {
  return decodeURIComponent(imageUrl.split('/o/')[1].split('?')[0]);
}

export async function deleteStorageFile(imageUrl: string): Promise<void> {
  const storage = getStorage(getFirebaseApp());
  const path = getStoragePathFromUrl(imageUrl);
  await deleteObject(ref(storage, path));
}
