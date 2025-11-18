/**
 * Redimensiona uma imagem para ficar dentro do limite de tamanho especificado
 * @param file - Arquivo de imagem original
 * @param maxSizeInMB - Tamanho máximo em MB (padrão: 5MB)
 * @param quality - Qualidade da compressão (0-1, padrão: 0.8)
 * @returns Promise que resolve com o arquivo redimensionado
 */
export const resizeImageToLimit = async (
  file: File,
  maxSizeInMB: number = 5,
  quality: number = 0.8
): Promise<File> => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  
  // Se o arquivo já está dentro do limite, retorna como está
  if (file.size <= maxSizeInBytes) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Calcula as dimensões para reduzir o tamanho do arquivo
        let { width, height } = img;
        
        // Calcula a redução necessária baseada no tamanho do arquivo
        const compressionRatio = Math.sqrt(maxSizeInBytes / file.size);
        width = Math.floor(width * compressionRatio);
        height = Math.floor(height * compressionRatio);

        // Define as dimensões do canvas
        canvas.width = width;
        canvas.height = height;

        // Desenha a imagem redimensionada
        ctx?.drawImage(img, 0, 0, width, height);

        // Converte para blob com qualidade especificada
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Erro ao processar a imagem'));
              return;
            }

            // Se ainda estiver muito grande, tenta com qualidade menor
            if (blob.size > maxSizeInBytes && quality > 0.1) {
              // Tenta novamente com qualidade reduzida
              resizeImageToLimit(file, maxSizeInMB, quality - 0.1)
                .then(resolve)
                .catch(reject);
              return;
            }

            // Cria um novo arquivo com o blob redimensionado
            const resizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            resolve(resizedFile);
          },
          'image/jpeg',
          quality
        );
      } catch (error) {
        reject(new Error('Erro ao redimensionar a imagem'));
      }
    };

    img.onerror = () => {
      reject(new Error('Erro ao carregar a imagem'));
    };

    // Carrega a imagem
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Valida se o arquivo é uma imagem válida
 * @param file - Arquivo a ser validado
 * @returns boolean indicando se é uma imagem válida
 */
export const isValidImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return validTypes.includes(file.type);
};

/**
 * Formata o tamanho do arquivo para exibição
 * @param bytes - Tamanho em bytes
 * @returns String formatada com o tamanho
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};