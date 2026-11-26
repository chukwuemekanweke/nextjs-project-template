import { Card } from "@template/ui-core";

const TILE_COUNT = 4;
const GRID_LINES = [40, 80, 120];
const LINE =
  "M0 128 C60 120 90 96 150 100 S250 70 300 76 S400 40 450 52 S540 24 600 18";

/**
 * Decorative product illustration (reference `.shot`): a browser frame
 * around abstract dashboard tiles and a trend line. It deliberately shows no
 * numbers, names or statuses, so it can never be read as real account,
 * billing or security data, and it is hidden from assistive technology.
 */
export function ProductShot() {
  return (
    <div
      aria-hidden="true"
      className="border-border bg-surface w-full max-w-260 overflow-hidden rounded-2xl border shadow-lg"
    >
      <div className="border-border bg-surface-2 flex gap-1.5 border-b px-4 py-3">
        {[0, 1, 2].map((dot) => (
          <span className="bg-border-strong size-2.5 rounded-full" key={dot} />
        ))}
      </div>
      <div className="bg-bg flex flex-col gap-3 p-4 md:gap-4 md:p-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: TILE_COUNT }, (_, tile) => (
            <Card className="flex flex-col gap-3 p-4" key={tile}>
              <span className="bg-surface-3 h-2.5 w-3/5 rounded-full" />
              <span className="bg-border-strong h-5 w-2/5 rounded-md" />
            </Card>
          ))}
        </div>
        <Card className="p-4 md:p-6">
          <svg
            className="h-28 w-full md:h-44"
            focusable="false"
            preserveAspectRatio="none"
            viewBox="0 0 600 160"
          >
            {GRID_LINES.map((y) => (
              <line
                key={y}
                stroke="var(--color-grid)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                x1="0"
                x2="600"
                y1={y}
                y2={y}
              />
            ))}
            <path
              d={`${LINE} L600 160 L0 160 Z`}
              fill="var(--color-chart-area)"
            />
            <path
              d={LINE}
              fill="none"
              stroke="var(--color-chart-1)"
              strokeLinecap="round"
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </Card>
      </div>
    </div>
  );
}
