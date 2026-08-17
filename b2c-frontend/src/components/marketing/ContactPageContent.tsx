'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  Phone,
  Send,
} from 'lucide-react';
import { Container } from './Container';
import { FOOTER_CONTACT } from './data';
import { buttonClasses } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { cn } from '@/src/lib/utils';
import { useTranslation, useIsRtl } from '@/src/i18n';
import type { MessageKey } from '@/src/i18n';

const CONTACT_LABEL_KEYS: Record<string, MessageKey> = {
  'Email Address:': 'marketing.contactEmailLabel',
  'Phone Number': 'marketing.contactPhoneLabel',
  'Our Address': 'marketing.contactAddressLabel',
};

const fieldClass =
  'h-12 rounded-md border border-line/70 bg-transparent px-4 text-sm text-ink shadow-none outline-none transition placeholder:text-ink/35 hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/10';

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <Label className="mb-2 block text-[13px] font-medium text-ink/70">
      {children}
      {required ? <span className="text-bad"> *</span> : null}
    </Label>
  );
}

function ContactForm() {
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSubmitting(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center px-2 py-10 text-center">
        <span className="grid size-12 place-items-center rounded-md border border-good/25 bg-good-soft text-good">
          <CheckCircle2 className="size-6" />
        </span>
        <h3 className="mt-5 font-heading text-xl font-medium text-ink">{t('marketing.messageSent')}</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-ink/65">{t('marketing.messageSentBody')}</p>
        <button
          type="button"
          className={buttonClasses({
            variant: 'outline',
            className: 'mt-8 h-11 rounded-md bg-transparent px-5 text-sm font-medium',
          })}
          onClick={() => setSent(false)}
        >
          {t('marketing.sendAnother')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel required>{t('marketing.fullName')}</FieldLabel>
          <Input
            name="name"
            placeholder={t('marketing.fullNamePlaceholder')}
            required
            autoComplete="name"
            className={fieldClass}
          />
        </div>
        <div>
          <FieldLabel required>{t('marketing.emailAddress')}</FieldLabel>
          <Input
            name="email"
            type="email"
            placeholder={t('marketing.emailPlaceholder')}
            required
            autoComplete="email"
            className={fieldClass}
          />
        </div>
      </div>

      <div>
        <FieldLabel required>{t('marketing.subject')}</FieldLabel>
        <Input
          name="subject"
          placeholder={t('marketing.subjectPlaceholder')}
          required
          className={fieldClass}
        />
      </div>

      <div>
        <FieldLabel required>{t('marketing.message')}</FieldLabel>
        <textarea
          name="message"
          required
          rows={6}
          placeholder={t('marketing.messagePlaceholder')}
          className={cn(
            'w-full resize-none rounded-md border border-line/70 bg-transparent px-4 py-3.5 text-sm text-ink shadow-none outline-none transition',
            'placeholder:text-ink/35 hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/10',
          )}
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-line/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink/45">{t('marketing.requiredFields')}</p>
        <button
          type="submit"
          disabled={submitting}
          className={buttonClasses({
            size: 'lg',
            className: 'h-11 rounded-md px-5 text-sm font-medium shadow-none sm:min-w-[180px]',
          })}
        >
          {submitting ? t('marketing.sending') : t('marketing.submitMessage')}
          <Send className={isRtl ? 'size-4 rtl-flip' : 'size-4'} />
        </button>
      </div>
    </form>
  );
}

function ContactDetails() {
  const { t } = useTranslation();
  const icons = { mail: Mail, phone: Phone, location: MapPin } as const;

  return (
    <ul className="divide-y divide-line/70">
      {FOOTER_CONTACT.map((item) => {
        const Icon = icons[item.icon];
        const labelKey = CONTACT_LABEL_KEYS[item.label];
        const label = labelKey ? t(labelKey) : item.label.replace(':', '');
        const inner = (
          <div className="flex items-start gap-3.5 py-5">
            <Icon className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.75} />
            <div className="min-w-0">
              <p className="text-xs font-medium text-ink/45">{label}</p>
              <p className="mt-1.5 break-words text-sm font-medium text-ink">{item.value}</p>
            </div>
          </div>
        );

        return (
          <li key={item.label}>
            {item.href ? (
              <Link href={item.href} className="block transition-colors hover:text-primary">
                {inner}
              </Link>
            ) : (
              inner
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function ContactPageContent() {
  const { t } = useTranslation();

  const supportTopics = [
    t('marketing.helpTopic1'),
    t('marketing.helpTopic2'),
    t('marketing.helpTopic3'),
    t('marketing.helpTopic4'),
  ] as const;

  return (
    <section className="bg-[var(--marketing-hero)] pt-4 pb-16 lg:pt-6 lg:pb-20">
      <Container>
        <header className="max-w-2xl">
          <h1 className="font-heading text-[2rem] font-medium leading-[1.18] tracking-[-0.02em] text-ink sm:text-[2.45rem]">
            {t('marketing.contactTitle')}
          </h1>
          <p className="mt-3 text-base leading-7 text-ink/70">{t('marketing.contactIntro')}</p>
        </header>

        <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-0">
          <aside className="space-y-8 lg:col-span-4 lg:pe-10">
            <div>
              <p className="text-sm font-medium text-ink">{t('marketing.responseTime')}</p>
              <p className="mt-1.5 flex items-center gap-2 text-sm text-ink/70">
                <Clock3 className="size-4 text-primary" />
                <span>
                  <span className="font-medium text-ink">{t('marketing.within24Hours')}</span>
                  <span className="text-ink/40"> · </span>
                  {t('marketing.responseHours')}
                </span>
              </p>
            </div>

            <div>
              <h2 className="text-sm font-medium text-ink">{t('marketing.directContact')}</h2>
              <div className="mt-5">
                <ContactDetails />
              </div>
            </div>

            <div>
              <h2 className="text-sm font-medium text-ink">{t('marketing.howWeHelp')}</h2>
              <ul className="mt-3 space-y-2">
                {supportTopics.map((topic) => (
                  <li key={topic} className="flex gap-2.5 text-sm leading-6 text-ink/70">
                    <span className="mt-2.5 size-1 shrink-0 rounded-full bg-primary" />
                    {topic}
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <div
            className="lg:col-span-8 lg:border-s lg:border-line/70 lg:ps-10 xl:ps-14"
            data-tour="tour-contact-form"
          >
            <h2 className="font-heading text-xl font-medium tracking-[-0.02em] text-ink sm:text-[1.35rem]">
              {t('marketing.sendMessage')}
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-ink/65">{t('marketing.sendMessageHint')}</p>
            <div className="mt-7">
              <ContactForm />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
