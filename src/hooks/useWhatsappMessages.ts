import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface WhatsappMessage {
  id: number;
  remoteJid: string | null;
  Nome: string;
  Mensagem: string;
  FromMe: string;
  created_at: string;
  Instancia: string;
  Mensagem_visualizada?: boolean;
  Imagem?: string;
  audio?: string;
}

// Interface para a nova tabela de chats
interface Chat {
  id: string;
  client_phone: string;
  status: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  closed_at?: string;
  closed_by?: string;
}

interface Client {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  phone: string;
  chatStatus?: 'open' | 'closed';
}

interface Message {
  id: string;
  content: string;
  timestamp: string; // HH:mm
  fullTimestamp?: string; // dd/MM/yyyy, HH:mm (pt-BR)
  isFromClient: boolean;
  senderName: string;
  imageUrl?: string;
  audioUrl?: string;
}

export const useWhatsappMessages = (sortOrder: "recent" | "oldest" = "recent") => {
  const [messages, setMessages] = useState<WhatsappMessage[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClosedChats, setShowClosedChats] = useState(false);
  const [chatStatusCache, setChatStatusCache] = useState<Map<string, 'open' | 'closed'>>(new Map());
  const [chatStatusesReady, setChatStatusesReady] = useState(false);
  const { organization } = useAuth();

  const cleanPhoneNumber = (remoteJid: string | null): string => {
    if (!remoteJid) return "";
    return remoteJid.replace(/@(s\.whatsapp\.net|lid)$/, "");
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("pt-BR", { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  const fetchMessages = async () => {
    try {
      console.log("Buscando mensagens (apenas Mensagens)...");
      setLoading(true);

      // Disparar carregamento dos status de chat (não aguardar setState)
      fetchChatStatuses();

      // Buscar mensagens (RLS já filtra por organização)
      const { data: messagesData, error: messagesError } = await supabase
        .from("Mensagens")
        .select("id, remoteJid, Nome, Mensagem, FromMe, created_at, Instancia, Mensagem_visualizada, Imagem, audio, organization_id")
        .order("created_at", { ascending: false })
        .limit(5000);

      console.log("Mensagens encontradas:", messagesData);
      if (messagesError) {
        console.error("Erro ao buscar mensagens:", messagesError);
        return;
      }

      const sortedData = (messagesData || []).sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      setMessages(sortedData);
      setChats([]);
      // Importante: não processar aqui; aguardar chatStatusesReady via useEffect
    } catch (error) {
      console.error("Erro ao buscar mensagens:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChatStatuses = async () => {
    try {
      if (!organization?.id) return;
      const { data, error } = await supabase
        .from("chats")
        .select("client_phone, status")
        .eq("organization_id", organization.id);
      if (error) {
        console.error("Erro ao buscar status dos chats:", error);
        return;
      }
      const newCache = new Map<string, 'open' | 'closed'>(chatStatusCache);
      (data || []).forEach((c: any) => {
        if (c.client_phone) newCache.set(c.client_phone, c.status);
      });
      setChatStatusCache(newCache);
      setChatStatusesReady(true);
    } catch (e) {
      console.error("Erro ao carregar status dos chats:", e);
    }
  };

  const processClientsFromChats = useCallback(async (chatsData: any[], messageData: WhatsappMessage[]) => {
    const clientsMap = new Map<string, Client>();
    const unreadCountMap = new Map<string, number>();

    // Contagem de não lidas a partir das mensagens
    messageData.forEach(msg => {
      const phone = cleanPhoneNumber(msg.remoteJid);
      if (!phone) return;
      const isFromCompany = msg.FromMe === "true";
      if (!isFromCompany && (msg.Mensagem_visualizada === null || msg.Mensagem_visualizada === false)) {
        unreadCountMap.set(phone, (unreadCountMap.get(phone) || 0) + 1);
      }
    });

    // 1) Priorizar chats se existirem (mantém compatibilidade)
    chatsData.forEach(chat => {
      const phone = chat.client_phone;
      if (!phone) return;

      const chatMessages = messageData.filter(msg => cleanPhoneNumber(msg.remoteJid) === phone);
      const lastMessage = chatMessages.length > 0 ? chatMessages[chatMessages.length - 1] : null;

      let clientName = phone;
      if (lastMessage && lastMessage.Nome && lastMessage.FromMe !== "true") {
        clientName = lastMessage.Nome;
      }

      clientsMap.set(phone, {
        id: phone,
        name: clientName,
        lastMessage: lastMessage?.Mensagem ?
          lastMessage.Mensagem.replace(/\\n/g, '\n') :
          (lastMessage?.audio ? 'Áudio' :
           lastMessage?.Imagem ? 'Imagem' :
           'Chat iniciado'),
        timestamp: lastMessage?.created_at || chat.created_at,
        unread: unreadCountMap.get(phone) || 0,
        phone: phone,
        chatStatus: chat.status as 'open' | 'closed'
      });
    });

    // 2) Construir clientes a partir de Mensagens quando não houver chat
    const lastByPhone = new Map<string, WhatsappMessage>();
    for (const msg of messageData) {
      const phone = cleanPhoneNumber(msg.remoteJid);
      if (!phone) continue;
      lastByPhone.set(phone, msg); // messageData está em ordem crescente
    }

    for (const [phone, lastMessage] of lastByPhone) {
      if (clientsMap.has(phone)) continue;
      const clientName = lastMessage.Nome && lastMessage.FromMe !== "true" ? lastMessage.Nome : phone;
      
      // Incluir todos os chats, mas marcar o status correto
      const currentStatus = chatStatusCache.get(phone);
      
      clientsMap.set(phone, {
        id: phone,
        name: clientName,
        lastMessage: lastMessage.Mensagem ?
          lastMessage.Mensagem.replace(/\\n/g, '\n') :
          (lastMessage.audio ? 'Áudio' : lastMessage.Imagem ? 'Imagem' : 'Conversa'),
        timestamp: lastMessage.created_at,
        unread: unreadCountMap.get(phone) || 0,
        phone,
        chatStatus: currentStatus || 'open' // Chats sem registro são considerados abertos
      });
    }

    // Atualizar cache de status (apenas os que vieram de chats)
    const newCache = new Map(chatStatusCache);
    chatsData.forEach(chat => {
      if (chat.client_phone) {
        newCache.set(chat.client_phone, chat.status as 'open' | 'closed');
      }
    });
    setChatStatusCache(newCache);

    const clientsArray = Array.from(clientsMap.values())
      .sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return sortOrder === "recent" ? dateB - dateA : dateA - dateB;
      })
      .map(client => ({
        ...client,
        timestamp: formatTime(client.timestamp)
      }));

    setClients(clientsArray);
  }, [sortOrder, chatStatusCache]);

  const markMessagesAsRead = async (clientPhone: string) => {
    console.log('Marcando mensagens como lidas para:', clientPhone);

    // Primeiro, vamos ver todas as mensagens deste cliente para debug
    const { data: allClientMessages, error: debugError } = await supabase
      .from("Mensagens")
      .select("id, remoteJid, FromMe, Mensagem_visualizada, Mensagem")
      .like("remoteJid", `%${clientPhone}%`);

    console.log('Todas as mensagens do cliente:', allClientMessages);

    // Buscar mensagens não visualizadas especificamente
    const { data: unreadMessages, error: fetchError } = await supabase
      .from("Mensagens")
      .select("id, remoteJid, FromMe, Mensagem_visualizada")
      .eq("FromMe", "false")
      .like("remoteJid", `%${clientPhone}%`)
      .or("Mensagem_visualizada.is.null,Mensagem_visualizada.eq.false");

    console.log('Mensagens não lidas encontradas:', unreadMessages);

    if (fetchError) {
      console.error("Erro ao buscar mensagens não lidas:", fetchError);
      return;
    }

    if (unreadMessages && unreadMessages.length > 0) {
      console.log(`Encontrou ${unreadMessages.length} mensagens para marcar como lidas`);
      
      // Marcar todas essas mensagens como visualizadas
      const { error: updateError } = await supabase
        .from("Mensagens")
        .update({ Mensagem_visualizada: true })
        .in("id", unreadMessages.map(msg => msg.id));

      if (updateError) {
        console.error("Erro ao marcar mensagens como lidas:", updateError);
        return;
      }

      console.log(`Sucesso: Marcou ${unreadMessages.length} mensagens como lidas`);
    } else {
      console.log('Nenhuma mensagem não lida encontrada para este cliente');
    }

    // Atualizar imediatamente o estado dos clientes para zerar o contador
    setClients(prev => prev.map(client => 
      client.phone === clientPhone ? { ...client, unread: 0 } : client
    ));

    // Atualizar o estado das mensagens localmente
    setMessages(prev => prev.map(msg => 
      cleanPhoneNumber(msg.remoteJid) === clientPhone && msg.FromMe !== "true"
        ? { ...msg, Mensagem_visualizada: true }
        : msg
    ));
  };

  const getClientMessages = useMemo(() => {
    const clientMessagesCache = new Map<string, Message[]>();
    
    return (clientPhone: string): Message[] => {
      if (clientMessagesCache.has(clientPhone)) {
        return clientMessagesCache.get(clientPhone)!;
      }
      
      const clientMessages = messages
        .filter((msg) => cleanPhoneNumber(msg.remoteJid) === clientPhone)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((msg) => {
          const hasAudio = msg.audio && msg.audio.trim() !== '';
          const hasImage = msg.Imagem && msg.Imagem.trim() !== '';
          
          return {
            id: msg.id.toString(),
            content: msg.Mensagem ? msg.Mensagem.replace(/\\n/g, '\n') : "",
            timestamp: formatTime(msg.created_at),
            fullTimestamp: new Date(msg.created_at).toLocaleString("pt-BR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            }),
            isFromClient: msg.FromMe !== "true",
            senderName: msg.FromMe === "true" ? "Empresa" : (msg.Nome || clientPhone),
            audioUrl: hasAudio ? msg.audio : undefined,
            imageUrl: hasImage && !hasAudio ? msg.Imagem : undefined
          };
        });
      
      clientMessagesCache.set(clientPhone, clientMessages);
      return clientMessages;
    };
  }, [messages]);

  useEffect(() => {
    if (!organization?.id) return;
    setChatStatusesReady(false);
    fetchMessages();
  }, [organization?.id]);

  useEffect(() => {
    if (!chatStatusesReady) return;
    if (chats.length > 0 || messages.length > 0) {
      processClientsFromChats(chats, messages);
    }
  }, [messages, chats, processClientsFromChats, chatStatusesReady]);

  // Real-time subscription for new messages and updates
  useEffect(() => {
    if (!organization?.id) return;
    
    const channel = supabase
      .channel('mensagens-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Mensagens'
        },
        async (payload) => {
          console.log('Nova mensagem recebida:', payload);
          const newMessage = payload.new as WhatsappMessage;
          
          // Qualquer nova mensagem deve garantir que o chat esteja aberto
          const clientPhone = cleanPhoneNumber(newMessage.remoteJid);
          
          // Atualizar imediatamente o estado local para garantir que o chat apareça como aberto
          setChatStatusCache(prev => new Map(prev).set(clientPhone, 'open'));
          setClients(prev => prev.map(client => 
            client.phone === clientPhone ? { ...client, chatStatus: 'open' } : client
          ));
          
          try {
            // Verificar se o chat existe e seu status atual
            const { data: existingChat, error: fetchError } = await supabase
              .from("chats")
              .select("id, status")
              .eq("client_phone", clientPhone)
              .eq("organization_id", organization.id)
              .maybeSingle();
            
            if (fetchError) {
              console.error('Erro ao buscar chat:', fetchError);
              return;
            }
            
            if (!existingChat) {
              const { error: insertError } = await supabase
                .from("chats")
                .insert({
                  client_phone: clientPhone,
                  organization_id: organization.id,
                  status: 'open',
                  closed_at: null
                });
              
              if (insertError) {
                console.error('Erro ao criar chat:', insertError);
              } else {
                console.log(`Chat ${clientPhone} criado automaticamente`);
              }
            } else if (existingChat.status === 'closed') {
              const { error: updateError } = await supabase
                .from("chats")
                .update({ 
                  status: 'open', 
                  closed_at: null, 
                  updated_at: new Date().toISOString() 
                })
                .eq("id", existingChat.id);
              
              if (updateError) {
                console.error('Erro ao reabrir chat:', updateError);
              } else {
                console.log(`Chat ${clientPhone} reaberto automaticamente`);
              }
            }
          } catch (error) {
            console.error('Erro ao gerenciar status do chat:', error);
          }
          
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Mensagens'
        },
        (payload) => {
          const updated = payload.new as WhatsappMessage;
          setMessages(prev => {
            const idx = prev.findIndex(m => m.id === updated.id);
            if (idx === -1) return prev;
            const next = [...prev];
            next[idx] = { ...next[idx], ...updated };
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Realtime de chats desativado (exibimos apenas Mensagens)
  useEffect(() => {
    return () => {};
  }, []);

  const deleteMessage = async (messageId: number) => {
    try {
      const { error } = await supabase
        .from("Mensagens")
        .delete()
        .eq("id", messageId);

      if (error) {
        console.error("Erro ao deletar mensagem:", error);
        return false;
      }

      // Atualizar o estado local removendo a mensagem
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      console.log(`Mensagem ${messageId} deletada com sucesso`);
      return true;
    } catch (error) {
      console.error("Erro ao deletar mensagem:", error);
      return false;
    }
  };

  const deleteAllClientMessages = async (clientPhone: string) => {
    try {
      const { error } = await supabase
        .from("Mensagens")
        .delete()
        .like("remoteJid", `%${clientPhone}%`);

      if (error) {
        console.error("Erro ao deletar todas as mensagens do cliente:", error);
        return false;
      }

      // Atualizar o estado local removendo todas as mensagens deste cliente
      setMessages(prev => prev.filter(msg => 
        !msg.remoteJid?.includes(clientPhone)
      ));
      
      // Remover o cliente da lista
      setClients(prev => prev.filter(client => client.phone !== clientPhone));
      
      console.log(`Todas as mensagens do cliente ${clientPhone} foram deletadas`);
      return true;
    } catch (error) {
      console.error("Erro ao deletar todas as mensagens do cliente:", error);
      return false;
    }
  };

  const sendMessage = async (clientPhone: string, messageText: string) => {
    if (!organization?.whatsapp_instance_name || !organization?.whatsapp_apikey || !organization?.id) {
      console.error("Configurações da Evolution API/Organização não encontradas");
      return { success: false, error: "Configurações da Evolution API/Organização não encontradas" };
    }

    try {
      const baseUrl = (organization as any).whatsapp_base_url || "https://api.onebots.com.br";
      const url = `${baseUrl}/api/sendText`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Api-Key': organization.whatsapp_apikey,
        },
        body: JSON.stringify({
          session: organization.whatsapp_instance_name,
          chatId: `${clientPhone}@c.us`,
          text: messageText
        })
      });

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Mensagem enviada com sucesso:', result);
      
      // Salvar mensagem na tabela Mensagens
      const { error: dbError } = await supabase
        .from('Mensagens')
        .insert({
          Mensagem: messageText,
          FromMe: 'true',
          remoteJid: `${clientPhone}@s.whatsapp.net`,
          Instancia: organization.whatsapp_instance_name,
          Mensagem_visualizada: true,
          Nome: clientPhone,
          organization_id: organization.id
        });

      if (dbError) {
        console.error('Erro ao salvar mensagem no banco:', dbError);
      }
      
      return { success: true, data: result };
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" };
    }
  };

  const sendImage = async (clientPhone: string, imageUrl: string, caption: string = '', mimetype: string = 'image/jpeg') => {
    if (!organization?.whatsapp_instance_name || !organization?.whatsapp_apikey || !organization?.id) {
      console.error("Configurações da Evolution API/Organização não encontradas");
      return { success: false, error: "Configurações da Evolution API/Organização não encontradas" };
    }

    try {
      const baseUrl = (organization as any).whatsapp_base_url || "https://api.onebots.com.br";
      const url = `${baseUrl}/api/sendImage`;
      
      const payload = {
        session: organization.whatsapp_instance_name,
        chatId: `${clientPhone}@c.us`,
        file: {
          mimetype: mimetype,
          data: imageUrl, // Se for base64, usar imageUrl diretamente; se for URL, precisará converter
          filename: "foto.jpeg"
        },
        caption: caption
      };

      console.log('📤 Enviando para Evolution API:', url);
      console.log('📋 Payload completo:', {
        session: payload.session,
        chatId: payload.chatId,
        file: {
          mimetype: payload.file.mimetype,
          filename: payload.file.filename,
          dataLength: payload.file.data?.length || 0,
          dataPreview: payload.file.data?.substring(0, 50) + '...'
        },
        caption: payload.caption
      });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Api-Key': organization.whatsapp_apikey,
        },
        body: JSON.stringify(payload)
      });

      console.log('📨 Status da resposta:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('💥 Resposta de erro da API:', errorText);
        throw new Error(`Erro na requisição: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Imagem enviada com sucesso:', result);
      
      // Salvar mensagem de imagem na tabela Mensagens
      const { error: dbError } = await supabase
        .from('Mensagens')
        .insert({
          Mensagem: caption || 'Imagem enviada',
          FromMe: 'true',
          remoteJid: `${clientPhone}@s.whatsapp.net`,
          Instancia: organization.whatsapp_instance_name,
          Mensagem_visualizada: true,
          Nome: clientPhone,
          Imagem: imageUrl,
          organization_id: organization.id
        });

      if (dbError) {
        console.error('Erro ao salvar imagem no banco:', dbError);
      }
      
      return { success: true, data: result };
    } catch (error) {
      console.error("Erro ao enviar imagem:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" };
    }
  };

  const closeChatStatus = async (clientPhone: string) => {
    try {
      if (!organization?.id) {
        console.error("Organization ID não encontrado");
        return false;
      }

      // Primeiro, verificar se já existe um chat para este telefone e organização
      const { data: existingChat } = await supabase
        .from("chats")
        .select("*")
        .eq("client_phone", clientPhone)
        .eq("organization_id", organization.id)
        .single();

      if (existingChat) {
        // Atualizar chat existente
        const { error } = await supabase
          .from("chats")
          .update({
            status: 'closed',
            closed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("id", existingChat.id);

        if (error) {
          console.error("Erro ao fechar chat:", error);
          return false;
        }
      } else {
        // Criar novo chat fechado
        const { error } = await supabase
          .from("chats")
          .insert({
            client_phone: clientPhone,
            organization_id: organization.id,
            status: 'closed',
            closed_at: new Date().toISOString(),
          });

        if (error) {
          console.error("Erro ao criar chat fechado:", error);
          return false;
        }
      }

      // Atualizar o estado local e cache
      setChatStatusCache(prev => new Map(prev).set(clientPhone, 'closed'));
      setClients(prev => prev.map(client => 
        client.phone === clientPhone ? { ...client, chatStatus: 'closed' } : client
      ));

      console.log(`Chat ${clientPhone} fechado com sucesso`);
      return true;
    } catch (error) {
      console.error("Erro ao fechar chat:", error);
      return false;
    }
  };

  const reopenChatStatus = async (clientPhone: string) => {
    try {
      if (!organization?.id) {
        console.error("Organization ID não encontrado");
        return false;
      }

      // Primeiro, verificar se já existe um chat para este telefone e organização
      const { data: existingChat } = await supabase
        .from("chats")
        .select("*")
        .eq("client_phone", clientPhone)
        .eq("organization_id", organization.id)
        .single();

      if (existingChat) {
        // Atualizar chat existente
        const { error } = await supabase
          .from("chats")
          .update({
            status: 'open',
            closed_at: null,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingChat.id);

        if (error) {
          console.error("Erro ao reabrir chat:", error);
          return false;
        }
      } else {
        // Criar novo chat aberto
        const { error } = await supabase
          .from("chats")
          .insert({
            client_phone: clientPhone,
            organization_id: organization.id,
            status: 'open',
            closed_at: null,
          });

        if (error) {
          console.error("Erro ao criar chat aberto:", error);
          return false;
        }
      }

      // Atualizar o estado local e cache
      setChatStatusCache(prev => new Map(prev).set(clientPhone, 'open'));
      setClients(prev => prev.map(client => 
        client.phone === clientPhone ? { ...client, chatStatus: 'open' } : client
      ));

      console.log(`Chat ${clientPhone} reaberto com sucesso`);
      return true;
    } catch (error) {
      console.error("Erro ao reabrir chat:", error);
      return false;
    }
  };

  const toggleShowClosedChats = () => {
    setShowClosedChats(prev => !prev);
  };

  // Filtrar clientes baseado no status
  const filteredClients = !chatStatusesReady
    ? []
    : (showClosedChats 
      ? clients.filter(client => client.chatStatus === 'closed')
      : clients.filter(client => client.chatStatus === 'open'));


  // Total de mensagens não lidas considerando todas as conversas (abertas e fechadas)
  const totalUnreadAll = useMemo(
    () => clients.reduce((sum, c) => sum + (c.unread || 0), 0),
    [clients]
  );

  return {
    clients: filteredClients,
    totalUnread: totalUnreadAll,
    getClientMessages,
    markMessagesAsRead,
    deleteMessage,
    deleteAllClientMessages,
    sendMessage,
    sendImage,
    loading,
    refetch: fetchMessages,
    closeChatStatus,
    reopenChatStatus,
    showClosedChats,
    toggleShowClosedChats
  };
};