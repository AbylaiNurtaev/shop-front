import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Loader2, Phone } from 'lucide-react';
import api from '../../api/axios';

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber: string;
  onVerified: () => void;
  isDemo?: boolean;
}

export function PhoneVerificationModal({
  isOpen,
  onClose,
  phoneNumber,
  onVerified,
  isDemo = false,
}: PhoneVerificationModalProps) {
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  // Функция для нормализации номера телефона
  const normalizePhoneNumber = (phone: string): string => {
    // Удаляем все нецифровые символы, кроме +
    let cleaned = phone.replace(/[^\d+]/g, '');
    // Если не начинается с +, добавляем
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    return cleaned;
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Код должен состоять из 6 цифр');
      return;
    }

    setIsVerifying(true);
    setError(undefined);

    try {
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      await api.post('/auth/verification/phone/verify', {
        phoneNumber: normalizedPhone,
        code: verificationCode,
        ...(isDemo && { demo: true }),
      });
      onVerified();
      setVerificationCode('');
      setError(undefined);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Неверный код верификации';
      setError(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setVerificationCode('');
    setError(undefined);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            Верификация телефона
          </DialogTitle>
          <DialogDescription>
            Мы отправили вам на WhatsApp кодовое сообщение на номер {phoneNumber}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Введите код верификации <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setVerificationCode(value);
                setError(undefined);
              }}
              className="w-full px-3 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-center text-2xl tracking-widest"
              placeholder="000000"
              maxLength={6}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && verificationCode.length === 6) {
                  handleVerify();
                }
              }}
            />
            {error && (
              <p className="mt-2 text-xs text-destructive">{error}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleVerify}
              disabled={isVerifying || verificationCode.length !== 6}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Проверка...</span>
                </>
              ) : (
                'Подтвердить'
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
