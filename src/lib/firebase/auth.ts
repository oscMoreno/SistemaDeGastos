import { getAuth, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { getFirebaseApp } from './config';

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

export async function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(getFirebaseAuth(), email, password);
}

export async function signOut() {
  return firebaseSignOut(getFirebaseAuth());
}
