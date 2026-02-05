import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ScrollToTopButton } from '../ui/scroll-to-top-button';

export function RefundPolicy() {
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
          <h1 className="text-3xl font-bold mb-6">Политика возврата</h1>
          
          <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
            <p className="text-sm text-muted-foreground mb-4">
              <strong>Дата последнего обновления:</strong> {new Date().toLocaleDateString('ru-RU')}
            </p>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">1. Общие положения</h2>
              <p>
                Настоящая Политика возврата определяет условия и порядок возврата денежных средств 
                за оплаченные услуги и товары через Сервис. Все платежи обрабатываются через 
                платежную систему TipTop.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">2. Право на возврат</h2>
              <p>
                Пользователь имеет право на возврат денежных средств в следующих случаях:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Отказ от услуги в течение 14 дней с момента оплаты (если услуга не была оказана)</li>
                <li>Технические сбои, приведшие к невозможности использования оплаченной услуги</li>
                <li>Ошибка при оплате (двойная оплата, неправильная сумма)</li>
                <li>Нарушение условий предоставления услуги со стороны Сервиса</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">3. Сроки возврата</h2>
              <p>
                Возврат денежных средств осуществляется в течение 10 рабочих дней с момента 
                получения заявления на возврат и подтверждения права на возврат.
              </p>
              <p>
                Денежные средства возвращаются на ту же платежную карту или счет, с которого 
                была произведена оплата, через платежную систему TipTop.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">4. Порядок возврата</h2>
              <p>Для оформления возврата необходимо:</p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Отправить заявление на возврат на адрес электронной почты: info@omiai.kz</li>
                <li>Указать номер заказа или транзакции</li>
                <li>Указать причину возврата</li>
                <li>Приложить документы, подтверждающие право на возврат (при необходимости)</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">5. Случаи, когда возврат не производится</h2>
              <p>Возврат денежных средств не производится в следующих случаях:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Услуга была оказана в полном объеме</li>
                <li>Истек срок для возврата (14 дней)</li>
                <li>Нарушение условий использования Сервиса со стороны Пользователя</li>
                <li>Возврат запрошен по причинам, не предусмотренным настоящей Политикой</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">6. Комиссии при возврате</h2>
              <p>
                Комиссии платежной системы TipTop, удержанные при первоначальной оплате, 
                не возвращаются. Возврату подлежит сумма за вычетом комиссий платежной системы.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">7. Контакты</h2>
              <p>
                По всем вопросам, связанным с возвратом денежных средств, вы можете обращаться 
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
