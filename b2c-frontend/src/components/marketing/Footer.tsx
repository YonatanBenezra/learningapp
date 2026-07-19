'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Send,
  Phone,
  Mail,
  MapPin,
  ArrowUp,
} from 'lucide-react';
import { Container } from './Container';

const usefulLinks = ['Marketplace', 'Kindergarten', 'University', 'GYM Coaching', 'Cooking'];
const companyLinks = ['Contact Us', 'Become Teacher', 'Blog', 'Instructor', 'Events'];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-white">
      {/* ─── Gradient Background ─── */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 size-[700px] rounded-full bg-[#D4ECFF] opacity-55 blur-[140px]" />
        <div className="absolute left-1/3 top-20 size-[600px] rounded-full bg-[#FFF3D6] opacity-50 blur-[140px]" />
        <div className="absolute -right-40 top-10 size-[600px] rounded-full bg-[#D6F0FF] opacity-50 blur-[140px]" />
        <div className="absolute bottom-40 left-[20%] size-[500px] rounded-full bg-[#FFE4CC] opacity-40 blur-[130px]" />
        <div className="absolute -right-20 bottom-20 size-[450px] rounded-full bg-[#EDE4FF] opacity-40 blur-[130px]" />
      </div>

      {/* ─── Decorations ─── */}
      <div className="pointer-events-none absolute inset-0">
        {/* Green dotted square — left side */}
        <svg className="absolute bottom-[28%] left-[3%] size-20 opacity-[0.12]" viewBox="0 0 80 80">
          {[0, 12, 24, 36, 48, 60].map((x) =>
            [0, 12, 24, 36, 48, 60].map((y) => (
              <circle key={`${x}-${y}`} cx={x + 6} cy={y + 6} r="3" fill="#0D6E63" />
            ))
          )}
        </svg>

        {/* White dotted circle — top right */}
        <svg className="absolute right-[5%] top-[12%] size-24 opacity-[0.12]" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="42" fill="none" stroke="white" strokeWidth="2" strokeDasharray="5 4" />
        </svg>
      </div>

      {/* ─── Newsletter Card ─── */}
      <div className="relative z-1 mx-auto mt-[-110px] w-full max-w-[1220px] px-6">
        <div className="relative h-[210px] overflow-hidden rounded-[28px] bg-[#0B6A5B] shadow-[0_30px_80px_rgba(0,0,0,0.12)]">
          {/* Background curves inside card */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <svg className="absolute -right-16 -top-8 h-[280px] w-[480px] opacity-[0.06]" viewBox="0 0 480 280" fill="none">
              <path d="M0 180C80 80 180 40 320 90C460 140 480 220 480 280" stroke="white" strokeWidth="2" />
              <path d="M-40 220C60 130 180 70 340 110C480 140 520 250 520 280" stroke="white" strokeWidth="1.5" />
              <path d="M40 160C130 70 260 25 380 70C480 110 500 180 500 240" stroke="white" strokeWidth="1" />
            </svg>
            <svg className="absolute -left-8 bottom-0 h-[180px] w-[380px] opacity-[0.04]" viewBox="0 0 380 180" fill="none">
              <path d="M0 90C70 35 160 18 280 55C360 78 380 125 380 180" stroke="white" strokeWidth="2" />
              <path d="M-25 125C55 65 145 36 260 72C350 100 380 145 380 180" stroke="white" strokeWidth="1.5" />
            </svg>
          </div>

          <div className="relative z-10 flex h-full items-center justify-between px-20">
            {/* Left heading */}
            <h3
              className="max-w-[580px] text-[clamp(1.75rem,3.8vw,58px)] font-bold leading-[1.1] text-white"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              Sign Up today to get the
              <br />
              latest inspiration &amp; insights
            </h3>

            {/* Right form */}
            <div className="w-full max-w-[480px]">
              <div className="relative">
                <input
                  type="email"
                  placeholder="Enter Your Email Address"
                  className="h-[72px] w-full rounded-[18px] border border-gray-200 bg-white pl-6 pr-[76px] text-[18px] text-[#111827] outline-none placeholder:text-[#6B7280]"
                  style={{ fontFamily: 'var(--font-open-sans)' }}
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 flex size-[56px] -translate-y-1/2 items-center justify-center rounded-[14px] bg-[#0B6A5B] text-white transition-colors hover:bg-[#095c52]"
                  aria-label="Send"
                >
                  <Send className="size-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Footer ─── */}
      <Container className="relative z-10 pt-[100px] pb-[60px]">
        <div className="flex items-start justify-between gap-0 lg:flex-nowrap">
          {/* Column 1 — Logo + Description + CTA */}
          <div className="min-w-0 shrink-0 basis-[300px] pr-5">
            <Link href="#top" className="mb-4 flex items-center gap-2.5 text-[24px] font-extrabold text-[#111827]">
              <span className="grid size-10 place-items-center rounded-[12px] bg-[#0D6E63] text-[18px] font-bold text-white">
                B
              </span>
              Bina B2C
            </Link>
            <p
              className="max-w-[360px] text-[18px] leading-[1.8] text-[#6B7280]"
              style={{ fontFamily: 'var(--font-open-sans)' }}
            >
              Empowering learners worldwide with expert-led courses, hands-on labs,
              and career-ready skills for the modern workforce.
            </p>
            <Link
              href="/contact"
              className="mt-8 inline-flex h-[54px] items-center gap-2 rounded-[12px] bg-[#0D6E63] px-7 text-[16px] font-semibold text-white shadow-[0_4px_14px_rgba(13,110,99,0.3)] transition-all duration-300 hover:-translate-y-[2px] hover:bg-[#095c52]"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              Contact Us
              <svg className="size-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </Link>
          </div>

          {/* Divider 1 */}
          <div className="hidden shrink-0 self-stretch lg:block" style={{ borderLeft: '1px solid rgba(0,0,0,0.08)' }} />

          {/* Column 2 — Useful Links */}
          <div className="min-w-0 shrink-0 basis-[220px] px-6">
            <h4
              className="mb-8 text-[26px] font-bold leading-tight text-[#111827]"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              Useful Links
            </h4>
            <ul className="space-y-5">
              {usefulLinks.map((l) => (
                <li key={l}>
                  <Link
                    href="#"
                    className="text-[18px] text-[#6B7280] transition-colors hover:text-[#0D6E63]"
                    style={{ fontFamily: 'var(--font-open-sans)' }}
                  >
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Divider 2 */}
          <div className="hidden shrink-0 self-stretch lg:block" style={{ borderLeft: '1px solid rgba(0,0,0,0.08)' }} />

          {/* Column 3 — Our Company */}
          <div className="min-w-0 shrink-0 basis-[220px] px-4">
            <h4
              className="mb-8 text-[26px] font-bold leading-tight text-[#111827]"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              Our Company
            </h4>
            <ul className="space-y-5">
              {companyLinks.map((l) => (
                <li key={l}>
                  <Link
                    href="#"
                    className="text-[18px] text-[#6B7280] transition-colors hover:text-[#0D6E63]"
                    style={{ fontFamily: 'var(--font-open-sans)' }}
                  >
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Divider 3 */}
          <div className="hidden shrink-0 self-stretch lg:block" style={{ borderLeft: '1px solid rgba(0,0,0,0.08)' }} />

          {/* Column 4 — Get Contact */}
          <div className="min-w-0 shrink-0 basis-[260px] pl-10">
            <h4
              className="mb-8 text-[32px] font-semibold leading-tight text-[#111827]"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              Get Contact
            </h4>
            <ul className="space-y-5">
              <li className="flex items-center gap-3 text-[20px] text-[#6B7280]" style={{ fontFamily: 'var(--font-open-sans)' }}>
                <Phone className="size-5 shrink-0 text-[#0D6E63]" />
                (+91) 123-456-789
              </li>
              <li className="flex items-center gap-3 text-[20px] text-[#6B7280]" style={{ fontFamily: 'var(--font-open-sans)' }}>
                <Mail className="size-5 shrink-0 text-[#0D6E63]" />
                educeet@gmail.com
              </li>
              <li className="flex items-center gap-3 text-[20px] text-[#6B7280]" style={{ fontFamily: 'var(--font-open-sans)' }}>
                <MapPin className="size-5 shrink-0 text-[#0D6E63]" />
                Israel Ranana
              </li>
            </ul>

            {/* Social Icons */}
            <div className="mt-8 flex items-center gap-4">
              {/* X */}
              <a
                href="#"
                className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[rgba(0,0,0,0.08)] text-[#6B7280] transition-all duration-200 hover:border-[#0D6E63] hover:bg-[#0D6E63] hover:text-white"
                aria-label="X"
              >
                <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              {/* Facebook */}
              <a
                href="#"
                className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[rgba(0,0,0,0.08)] text-[#6B7280] transition-all duration-200 hover:border-[#0D6E63] hover:bg-[#0D6E63] hover:text-white"
                aria-label="Facebook"
              >
                <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              {/* Instagram */}
              <a
                href="#"
                className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[rgba(0,0,0,0.08)] text-[#6B7280] transition-all duration-200 hover:border-[#0D6E63] hover:bg-[#0D6E63] hover:text-white"
                aria-label="Instagram"
              >
                <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              {/* LinkedIn */}
              <a
                href="#"
                className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[rgba(0,0,0,0.08)] text-[#6B7280] transition-all duration-200 hover:border-[#0D6E63] hover:bg-[#0D6E63] hover:text-white"
                aria-label="LinkedIn"
              >
                <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </Container>

      {/* ─── Copyright Bar ─── */}
      <div className="relative z-10 flex h-[64px] items-center justify-center bg-[#1E2432]">
        <p
          className="text-[16px] text-white"
          style={{ fontFamily: 'var(--font-open-sans)' }}
        >
          Copyright &copy; 2026{' '}
          <span className="font-semibold text-[#F6C23E]">Bina B2C</span>{' '}
          All Rights Reserved
        </p>
      </div>

      {/* ─── Back to Top Button ─── */}
      <motion.a
        href="#top"
        className="fixed bottom-20 right-6 z-50 flex size-12 items-center justify-center rounded-full bg-[#0D6E63] text-white shadow-[0_4px_14px_rgba(13,110,99,0.35)] transition-colors hover:bg-[#095c52] lg:bottom-6 lg:right-8"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.4 }}
        aria-label="Back to top"
      >
        <ArrowUp className="size-5" />
      </motion.a>
    </footer>
  );
}
