import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { getPlan } from '@/commerce/plans';
import { CommerceContext, type CommerceContextValue, type Membership } from './commerce-context';

export function CommerceProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);

  const refreshMembership = useCallback(async () => {
    const { data: auth } = await supabase.auth.getSession();
    const userId = auth.session?.user.id;
    if (!userId) {
      setMembership(null);
      return;
    }
    const { data, error } = await supabase
      .from('memberships')
      .select('plan_id,status,expires_at,lifetime')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) {
      console.warn('Membership unavailable:', error.message);
      setMembership(null);
      return;
    }
    if (data && getPlan(data.plan_id)) {
      setMembership({
        planId: data.plan_id,
        status: data.status,
        expiresAt: data.expires_at,
        lifetime: data.lifetime,
      });
    } else setMembership(null);
  }, []);

  const refreshAdmin = useCallback(async () => {
    const { data: auth } = await supabase.auth.getSession();
    if (!auth.session) {
      setIsAdmin(false);
      return;
    }
    const { data, error } = await supabase.rpc('is_admin');
    setIsAdmin(!error && data === true);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setMembership(null);
        setIsAdmin(false);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading) {
      void refreshMembership();
      void refreshAdmin();
    }
  }, [loading, session?.user.id, refreshMembership, refreshAdmin]);

  const value = useMemo<CommerceContextValue>(() => ({
    user: session?.user ?? null,
    session,
    membership,
    isAdmin,
    loading,
    hasPaidAccess: Boolean(
      isAdmin || (membership &&
      (membership.status === 'active' || membership.status === 'trialing') &&
      (membership.lifetime || !membership.expiresAt || new Date(membership.expiresAt).getTime() > Date.now())),
    ),
    authOpen,
    openAuth: () => setAuthOpen(true),
    closeAuth: () => setAuthOpen(false),
    signOut: async () => { await supabase.auth.signOut(); },
    refreshMembership,
  }), [session, membership, isAdmin, loading, authOpen, refreshMembership]);

  return <CommerceContext.Provider value={value}>{children}</CommerceContext.Provider>;
}
