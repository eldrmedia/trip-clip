// src/lib/fx.ts
// Minimal home-currency converter; replace with a real FX service later.
export async function convertToHome(
  amount: number,
  from: string,
  to = "USD",
  _date?: Date
): Promise<number> {
  if (!amount || from === to) return amount;

  // TODO: plug in ECB/historical rates. For now, passthrough.
  return amount;
}
