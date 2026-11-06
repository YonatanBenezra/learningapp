export function getTimezoneOptions(): { value: string; label: string }[] {
  let zones: string[] = ["UTC"];
  try {
    if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl) {
      zones = Intl.supportedValuesOf("timeZone");
    }
  } catch {
    /* fallback */
  }
  return zones.map((value) => ({
    value,
    label: value.replace(/_/g, " "),
  }));
}

export const CALLING_CODE_OPTIONS = [
  { value: "+880", label: "+880 (BD)" },
  { value: "+1", label: "+1 (US)" },
  { value: "+44", label: "+44 (UK)" },
  { value: "+91", label: "+91 (IN)" },
  { value: "+61", label: "+61 (AU)" },
  { value: "+49", label: "+49 (DE)" },
  { value: "+33", label: "+33 (FR)" },
  { value: "+81", label: "+81 (JP)" },
  { value: "+971", label: "+971 (AE)" },
  { value: "+65", label: "+65 (SG)" },
];

export const YEARS_EXPERIENCE_OPTIONS = [
  { value: "0-2 years (Junior)", label: "0-2 years (Junior)" },
  { value: "3-5 years (Mid Level)", label: "3-5 years (Mid Level)" },
  { value: "6-10 years (Senior)", label: "6-10 years (Senior)" },
  { value: "10+ years", label: "10+ years" },
];
