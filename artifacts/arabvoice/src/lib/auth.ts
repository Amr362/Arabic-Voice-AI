import { supabase } from "./supabase";
import { setAuthTokenGetter } from "@workspace/api-client-react";

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string, name?: string) {
  return supabase.auth.signUp({ email, password, options: { data: { name } } });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getSession() {
  return supabase.auth.getSession();
}

export async function resetPassword(email: string) {
  return supabase.auth.resetPasswordForEmail(email);
}

// Wire up auth token getter so every API call sends the Bearer token
setAuthTokenGetter(async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
});
