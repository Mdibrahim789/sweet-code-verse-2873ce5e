import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AboutContent {
  id: string;
  content_en: string;
  content_bn: string;
  image_url: string | null;
  name: string | null;
  designation: string | null;
  facebook_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  contact_email: string | null;
  updated_at: string;
  updated_by: string | null;
}

export const useAboutWebsite = () => {
  const queryClient = useQueryClient();

  const { data: content, isLoading, error } = useQuery({
    queryKey: ['about-website'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('about_website')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as AboutContent | null;
    },
  });

  const updateContent = useMutation({
    mutationFn: async (updates: Partial<AboutContent>) => {
      const { data: existing } = await supabase
        .from('about_website')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('about_website')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('about_website')
          .insert({
            content_en: updates.content_en || '',
            content_bn: updates.content_bn || '',
            image_url: updates.image_url || null,
            name: updates.name || 'Abu Ebrahim',
            designation: updates.designation || 'Developer',
            facebook_url: updates.facebook_url || null,
            linkedin_url: updates.linkedin_url || null,
            github_url: updates.github_url || null,
            contact_email: updates.contact_email || null,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['about-website'] });
      toast.success('Content updated successfully');
    },
    onError: (error) => {
      console.error('Error updating content:', error);
      toast.error('Failed to update content');
    },
  });

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `about-profile-${Date.now()}.${fileExt}`;
    const filePath = `about/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      toast.error('Failed to upload image');
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  return {
    content,
    isLoading,
    error,
    updateContent,
    uploadImage,
  };
};
