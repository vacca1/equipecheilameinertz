import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file: File, bucket: string): Promise<string | null> => {
    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      toast.success("Arquivo enviado com sucesso!");
      return publicUrl;
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar arquivo");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (fileUrl: string, bucket: string): Promise<boolean> => {
    try {
      const fileName = fileUrl.split('/').pop();
      if (!fileName) return false;

      const { error } = await supabase.storage
        .from(bucket)
        .remove([fileName]);

      if (error) throw error;

      toast.success("Arquivo removido com sucesso!");
      return true;
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover arquivo");
      return false;
    }
  };

  return { uploadFile, deleteFile, uploading };
};
