import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Database features will be limited.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

export const validateFile = (file: File | Blob, maxSizeMB: number = 2): { valid: boolean; error?: string } => {
  const isImage = file.type.startsWith('image/');
  const isValidSize = file.size <= maxSizeMB * 1024 * 1024;

  if (!isImage) return { valid: false, error: 'Apenas arquivos de imagem (PNG, JPG, WEBP) são permitidos.' };
  if (!isValidSize) return { valid: false, error: `Arquivo muito grande. O limite é de ${maxSizeMB}MB.` };
  
  return { valid: true };
};

export const uploadFile = async (bucket: string, path: string, file: File | Blob) => {
  const validation = validateFile(file);
  if (!validation.valid) throw new Error(validation.error);

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: true,
      contentType: file.type
    });
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
    
  return publicUrl;
};
