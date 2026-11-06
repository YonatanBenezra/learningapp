"use client";

import { useCallback, useState, type FormEvent } from "react";
import { ChevronRight, Send } from "lucide-react";

const PURPOSE = [
  { value: "", label: "Choose a topic" },
  { value: "general", label: "General inquiry" },
  { value: "product", label: "Product or demo" },
  { value: "partnership", label: "Partnership" },
  { value: "press", label: "Press" },
  { value: "security", label: "Security disclosure" },
  { value: "feedback", label: "Feedback" },
  { value: "other", label: "Other" },
] as const;

const AUDIENCE = [
  { value: "", label: "Best description for you" },
  { value: "student", label: "Student" },
  { value: "individual", label: "Individual builder" },
  { value: "startup", label: "Startup or small team" },
  { value: "enterprise", label: "Enterprise" },
  { value: "oss", label: "Open source contributor" },
  { value: "other-audience", label: "Other" },
] as const;

const CONTACT_EMAIL = "hello@labpath.dev";

export function ContactForm() {
  const [purpose, setPurpose] = useState("");
  const [audience, setAudience] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const onSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const purposeLabel = PURPOSE.find((p) => p.value === purpose)?.label ?? (purpose || "Contact");
      const audienceRaw = AUDIENCE.find((a) => a.value === audience)?.label;
      const audienceLabel = audienceRaw && audience ? audienceRaw : "";
      const subject = `[LabPath] ${purposeLabel}`;
      const lines = [
        `Purpose: ${purposeLabel}`,
        audienceLabel ? `Audience: ${audienceLabel}` : null,
        "",
        `Name: ${fullName.trim()}`,
        `Email: ${email.trim()}`,
        org.trim() ? `Organization: ${org.trim()}` : null,
        phone.trim() ? `Phone: ${phone.trim()}` : null,
        "",
        "Message:",
        message.trim() || "(no message)",
      ].filter(Boolean) as string[];
      const body = lines.join("\n");
      const href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = href;
    },
    [purpose, audience, fullName, email, org, phone, message],
  );

  return (
    <form className="lp-contact-form" onSubmit={onSubmit} noValidate>
      <div className="lp-contact-form-grid">
        <label className="lp-contact-field">
          <span className="lp-contact-field-label">Inquiry purpose</span>
          <select
            className="lp-contact-input lp-contact-select"
            name="purpose"
            value={purpose}
            onChange={(ev) => setPurpose(ev.target.value)}
            required
            aria-required
          >
            {PURPOSE.map((o) => (
              <option key={o.value || "empty"} value={o.value} disabled={o.value === ""}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="lp-contact-field">
          <span className="lp-contact-field-label">What fits you</span>
          <select
            className="lp-contact-input lp-contact-select"
            name="audience"
            value={audience}
            onChange={(ev) => setAudience(ev.target.value)}
          >
            {AUDIENCE.map((o) => (
              <option key={o.value || "empty"} value={o.value} disabled={o.value === ""}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="lp-contact-field">
          <span className="lp-contact-field-label">Full name</span>
          <input
            className="lp-contact-input"
            type="text"
            name="name"
            autoComplete="name"
            value={fullName}
            onChange={(ev) => setFullName(ev.target.value)}
            placeholder="Your name"
            required
            aria-required
          />
        </label>

        <label className="lp-contact-field">
          <span className="lp-contact-field-label">Email</span>
          <input
            className="lp-contact-input"
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            placeholder="you@example.com"
            required
            aria-required
          />
        </label>

        <label className="lp-contact-field">
          <span className="lp-contact-field-label">Organization</span>
          <input
            className="lp-contact-input"
            type="text"
            name="organization"
            autoComplete="organization"
            value={org}
            onChange={(ev) => setOrg(ev.target.value)}
            placeholder="Company or school (optional)"
          />
        </label>

        <label className="lp-contact-field">
          <span className="lp-contact-field-label">Phone</span>
          <input
            className="lp-contact-input"
            type="tel"
            name="phone"
            autoComplete="tel"
            value={phone}
            onChange={(ev) => setPhone(ev.target.value)}
            placeholder="Optional"
          />
        </label>

        <label className="lp-contact-field lp-contact-field-span-2">
          <span className="lp-contact-field-label">Message</span>
          <textarea
            className="lp-contact-textarea"
            name="message"
            rows={5}
            value={message}
            onChange={(ev) => setMessage(ev.target.value)}
            placeholder="Tell us what you need — demos, pricing, partnerships, or anything else."
          />
        </label>
      </div>

      <div className="lp-contact-form-actions">
        <button type="submit" className="lp-contact-submit">
          <Send className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          Open mail app
          <ChevronRight className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
        </button>
        <p className="lp-contact-form-hint">
          This opens your email client with everything filled in. You can edit before sending.
        </p>
      </div>
    </form>
  );
}
