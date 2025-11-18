import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { resizeImageToLimit, isValidImageFile } from '@/utils/imageUtils';

export const useProfilePhoto = () => {
  const [uploading, setUploading] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
  const { toast } = useToast();

  const handleFileSelect = async (file: File): Promise<boolean> => {
    // Validate file type
    if (!isValidImageFile(file)) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem (JPEG, PNG, WebP).",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Automatically resize image if it's larger than 5MB
      const processedFile = await resizeImageToLimit(file, 5, 0.8);
      
      // Show info if file was resized
      if (processedFile.size < file.size) {
        toast({
          title: "Imagem redimensionada",
          description: "A imagem foi automaticamente redimensionada para atender ao limite de 5MB.",
          variant: "default",
        });
      }

      // Create URL for the processed file and show crop modal
      const imageUrl = URL.createObjectURL(processedFile);
      setSelectedImageUrl(imageUrl);
      setShowCropModal(true);
      return true;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao processar a imagem. Tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  };

  const uploadPhoto = async (croppedImageBlob: Blob): Promise<string | null> => {
    setUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      const formData = new FormData();
      // Convert blob to file for upload
      const file = new File([croppedImageBlob], 'profile.jpg', { type: 'image/jpeg' });
      formData.append('file', file);

      const response = await fetch(`https://juigucueyykqcnljiyvn.supabase.co/functions/v1/upload-profile-photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao fazer upload');
      }

      toast({
        title: "Sucesso",
        description: "Foto de perfil atualizada com sucesso!",
        variant: "success",
      });

      return result.avatar_url;
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao fazer upload da foto.",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const closeCropModal = () => {
    setShowCropModal(false);
    if (selectedImageUrl) {
      URL.revokeObjectURL(selectedImageUrl);
      setSelectedImageUrl('');
    }
  };

  return {
    handleFileSelect,
    uploadPhoto,
    uploading,
    showCropModal,
    selectedImageUrl,
    closeCropModal,
  };
};