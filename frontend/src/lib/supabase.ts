import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadPlayerImage(file: File): Promise<string> {
  try {
    const fileExt = file.name ? file.name.split('.').pop() : 'jpg';
    const fileName = `player_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `player-photos/${fileName}`;

    const { data, error } = await supabase.storage
      .from('player-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.warn("Supabase Storage upload fallback:", error.message);
      return await fileToDataUrl(file);
    }

    const { data: publicUrlData } = supabase.storage
      .from('player-photos')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error("Supabase Storage upload exception:", err);
    return await fileToDataUrl(file);
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || "");
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}
