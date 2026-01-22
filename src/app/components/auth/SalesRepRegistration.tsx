import React, { useState, useEffect, type FormEvent } from 'react';
import { ArrowLeft, Users, Loader2, Mail, CheckCircle2 } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';

interface SalesRepRegistrationProps {
  onComplete: () => void | Promise<void>;
  onBack: () => void;
}

export function SalesRepRegistration({ onComplete, onBack }: SalesRepRegistrationProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Email verification states
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [verificationError, setVerificationError] = useState<string | undefined>(undefined);
  const [codeSent, setCodeSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isEmailVerified) {
      setVerificationError('Пожалуйста, подтвердите ваш email');
      return;
    }
    if (!verificationCode || verificationCode.length !== 6) {
      setVerificationError('Пожалуйста, введите и подтвердите код верификации');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/auth/register-sales-representative', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        verificationCode,
      });
      toast.success('Регистрация успешна!');
      await onComplete();
    } catch (error: any) {
      console.error('Ошибка при регистрации торгового представителя', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось зарегистрироваться';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendVerificationCode = async () => {
    if (!formData.email) {
      setVerificationError('Пожалуйста, введите email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setVerificationError('Некорректный формат email');
      return;
    }

    setIsSendingCode(true);
    setVerificationError(undefined);
    setCodeSent(false);
    setIsEmailVerified(false);

    try {
      await api.post('/auth/verification/send', {
        email: formData.email,
      });
      setCodeSent(true);
    } catch (error: any) {
      const status = error.response?.status;
      const code = error.response?.data?.code;
      const backendError = error.response?.data?.error;

      if (status === 409 && code === 'EMAIL_ALREADY_EXISTS') {
        setVerificationError('Пользователь с таким email уже существует. Попробуйте войти в систему или используйте другой email.');
      } else {
        const fallbackMessage = backendError || error.response?.data?.message || 'Не удалось отправить код верификации';
        setVerificationError(fallbackMessage);
      }
      setCodeSent(false);
      setIsEmailVerified(false);
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setVerificationError('Код должен состоять из 6 цифр');
      return;
    }

    setIsVerifyingCode(true);
    setVerificationError(undefined);

    try {
      await api.post('/auth/verification/verify', {
        email: formData.email,
        code: verificationCode,
      });
      setIsEmailVerified(true);
      setVerificationError(undefined);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Неверный код верификации';
      setVerificationError(errorMessage);
      setIsEmailVerified(false);
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // Сброс верификации при изменении email
  useEffect(() => {
    if (formData.email) {
      setIsEmailVerified(false);
      setCodeSent(false);
      setVerificationCode('');
      setVerificationError(undefined);
    }
  }, [formData.email]);

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4 relative">
      {isSubmitting && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg shadow-lg p-6 sm:p-8 flex flex-col items-center gap-4 max-w-sm w-full">
            <div className="relative">
              <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary/70" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-base sm:text-lg font-semibold mb-1">Регистрация торгового представителя</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Отправка данных...
              </p>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300 ease-in-out"
                style={{
                  width: '60%',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}
              />
            </div>
          </div>
        </div>
      )}
      <div className="w-full max-w-2xl">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Назад</span>
        </button>

        <div className="bg-card border border-border rounded-lg shadow-sm p-4 sm:p-6 md:p-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold">Регистрация торгового представителя</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Укажите основные данные</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 relative">
            {isSubmitting && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] rounded-lg z-10" />
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm mb-1.5">
                  Имя торгового представителя <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full px-3 py-2 text-sm sm:text-base bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Введите ваше имя"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm mb-1.5">
                  Email <span className="text-destructive">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="flex-1 px-3 py-2 text-sm sm:text-base bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    placeholder="sales@example.com"
                    required
                    disabled={isEmailVerified}
                  />
                  {!isEmailVerified && (
                    <button
                      type="button"
                      onClick={handleSendVerificationCode}
                      disabled={isSendingCode || !formData.email}
                      className="px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs sm:text-sm font-medium whitespace-nowrap"
                    >
                      {isSendingCode ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="hidden sm:inline">Отправка...</span>
                          <span className="sm:hidden">...</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          <span className="hidden sm:inline">Отправить код</span>
                          <span className="sm:hidden">Код</span>
                        </>
                      )}
                    </button>
                  )}
                  {isEmailVerified && (
                    <div className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-500/10 text-green-600 rounded-md whitespace-nowrap">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium">Подтверждено</span>
                    </div>
                  )}
                </div>
                {codeSent && !isEmailVerified && (
                  <div className="mt-3 space-y-2">
                    <label className="block text-xs sm:text-sm mb-1.5">
                      Код верификации <span className="text-destructive">*</span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setVerificationCode(value);
                          setVerificationError(undefined);
                        }}
                        className="flex-1 px-3 py-2 text-sm sm:text-base bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Введите 6-значный код"
                        maxLength={6}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyCode}
                        disabled={isVerifyingCode || verificationCode.length !== 6}
                        className="px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs sm:text-sm font-medium whitespace-nowrap"
                      >
                        {isVerifyingCode ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="hidden sm:inline">Проверка...</span>
                            <span className="sm:hidden">...</span>
                          </>
                        ) : (
                          'Подтвердить'
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground break-words">
                      Код отправлен на <span className="break-all">{formData.email}</span>. Проверьте почту.
                    </p>
                  </div>
                )}
                {verificationError && (
                  <p className="mt-2 text-xs text-destructive">{verificationError}</p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm mb-1.5">
                  Пароль <span className="text-destructive">*</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  className="w-full px-3 py-2 text-sm sm:text-base bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Минимум 8 символов"
                  minLength={8}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
              <button
                type="button"
                onClick={onBack}
                disabled={isSubmitting}
                className="w-full sm:flex-1 px-4 py-2.5 text-sm sm:text-base border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !isEmailVerified}
                className="w-full sm:flex-1 bg-primary text-primary-foreground py-2.5 rounded-md hover:opacity-90 transition-opacity font-medium disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Регистрация...</span>
                    <span className="sm:hidden">Отправка...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Завершить регистрацию</span>
                    <span className="sm:hidden">Зарегистрироваться</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
