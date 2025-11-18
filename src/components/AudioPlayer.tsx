import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AudioPlayerProps {
  audioUrl: string;
  className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, className = '' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioSrc, setAudioSrc] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement>(null);

  // Converter base64 para URL de objeto se necessário
  useEffect(() => {
    const convertAudioSource = () => {
      if (audioUrl.startsWith('data:') || audioUrl.startsWith('http')) {
        // Se já é uma URL válida ou data URL, usar diretamente
        setAudioSrc(audioUrl);
      } else {
        // Assumir que é base64 e converter para blob URL
        try {
          // Detectar o tipo de arquivo baseado no cabeçalho base64 ou assumir mp3
          const mimeType = 'audio/mpeg'; // Pode ser ajustado baseado no formato real
          const byteCharacters = atob(audioUrl);
          const byteNumbers = new Array(byteCharacters.length);
          
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: mimeType });
          const blobUrl = URL.createObjectURL(blob);
          
          setAudioSrc(blobUrl);
          
          // Cleanup function para revogar a URL quando o componente for desmontado
          return () => {
            URL.revokeObjectURL(blobUrl);
          };
        } catch (error) {
          console.error('Erro ao converter base64 para blob:', error);
          setAudioSrc(audioUrl); // Fallback para URL original
        }
      }
    };

    convertAudioSource();
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, [audioSrc]); // Dependência mudou para audioSrc

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`flex items-center gap-2 bg-muted/50 rounded-lg p-2 min-w-48 ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={togglePlayPause}
        className="h-8 w-8 rounded-full p-0 hover:bg-muted"
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
      
      <div className="flex-1 flex items-center gap-2">
        <div className="flex-1 bg-muted rounded-full h-1 relative overflow-hidden">
          <div 
            className="bg-primary h-full transition-all duration-75" 
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <span className="text-xs text-muted-foreground min-w-fit">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <audio
        ref={audioRef}
        src={audioSrc}
        preload="metadata"
      />
    </div>
  );
};