import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/auth/useSession';

export type ImageBucket = 'menu-images' | 'avatars';

interface PickOptions {
  /** Square crop with editor (used for avatars). Default false. */
  square?: boolean;
}

/**
 * Pick → resize/compress → upload → return public URL.
 *
 * 修复:原版直接上传原图。新版 expo-image-manipulator 限制 1080px max edge
 * + 80% jpeg 质量,大幅减小流量与存储。
 */
export function usePickAndUploadImage(bucket: ImageBucket, options?: PickOptions) {
  const { user } = useSession();

  return useMutation({
    mutationFn: async (): Promise<string | null> => {
      if (!user?.id) throw new Error('Not signed in');

      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) throw new Error('Permission denied');

      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        quality: 1,
        allowsEditing: !!options?.square,
        aspect: options?.square ? [1, 1] : undefined,
      });
      if (picked.canceled || picked.assets.length === 0) return null;

      const asset = picked.assets[0];
      const maxEdge = options?.square ? 512 : 1080;
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: maxEdge } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
      );

      // RN-friendly upload: fetch local file → ArrayBuffer → Supabase Storage
      const ab = await fetch(manipulated.uri).then((r) => r.arrayBuffer());

      const filename = `${Date.now()}.jpg`;
      const path = `${user.id}/${filename}`;

      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, ab, { contentType: 'image/jpeg', upsert: false });
      if (error) throw error;

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    },
  });
}
