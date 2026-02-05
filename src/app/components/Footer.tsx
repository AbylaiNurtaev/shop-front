import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Shield, CreditCard, RotateCcw, UserCheck } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/30 shrink-0">
      <div className="container mx-auto px-4 py-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* О компании */}
          <div>
            <h3 className="text-xs font-semibold mb-2">О компании</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Платформа для управления продажами и дистрибуцией товаров
            </p>
          </div>

          {/* Документы */}
          <div>
            <h3 className="text-xs font-semibold mb-2">Документы</h3>
            <ul className="space-y-1.5">
              <li>
                <Link
                  to="/privacy-policy"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Shield className="w-3 h-3" />
                  <span className="truncate">Политика конфиденциальности</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/terms-of-service"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <FileText className="w-3 h-3" />
                  <span className="truncate">Пользовательское соглашение</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/refund-policy"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="truncate">Политика возврата</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/payment-policy"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <CreditCard className="w-3 h-3" />
                  <span className="truncate">Политика обработки платежей</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/consent"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <UserCheck className="w-3 h-3" />
                  <span className="truncate">Согласие на обработку персональных данных</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Контакты */}
          <div>
            <h3 className="text-xs font-semibold mb-2">Контакты</h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>Email: info@omiai.kz</li>
              <li>Телефон: +7 771 594 37 38</li>
            </ul>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2">
            <p className="text-xs text-muted-foreground">
              © {currentYear} Все права защищены
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Платежи обрабатываются через</span>
              <span className="font-semibold text-foreground">TipTop</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
