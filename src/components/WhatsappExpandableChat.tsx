import { useState, FormEvent, useMemo, useRef } from "react";
import { Send, MessageCircle, Paperclip, CornerDownLeft, Search, SortAsc, SortDesc, Eye, EyeOff, Check, RotateCcw, Trash2, ArrowLeft, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat-bubble";
import { ChatInput } from "@/components/ui/chat-input";
import {
  ExpandableChat,
  ExpandableChatHeader,
  ExpandableChatBody,
  ExpandableChatFooter,
} from "@/components/ui/expandable-chat";
import { ChatMessageList } from "@/components/ui/chat-message-list";
import { useWhatsappMessages } from "@/hooks/useWhatsappMessages";
import { MobileContextMenu } from "@/components/MobileContextMenu";
import { AudioPlayer } from "@/components/AudioPlayer";
import ClassicLoader from "@/components/ui/loader";
import { usePermissions } from "@/hooks/usePermissions";
import { AccessDenied } from "@/components/AccessDenied";
import { toast } from "sonner";

export function WhatsappExpandableChat() {
  const isMobile = useIsMobile();
  const { hasPermission } = usePermissions();
  const [sortOrder, setSortOrder] = useState<"recent" | "oldest">("recent");
  const { 
    clients, 
    totalUnread,
    getClientMessages, 
    sendMessage, 
    sendImage,
    markMessagesAsRead, 
    closeChatStatus,
    reopenChatStatus,
    deleteMessage,
    deleteAllClientMessages,
    toggleShowClosedChats, 
    showClosedChats,
    loading,
    refetch,
  } = useWhatsappMessages(sortOrder);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedImage, setSelectedImage] = useState<{ file: File; preview: string } | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [visibleCount, setVisibleCount] = useState(15);

const allMessages = selectedClient ? getClientMessages(selectedClient.phone) : [];
  const messages = useMemo(() => {
    const start = Math.max(allMessages.length - visibleCount, 0);
    return allMessages.slice(start);
  }, [allMessages, visibleCount]);

  

  // Filtrar clientes por busca
  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clients;
    
    const searchLower = searchTerm.toLowerCase();
    return clients.filter(client => 
      client.name.toLowerCase().includes(searchLower) ||
      client.phone.includes(searchTerm)
    );
  }, [clients, searchTerm]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedImage) || !selectedClient) return;

    if (!hasPermission('messages', 'create')) {
      toast.error('Você não tem permissão para enviar mensagens');
      return;
    }

    setIsLoading(true);
    try {
      // Se há imagem selecionada, enviar a imagem
      if (selectedImage) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64String = reader.result as string;
            const base64Data = base64String.includes(',') ? base64String.split(',')[1] : base64String;
            
            const result = await sendImage(selectedClient.phone, base64Data, newMessage, selectedImage.file.type);
            
            if (result.success) {
              console.log('✅ Imagem enviada com sucesso!');
              setSelectedImage(null);
              setNewMessage("");
            } else {
              console.error('❌ Erro ao enviar imagem:', result.error);
            }
          } catch (error) {
            console.error("❌ Erro ao enviar imagem:", error);
          } finally {
            setIsLoading(false);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }
        };
        reader.readAsDataURL(selectedImage.file);
      } else {
        // Enviar apenas texto
        await sendMessage(selectedClient.phone, newMessage);
        setNewMessage("");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      setIsLoading(false);
    }
  };

  const handleClientSelect = (client: any) => {
    setSelectedClient(client);
    setVisibleCount(15);
    markMessagesAsRead(client.phone);
  };

  const handleImageSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar se é uma imagem
    if (!file.type.startsWith('image/')) {
      console.error('Por favor, selecione apenas arquivos de imagem');
      return;
    }

    // Criar preview da imagem
    const preview = URL.createObjectURL(file);
    setSelectedImage({ file, preview });
  };

  const handleRemoveImage = () => {
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage.preview);
      setSelectedImage(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleToggleChatStatus = async () => {
    if (!selectedClient) return;
    
    try {
      if (selectedClient.chatStatus === 'closed') {
        await reopenChatStatus(selectedClient.phone);
      } else {
        await closeChatStatus(selectedClient.phone);
      }
      setSelectedClient(null); // Voltar para a lista
    } catch (error) {
      console.error("Erro ao alterar status da conversa:", error);
    }
  };

  const handleDeleteChat = async (clientPhone: string) => {
    if (!hasPermission('messages', 'delete')) {
      toast.error('Você não tem permissão para excluir conversas');
      return;
    }
    
    try {
      await deleteAllClientMessages(clientPhone);
    } catch (error) {
      console.error("Erro ao excluir chat:", error);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!hasPermission('messages', 'delete')) {
      toast.error('Você não tem permissão para excluir mensagens');
      return;
    }
    
    try {
      await deleteMessage(messageId);
    } catch (error) {
      console.error("Erro ao excluir mensagem:", error);
    }
  };


  if (!selectedClient) {
    return (
      <>
        <ExpandableChat
          size="md"
          position="bottom-right"
          icon={<MessageCircle className="h-6 w-6" />}
          unreadCount={totalUnread}
        >
          <ExpandableChatHeader className="flex-col space-y-3">
            <div className="text-center">
              <h1 className="text-xl font-semibold">WhatsApp</h1>
              <p className="text-sm text-muted-foreground">
                Selecione um cliente para conversar
              </p>
            </div>
            
            {/* Verificar permissão dentro do modal */}
            {!hasPermission('messages', 'read') ? (
              <div className="p-4">
                <AccessDenied module="messages" />
              </div>
            ) : (
              <>
                {/* Controles de busca e filtros */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome ou número..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortOrder(sortOrder === "recent" ? "oldest" : "recent")}
                      className="flex-1"
                    >
                      {sortOrder === "recent" ? (
                        <>
                          <SortDesc className="h-4 w-4 mr-1" />
                          Mais recentes
                        </>
                      ) : (
                        <>
                          <SortAsc className="h-4 w-4 mr-1" />
                          Mais antigas
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleShowClosedChats}
                      className="flex-1"
                    >
                      {showClosedChats ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-1" />
                          Ocultar fechadas
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          Mostrar fechadas
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </ExpandableChatHeader>

          <ExpandableChatBody>
            {!hasPermission('messages', 'read') ? null : (
              <>
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <ClassicLoader />
                  </div>
                ) : (
                  <div className="p-4 space-y-2">
                    {filteredClients.slice(0, 10).map((client) => (
                      hasPermission('messages', 'delete') ? (
                        <MobileContextMenu
                          key={client.id}
                          onItemClick={() => handleDeleteChat(client.phone)}
                          onTriggerClick={() => handleClientSelect(client)}
                          content={
                            <div className="flex items-center gap-2 text-destructive">
                              <Trash2 className="h-4 w-4" />
                              Excluir conversa
                            </div>
                          }
                        >
                          <div className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent relative">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium">
                                {client.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{client.name}</p>
                              <p className="text-sm text-muted-foreground truncate">
                                {client.lastMessage}
                              </p>
                            </div>
                            {client.unread > 0 && (
                              <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                <span className="text-xs text-primary-foreground">
                                  {client.unread}
                                </span>
                              </div>
                            )}
                            {client.chatStatus === 'closed' && (
                              <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                Fechada
                              </div>
                            )}
                          </div>
                        </MobileContextMenu>
                      ) : (
                        <div 
                          key={client.id}
                          className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent relative"
                          onClick={() => handleClientSelect(client)}
                        >
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {client.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{client.name}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {client.lastMessage}
                            </p>
                          </div>
                          {client.unread > 0 && (
                            <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                              <span className="text-xs text-primary-foreground">
                                {client.unread}
                              </span>
                            </div>
                          )}
                          {client.chatStatus === 'closed' && (
                            <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                              Fechada
                            </div>
                          )}
                        </div>
                      )
                    ))}
                  </div>
                )}
              </>
            )}
          </ExpandableChatBody>
        </ExpandableChat>
        
        {/* Modal de visualização da imagem */}
        <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
          <DialogContent className="max-w-4xl w-full max-h-[90vh] p-0 overflow-hidden">
            <div className="relative w-full h-full bg-black">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => setViewingImage(null)}
              >
                <X className="h-4 w-4" />
              </Button>
              {viewingImage && (
                <img
                  src={viewingImage}
                  alt="Visualização da imagem"
                  className="w-full h-full object-contain"
                  style={{ maxHeight: '80vh' }}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <ExpandableChat
        size="lg"
        position="bottom-right"
        icon={<MessageCircle className="h-6 w-6" />}
        unreadCount={totalUnread}
      >
        <ExpandableChatHeader className="flex items-center gap-3">
          <Button
            variant="ghost"
            size={isMobile ? "icon" : "sm"}
            onClick={() => setSelectedClient(null)}
            title="Voltar"
          >
            {isMobile ? (
              <ArrowLeft className="h-4 w-4" />
            ) : (
              "← Voltar"
            )}
          </Button>
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium">
              {selectedClient.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="font-semibold">{selectedClient.name}</h2>
            <p className="text-sm text-muted-foreground">{selectedClient.phone}</p>
          </div>
          <Button
            variant="ghost"
            size={isMobile ? "icon" : "sm"}
            onClick={handleToggleChatStatus}
            className="text-muted-foreground hover:text-primary"
            title={selectedClient.chatStatus === 'closed' ? "Reabrir conversa" : "Concluir conversa"}
          >
            {selectedClient.chatStatus === 'closed' ? (
              isMobile ? (
                <RotateCcw className="h-4 w-4" />
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reabrir
                </>
              )
            ) : (
              isMobile ? (
                <Check className="h-4 w-4" />
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Concluir
                </>
              )
            )}
          </Button>
        </ExpandableChatHeader>

        <ExpandableChatBody>
          <ChatMessageList onReachTop={() => setVisibleCount((c) => Math.min(c + 15, allMessages.length))}>
            {messages.map((message) => (
              hasPermission('messages', 'delete') ? (
                <MobileContextMenu
                  key={message.id}
                  onItemClick={() => handleDeleteMessage(Number(message.id))}
                  content={
                    <div className="flex items-center gap-2 text-destructive">
                      <Trash2 className="h-4 w-4" />
                      Excluir mensagem
                    </div>
                  }
                >
                  <ChatBubble
                    variant={!message.isFromClient ? "sent" : "received"}
                  >
                    <ChatBubbleAvatar
                      className="h-8 w-8 shrink-0"
                      fallback={!message.isFromClient ? "EU" : selectedClient.name.charAt(0)}
                    />
                    <ChatBubbleMessage
                      variant={!message.isFromClient ? "sent" : "received"}
                      tooltip={message.fullTimestamp}
                    >
                      {message.audioUrl ? (
                        <div className="space-y-2">
                          <AudioPlayer audioUrl={message.audioUrl} />
                          {message.content && (
                            <p className="text-sm">{message.content}</p>
                          )}
                        </div>
                        ) : message.imageUrl ? (
                         <div className="space-y-2">
                           <img 
                             src={message.imageUrl.startsWith('data:') ? message.imageUrl : `data:image/jpeg;base64,${message.imageUrl}`}
                             alt="Imagem enviada"
                             className="max-w-64 max-h-64 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                             onClick={() => setViewingImage(message.imageUrl.startsWith('data:') ? message.imageUrl : `data:image/jpeg;base64,${message.imageUrl}`)}
                             onError={(e) => {
                               console.error('Erro ao carregar imagem:', message.imageUrl);
                               e.currentTarget.style.display = 'none';
                             }}
                             onLoad={() => {
                               console.log('Imagem carregada com sucesso:', message.id);
                             }}
                           />
                           {message.content && (
                             <p className="text-sm">{message.content}</p>
                           )}
                         </div>
                       ) : (
                         <div className="whitespace-pre-wrap">{message.content || "Mensagem de mídia"}</div>
                       )}
                    </ChatBubbleMessage>
                  </ChatBubble>
                </MobileContextMenu>
              ) : (
                <ChatBubble
                  key={message.id}
                  variant={!message.isFromClient ? "sent" : "received"}
                >
                  <ChatBubbleAvatar
                    className="h-8 w-8 shrink-0"
                    fallback={!message.isFromClient ? "EU" : selectedClient.name.charAt(0)}
                  />
                  <ChatBubbleMessage
                    variant={!message.isFromClient ? "sent" : "received"}
                    tooltip={message.fullTimestamp}
                  >
                    {message.audioUrl ? (
                      <div className="space-y-2">
                        <AudioPlayer audioUrl={message.audioUrl} />
                        {message.content && (
                          <p className="text-sm">{message.content}</p>
                        )}
                      </div>
                    ) : message.imageUrl ? (
                      <div className="space-y-2">
                        <img 
                          src={message.imageUrl.startsWith('data:') ? message.imageUrl : `data:image/jpeg;base64,${message.imageUrl}`}
                          alt="Imagem enviada"
                          className="max-w-64 max-h-64 rounded-lg object-cover"
                          onError={(e) => {
                            console.error('Erro ao carregar imagem:', message.imageUrl);
                            e.currentTarget.style.display = 'none';
                          }}
                          onLoad={() => {
                            console.log('Imagem carregada com sucesso:', message.id);
                          }}
                        />
                        {message.content && (
                          <p className="text-sm">{message.content}</p>
                        )}
                      </div>
                     ) : (
                       <div className="whitespace-pre-wrap">{message.content || "Mensagem de mídia"}</div>
                     )}
                  </ChatBubbleMessage>
                </ChatBubble>
              )
            ))}

            {isLoading && (
              <ChatBubble variant="sent">
                <ChatBubbleAvatar
                  className="h-8 w-8 shrink-0"
                  fallback="EU"
                />
                <ChatBubbleMessage variant="sent" isLoading />
              </ChatBubble>
            )}
          </ChatMessageList>
        </ExpandableChatBody>

        <ExpandableChatFooter>
          {selectedImage && (
            <div className="p-2 border-b">
              <div className="relative inline-block">
                <img 
                  src={selectedImage.preview} 
                  alt="Preview" 
                  className="w-20 h-20 object-cover rounded"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  onClick={handleRemoveImage}
                >
                  ×
                </Button>
              </div>
            </div>
          )}
          
          <form
            onSubmit={handleSubmit}
            className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring p-1"
          >
            <ChatInput
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={selectedImage ? "Adicione uma legenda..." : "Digite sua mensagem..."}
              className="min-h-12 resize-none rounded-lg bg-background border-0 p-3 shadow-none focus-visible:ring-0"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <div className="flex items-center p-3 pt-0 justify-between">
              <Button
                variant="ghost"
                size="icon"
                type="button"
                title="Adicionar foto"
                onClick={handleImageSelect}
              >
                <Paperclip className="size-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button 
                type="submit" 
                size="sm" 
                className="ml-auto gap-1.5" 
                disabled={isLoading || (!newMessage.trim() && !selectedImage)}
              >
                Enviar
                <CornerDownLeft className="size-3.5" />
              </Button>
            </div>
          </form>
        </ExpandableChatFooter>
      </ExpandableChat>

      {/* Modal de visualização da imagem */}
      <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] p-0 overflow-hidden">
          <div className="relative w-full h-full bg-black">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setViewingImage(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            {viewingImage && (
              <img
                src={viewingImage}
                alt="Visualização da imagem"
                className="w-full h-full object-contain"
                style={{ maxHeight: '80vh' }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

    </>
  );
}