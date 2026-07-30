import { useAuthStore } from '../store/useAuthStore';

export function useAuth() {
    const session = useAuthStore(state => state.session);
    const user = useAuthStore(state => state.user);
    const loading = useAuthStore(state => state.loading);
    const signOut = useAuthStore(state => state.signOut);

    return { session, user, loading, signOut };
}
