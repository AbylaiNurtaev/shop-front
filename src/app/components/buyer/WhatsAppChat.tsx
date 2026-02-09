import React, { useState, useRef, useEffect } from 'react';
import { Send, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../../api/axios';

type Message = {
  id: string;
  chatId: string;
  body: string;
  is_me: boolean;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  processingTime?: number;
  totalTime?: number;
};

export function WhatsAppChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [chatId, setChatId] = useState('79991234567@c.us');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || sending) return;

    const trimmedText = text.trim();
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      chatId,
      body: trimmedText,
      is_me: true,
      timestamp: new Date(),
      status: 'sending',
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput('');
    setSending(true);

    try {
      // Отправляем запрос с параметром test=true
      const response = await api.post('/wappi/webhook?test=true', {
        messages: [
          {
            chatId,
            body: trimmedText,
            is_me: false,
          },
        ],
      });

      // Обновляем статус отправленного сообщения
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id
            ? { ...msg, status: 'sent' as const }
            : msg
        )
      );

      // Обрабатываем ответ
      if (response.data.received) {
        // Тестовый режим - обрабатываем ответ с полем response (полный объект)
        if (response.data.testMode && response.data.response) {
          const result = response.data.response;

          // Логируем полный объект результата для отладки
          console.log('Wappi test response:', result);

          // Для отображения в чате берем только текст для пользователя
          const replyText =
            typeof result === 'string'
              ? result
              : result.replyText ||
                'Нет текстового ответа (replyText) в результате. Проверьте объект в консоли.';

          // Добавляем ответ от системы как сообщение
          const responseMessage: Message = {
            id: `response-${Date.now()}`,
            chatId,
            body: replyText,
            is_me: false,
            timestamp: new Date(),
            processingTime: response.data.processingTime,
            totalTime: response.data.totalTime,
          };
          setMessages((prev) => [...prev, responseMessage]);

          // Показываем информацию о времени обработки
          if (response.data.processingTime || response.data.totalTime) {
            const timeInfo = [];
            if (response.data.processingTime) {
              timeInfo.push(`Обработка: ${response.data.processingTime}мс`);
            }
            if (response.data.totalTime) {
              timeInfo.push(`Всего: ${response.data.totalTime}мс`);
            }
            if (timeInfo.length > 0) {
              console.log('Время обработки:', timeInfo.join(', '));
            }
          }

          const requestId = response.data.requestId;
          if (requestId) {
            console.log('RequestId:', requestId);
          }
        } else if (response.data.ignored) {
          toast.info(`Сообщение игнорировано: ${response.data.reason || 'неизвестная причина'}`);
        } else if (response.data.error) {
          toast.error(`Ошибка: ${response.data.error}`);
        } else {
          // Успешная отправка (не тестовый режим)
          const requestId = response.data.requestId;
          if (requestId) {
            console.log('RequestId:', requestId);
          }
        }
      }
    } catch (error: any) {
      console.error('Ошибка отправки сообщения', error);
      
      // Обновляем статус сообщения на ошибку
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id
            ? { ...msg, status: 'error' as const }
            : msg
        )
      );

      toast.error(error?.response?.data?.error || error?.response?.data?.message || 'Не удалось отправить сообщение');
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 bg-[#e5ddd5] flex items-center justify-center p-0 sm:p-4">
      <div className="w-full h-full sm:h-[90vh] sm:max-h-[800px] sm:max-w-xl sm:rounded-lg bg-white sm:border sm:border-gray-300 shadow-lg flex flex-col">
        {/* Заголовок */}
        <div className="flex-shrink-0 bg-[#075e54] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-semibold">
                {chatId.split('@')[0].slice(-2)}
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold">WhatsApp Chat</h1>
              <p className="text-xs text-white/80 truncate">{chatId}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            title="Выход"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Поле для ввода chatId */}
        <div className="flex-shrink-0 bg-[#f0f0f0] p-3 border-b border-gray-300">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-700 whitespace-nowrap">
              Chat ID:
            </label>
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="79991234567@c.us"
              className="flex-1 min-w-0 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#075e54]"
            />
          </div>
        </div>

        {/* Область сообщений */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2 bg-[#e5ddd5] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBkPSJNMjAgMGMxMS4wNDYgMCAyMCA4Ljk1NCAyMCAyMHMtOC45NTQgMjAtMjAgMjBTMCAzMS4wNDYgMCAyMCA4Ljk1NCAwIDIwIDB6IiBmaWxsPSIjZjBmMGYwIiBvcGFjaXR5PSIuNSIvPjwvZz48L3N2Zz4=')]">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <p className="text-sm">Начните отправлять сообщения</p>
                <p className="text-xs mt-1">Тестовый режим: ответы приходят синхронно</p>
                <p className="text-xs mt-0.5 text-gray-400">Эндпоинт: /api/wappi/webhook?test=true</p>
              </div>
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.is_me ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-sm ${
                  message.is_me
                    ? 'bg-[#dcf8c6] text-black'
                    : 'bg-white text-black'
                }`}
              >
                <div className="whitespace-pre-wrap break-words">{message.body}</div>
                {(message.processingTime !== undefined || message.totalTime !== undefined) && (
                  <div className="mt-1 text-[10px] text-gray-400">
                    {message.processingTime !== undefined && (
                      <span>⏱️ {message.processingTime}мс</span>
                    )}
                    {message.processingTime !== undefined && message.totalTime !== undefined && ' • '}
                    {message.totalTime !== undefined && (
                      <span>🕐 {message.totalTime}мс</span>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-[10px] text-gray-500">
                    {formatTime(message.timestamp)}
                  </span>
                  {message.is_me && (
                    <span className="text-[10px]">
                      {message.status === 'sending' && '⏱️'}
                      {message.status === 'sent' && '✓'}
                      {message.status === 'error' && '✗'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-end">
              <div className="max-w-[75%] rounded-lg px-3 py-2 text-sm bg-[#dcf8c6] shadow-sm">
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 text-xs">Отправка...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Поле ввода */}
        <div className="flex-shrink-0 bg-[#f0f0f0] p-3 border-t border-gray-300">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Введите сообщение..."
              className="flex-1 min-w-0 px-4 py-2 bg-white border border-gray-300 rounded-full text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#075e54]"
              disabled={sending}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-[#075e54] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#064e46] transition-colors"
              title="Отправить"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
