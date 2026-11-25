import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  ChartFrame,
  chartColors,
  chartSeriesColor,
  type ChartState,
} from "@template/dashboard-ui/charts";
import { weeklySeriesFixture } from "./__fixtures__/team-members";

/**
 * Hand-drawn preview SVG: shows how a chart reads the series and grid
 * tokens. Real charts arrive with Recharts in the analytics ticket (TD-10).
 */
function PreviewLine() {
  const width = 600;
  const height = 240;
  const max = Math.max(...weeklySeriesFixture);
  const step = width / (weeklySeriesFixture.length - 1);
  const points = weeklySeriesFixture
    .map(
      (value, index) =>
        `${index * step},${height - (value / max) * (height - 20)}`,
    )
    .join(" ");

  return (
    <svg preserveAspectRatio="none" viewBox={`0 0 ${width} ${height}`}>
      {[0.25, 0.5, 0.75].map((fraction) => (
        <line
          key={fraction}
          stroke={chartColors.grid}
          x1={0}
          x2={width}
          y1={height * fraction}
          y2={height * fraction}
        />
      ))}
      <polygon
        fill={chartColors.area}
        points={`0,${height} ${points} ${width},${height}`}
      />
      <polyline
        fill="none"
        points={points}
        stroke={chartSeriesColor(1)}
        strokeWidth={2.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function ChartDemo({ state }: { state: ChartState }) {
  return (
    <div className="max-w-content grid gap-4 md:grid-cols-2" data-gallery>
      <ChartFrame
        description="Last 7 days"
        legend={[
          { label: "This week", series: 1 },
          { label: "Previous week", series: 2 },
        ]}
        onRetry={() => undefined}
        state={state}
        summary="Weekly activity rose from 32 to 58 over seven days."
        title="Activity"
      >
        <PreviewLine />
      </ChartFrame>
    </div>
  );
}

const meta = {
  args: { state: "ready" },
  argTypes: {
    state: {
      control: "inline-radio",
      options: ["ready", "loading", "empty", "error"],
    },
  },
  component: ChartDemo,
  title: "Charts/ChartFrame",
} satisfies Meta<typeof ChartDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};
export const Loading: Story = { args: { state: "loading" } };
export const Empty: Story = { args: { state: "empty" } };
export const LoadError: Story = { args: { state: "error" } };
