import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import DataLabels from "chartjs-plugin-datalabels";
import type { ParetoItem } from "../lib/api";

Chart.register(DataLabels);

const SDESK = [
  "#2563eb", "#0ea5e9", "#06b6d4", "#0d9488", "#65a30d", "#ca8a04",
  "#ea580c", "#dc2626", "#9333ea", "#c026d3", "#db2777", "#7c3aed",
  "#f59e0b", "#10b981", "#0891b2", "#a855f7",
];

export function HorizontalBar({
  data,
  label,
  onBarClick,
}: {
  data: Record<string, number>;
  label?: string;
  onBarClick?: (label: string) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const labels = Object.keys(data);
    const values = Object.values(data);
    const chart = new Chart(ref.current, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label,
          data: values,
          backgroundColor: labels.map((_, i) => SDESK[i % SDESK.length]),
          borderRadius: 3,
          barThickness: 18,
        }],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        onClick: onBarClick
          ? (_evt, elements) => {
              if (elements.length === 0) return;
              const idx = elements[0].index;
              const lbl = labels[idx];
              if (lbl) onBarClick(lbl);
            }
          : undefined,
        onHover: onBarClick
          ? (event, elements) => {
              const target = event.native?.target as HTMLElement | undefined;
              if (target) target.style.cursor = elements.length > 0 ? "pointer" : "default";
            }
          : undefined,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#18181b",
            padding: 8,
            callbacks: onBarClick
              ? { footer: () => "Tıkla: bu kategoriye ait ticket'ları gör →" }
              : undefined,
          },
          datalabels: {
            display: true,
            anchor: "end",
            align: "end",
            color: "#3f3f46",
            font: { size: 10, weight: 600, family: "JetBrains Mono" },
            formatter: (v: number) => v,
          },
        },
        scales: {
          x: { grid: { color: "#f4f4f5" }, ticks: { font: { size: 10 } }, beginAtZero: true },
          y: { grid: { display: false }, ticks: { font: { size: 11 }, autoSkip: false } },
        },
        layout: { padding: { right: 30 } },
      },
    });
    return () => chart.destroy();
  }, [data, label, onBarClick]);
  return <canvas ref={ref} />;
}

export function TrendLine({ data }: { data: Record<string, number> }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const chart = new Chart(ref.current, {
      type: "line",
      data: {
        labels: Object.keys(data),
        datasets: [{
          label: "Ticket",
          data: Object.values(data),
          borderColor: "#2563eb",
          backgroundColor: "rgba(37,99,235,0.08)",
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointBackgroundColor: "#fff",
          pointBorderColor: "#2563eb",
          pointBorderWidth: 2,
          pointRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: "#18181b", padding: 10 },
          datalabels: { display: false },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10.5 } } },
          y: { grid: { color: "#f4f4f5" }, ticks: { font: { size: 10.5 } }, beginAtZero: true },
        },
      },
    });
    return () => chart.destroy();
  }, [data]);
  return <canvas ref={ref} />;
}

export function ParetoChart({ data }: { data: ParetoItem[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const chart = new Chart(ref.current, {
      type: "bar",
      data: {
        labels: data.map((p) => p.label),
        datasets: [
          {
            type: "bar",
            label: "Ticket sayısı",
            data: data.map((p) => p.count),
            backgroundColor: "#2563eb",
            borderRadius: 3,
            order: 2,
            yAxisID: "y",
          },
          {
            type: "line" as const,
            label: "Kümülatif %",
            data: data.map((p) => p.cumPct),
            borderColor: "#ea580c",
            backgroundColor: "#ea580c",
            borderWidth: 2.5,
            fill: false,
            tension: 0.1,
            pointBackgroundColor: "#fff",
            pointBorderColor: "#ea580c",
            pointBorderWidth: 2,
            pointRadius: 4,
            order: 1,
            yAxisID: "y1",
          } as never,
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: "top", align: "end" },
          tooltip: { backgroundColor: "#18181b", padding: 10 },
          datalabels: { display: false },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 9.5 }, maxRotation: 60, minRotation: 40 } },
          y: { position: "left", grid: { color: "#f4f4f5" }, beginAtZero: true },
          y1: { position: "right", grid: { display: false }, beginAtZero: true, max: 100, ticks: { callback: (v) => v + "%" } },
        },
      },
    });
    return () => chart.destroy();
  }, [data]);
  return <canvas ref={ref} />;
}
