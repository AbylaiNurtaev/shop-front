import React, { useState } from 'react';
import { MessageCircle, Send, BookOpen } from 'lucide-react';

export function AIFAQ() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([]);

  const handleSend = () => {
    if (!question.trim()) return;
    
    // TODO: Интеграция с AI API
    setMessages([...messages, { role: 'user', content: question }]);
    setQuestion('');
    
    // Временный ответ
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: 'Это демо-версия AI-FAQ. В будущем здесь будет интеллектуальный помощник для ответов на вопросы.' 
      }]);
    }, 500);
  };

  return (
    <div className="space-y-4 h-full flex flex-col p-4 md:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-semibold">AI-FAQ и обучение</h1>
        <button className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors text-sm font-medium flex items-center gap-2 self-start sm:self-auto">
          <BookOpen className="w-4 h-4" />
          База знаний
        </button>
      </div>

      <div className="bg-card border border-border rounded-lg flex-1 flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Задайте вопрос, и AI-помощник ответит на него</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Задайте вопрос..."
              className="flex-1 px-3 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={handleSend}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Отправить</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
