import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ScrollToTopButton } from '../ui/scroll-to-top-button';

export function Consent() {
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
          <h1 className="text-3xl font-bold mb-6">Согласие на обработку персональных данных</h1>
          
          <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
            <p className="text-sm text-muted-foreground mb-4">
              <strong>Дата последнего обновления:</strong> {new Date().toLocaleDateString('ru-RU')}
            </p>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">1. Общие положения</h2>
              <p>
                Настоящее Согласие на обработку персональных данных (далее — «Согласие») предоставляется 
                в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных» 
                и определяет условия обработки персональных данных Пользователя.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">2. Данные оператора</h2>
              <p>
                Оператор персональных данных: [Наименование организации]<br />
                Адрес: [Адрес организации]<br />
                Email: info@omiai.kz
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">3. Персональные данные</h2>
              <p>
                Настоящим я даю согласие на обработку следующих персональных данных:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Фамилия, имя, отчество</li>
                <li>Адрес электронной почты</li>
                <li>Номер телефона</li>
                <li>Адрес доставки (при необходимости)</li>
                <li>Данные платежных карт (обрабатываются через TipTop)</li>
                <li>IP-адрес</li>
                <li>Данные об использовании Сервиса</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">4. Цели обработки</h2>
              <p>Персональные данные обрабатываются в следующих целях:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Предоставление доступа к функционалу Сервиса</li>
                <li>Обработка заказов и платежей</li>
                <li>Связь с Пользователем</li>
                <li>Улучшение качества Сервиса</li>
                <li>Соблюдение требований законодательства</li>
                <li>Маркетинговые коммуникации (при согласии)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">5. Способы обработки</h2>
              <p>
                Обработка персональных данных осуществляется с использованием средств автоматизации 
                и без использования таких средств, включая сбор, запись, систематизацию, накопление, 
                хранение, уточнение, извлечение, использование, передачу, обезличивание, блокирование, 
                удаление, уничтожение персональных данных.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">6. Срок действия согласия</h2>
              <p>
                Согласие действует с момента предоставления до момента отзыва согласия Пользователем 
                или до достижения целей обработки персональных данных.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">7. Права субъекта персональных данных</h2>
              <p>Пользователь имеет право:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Получать информацию, касающуюся обработки его персональных данных</li>
                <li>Требовать уточнения, блокирования или уничтожения персональных данных</li>
                <li>Отозвать согласие на обработку персональных данных</li>
                <li>Обжаловать действия или бездействие Оператора в уполномоченном органе</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">8. Отзыв согласия</h2>
              <p>
                Пользователь вправе отозвать настоящее Согласие, направив письменное уведомление 
                на адрес электронной почты: info@omiai.kz
              </p>
              <p>
                В случае отзыва согласия Оператор прекращает обработку персональных данных и уничтожает 
                их в срок, не превышающий 30 дней с момента получения отзыва, если иное не предусмотрено 
                договором или законодательством.
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
