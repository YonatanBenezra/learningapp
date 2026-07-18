import Link from 'next/link';
import { Container } from './Container';

const cols = [
  { h: 'Product', links: ['Features', 'How it works', 'Pricing', 'FAQ'] },
  { h: 'Domains', links: ['Cybersecurity', 'Networking', 'Programming', 'Systems'] },
  { h: 'Company', links: ['About', 'Privacy', 'Terms', 'Contact'] },
];

export function Footer() {
  return (
    <footer className="mt-20 bg-[#14122a] py-14 text-[#c9c6e4]">
      <Container>
        <div className="grid gap-8 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <Link href="#top" className="mb-3 flex items-center gap-2.5 text-lg font-extrabold text-white">
              <span className="grid size-8 place-items-center rounded-[10px] bg-linear-to-br from-primary to-primary-2 text-white">
                A
              </span>
              ABC
            </Link>
            <p className="max-w-[32ch] text-[13.5px] text-[#8e8ab8]">
              The AI that drafts your course, then hands you the labs to actually build the skill.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.h}>
              <h4 className="mb-3.5 text-[13px] font-semibold text-white">{c.h}</h4>
              {c.links.map((l) => (
                <a
                  key={l}
                  href="#"
                  className="block py-1.5 text-[13.5px] text-[#a6a2ce] transition-colors hover:text-white"
                >
                  {l}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap justify-between gap-4 border-t border-white/10 pt-6 text-[12.5px] text-[#8e8ab8]">
          <span>© 2026 ABC — Learn · Lab · Level up</span>
          <span>Your data, your call — export or delete anytime.</span>
        </div>
      </Container>
    </footer>
  );
}
