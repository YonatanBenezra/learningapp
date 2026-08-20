'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useTranslation } from '@/src/i18n';

export function PasswordStrength({ password }: { password: string }) {
  const { t } = useTranslation();

  const rules = [
    { label: t('authExtra.passwordMin8'), test: (pw: string) => pw.length >= 8 },
    { label: t('authExtra.passwordNumber'), test: (pw: string) => /\d/.test(pw) },
    {
      label: t('authExtra.passwordCase'),
      test: (pw: string) => /[a-z]/.test(pw) && /[A-Z]/.test(pw),
    },
    {
      label: t('authExtra.passwordSpecial'),
      test: (pw: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw),
    },
  ];

  if (!password) return null;

  const passed = rules.map((r) => r.test(password));
  const score = passed.filter(Boolean).length;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-line">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                i < score ? 'w-full bg-primary' : 'w-0 bg-transparent'
              }`}
            />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-1">
        {rules.map((rule, i) => (
          <div key={rule.label} className="flex items-center gap-2 text-xs">
            <span
              className={`flex size-4 shrink-0 items-center justify-center rounded-full transition-colors ${
                passed[i]
                  ? 'bg-primary text-white'
                  : 'border border-line bg-bg-soft text-ink-3'
              }`}
            >
              {passed[i] && <Check className="size-2.5" strokeWidth={3} />}
            </span>
            <span className={passed[i] ? 'text-primary' : 'text-ink-3'}>{rule.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
