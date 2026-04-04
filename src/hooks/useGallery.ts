import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GalleryImage {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  created_by: string | null;
  created_at: string;
}

export interface GalleryLike {
  id: string;
  image_id: string;
  user_id: string;
  created_at: string;
}

export const useGallery = () => {
  const queryClient = useQueryClient();

  const { data: images = [], isLoading, error } = useQuery({
    queryKey: ['gallery'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as GalleryImage[];
    },
  });

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(fileName, file);
    
    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabase.storage
      .from('gallery')
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  const addImage = useMutation({
    mutationFn: async ({ title, description, file }: { title: string; description?: string; file: File }) => {
      const imageUrl = await uploadImage(file);
      
      const { data, error } = await supabase
        .from('gallery')
        .insert({
          title,
          description,
          image_url: imageUrl,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      toast.success('Image added to gallery!');
    },
    onError: (error: Error) => {
      toast.error('Failed to add image: ' + error.message);
    },
  });

  const deleteImage = useMutation({
    mutationFn: async (id: string) => {
      const image = images.find(img => img.id === id);
      if (image) {
        const fileName = image.image_url.split('/').pop();
        if (fileName) {
          await supabase.storage.from('gallery').remove([fileName]);
        }
      }
      
      const { error } = await supabase
        .from('gallery')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      toast.success('Image deleted!');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete image: ' + error.message);
    },
  });

  return {
    images,
    isLoading,
    error,
    addImage,
    deleteImage,
  };
};

// Hook for gallery likes
export const useGalleryLikes = (imageId?: string) => {
  const queryClient = useQueryClient();

  const { data: likes = [] } = useQuery({
    queryKey: ['gallery-likes', imageId],
    queryFn: async () => {
      if (!imageId) return [];
      const { data, error } = await supabase
        .from('gallery_likes')
        .select('*')
        .eq('image_id', imageId);
      
      if (error) throw error;
      return data as GalleryLike[];
    },
    enabled: !!imageId,
  });

  // Fetch all likes for all images at once
  const { data: allLikes = [] } = useQuery({
    queryKey: ['gallery-likes-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gallery_likes')
        .select('*');
      
      if (error) throw error;
      return data as GalleryLike[];
    },
  });

  const toggleLike = useMutation({
    mutationFn: async ({ imageId, userId, isLiked }: { imageId: string; userId: string; isLiked: boolean }) => {
      if (isLiked) {
        const { error } = await supabase
          .from('gallery_likes')
          .delete()
          .eq('image_id', imageId)
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('gallery_likes')
          .insert({ image_id: imageId, user_id: userId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-likes'] });
      queryClient.invalidateQueries({ queryKey: ['gallery-likes-all'] });
    },
    onError: (error: Error) => {
      toast.error('Failed to update like: ' + error.message);
    },
  });

  return {
    likes,
    allLikes,
    toggleLike,
  };
};
