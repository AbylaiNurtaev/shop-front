import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface Message {
  role: 'user' | 'ai';
  content: string;
  id?: string;
}

interface LandingAIFAQProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LandingAIFAQ({ open, onOpenChange }: LandingAIFAQProps) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Автопрокрутка к последнему сообщению
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
    if (messagesContainerRef.current) {
      setTimeout(() => {
        messagesContainerRef.current!.scrollTop = messagesContainerRef.current!.scrollHeight;
      }, 0);
    }
  }, [messages, isLoading]);

  // Сброс сообщений при закрытии
  useEffect(() => {
    if (!open) {
      setMessages([]);
      setQuestion('');
    }
  }, [open]);

  const handleSend = async () => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: trimmedQuestion,
      id: Date.now().toString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setIsLoading(true);

    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    try {
      const response = await api.post<{ success: boolean; response: string; timestamp: string }>('/faq', {
        message: trimmedQuestion,
      });

      const aiMessage: Message = {
        role: 'ai',
        content: response.data.response || 'Не удалось получить ответ от AI.',
        id: (Date.now() + 1).toString(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error('Ошибка отправки сообщения', error);

      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        'Не удалось отправить сообщение. Попробуйте позже.';

      toast.error(errorMessage);

      const errorAiMessage: Message = {
        role: 'ai',
        content: 'Извините, произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте еще раз.',
        id: (Date.now() + 1).toString(),
      };

      setMessages((prev) => [...prev, errorAiMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const adjustTextareaHeight = (target: HTMLTextAreaElement) => {
    target.style.height = 'auto';
    const newHeight = Math.min(target.scrollHeight, 200);
    target.style.height = `${Math.max(newHeight, 44)}px`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            AI-помощник
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-8 flex-1">
              <div className="text-center max-w-2xl w-full">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Задайте вопрос о нашей программе</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Я помогу вам узнать больше о возможностях программы для управления магазином
                </p>
              </div>
            </div>
          ) : (
            <div
              ref={messagesContainerRef}
              className="overflow-y-auto overflow-x-hidden flex-1 px-6 py-4"
            >
              <div className="max-w-3xl mx-auto space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'ai' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}

                    <div
                      className={`flex flex-col gap-1 max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`rounded-2xl px-4 py-3 ${msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-tr-md'
                          : 'bg-gradient-to-br from-primary/5 via-accent/30 to-primary/10 dark:from-primary/10 dark:via-primary/5 dark:to-accent/20 text-foreground rounded-tl-md border border-primary/10 dark:border-primary/20'
                          }`}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">
                          {msg.content}
                        </p>
                      </div>
                    </div>

                    {msg.role === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3 justify-start w-full">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="bg-gradient-to-br from-primary/5 via-accent/30 to-primary/10 dark:from-primary/10 dark:via-primary/5 dark:to-accent/20 border border-primary/10 dark:border-primary/20 rounded-2xl rounded-tl-md px-4 py-3">
                        <div className="flex gap-1.5 items-center">
                          <div
                            className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
                            style={{ animationDelay: '0ms' }}
                          />
                          <div
                            className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
                            style={{ animationDelay: '150ms' }}
                          />
                          <div
                            className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
                            style={{ animationDelay: '300ms' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} className="h-4" />
              </div>
            </div>
          )}

          <div className="border-t bg-card px-6 py-4">
            <div className="flex gap-3 items-center max-w-3xl mx-auto">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={question}
                  onChange={(e) => {
                    setQuestion(e.target.value);
                    adjustTextareaHeight(e.target);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Задайте вопрос о программе..."
                  disabled={isLoading}
                  rows={1}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed text-base placeholder:text-muted-foreground overflow-hidden"
                  style={{
                    minHeight: '44px',
                    maxHeight: '200px',
                    height: '44px',
                    boxSizing: 'border-box',
                    overflowY: 'hidden',
                  }}
                  onInput={(e) => {
                    adjustTextareaHeight(e.target as HTMLTextAreaElement);
                  }}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!question.trim() || isLoading}
                className="flex-shrink-0 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  width: '44px',
                  height: '44px',
                }}
                aria-label="Отправить сообщение"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Нажмите Enter для отправки, Shift+Enter для новой строки
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
