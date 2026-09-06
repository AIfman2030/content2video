import { createContext, useContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { PlanId } from '@/commerce/plans';

export type Membership = {
  planId: PlanId;
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  expiresAt: string | null;
  lifetime: boolean;
};

export type CommerceContextValue = {
  user: User | null;
  session: Session | null;
  membership: Membership | null;
  isAdmin: boolean;
  loading: boolean;
  hasPaidAccess: boolean;
  authOpen: boolean;
  openAuth: () => void;
  closeAuth: () => void;
  signOut: () => Promise<void>;
  refreshMembership: () => Promise<void>;
};

export const CommerceContext = createContext<CommerceContextValue | null>(null);

export function useCommerce() {
  const context = useContext(CommerceContext);
  if (!context) throw new Error('useCommerce must be used inside CommerceProvider');
  return context;
}
