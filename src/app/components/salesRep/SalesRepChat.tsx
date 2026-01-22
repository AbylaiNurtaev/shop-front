import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, User } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  isOwn: boolean;
}

interface Chat {
  id: string;
  name: string;
  lastMessage?: string;
  unreadCount?: number;
}

export function SalesRepChat() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat);
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChats = async () => {
    try {
      const response = await api.get<{ items: Chat[] }>('/sales-reps/chats');
      setChats(response.data?.items || []);
    } catch (error) {
      console.error('Ошибка загрузки чатов', error);
      toast.error('Не удалось загрузить чаты');
    }
  };

  const loadMessages = async (chatId: string) => {
    setIsLoading(true);
    try {
      const response = await api.get<{ items: Message[] }>(`/sales-reps/chats/${chatId}/messages`);
      setMessages(response.data?.items || []);
    } catch (error) {
      console.error('Ошибка загрузки сообщений', error);
      toast.error('Не удалось загрузить сообщения');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedChat) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      senderId: 'current-user',
      senderName: 'Вы',
      timestamp: new Date().toISOString(),
      isOwn: true,
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessageText('');

    try {
      await api.post(`/sales-reps/chats/${selectedChat}/messages`, {
        text: messageText,
      });
    } catch (error) {
      console.error('Ошибка отправки сообщения', error);
      toast.error('Не удалось отправить сообщение');
      setMessages((prev) => prev.filter((m) => m.id !== newMessage.id));
    }
  };

  const selectedChatData = chats.find((c) => c.id === selectedChat);

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col md:flex-row gap-4">
      {/* Список чатов */}
      <div className="w-full md:w-80 border border-border rounded-lg bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Чаты
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Нет активных чатов
            </div>
          ) : (
            <div className="divide-y divide-border">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat.id)}
                  className={`w-full p-4 text-left hover:bg-accent transition-colors ${
                    selectedChat === chat.id ? 'bg-accent' : ''
                  }`}
                >
                  <div className="font-medium mb-1">{chat.name}</div>
                  {chat.lastMessage && (
                    <div className="text-sm text-muted-foreground truncate">
                      {chat.lastMessage}
                    </div>
                  )}
                  {chat.unreadCount && chat.unreadCount > 0 && (
                    <div className="mt-1">
                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-primary rounded-full">
                        {chat.unreadCount}
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Область сообщений */}
      <div className="flex-1 border border-border rounded-lg bg-card flex flex-col">
        {selectedChat ? (
          <>
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold">{selectedChatData?.name || 'Чат'}</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Загрузка сообщений...</div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center text-muted-foreground">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Нет сообщений</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.isOwn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {!message.isOwn && (
                        <div className="text-xs font-medium mb-1 opacity-80">
                          {message.senderName}
                        </div>
                      )}
                      <div className="text-sm">{message.text}</div>
                      <div className="text-xs opacity-70 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Введите сообщение..."
                />
                <button
                  onClick={sendMessage}
                  disabled={!messageText.trim()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Выберите чат для начала общения</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
