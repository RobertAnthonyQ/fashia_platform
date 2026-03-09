import { createClient } from "@/src/lib/supabase/server";

type Bucket = "garments" | "model-refs" | "outputs";

export async function uploadFile(
  userId: string,
  bucket: Bucket,
  file: File,
  pathPrefix?: string,
) {
  const supabase = await createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const fileName = `${userId}/${pathPrefix ? pathPrefix + "/" : ""}${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    });

  return { data, error, path: data?.path };
}

export async function uploadGarmentImage(userId: string, file: File) {
  return uploadFile(userId, "garments", file);
}

export async function uploadModelRef(userId: string, file: File) {
  return uploadFile(userId, "model-refs", file);
}

export async function uploadOutput(
  userId: string,
  generationId: string,
  file: File,
) {
  return uploadFile(userId, "outputs", file, generationId);
}

export async function getSignedUrl(bucket: Bucket, path: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 3600); // 1 hour

  return { data: data?.signedUrl, error };
}

export async function getPublicUrl(bucket: Bucket, path: string) {
  const supabase = await createClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return { data: data.publicUrl };
}

export async function deleteFile(bucket: Bucket, path: string) {
  const supabase = await createClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);

  return { error };
}
