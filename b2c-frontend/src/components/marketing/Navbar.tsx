'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, GraduationCap, Menu, Search, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Home', href: '#top' },
  { label: 'Learning Path', href: '#pages' },
  { label: 'Courses', href: '#courses' },
  { label: 'Contact', href: '#contact' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <motion.header
      className="absolute left-0 right-0 top-6 z-50 px-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="mx-auto flex h-[84px] max-w-[1280px] items-center rounded-[18px] border border-white/55 bg-white/92 px-8 shadow-[0_20px_60px_rgba(16,24,40,0.08)] backdrop-blur-[18px]">
        {/* ─── LEFT: Logo ─── */}
        <Link href="#top" className="relative z-10 flex shrink-0 items-center gap-2.5" aria-label="Educeed Home">
          <span className="relative flex flex-col items-center leading-none">
            <GraduationCap className="h-[18px] w-[18px] text-[#0D6E63]" strokeWidth={2.2} />
            <span className="mt-0.5 grid size-8 place-items-center rounded-full border-[2.5px] border-[#0D6E63] text-[11px] font-bold text-[#0D6E63]">
              e
            </span>
          </span>
          <span
            className="text-[28px] font-bold leading-none tracking-tight"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            <span className="text-[#1F2937]">Bina</span>
            <span className="font-normal text-[#6B7280]">B2C</span>
          </span>
        </Link>

        {/* ─── CENTER: Nav links ─── */}
        <nav
          className="relative z-10 mx-auto hidden items-center gap-[44px] lg:flex"
          role="navigation"
          aria-label="Main navigation"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="nav-link group relative py-2 text-[16px] font-medium text-[#111827] transition-colors duration-250 hover:text-[#0D6E63]"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              {link.label}
              <span className="nav-underline" />
            </a>
          ))}
        </nav>

        {/* ─── RIGHT: Actions ─── */}
        <div className="relative z-10 hidden items-center gap-6 lg:flex">
          {/* Search Icon */}
          <button
            type="button"
            aria-label="Search"
            className="inline-flex size-10 items-center justify-center rounded-full transition-all duration-250 hover:bg-[#F3F4F6] hover:text-[#0D6E63] hover:scale-110"
          >
            <Search className="size-6 text-[#374151]" />
          </button>

          {/* Login / Register */}
          <Link
            href="/login"
            className="text-[16px] font-medium text-[#1F2937] transition-colors duration-250 hover:text-[#0D6E63]"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            Login / Register
          </Link>

          {/* Apply Now Button */}
          <Link
            href="/signup"
            aria-label="Apply now"
            className="group inline-flex h-12 items-center gap-2.5 rounded-xl bg-[#F7B928] px-[30px] text-[16px] font-semibold text-[#111827] shadow-[0_4px_14px_rgba(247,185,40,0.35)] transition-all duration-300 hover:-translate-y-[2px] hover:bg-[#E5A920] hover:shadow-[0_8px_20px_rgba(247,185,40,0.4)]"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            Upgrade Now
            <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* ─── MOBILE: Hamburger ─── */}
        <div className="relative z-10 ml-auto flex items-center gap-3 lg:hidden">
          <Link
            href="/signup"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-[#F7B928] px-4 text-[14px] font-semibold text-[#111827]"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            Apply Now
          </Link>
          <button
            type="button"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen((v) => !v)}
            className="grid size-10 place-items-center rounded-xl border border-[#E5E7EB] bg-white/80 text-[#374151] backdrop-blur-sm"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* ─── MOBILE: Dropdown menu ─── */}
      {mobileOpen && (
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mx-auto mt-2 max-w-[1280px] rounded-2xl border border-white/55 bg-white/95 px-6 py-4 shadow-[0_20px_60px_rgba(16,24,40,0.12)] backdrop-blur-[18px] lg:hidden"
          role="navigation"
          aria-label="Mobile navigation"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block py-3 text-[16px] font-medium text-[#111827] transition-colors duration-250 hover:text-[#0D6E63]"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              {link.label}
            </a>
          ))}

          <div className="mt-3 flex flex-col gap-3 border-t border-[#E5E7EB] pt-3">
            <Link
              href="/login"
              className="text-center text-[15px] font-medium text-[#1F2937]"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              Login / Register
            </Link>
          </div>
        </motion.nav>
      )}

      {/* ─── Bottom accent strip ─── */}
      <div className="mx-auto h-1 max-w-[1265px] rounded-b-[80px] bg-[#0D6E63]" />
    </motion.header>
  );
}
