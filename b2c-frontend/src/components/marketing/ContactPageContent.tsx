'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
} from 'lucide-react';
import { Container } from './Container';
import { FOOTER_CONTACT } from './data';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { cn } from '@/src/lib/utils';

const SUPPORT_TOPICS = [
  'Course access and learning progress',
  'Billing, subscriptions, and refunds',
  'Skill assessments and certificates',
  'Partnerships and institutional enquiries',
] as const;

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <Label className="mb-2 block text-sm font-semibold text-ink">
      {children}
      {required ? <span className="text-bad"> *</span> : null}
    </Label>
  );
}

function ContactForm() {
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
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-line bg-bg-soft px-6 py-12 text-center">
        <span className="grid size-14 place-items-center rounded-xl border border-good/20 bg-good-soft text-good">
          <CheckCircle2 className="size-7" />
        </span>
        <h3 className="mt-6 text-xl font-bold text-ink sm:text-2xl">Message sent successfully</h3>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-2">
          Thank you for contacting LabPath. A member of our support team will respond within one
          business day.
        </p>
        <Button type="button" variant="soft" className="mt-8" onClick={() => setSent(false)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel required>Full name</FieldLabel>
          <Input name="name" placeholder="Your full name" required autoComplete="name" />
        </div>
        <div>
          <FieldLabel required>Email address</FieldLabel>
          <Input
            name="email"
            type="email"
            placeholder="you@company.com"
            required
            autoComplete="email"
          />
        </div>
      </div>

      <div>
        <FieldLabel required>Subject</FieldLabel>
        <Input name="subject" placeholder="Brief summary of your enquiry" required />
      </div>

      <div>
        <FieldLabel required>Message</FieldLabel>
        <textarea
          name="message"
          required
          rows={6}
          placeholder="Please include any relevant details so we can assist you efficiently."
          className={cn(
            'w-full resize-none rounded-xl border border-line bg-bg-elev px-3.5 py-3 text-sm text-ink outline-none transition',
            'placeholder:text-ink-3 focus:border-primary focus:ring-2 focus:ring-primary/15',
          )}
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-3">Fields marked with * are required.</p>
        <Button type="submit" size="lg" disabled={submitting} className="sm:min-w-[180px]">
          {submitting ? 'Sending…' : 'Submit message'}
          <Send className="size-4" />
        </Button>
      </div>
    </form>
  );
}

function ContactDetails() {
  const icons = { mail: Mail, phone: Phone, location: MapPin } as const;

  return (
    <div className="space-y-4">
      {FOOTER_CONTACT.map((item) => {
        const Icon = icons[item.icon];
        const inner = (
          <div className="flex gap-4 rounded-xl border border-line bg-bg-elev p-5 transition-colors hover:border-primary/30">
            <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-primary/15 bg-primary-soft text-primary">
              <Icon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">
                {item.label.replace(':', '')}
              </p>
              <p className="mt-1 break-words text-base font-semibold text-ink">{item.value}</p>
            </div>
          </div>
        );

        return item.href ? (
          <Link key={item.label} href={item.href} className="block">
            {inner}
          </Link>
        ) : (
          <div key={item.label}>{inner}</div>
        );
      })}
    </div>
  );
}

export function ContactPageContent() {
  return (
    <section className="bg-bg pb-16 pt-24 sm:pb-20 sm:pt-28">
      <Container>
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            <MessageSquare className="size-3.5" />
            Contact
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Contact our team
          </h1>
          <p className="mt-3 text-base leading-relaxed text-ink-2">
            For support, billing questions, assessment enquiries, or partnership requests, please
            complete the form below. We aim to respond within one business day.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:gap-10">
          <aside className="space-y-6 lg:col-span-4">
            <div className="rounded-2xl border border-line bg-bg-elev p-5 shadow-card">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                  <Clock3 className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">Response time</p>
                  <p className="mt-1 text-2xl font-bold text-primary">Within 24 hours</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-2">
                    Monday to Friday, excluding public holidays.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-3">
                Direct contact
              </h2>
              <div className="mt-4">
                <ContactDetails />
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-bg-soft p-5">
              <h2 className="text-sm font-semibold text-ink">How we can help</h2>
              <ul className="mt-3 space-y-2.5">
                {SUPPORT_TOPICS.map((topic) => (
                  <li key={topic} className="flex gap-2 text-sm leading-relaxed text-ink-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                    {topic}
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <div className="lg:col-span-8">
            <div
              className="rounded-2xl border border-line bg-bg-elev p-6 shadow-lift sm:p-8"
              data-tour="tour-contact-form"
            >
              <div className="border-b border-line pb-5">
                <h2 className="text-xl font-bold text-ink">Send a message</h2>
                <p className="mt-1 text-sm text-ink-2">
                  Provide as much detail as possible so we can route your enquiry to the right team.
                </p>
              </div>
              <div className="pt-6">
                <ContactForm />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 rounded-2xl border border-line bg-bg-elev p-6 shadow-card sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                New to LabPath
              </p>
              <h2 className="mt-2 text-xl font-bold text-ink sm:text-2xl">
                Start learning with a personalized AI course
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-2 sm:text-base">
                Create a free account, take a skill assessment, and generate a course tailored to
                your level and goals.
              </p>
            </div>
            <Link href="/signup" className="shrink-0">
              <Button size="lg">
                Create free account
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
