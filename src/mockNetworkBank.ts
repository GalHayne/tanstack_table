export type NetworkBankRow = {
  knowNetworkId: string;
  comintPriority: number;
  txType: "FF" | "FH";
  centerFrequency: number | null;
  frequenciesMhz: number[] | null;
  hopRate: number | null;
  bandwidthKhz: number;
  modulation: string | null;
  speechType: string | null;
  unitSymbol: string | null;
  unitName: string | null;
  networkName: string | null;
  trafficType: string;
  lastInterceptionTime: string | null;
  jammingTarget: boolean;
};

function pad3(n: number) {
  return String(n).padStart(3, "0");
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/**
 * Generates a realistic-ish dataset:
 * - txType alternates FF/FH
 * - If FF => centerFrequency != null and frequenciesMhz = null
 * - If FH => centerFrequency = null and frequenciesMhz != null
 * - lastInterceptionTime spreads across recent days
 */
function generateMockNetworkBank(count: number): NetworkBankRow[] {
  const modulations = [null, "AM", "FM", "QPSK", "BPSK", "QAM"] as const;
  const speechTypes = [null, "Analog", "Digital", "Encrypted", "None"] as const;
  const trafficTypes = ["Analog Voice", "Digital Voice", "Data"] as const;

  const baseTime = Date.parse("2026-02-03T12:00:00.000Z");

  const rows: NetworkBankRow[] = [];
  for (let i = 1; i <= count; i++) {
    const isFH = i % 2 === 0;
    const txType: NetworkBankRow["txType"] = isFH ? "FH" : "FF";

    // priority 1..4 with some variation
    const comintPriority = (i % 4) + 1;

    // bandwidth typical-ish values
    const bandwidthKhz = [5, 10, 12.5, 15, 20, 22.5, 25][i % 7];

    // hop rate for FH, sometimes null for FF
    const hopRate = isFH ? [60, 120, 240, 300, 480][i % 5] : (i % 5 === 0 ? null : [10, 25, 50, 75][i % 4]);

    // center vs freqs (mutually exclusive)
    let centerFrequency: number | null = null;
    let frequenciesMhz: number[] | null = null;

    if (!isFH) {
      // FF: center exists
      // keep it in a reasonable range: 1..40 MHz
      centerFrequency = round2(((i * 1.37) % 39) + 1);
      frequenciesMhz = null;
    } else {
      // FH: array exists (5..12 points)
      centerFrequency = null;
      const len = 5 + (i % 8); // 5..12
      const start = round2(((i * 0.91) % 28) + 1); // 1..29
      const step = round2(((i % 5) + 1) * 0.35); // 0.35..1.75
      frequenciesMhz = Array.from({ length: len }, (_, k) => round2(start + k * step));
    }

    // nullable strings sometimes
    const modulation = modulations[i % modulations.length];
    const speechType = speechTypes[(i + 2) % speechTypes.length];
    const trafficType = trafficTypes[i % trafficTypes.length];

    const unitSymbol = null; // כרגע עזבנו unit
    const unitName = null;

    const networkName = i % 6 === 0 ? null : `Net-${pad3((i % 250) + 1)}`;

    // Some rows have no interception time
    const lastInterceptionTime =
      i % 13 === 0
        ? null
        : new Date(baseTime - i * 60_000 * (3 + (i % 17))).toISOString();

    const jammingTarget = i % 3 === 0;

    rows.push({
      knowNetworkId: `KN-${pad3(i)}`,
      comintPriority,
      txType,
      centerFrequency,
      frequenciesMhz,
      hopRate,
      bandwidthKhz,
      modulation,
      speechType,
      unitSymbol,
      unitName,
      networkName,
      trafficType,
      lastInterceptionTime,
      jammingTarget,
    });
  }

  return rows;
}

const mockNetworkBank = generateMockNetworkBank(1000);

export default mockNetworkBank;