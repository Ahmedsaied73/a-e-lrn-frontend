'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the user profile page
    router.push('/me/user');
  }, [router]);

  return (
    <div className="account-page flex items-center justify-center">
      <div className="text-white text-xl">جاري التحميل...</div>
    </div>
  );
}
