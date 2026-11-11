/**
 * A decorative, NON-scannable "QR-like" pattern (250×250) with a DEMO watermark (UI §14.2).
 * It encodes nothing — no real PromptPay or bank data is ever shown (SPEC system 9).
 */
export function DemoQr({ seed }: { seed: string }) {
  const size = 25;
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const cells: [number, number][] = [];
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      h = Math.imul(h ^ (x * 31 + y), 16777619);
      const inFinder = (x < 7 && y < 7) || (x >= size - 7 && y < 7) || (x < 7 && y >= size - 7);
      if (!inFinder && (h >>> 0) % 2 === 0) cells.push([x, y]);
    }
  const finder = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={7} height={7} fill="#0A0B1E" />
      <rect x={x + 1} y={y + 1} width={5} height={5} fill="#fff" />
      <rect x={x + 2} y={y + 2} width={3} height={3} fill="#0A0B1E" />
    </g>
  );
  return (
    <svg
      viewBox={`-2 -2 ${size + 4} ${size + 4}`}
      className="size-[250px] max-w-full rounded-btn"
      role="img"
      aria-label="QR ตัวอย่าง (ระบบจำลอง ใช้ชำระเงินจริงไม่ได้)"
    >
      <rect x={-2} y={-2} width={size + 4} height={size + 4} fill="#fff" />
      {cells.map(([x, y]) => (
        <rect key={`${x}.${y}`} x={x} y={y} width={1} height={1} fill="#0A0B1E" />
      ))}
      {finder(0, 0)}
      {finder(size - 7, 0)}
      {finder(0, size - 7)}
      <text
        x={size / 2}
        y={size / 2 + 2.5}
        textAnchor="middle"
        fontSize="7"
        fontWeight="700"
        fill="#F87171"
        opacity="0.9"
        transform={`rotate(-30 ${size / 2} ${size / 2})`}
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        DEMO
      </text>
    </svg>
  );
}
