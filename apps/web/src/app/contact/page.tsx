import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock, Mail, MapPin } from "lucide-react";
import { brand } from "@/config/brand";
import { routes } from "@/config/routes";
import { ContactCopyEmail } from "@/app/contact/contact-copy-email";
import { ContactForm } from "@/app/contact/contact-form";
import "./contact-page.css";

const CONTACT_EMAIL = "hello@labpath.dev";
const MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Hello LabPath")}`;

export const metadata: Metadata = {
  title: `Contact — ${brand.name}`,
  description: "Reach the LabPath team by email or send a message from your inbox.",
};

export default function ContactPage() {
  return (
    <div className="lp-app ag-page">
      <main className="lp-main lp-app-main lp-contact-page flex flex-col">
        <div className="lp-contact-bg-scrim" aria-hidden />
        <div className="lp-contact-bg-grid" aria-hidden />

        <div className="lp-contact-page-inner mx-auto flex w-full max-w-[960px] flex-1 flex-col px-6 pb-20 pt-6 sm:px-8 sm:pb-28 sm:pt-10 lg:max-w-[1024px] lg:pt-14">
          <div className="lp-contact-accent-bar" aria-hidden />

          <p className="lp-contact-eyebrow">Contact</p>
          <h1 className="lp-contact-title">Let&apos;s get in touch</h1>
          <p className="lp-contact-lede">
            Questions about the platform, lab content, or working together — pick a channel below or
            send us a structured note. We read every message.
          </p>

          <section className="lp-contact-info" aria-label="Contact options">
            <article className="lp-contact-info-card">
              <div className="lp-contact-info-icon" aria-hidden>
                <Mail className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <h2 className="lp-contact-info-title">Email</h2>
              <a href={MAILTO} className="lp-contact-info-value lp-contact-info-link">
                {CONTACT_EMAIL}
              </a>
              <p className="lp-contact-info-meta">
                Best for partnerships, press, and security — use the form below so we have context.
              </p>
              <ContactCopyEmail email={CONTACT_EMAIL} />
            </article>

            <article className="lp-contact-info-card">
              <div className="lp-contact-info-icon" aria-hidden>
                <Clock className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <h2 className="lp-contact-info-title">Response time</h2>
              <p className="lp-contact-info-value">Within a few business days</p>
              <p className="lp-contact-info-meta">Urgent security issues: put Security in the subject line.</p>
            </article>

            <article className="lp-contact-info-card">
              <div className="lp-contact-info-icon" aria-hidden>
                <MapPin className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <h2 className="lp-contact-info-title">Where we are</h2>
              <p className="lp-contact-info-value">Remote-first</p>
              <p className="lp-contact-info-meta">We collaborate with teams and educators worldwide.</p>
            </article>
          </section>

          <section className="lp-contact-form-section" aria-labelledby="lp-contact-form-heading">
            <h2 id="lp-contact-form-heading" className="lp-contact-form-section-title">
              Or send a message
            </h2>
            <p className="lp-contact-form-section-lede">
              Fill in the fields — we&apos;ll open your mail app with the details prefilled so you can
              review and send.
            </p>
            <ContactForm />
          </section>

          <footer className="lp-contact-footer">
            <Link href={routes.home} className="lp-contact-back">
              <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
              Back to home
            </Link>
          </footer>
        </div>
      </main>
    </div>
  );
}
