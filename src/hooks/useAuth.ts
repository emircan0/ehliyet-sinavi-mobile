import { useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../api/supabase';
import { signOutAndClearUserData } from '../services/auth-session';

export function useAuth() {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession()
            .then(async ({ data: { session }, error }) => {
                if (error) {
                    await signOutAndClearUserData();
                    setSession(null);
                    setUser(null);
                    return;
                }

                setSession(session);
                setUser(session?.user ?? null);
            })
            .catch(async () => {
                await signOutAndClearUserData();
                setSession(null);
                setUser(null);
            })
            .finally(() => {
                setLoading(false);
            });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await signOutAndClearUserData();
    };

    return { session, user, loading, signOut };
}
