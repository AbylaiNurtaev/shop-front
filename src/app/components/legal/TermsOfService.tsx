import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ScrollToTopButton } from '../ui/scroll-to-top-button';

export function TermsOfService() {
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
          <h1 className="text-3xl font-bold mb-6">Пользовательское соглашение</h1>
          
          <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
            <p className="text-sm text-muted-foreground mb-4">
              <strong>Дата последнего обновления:</strong> {new Date().toLocaleDateString('ru-RU')}
            </p>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">1. Общие положения</h2>
              <p>
                Настоящее Пользовательское соглашение (далее — «Соглашение») регулирует отношения между 
                администрацией Сервиса (далее — «Администрация») и пользователем Сервиса (далее — «Пользователь») 
                при использовании Сервиса.
              </p>
              <p>
                Используя Сервис, Пользователь подтверждает, что прочитал, понял и согласился с условиями 
                настоящего Соглашения. Если Пользователь не согласен с условиями Соглашения, он должен 
                прекратить использование Сервиса.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">2. Регистрация и учетная запись</h2>
              <p>Для использования Сервиса Пользователь должен:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Предоставить достоверную и актуальную информацию при регистрации</li>
                <li>Подтвердить адрес электронной почты и номер телефона</li>
                <li>Создать надежный пароль и обеспечить его конфиденциальность</li>
                <li>Немедленно уведомлять Администрацию о любом несанкционированном использовании учетной записи</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">3. Правила использования Сервиса</h2>
              <p>Пользователь обязуется:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Использовать Сервис только в законных целях</li>
                <li>Не нарушать права третьих лиц</li>
                <li>Не размещать незаконный, вредоносный или оскорбительный контент</li>
                <li>Не пытаться получить несанкционированный доступ к Сервису</li>
                <li>Не использовать автоматизированные системы для взаимодействия с Сервисом без разрешения</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">4. Интеллектуальная собственность</h2>
              <p>
                Все материалы Сервиса, включая дизайн, тексты, графику, логотипы, являются объектами 
                интеллектуальной собственности Администрации и защищены законодательством об интеллектуальной собственности.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">5. Платежи и возвраты</h2>
              <p>
                Все платежи обрабатываются через платежную систему TipTop. Условия возврата средств 
                регулируются Политикой возврата, доступной на сайте.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">6. Ответственность</h2>
              <p>
                Администрация не несет ответственности за ущерб, возникший в результате использования 
                или невозможности использования Сервиса, включая упущенную выгоду.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">7. Изменение условий</h2>
              <p>
                Администрация оставляет за собой право изменять условия настоящего Соглашения в любое время. 
                Продолжение использования Сервиса после внесения изменений означает согласие Пользователя 
                с новыми условиями.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">8. Расторжение соглашения</h2>
              <p>
                Администрация вправе приостановить или прекратить доступ Пользователя к Сервису в случае 
                нарушения условий настоящего Соглашения без предварительного уведомления.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">9. Применимое право</h2>
              <p>
                Настоящее Соглашение регулируется законодательством Российской Федерации. 
                Все споры подлежат разрешению в соответствии с законодательством РФ.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">10. Контакты</h2>
              <p>
                По всем вопросам, связанным с использованием Сервиса, вы можете обращаться 
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
