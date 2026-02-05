import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ScrollToTopButton } from '../ui/scroll-to-top-button';

export function PaymentPolicy() {
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
          <h1 className="text-3xl font-bold mb-6">Политика обработки платежей</h1>
          
          <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
            <p className="text-sm text-muted-foreground mb-4">
              <strong>Дата последнего обновления:</strong> {new Date().toLocaleDateString('ru-RU')}
            </p>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">1. Общие положения</h2>
              <p>
                Настоящая Политика обработки платежей определяет порядок приема и обработки платежей 
                через Сервис. Все платежи обрабатываются через платежную систему TipTop, 
                которая обеспечивает безопасную обработку платежных данных.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">2. Способы оплаты</h2>
              <p>Мы принимаем следующие способы оплаты через TipTop:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Банковские карты Visa, MasterCard, МИР</li>
                <li>Электронные кошельки (при поддержке TipTop)</li>
                <li>Банковские переводы</li>
                <li>Другие способы оплаты, доступные в платежной системе TipTop</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">3. Безопасность платежей</h2>
              <p>
                Все платежи обрабатываются через защищенное соединение с использованием протокола SSL/TLS. 
                Платежная система TipTop соответствует стандарту безопасности данных индустрии платежных карт (PCI DSS).
              </p>
              <p>
                Мы не храним и не обрабатываем данные платежных карт напрямую. Все данные карт 
                обрабатываются исключительно платежной системой TipTop.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">4. Комиссии</h2>
              <p>
                Комиссии за обработку платежей взимаются платежной системой TipTop в соответствии 
                с тарифами, действующими на момент совершения платежа. Размер комиссии указывается 
                перед подтверждением платежа.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">5. Подтверждение платежа</h2>
              <p>
                После успешной обработки платежа Пользователь получает подтверждение на указанный 
                адрес электронной почты. В подтверждении указывается сумма платежа, дата и время, 
                номер транзакции.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">6. Обработка ошибочных платежей</h2>
              <p>
                В случае ошибочного платежа (двойная оплата, неправильная сумма) Пользователь 
                должен немедленно обратиться в службу поддержки. Ошибочные платежи подлежат возврату 
                в соответствии с Политикой возврата.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">7. Отказ в обработке платежа</h2>
              <p>
                Мы оставляем за собой право отказать в обработке платежа в следующих случаях:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Подозрение в мошенничестве</li>
                <li>Нарушение условий использования Сервиса</li>
                <li>Технические проблемы с платежной системой</li>
                <li>Другие случаи, предусмотренные законодательством</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">8. Контакты</h2>
              <p>
                По всем вопросам, связанным с обработкой платежей, вы можете обращаться 
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
