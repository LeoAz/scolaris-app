import * as React from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { Frame, FramePanel, FrameHeader, FrameTitle, FrameDescription, FrameFooter } from "@/components/ui/frame";

export interface ValidationStatsData {
    country: string;
    month: string;
    total: number;
    validated: number;
}

interface ValidationRateChartProps {
  data: ValidationStatsData[]
}

export function ValidationRateChart({ data }: ValidationRateChartProps) {
    const formattedData = React.useMemo(() => {
        const months: Record<string, any> = {};

        data.forEach((item) => {
            if (!months[item.month]) {
                months[item.month] = { month: item.month };
            }

            // Taux de validation en %
            const rate = item.total > 0 ? (item.validated / item.total) * 100 : 0;
            months[item.month][`${item.country}_rate`] = Math.round(rate);
            months[item.month][`${item.country}_total`] = item.total;
            months[item.month][`${item.country}_validated`] = item.validated;
        });

        return Object.values(months).sort((a, b) => a.month.localeCompare(b.month));
    }, [data]);

  const countries = React.useMemo(() => {
    return Array.from(new Set(data.map((item) => item.country)))
  }, [data])

    const dynamicConfig = React.useMemo(() => {
        const config: ChartConfig = {};

        countries.forEach((country, index) => {
            config[`${country}_rate`] = {
                label: country,
                color: `hsl(var(--chart-${(index % 5) + 1}))`,
            };
        });

        return config;
    }, [countries]);

  return (
    <Frame>
      <FramePanel>
        <FrameHeader>
          <FrameTitle>Taux de validation par pays</FrameTitle>
          <FrameDescription>Validations par rapport aux dossiers soumis (%)</FrameDescription>
        </FrameHeader>
        <div className="p-5 pt-0">
          <ChartContainer config={dynamicConfig}>
            <LineChart
              accessibilityLayer
              data={formattedData}
              margin={{
                left: 12,
                right: 12,
                top: 20,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                              tickFormatter={(value) => {
                                  const [year, month] = value.split("-");
                                  const date = new Date(parseInt(year), parseInt(month) - 1);

                                  return date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
                              }}
              />
              <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => `${value}%`}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              {countries.map((country) => (
                <Line
                  key={country}
                  dataKey={`${country}_rate`}
                  type="monotone"
                  stroke={dynamicConfig[`${country}_rate`].color}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ChartContainer>
        </div>
        <FrameFooter className="flex-col items-start gap-2 text-sm">
          <div className="leading-none text-muted-foreground">
            Pourcentage de dossiers validés parmi ceux soumis chaque mois
          </div>
        </FrameFooter>
      </FramePanel>
    </Frame>
  )
}
