'use client';

import Link from 'next/link';

interface PageHeaderProps {
  title: string;
  backHref?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, backHref, action }: PageHeaderProps) {
  return (
    <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-30">
      {backHref && (
        <Link href={backHref} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
      )}
      <h1 className="flex-1 text-lg font-semibold text-gray-900">{title}</h1>
      {action}
    </header>
  );
}
