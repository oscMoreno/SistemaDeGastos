'use client';

import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
