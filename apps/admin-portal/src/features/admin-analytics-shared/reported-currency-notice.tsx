/**
 * States the currency the figures on screen were reported in. While a
 * different currency is requested (and still loading) it says so, so stale
 * amounts are never read as the newly selected currency.
 */
export function ReportedCurrencyNotice({
  reportedCurrencyCode,
  requestedCurrencyCode,
}: Readonly<{
  reportedCurrencyCode: string;
  requestedCurrencyCode: string;
}>) {
  const requested = requestedCurrencyCode.trim().toUpperCase();
  const stale = requested !== "" && requested !== reportedCurrencyCode;
  return (
    <p className="text-small text-fg-muted" role="status">
      {stale
        ? `Showing figures reported in ${reportedCurrencyCode}. ${requested} figures have not loaded yet.`
        : `Amounts are reported in ${reportedCurrencyCode}.`}
    </p>
  );
}
