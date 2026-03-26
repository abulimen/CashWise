import { decryptWithDekBase64, encryptWithDekBase64, generateDekBase64, unwrapDekForUser, wrapDekForUser } from '@/lib/secureCache';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function deepMergeProfile(base: Record<string, unknown>, patch: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = { ...base };
  Object.entries(patch).forEach(([key, value]) => {
    const existing = output[key];
    if (isPlainObject(existing) && isPlainObject(value)) {
      output[key] = deepMergeProfile(existing, value);
      return;
    }
    output[key] = value;
  });
  return output;
}

export async function loadOnboardingProfile(userId: string): Promise<{
  exists: boolean;
  profileDraft: Record<string, unknown>;
  confidenceOverall: number;
  onboardingCompleted: boolean;
  row: { wrapped_dek: string | null };
}> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('user_onboarding')
    .select('encrypted_profile_blob, wrapped_dek, iv, confidence_overall, onboarding_completed')
    .eq('user_id', userId)
    .maybeSingle();

  if (!data?.encrypted_profile_blob || !data.wrapped_dek || !data.iv) {
    return {
      exists: false,
      profileDraft: {},
      confidenceOverall: 0,
      onboardingCompleted: false,
      row: { wrapped_dek: data?.wrapped_dek || null },
    };
  }

  const dek = await unwrapDekForUser(userId, data.wrapped_dek);
  const plaintext = await decryptWithDekBase64(data.encrypted_profile_blob, data.iv, dek);
  return {
    exists: true,
    profileDraft: JSON.parse(plaintext) as Record<string, unknown>,
    confidenceOverall: Number(data.confidence_overall || 0),
    onboardingCompleted: Boolean(data.onboarding_completed),
    row: { wrapped_dek: data.wrapped_dek },
  };
}

export async function saveOnboardingProfile(params: {
  userId: string;
  profileDraft: Record<string, unknown>;
  confidenceOverall: number;
  onboardingCompleted?: boolean;
}): Promise<void> {
  const supabase = getSupabaseAdmin();
  const existing = await loadOnboardingProfile(params.userId);

  let dekBase64 = '';
  let wrappedDek = existing.row.wrapped_dek;
  if (wrappedDek) {
    dekBase64 = await unwrapDekForUser(params.userId, wrappedDek);
  } else {
    dekBase64 = await generateDekBase64();
    wrappedDek = await wrapDekForUser(params.userId, dekBase64);
  }

  const encrypted = await encryptWithDekBase64(params.profileDraft, dekBase64);
  await supabase.from('user_onboarding').upsert({
    user_id: params.userId,
    consent_given: true,
    encrypted_profile_blob: encrypted.encryptedBlob,
    wrapped_dek: wrappedDek,
    iv: encrypted.iv,
    confidence_overall: params.confidenceOverall,
    onboarding_completed: Boolean(params.onboardingCompleted),
    profile_version: 1,
    updated_at: new Date().toISOString(),
  });
}
