import { SignIn } from "@clerk/nextjs";
import { ChatCircleDotsIcon, ChartLineIcon, FileTextIcon, PillIcon } from "@phosphor-icons/react/ssr";
import { BrandMark, BrandWordmark } from "@/components/brand/brand";

const FEATURES = [
  { icon: ChatCircleDotsIcon, label: "AI health companion" },
  { icon: PillIcon, label: "Medicine reminders" },
  { icon: ChartLineIcon, label: "Track vitals" },
  { icon: FileTextIcon, label: "Report insights" },
];

/**
 * The signed-out landing — shared by every route's <Show when="signed-out">
 * so the first thing anyone sees is the brand, not a bare Clerk box
 * floating on an empty page. Brand panel on the left (hidden on phones,
 * where the compact header above the form carries the identity instead),
 * Clerk's SignIn on the right, skinned to the forest-green theme.
 */
function SignedOutScreen() {
  return (
    <div className="flex flex-1 overflow-y-auto">
      <div className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-8 p-4 md:grid-cols-2 md:p-8">
        <section className="bg-mint-wash relative hidden h-full min-h-[560px] flex-col overflow-hidden rounded-[2rem] p-10 md:flex">
          {/* soft decorative blobs */}
          <div aria-hidden className="absolute -top-16 -right-16 size-56 rounded-full bg-white/40" />
          <div aria-hidden className="absolute -bottom-24 -left-10 size-72 rounded-full bg-primary/5" />

          <div className="relative flex flex-1 flex-col items-center justify-center text-center">
            <div className="relative mb-8">
              <div aria-hidden className="absolute inset-0 scale-[1.9] rounded-full bg-white/50" />
              <div aria-hidden className="absolute inset-0 scale-[1.45] rounded-full bg-white/60" />
              <BrandMark className="relative size-24 rounded-[1.75rem]" />
            </div>
            <BrandWordmark className="text-4xl" />
            <p className="mt-2 text-base font-medium text-foreground/80">Your Health, Our Support</p>

            <ul className="mt-10 grid w-full max-w-sm grid-cols-4 gap-2">
              {FEATURES.map(({ icon: FeatureIcon, label }) => (
                <li key={label} className="flex flex-col items-center gap-2">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-white/80 text-primary shadow-soft">
                    <FeatureIcon className="size-6" weight="duotone" />
                  </span>
                  <span className="text-[0.7rem] leading-tight font-medium text-foreground/75">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="relative text-center text-sm text-foreground/60">A healthier tomorrow, together</p>
        </section>

        <section className="flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-3 text-center md:hidden">
            <BrandMark className="size-14 rounded-2xl" />
            <BrandWordmark className="text-2xl" />
            <p className="text-sm text-muted-foreground">Your Health, Our Support</p>
          </div>
          <SignIn
            routing="hash"
            appearance={{
              variables: {
                colorPrimary: "oklch(0.43 0.075 168)",
                colorForeground: "oklch(0.24 0.02 170)",
                borderRadius: "0.8rem",
                fontFamily: "var(--font-sans)",
              },
              elements: {
                cardBox: "shadow-soft-lg border border-border rounded-[1.5rem]",
                formButtonPrimary: "shadow-primary",
              },
            }}
          />
        </section>
      </div>
    </div>
  );
}

export { SignedOutScreen };
