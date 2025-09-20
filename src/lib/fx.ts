// src/lib/fx.ts
// Minimal home-currency converter; replace with a real FX service later.
export async function convertToHome(
  amount: number,
  from: string,
  to = "USD",
  _date?: Date
): Promise<number> {
  // Mark optional param as intentionally unused (keeps future API shape)
  void _date;

  if (!amount || from === to) return amount;

  // TODO: plug in ECB/historical rates. For now, passthrough.
  return amount;
}
