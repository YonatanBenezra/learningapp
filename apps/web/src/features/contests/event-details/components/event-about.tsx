import Link from "next/link";
import { routes } from "@/config/routes";

type EventAboutProps = {
  paragraphs: string[];
};

export function EventAbout({ paragraphs }: EventAboutProps) {
  return (
    <section aria-labelledby="event-about-heading">
      <h2 id="event-about-heading" className="text-lg font-semibold text-white">
        About the Event
      </h2>
      <div className="mt-5 space-y-6 text-base leading-7 text-[#A4B1CD]">
        {paragraphs.map((text, i) => (
          <p key={i}>
            {text.split("Contact —").map((part, j, arr) =>
              j < arr.length - 1 ? (
                <span key={j}>
                  {part}
                  <Link href={routes.contact} className="text-[#9FEF00] underline underline-offset-4">
                    Contact
                  </Link>
                  {" —"}
                </span>
              ) : (
                <span key={j}>{part}</span>
              ),
            )}
          </p>
        ))}
      </div>
    </section>
  );
}
