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
      <img
        src={asset}
        alt={`${countryName} flag`}
        className={className ?? "inline-block h-4 w-6 rounded-[2px] object-cover"}
      />
    );
  }

  return (
    <span className={className} aria-hidden="true">
      {getCountryFlagEmoji(code)}
    </span>
  );
}
