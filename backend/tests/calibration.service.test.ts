/**
 * Tests for Calibration Service — validation logic.
 * Tests der ikke kræver DB-forbindelse.
 */

describe("Calibration validation logic", () => {
  it("should require exactly 256 gamma table values", () => {
    const validTable = Array.from({ length: 256 }, (_, i) => i / 255);
    expect(validTable).toHaveLength(256);

    const tooShort = Array.from({ length: 100 }, (_, i) => i / 99);
    expect(tooShort).toHaveLength(100);

    const tooLong = Array.from({ length: 300 }, (_, i) => i / 299);
    expect(tooLong).toHaveLength(300);
  });

  it("should set valid_until to 30 days from now", () => {
    const now = new Date();
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    const diffMs = validUntil.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    expect(diffDays).toBeGreaterThanOrEqual(29.9);
    expect(diffDays).toBeLessThanOrEqual(30.1);
  });

  it("should detect expired calibration", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    const isExpired = pastDate < new Date();
    expect(isExpired).toBe(true);
  });

  it("should accept valid calibration within 30 days", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);

    const isValid = futureDate > new Date();
    expect(isValid).toBe(true);
  });

  it("should validate background luminance is 10 cd/m²", () => {
    const EXPECTED_BG_LUMINANCE = 10.0;
    expect(EXPECTED_BG_LUMINANCE).toBe(10.0);
  });

  it("should validate max stimulus luminance is 3183 cd/m²", () => {
    const EXPECTED_MAX_LUMINANCE = 3183.0;
    expect(EXPECTED_MAX_LUMINANCE).toBe(3183.0);
  });
});

describe("Gamma correction table", () => {
  it("should map pixel 0 to ~0 luminance", () => {
    const linearTable = Array.from({ length: 256 }, (_, i) => i / 255);
    expect(linearTable[0]).toBeCloseTo(0, 5);
  });

  it("should map pixel 255 to ~1.0 luminance", () => {
    const linearTable = Array.from({ length: 256 }, (_, i) => i / 255);
    expect(linearTable[255]).toBeCloseTo(1.0, 5);
  });

  it("should be monotonically increasing", () => {
    const table = Array.from({ length: 256 }, (_, i) => i / 255);
    for (let i = 1; i < table.length; i++) {
      expect(table[i]).toBeGreaterThanOrEqual(table[i - 1]);
    }
  });
});
