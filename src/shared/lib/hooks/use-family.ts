'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/shared/lib/supabase/client';
import { useAuth } from './use-auth';

export interface ChildProfile {
    id: string;
    name: string;
    emoji: string;
    birthYear: number;
    propensity?: string;
    interests?: string[];
}

export function useFamily() {
    const { user } = useAuth();
    const [children, setChildren] = useState<ChildProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const refresh = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await fetch('/api/family/children');
            if (res.ok) {
                const data = await res.json();
                setChildren(data.children);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, [user]);

    const addChild = async (name: string, birthYear: string, emoji: string): Promise<ChildProfile | null> => {
        try {
            const res = await fetch('/api/family/children', {
                method: 'POST',
                body: JSON.stringify({ name, birthYear, emoji })
            });
            if (!res.ok) throw new Error('Failed to add child');
            const newChild = await res.json();
            await refresh();
            return newChild;
        } catch (e) {
            console.error(e);
            return null;
        }
    };

    const deleteChild = async (id: string) => {
        try {
            const res = await fetch(`/api/family/children?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete child');
            await refresh();
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    return { children, loading, refresh, addChild, deleteChild };
}
