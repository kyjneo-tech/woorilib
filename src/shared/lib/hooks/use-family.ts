'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/shared/lib/supabase/client';
import { useAuth } from './use-auth';

export interface ChildProfile {
  id: string;
  name: string;
  emoji: string;
  birthYear: number;
}

export function useFamily() {
  const { user } = useAuth();
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchChildren() {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            // Need server action or API route usually if using Prisma,
            // but if Supabase is exposed directly we can use it?
            // Project seems to use Prisma for heavy lifting.
            // Let's assume we have an API route or just use simple fetch for now if no direct Db access on client.
            // Actually, `user_profiles` and `child_profiles` are in public schema, accessible via Supabase client if RLS allows.
            
            const { data, error } = await supabase
                .from('child_profiles')
                .select('*')
                .eq('user_id', user.id);
            
            if (data) {
                setChildren(data.map(d => ({
                    id: d.id,
                    name: d.name,
                    emoji: d.emoji || '👶',
                    birthYear: d.birth_year
                })));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    fetchChildren();
  }, [user]);

  return { children, loading };
}
