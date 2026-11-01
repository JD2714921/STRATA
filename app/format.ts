/** London display only. This does not change timestamps stored by the engines. */
export const fmt = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleString("en-GB", {
        timeZone: "Europe/London",
        dateStyle: "medium",
        timeStyle: "short",
      }) + " London"
    : "Unknown";
