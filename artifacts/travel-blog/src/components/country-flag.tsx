import { cn } from "@/lib/utils";
import { getCountryFlagAsset, getCountryFlagEmoji } from "@/lib/travel-countries";

type CountryFlagProps = {
  code: string;
  countryName: string;
  className?: string;
};

export function CountryFlag({ code, countryName, className }: CountryFlagProps) {
  const asset = getCountryFlagAsset(code);

  if (asset) {
    return (
      <span
        className={cn(
          "relative inline-block h-4 w-5 overflow-hidden align-[-0.125em]",
          className,
        )}
        role="img"
        aria-label={`${countryName} flag`}
      >
        <svg
          viewBox="0 0 60 40"
          className="h-[92%] w-[92%] drop-shadow-[0_1px_1px_rgba(0,0,0,0.22)]"
          aria-hidden="true"
        >
          <defs>
            <clipPath id={`flag-wave-${code.toLowerCase()}`}>
              <path d="M4 3.5C10 1.2 16 5.8 22 3.5C28 1.2 34 5.8 40 3.5C46 1.2 52 5.8 56 3.5V36.5C50 38.8 44 34.2 38 36.5C32 38.8 26 34.2 20 36.5C14 38.8 8 34.2 4 36.5Z" />
            </clipPath>
          </defs>
          <path
            d="M4 3.5C10 1.2 16 5.8 22 3.5C28 1.2 34 5.8 40 3.5C46 1.2 52 5.8 56 3.5V36.5C50 38.8 44 34.2 38 36.5C32 38.8 26 34.2 20 36.5C14 38.8 8 34.2 4 36.5Z"
            fill="#ffffff"
            stroke="rgba(0,0,0,0.14)"
            strokeWidth="1"
          />
          <image
            href={asset}
            x="4"
            y="3.5"
            width="52"
            height="33"
            preserveAspectRatio="none"
            clipPath={`url(#flag-wave-${code.toLowerCase()})`}
          />
        </svg>
      </span>
    );
  }

  return (
    <span className={className} aria-hidden="true">
      {getCountryFlagEmoji(code)}
    </span>
  );
}
