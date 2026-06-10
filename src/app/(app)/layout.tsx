'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { DataProvider } from '@/context/DataContext';
import { ToastProvider } from '@/context/ToastContext';
import { BottomNav } from '@/components/layout/BottomNav';
import { Spinner } from '@/components/ui/Spinner';
import { cleanupExpiredImages } from '@/lib/firebase/firestore';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) { cleanupExpiredImages(); }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <DataProvider>
      <ToastProvider>
        <div className="min-h-screen pb-20 bg-slate-50">
          {children}
          <BottomNav />
        </div>
      </ToastProvider>
    </DataProvider>
  );
}
