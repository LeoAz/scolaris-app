import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { Frame, FramePanel, FrameHeader, FrameTitle, FrameDescription, FrameFooter } from "@/components/ui/frame";

export interface RequestsByCountryData {
    country: string;
    month: string;
    count: number;
}

interface RequestsChartProps {
    data: RequestsByCountryData[];
}

export function RequestsByCountryChart({ data }: RequestsChartProps) {
    // Transformer les données pour le format attendu par recharts
    // On regroupe par mois et on met les pays en colonnes
    const formattedData = React.useMemo(() => {
        const months: Record<string, any> = {};

        data.forEach((item) => {
            if (!months[item.month]) {
                months[item.month] = { month: item.month };
            }

            months[item.month][item.country] = item.count;
        });

        return Object.values(months).sort((a, b) => a.month.localeCompare(b.month));
    }, [data]);

    // Obtenir la liste des pays uniques pour générer les Bar
    const countries = React.useMemo(() => {
        return Array.from(new Set(data.map((item) => item.country)));
    }, [data]);

  // Générer une config dynamique pour chaque pays
    const dynamicConfig = React.useMemo(() => {
        const config: ChartConfig = {};

        countries.forEach((country) => {
            config[country] = {
                label: country,
                color: "hsl(217.2 91.2% 59.8%)", // Bleu (Sky-600)
            };
        });

        return config;
    }, [countries]);

    return (
        <Frame>
            <FramePanel>
                <FrameHeader>
                    <FrameTitle>Dossiers de prêt par pays</FrameTitle>
                    <FrameDescription>Évolution sur les 6 derniers mois</FrameDescription>
                </FrameHeader>
                <div className="p-5 pt-0">
                    <ChartContainer config={dynamicConfig}>
                        <BarChart
                            accessibilityLayer
                            data={formattedData}
                            margin={{
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
                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                            {countries.map((country) => (
                                <Bar key={country} dataKey={country} fill={dynamicConfig[country].color} radius={4} />
                            ))}
                        </BarChart>
                    </ChartContainer>
                </div>
                <FrameFooter className="flex-col items-start gap-2 text-sm">
                    <div className="leading-none text-muted-foreground">Nombre total de dossiers soumis par pays et par mois</div>
                </FrameFooter>
            </FramePanel>
        </Frame>
    );
}
