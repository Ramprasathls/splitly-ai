import { GlobeIcon, PercentIcon, ZapIcon } from "lucide-react";
import { DebtProof } from "@/components/debt-proof";
import { LandingCta } from "@/components/landing-cta";
import { Card } from "@/components/ui/card";

// Entrance fade/slide from tw-animate-css: CSS only, off for reduced-motion.
const ENTER =
  "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700 motion-safe:fill-mode-backwards";

const FEATURES = [
  {
    icon: PercentIcon,
    title: "Split any way",
    blurb: "Equally, by percentages, or exact amounts.",
  },
  {
    icon: GlobeIcon,
    title: "Any currency",
    blurb: "¥, €, ₹ and $ in one group.",
  },
  {
    icon: ZapIcon,
    title: "Settle in one tap",
    blurb: "The fewest payments, computed for you.",
  },
];

const STEPS = [
  { title: "Create a group", blurb: "Invite friends by email." },
  { title: "Add expenses", blurb: "Any currency, any split." },
  { title: "Settle up", blurb: "Fewest possible payments." },
];

// Decorative currency glyphs: text, not emoji. Slow float, hidden from AT, and
// hidden on phones where they would sit behind the headline.
const GLYPHS = [
  { g: "£", pos: "left-[22%] top-6", size: "text-5xl", delay: "0s" },
  { g: "¥", pos: "left-[6%] top-24", size: "text-6xl", delay: "-2s" },
  { g: "€", pos: "right-[6%] top-32", size: "text-7xl", delay: "-4s" },
  { g: "$", pos: "right-[18%] bottom-10", size: "text-5xl", delay: "-1s" },
  { g: "₹", pos: "left-[12%] bottom-16", size: "text-6xl", delay: "-3s" },
];

export default function Home() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {GLYPHS.map(({ g, pos, size, delay }) => (
          <span
            key={g}
            aria-hidden
            style={{ animationDelay: delay }}
            className={`pointer-events-none absolute hidden select-none font-bold text-primary/10 motion-safe:animate-float sm:block ${pos} ${size}`}
          >
            {g}
          </span>
        ))}

        <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-24 text-center">
          <h1
            className={`text-balance text-5xl font-bold tracking-tight sm:text-6xl ${ENTER}`}
          >
            Split expenses,
            <br />
            <span className="text-primary">skip the mental math.</span>
          </h1>
          <p
            style={{ animationDelay: "120ms" }}
            className={`mx-auto mt-6 max-w-xl text-pretty text-lg text-muted-foreground ${ENTER}`}
          >
            Track shared costs in any currency. Splitly nets it all down to the
            fewest possible payments.
          </p>
          <div
            style={{ animationDelay: "240ms" }}
            className={`mt-8 flex justify-center ${ENTER}`}
          >
            <LandingCta />
          </div>

          <div
            style={{ animationDelay: "360ms" }}
            className={`mx-auto mt-16 max-w-4xl text-left ${ENTER}`}
          >
            <DebtProof />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-card/60 py-20">
        <div className="mx-auto grid max-w-5xl gap-6 px-6 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, blurb }) => (
            <Card
              key={title}
              className="gap-3 px-6 py-6 transition-transform duration-300 hover:-translate-y-1"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
              <p className="text-muted-foreground">{blurb}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <ol className="mx-auto grid max-w-5xl gap-8 px-6 md:grid-cols-3">
          {STEPS.map(({ title, blurb }, i) => (
            <li key={title} className="flex items-start gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                {i + 1}
              </span>
              <div>
                <h2 className="font-semibold tracking-tight">{title}</h2>
                <p className="text-muted-foreground">{blurb}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Final CTA */}
      <section className="bg-card/60 py-20">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to stop doing math at dinner?
          </h2>
          <p className="mt-3 text-muted-foreground">
            No spreadsheets were harmed.
          </p>
          <div className="mt-8 flex justify-center">
            <LandingCta />
          </div>
        </div>
      </section>
    </main>
  );
}
