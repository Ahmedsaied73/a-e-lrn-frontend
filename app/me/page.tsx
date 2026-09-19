'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageTitle } from '@/components/page-title';
import { withTeacher } from '@/lib/site-config';
import { PAGE_TITLES } from '@/lib/page-titles';

export default function MePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the user profile page
    router.push('/me/user');
  }, [router]);

  return (
    <div className="account-page flex items-center justify-center">
      {/* Redirect page — set the profile title early so it matches the destination. */}
      <PageTitle title={withTeacher(PAGE_TITLES.profile)} />
      <div className="text-on-surface text-xl">جاري التحميل...</div>
    </div>
  );
}
