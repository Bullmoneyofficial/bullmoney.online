'use client';

import { NewsletterAdminPanel } from '@/components/store/NewsletterAdminPanel';
import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase';

// ============================================================================
// NEWSLETTER ADMIN PAGE - GMAIL ADMIN HUB
// Only accessible from store admin panel
// Integrates with existing admin layout
// ============================================================================

export default function NewsletterAdminPage() {
  const [isStoreAdmin, setIsStoreAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseClient();

  useEffect(() => {
    const checkAdminAccess = async () => {
      // Check if user is authenticated admin
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (!user || error) {
        setIsStoreAdmin(false);
        setLoading(false);
        return;
      }

      // Check if user is store admin
      const { data: admin, error: adminError } = await supabase
        .from('admins')
        .select('id, role')
        .eq('user_id', user.id)
        .single();

      if (!adminError && admin) {
        setIsStoreAdmin(true);
      } else {
        // Fallback: check environment variable
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
        if (adminEmail && user.email?.toLowerCase() === adminEmail.toLowerCase()) {
          setIsStoreAdmin(true);
        } else {
          setIsStoreAdmin(false);
        }
      }
      
      setLoading(false);
    };

    checkAdminAccess();
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading Gmail Newsletter Admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <NewsletterAdminPanel isStoreAdmin={isStoreAdmin} />
    </div>
  );
}