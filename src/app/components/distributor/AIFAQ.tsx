import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../api/axios';

interface Message {
  role: 'user' | 'ai';
  content: string;
  id?: string;
}

interface QuickQuestion {
  id: string;
  question: string;
  endpoint: string;
}

interface QuestionResponse {
  success: boolean;
  question: string;
  data: any;
  response: string;
  timestamp: string;
}

const QUICK_QUESTIONS: QuickQuestion[] = [
  {
    id: 'sales-reps-count',
    question: 'Сколько ТП у меня сейчас?',
    endpoint: '/ai-assistant/questions/sales-reps-count',
  },
  {
    id: 'stores-without-sales-reps',
    question: 'Какие магазины сейчас без ТП?',
    endpoint: '/ai-assistant/questions/stores-without-sales-reps',
  },
  {
    id: 'top-brands-turnover',
    question: 'Какие бренды сейчас дают наибольший оборот?',
    endpoint: '/ai-assistant/questions/top-brands-turnover',
  },
  {
    id: 'expiring-products',
    question: 'Какие товары скоро истекают по сроку годности?',
    endpoint: '/ai-assistant/questions/expiring-products',
  },
];

export function AIFAQ() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileNavHidden, setIsMobileNavHidden] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  const hideMobileNav = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      window.dispatchEvent(
        new CustomEvent('mobileNavVisibilityChange', {
          detail: { hidden: true },
        })
      );
    }
  };

  const showMobileNav = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      window.dispatchEvent(
        new CustomEvent('mobileNavVisibilityChange', {
          detail: { hidden: false },
        })
      );
    }
  };

  // Автопрокрутка к последнему сообщению
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    // Дополнительно принудительно скроллим контейнер чата в самый низ,
    // чтобы на мобильных и после изменения высоты всё равно видеть последнее сообщение
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      // Небольшая задержка, чтобы успели отрендериться новые сообщения и изменить высоту
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 0);
    }
  }, [messages, isLoading]);

  // Слушаем изменение видимости мобильной навигации,
  // чтобы опускать поле ввода ниже, когда навигация скрыта
  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ hidden: boolean }>;
      if (typeof customEvent.detail?.hidden === 'boolean') {
        setIsMobileNavHidden(customEvent.detail.hidden);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('mobileNavVisibilityChange', handler as EventListener);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('mobileNavVisibilityChange', handler as EventListener);
      }
    };
  }, []);

  // Автофокус на поле ввода (только для десктопа, чтобы на мобиле не ломать навигацию и клавиатуру)
  useEffect(() => {
    if (!isLoading && inputRef.current && typeof window !== 'undefined' && window.innerWidth >= 768) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  // Установка фиксированной высоты на мобильных
  useEffect(() => {
    const updateHeight = () => {
      if (chatAreaRef.current) {
        if (window.innerWidth < 768) {
          chatAreaRef.current.style.height = 'calc(100vh - 60px - 96px)';
          chatAreaRef.current.style.maxHeight = 'calc(100vh - 60px - 96px)';
        } else {
          chatAreaRef.current.style.height = '';
          chatAreaRef.current.style.maxHeight = '';
        }
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

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

    // Сброс высоты textarea
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    try {
      const response = await api.post<{ success: boolean; response: string; timestamp: string }>('/ai-assistant/message', {
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

      // Добавляем сообщение об ошибке от AI
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
    const newHeight = Math.min(target.scrollHeight, 200); // Максимум 200px
    target.style.height = `${Math.max(newHeight, 44)}px`; // Минимум 44px
  };

  const handleQuickQuestion = async (quickQuestion: QuickQuestion) => {
    if (isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: quickQuestion.question,
      id: Date.now().toString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await api.get<QuestionResponse>(quickQuestion.endpoint);

      const aiMessage: Message = {
        role: 'ai',
        content: response.data.response || 'Не удалось получить ответ от AI.',
        id: (Date.now() + 1).toString(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error('Ошибка получения ответа на готовый вопрос', error);

      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        'Не удалось получить ответ. Попробуйте позже.';

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

  return (
    <div className="h-full flex flex-col">
      {/* Заголовок - только на десктопе */}
      <div className="hidden md:flex items-center px-4 md:px-6 py-4 border-b border-border flex-shrink-0">
        <h1 className="text-xl md:text-2xl font-semibold">AI-FAQ и обучение</h1>
      </div>

      {/* Мобильный заголовок */}
      <div className="md:hidden px-4 py-3 border-b border-border bg-card flex-shrink-0">
        <h1 className="text-lg font-semibold">AI-помощник</h1>
      </div>

      {/* Область чата */}
      <div
        ref={chatAreaRef}
        className="flex flex-col bg-background md:flex-1 md:min-h-0 md:overflow-hidden"
      >
        {messages.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center px-4 overflow-y-auto py-6 md:py-8 md:flex-1"
            style={{
              height: '100%',
              maxHeight: '100%',
            }}
          >
            <div className="text-center max-w-2xl w-full">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                <Bot className="w-8 h-8 md:w-10 md:h-10 text-primary" />
              </div>
              <h2 className="text-lg md:text-xl font-semibold mb-2 md:mb-3">AI-помощник Дс</h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6 md:mb-8">
                Задайте вопрос, и я помогу вам с информацией о работе Дс, аналитике, планах и многом другом.
              </p>

              {/* Готовые вопросы */}
              <div className="space-y-2 md:space-y-3">
                <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4 font-medium">
                  Или выберите готовый вопрос:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => handleQuickQuestion(q)}
                      disabled={isLoading}
                      className="px-4 py-3 md:py-3.5 text-left bg-card border border-border rounded-lg md:rounded-xl hover:bg-accent hover:border-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base shadow-sm"
                    >
                      <span className="text-foreground">{q.question}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            ref={messagesContainerRef}
            className="overflow-y-auto overflow-x-hidden md:flex-1 md:min-h-0"
            style={{
              height: '100%',
              maxHeight: '100%',
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
            }}
          >
            <div className="max-w-3xl xl:max-w-4xl mx-auto w-full px-3 sm:px-4 md:px-6 py-4 md:py-6 pb-32 md:pb-6">
              <div className="space-y-4 md:space-y-6">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 md:gap-4 w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                  >
                    {/* Аватар AI слева */}
                    {msg.role === 'ai' && (
                      <div className="flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                      </div>
                    )}

                    {/* Сообщение */}
                    <div
                      className={`flex flex-col gap-1 max-w-[calc(100%-3rem)] sm:max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'
                        }`}
                    >
                      <div
                        className={`rounded-2xl px-4 py-2.5 md:px-5 md:py-3 ${msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-tr-md'
                          : 'bg-muted text-foreground rounded-tl-md'
                          }`}
                      >
                        <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed break-words">
                          {msg.content}
                        </p>
                      </div>
                    </div>

                    {/* Аватар пользователя справа */}
                    {msg.role === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Индикатор загрузки */}
                {isLoading && (
                  <div className="flex gap-3 md:gap-4 justify-start w-full">
                    <div className="flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="bg-muted rounded-2xl rounded-tl-md px-4 py-2.5 md:px-5 md:py-3">
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
          </div>
        )}

        {/* Поле ввода */}
        <div
          className={`fixed md:static ${isMobileNavHidden ? 'bottom-0' : 'bottom-24'} md:bottom-auto left-0 right-0 border-t border-border bg-card flex-shrink-0 z-10 md:z-auto shadow-lg md:shadow-none md:border-t`}
        >
          <div className="max-w-3xl xl:max-w-4xl mx-auto w-full px-3 sm:px-4 md:px-6 py-3 md:py-4">
            <div className="flex gap-2 md:gap-3 items-center">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={question}
                  onChange={(e) => {
                    setQuestion(e.target.value);
                    adjustTextareaHeight(e.target);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Задайте вопрос..."
                  disabled={isLoading}
                  rows={1}
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-background border border-border rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none overflow-y-auto disabled:opacity-50 disabled:cursor-not-allowed text-[16px] md:text-base placeholder:text-muted-foreground shadow-sm"
                  style={{
                    minHeight: '44px',
                    maxHeight: '200px',
                    height: '44px',
                    boxSizing: 'border-box',
                  }}
                  onInput={(e) => {
                    adjustTextareaHeight(e.target as HTMLTextAreaElement);
                  }}
                  onFocus={hideMobileNav}
                  onBlur={showMobileNav}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!question.trim() || isLoading}
                className="flex-shrink-0 bg-primary text-primary-foreground rounded-xl md:rounded-2xl hover:opacity-90 active:opacity-80 transition-opacity flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                onMouseDown={(e) => {
                  // Не даём кнопке убирать фокус с textarea на мобильных,
                  // чтобы первый тап сразу отправлял сообщение, а не просто закрывал клавиатуру
                  e.preventDefault();
                }}
                style={{
                  width: '44px',
                  height: '44px',
                  minWidth: '44px',
                  minHeight: '44px',
                  boxSizing: 'border-box',
                }}
                aria-label="Отправить сообщение"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 md:w-5 md:h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center hidden sm:block">
              Нажмите Enter для отправки, Shift+Enter для новой строки
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
