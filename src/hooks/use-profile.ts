import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
}

function extractFirstName(displayName: string | null, email: string | null): string {
  if (displayName) {
    const first = displayName.trim().split(/\s+/)[0];
    if (first && !/^\d+$/.test(first)) return capitalize(first);
  }
  if (email) {
    const prefix = email.split('@')[0];
    // Clean common separators, take first segment
    const cleaned = prefix.replace(/[._+]/g, ' ').replace(/\d+/g, '').trim().split(/\s+/)[0];
    if (cleaned && cleaned.length > 1) return capitalize(cleaned);
  }
  return 'Hello';
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function getInitials(name: string | null, email: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  }
  if (email) return email.charAt(0).toUpperCase();
  return '?';
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) { setProfile(null); setLoading(false); return; }
    const { data } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('user_id', user.id)
      .maybeSingle();
    setProfile(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const firstName = extractFirstName(
    profile?.display_name ?? user?.user_metadata?.display_name,
    user?.email ?? null
  );

  const initials = getInitials(
    profile?.display_name ?? user?.user_metadata?.display_name,
    user?.email ?? null
  );

  const avatarUrl = profile?.avatar_url ?? null;

  const updateAvatar = async (file: File) => {
    if (!user) return;
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });
    if (uploadErr) throw uploadErr;
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(path);
    const url = `${publicUrl}?t=${Date.now()}`;
    await supabase.from('profiles').update({ avatar_url: url }).eq('user_id', user.id);
    await fetchProfile();
  };

  const updateDisplayName = async (name: string) => {
    if (!user) return;
    await supabase.from('profiles').update({ display_name: name }).eq('user_id', user.id);
    await fetchProfile();
  };

  return { profile, loading, firstName, initials, avatarUrl, updateAvatar, updateDisplayName, refetch: fetchProfile };
}
