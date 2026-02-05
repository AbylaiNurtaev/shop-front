import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ScrollToTopButton } from '../ui/scroll-to-top-button';

export function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад
        </button>

        <div className="bg-card border border-border rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold mb-6">Политика конфиденциальности</h1>
          
          <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
            <p className="text-sm text-muted-foreground mb-4">
              <strong>Дата последнего обновления:</strong> {new Date().toLocaleDateString('ru-RU')}
            </p>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">1. Общие положения</h2>
              <p>
                Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных 
                пользователей сервиса (далее — «Сервис»). Использование Сервиса означает безоговорочное согласие 
                пользователя с настоящей Политикой и указанными в ней условиями обработки его персональной информации.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">2. Собираемая информация</h2>
              <p>Мы собираем следующие типы персональных данных:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Имя, фамилия, отчество</li>
                <li>Адрес электронной почты</li>
                <li>Номер телефона</li>
                <li>Адрес доставки (при необходимости)</li>
                <li>Данные платежных карт (обрабатываются через платежную систему TipTop)</li>
                <li>IP-адрес и данные браузера</li>
                <li>Информация об использовании Сервиса</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">3. Цели обработки персональных данных</h2>
              <p>Персональные данные обрабатываются в следующих целях:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Предоставление доступа к функционалу Сервиса</li>
                <li>Обработка заказов и платежей</li>
                <li>Связь с пользователем по вопросам использования Сервиса</li>
                <li>Улучшение качества Сервиса</li>
                <li>Соблюдение требований законодательства</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">4. Защита персональных данных</h2>
              <p>
                Мы применяем современные методы защиты информации, включая шифрование данных, 
                использование защищенных протоколов передачи данных и ограничение доступа к персональным данным.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">5. Передача данных третьим лицам</h2>
              <p>
                Мы можем передавать персональные данные следующим категориям третьих лиц:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Платежным системам (TipTop) для обработки платежей</li>
                <li>Службам доставки (при необходимости)</li>
                <li>Поставщикам IT-услуг, обеспечивающим работу Сервиса</li>
                <li>Государственным органам в случаях, предусмотренных законодательством</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">6. Права пользователей</h2>
              <p>Пользователь имеет право:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Получать информацию о своих персональных данных</li>
                <li>Требовать исправления неточных данных</li>
                <li>Требовать удаления персональных данных</li>
                <li>Отозвать согласие на обработку персональных данных</li>
                <li>Обратиться с жалобой в уполномоченный орган по защите прав субъектов персональных данных</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">7. Cookies и аналогичные технологии</h2>
              <p>
                Сервис использует cookies и аналогичные технологии для улучшения работы сайта, 
                персонализации контента и анализа трафика. Пользователь может настроить браузер 
                для отказа от cookies, однако это может повлиять на функциональность Сервиса.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">8. Изменения в Политике конфиденциальности</h2>
              <p>
                Мы оставляем за собой право вносить изменения в настоящую Политику конфиденциальности. 
                О существенных изменениях мы уведомим пользователей путем размещения уведомления на сайте 
                или отправки уведомления на указанный адрес электронной почты.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">9. Контакты</h2>
              <p>
                По всем вопросам, связанным с обработкой персональных данных, вы можете обращаться 
                по адресу электронной почты: info@omiai.kz
              </p>
            </section>
          </div>
        </div>
      </div>
      <ScrollToTopButton />
    </div>
  );
}
