import { cleanNationalNumber, COUNTRY_OPTIONS, countryByIso, flagOf, phoneProblem } from "@shared/phone";
import { ChevronDown } from "lucide-react";
import React, { useId, useState } from "react";

/**
 * One box for a phone number: the country (flag and calling code, Nigeria by default) on the left, the number on the
 * right. The owner types the number without the leading 0; if they type it anyway it is dropped and they are told.
 * The country picker is the browser's own list (easy to search and scroll on a phone), shown as flag and code.
 */
export default function PhoneField({ label, iso, national, onChange }: { label: string; iso: string; national: string; onChange: (value: { iso: string; national: string }) => void }) {
  const id = useId();
  const [droppedZero, setDroppedZero] = useState(false);
  const country = countryByIso(iso);
  const problem = phoneProblem(country.iso, national);
  const [touched, setTouched] = useState(false);

  return (
    <div>
      <div className="flex h-12 items-stretch border border-input bg-paper-raised transition-shadow focus-within:shadow-[0_0_0_4px_rgba(28,78,126,0.12)] focus-within:ring-1 focus-within:ring-ring">
        <div className="relative flex shrink-0 items-center gap-1.5 border-r border-input px-3 text-sm">
          <span aria-hidden className="text-lg leading-none">{flagOf(country.iso)}</span>
          <span aria-hidden className="font-medium tabular-nums">+{country.dial}</span>
          <ChevronDown aria-hidden className="h-3.5 w-3.5 text-ink-muted" />
          <select
            aria-label="Country code"
            value={country.iso}
            onChange={(event) => { setDroppedZero(false); onChange({ iso: event.target.value, national }); }}
            className="absolute inset-0 cursor-pointer opacity-0"
          >
            {COUNTRY_OPTIONS.map((option) => (
              <option key={option.iso} value={option.iso}>{flagOf(option.iso)} {option.name} (+{option.dial})</option>
            ))}
          </select>
        </div>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          aria-label={label}
          aria-describedby={`${id}-hint`}
          aria-invalid={touched && problem ? true : undefined}
          value={national}
          placeholder={country.iso === "NG" ? "803 123 4567" : "Number"}
          onBlur={() => setTouched(true)}
          onChange={(event) => {
            const cleaned = cleanNationalNumber(country.iso, event.target.value);
            setDroppedZero(cleaned.droppedZero);
            onChange({ iso: cleaned.iso, national: cleaned.national });
          }}
          className="w-0 min-w-0 flex-1 bg-transparent px-3 text-base tabular-nums outline-none placeholder:text-ink-faint md:text-sm"
        />
      </div>
      <p id={`${id}-hint`} className={`mt-1.5 text-xs ${touched && problem ? "text-danger-strong" : "text-ink-muted"}`} role={touched && problem ? "alert" : undefined}>
        {touched && problem ? problem : droppedZero ? `No need for the first 0: +${country.dial} replaces it.` : "Type the number without the first 0."}
      </p>
    </div>
  );
}
