import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import MobilePageHeader from "@/components/MobilePageHeader";
import { Save, User2, Camera } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfilePhoto } from "@/hooks/useProfilePhoto";
import { formatPhoneNumber } from "@/utils/phoneUtils";
import { ImageCropModal } from "@/components/ImageCropModal";

const Profile = () => {
  const { user, userProfile, refreshUserData } = useAuth();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { handleFileSelect, uploadPhoto, uploading, showCropModal, selectedImageUrl, closeCropModal } = useProfilePhoto();
  
  const [profileData, setProfileData] = useState({
    display_name: "",
    phone: "",
    avatar_url: "",
  });

  const { toast } = useToast();

  // Update profile data when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setProfileData({
        display_name: userProfile.display_name || "",
        phone: userProfile.phone || "",
        avatar_url: userProfile.avatar_url || "",
      });
    }
    setLoading(false);
  }, [userProfile]);

  const saveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: profileData.display_name,
          phone: profileData.phone,
          avatar_url: profileData.avatar_url,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Refresh user data to update avatar in context
      await refreshUserData();

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
        variant: "success",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar perfil.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Handle file selection (this will show the crop modal)
    handleFileSelect(file);
  };

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    const newAvatarUrl = await uploadPhoto(croppedImageBlob);
    if (newAvatarUrl) {
      setProfileData(prev => ({ ...prev, avatar_url: newAvatarUrl }));
      // Refresh user data to update avatar in sidebar
      await refreshUserData();
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-text-secondary">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {isMobile && <MobilePageHeader title="Perfil" icon={User2} />}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Perfil</h1>
        <p className="text-text-secondary">Gerencie suas informações pessoais</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-text-primary flex items-center gap-2">
            <User2 className="w-5 h-5" />
            Informações Pessoais
          </CardTitle>
          <CardDescription className="text-text-secondary">
            Gerencie suas informações pessoais e como elas aparecem para outros colaboradores
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src={profileData.avatar_url} />
                <AvatarFallback>
                  {profileData.display_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="sm"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                onClick={triggerFileUpload}
                disabled={uploading}
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-text-primary">Foto do perfil</h3>
              <p className="text-sm text-text-secondary">
                Clique no ícone da câmera para alterar sua foto
              </p>
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: JPG, PNG. Tamanho máximo: 5MB
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
            />
          </div>

          {/* Image Crop Modal */}
          <ImageCropModal
            open={showCropModal}
            onClose={closeCropModal}
            imageSrc={selectedImageUrl}
            onCropComplete={handleCropComplete}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="display_name">Nome de exibição</Label>
              <Input
                id="display_name"
                value={profileData.display_name}
                onChange={(e) => setProfileData({ ...profileData, display_name: e.target.value })}
                placeholder="Como você quer ser chamado"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={profileData.phone}
                onChange={(e) => {
                  const formattedPhone = formatPhoneNumber(e.target.value);
                  setProfileData({ ...profileData, phone: formattedPhone });
                }}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button 
              onClick={saveProfile} 
              disabled={saving || uploading}
              className="bg-primary hover:bg-primary-hover text-primary-foreground"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;