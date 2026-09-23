import { cn } from "@/lib/utils";

/**
 * The SwasthSaathi mark — a heart with a medical cross cut out of it, on a
 * forest-green tile. Inline SVG (not an icon-font glyph) so the cross is a
 * true knock-out and scales cleanly from the 28px sidebar tile up to the
 * sign-in hero.
 */
function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-[30%] bg-primary text-primary-foreground shadow-primary",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-[62%]" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M12 21.2c-.3 0-.6-.1-.8-.3C5.6 16.3 2.5 13.3 2.5 9.1 2.5 6 4.8 3.8 7.7 3.8c1.8 0 3.3.9 4.3 2.2 1-1.3 2.5-2.2 4.3-2.2 2.9 0 5.2 2.2 5.2 5.3 0 4.2-3.1 7.2-8.7 11.8-.2.2-.5.3-.8.3ZM11 8.6v2.4H8.6a.9.9 0 0 0 0 1.8H11v2.4a1 1 0 0 0 2 0v-2.4h2.4a.9.9 0 0 0 0-1.8H13V8.6a1 1 0 0 0-2 0Z"
        />
      </svg>
    </span>
  );
}

/** Two-tone wordmark: "Swasth" in ink, "Saathi" in brand green. */
function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-bold tracking-tight text-foreground", className)}>
      Swasth<span className="text-primary">Saathi</span>
    </span>
  );
}

function BrandLockup({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark className={markClassName} />
      <BrandWordmark className="text-[0.95rem]" />
    </span>
  );
}

export { BrandMark, BrandWordmark, BrandLockup };
