"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { Row, CombinedVehicleRow, TrendPoint, Summary, NormalizedRow } from "@/types/types";
import { computeAll } from "@/utils/utils";
import { Header } from "@/components/Header";
import { FileUpload } from "@/components/FileUpload";
import { SummaryCards } from "@/components/SummaryCard";
import { TrendChart } from "@/components/TrendCharts";
import { TopVehiclesChart } from "@/components/TopVechicleChart";
import { StatusPieChart } from "@/components/StatusPieChart";
import { HorizontalBarChart } from "@/components/HorizontalBarChart";
import { ActivityDistribution } from "@/components/ActivityDistribution";
import { VehicleTable } from "@/components/VechicleTable";
import { OperatorTab } from "@/components/OperatorTab";
import { generatePDF } from "@/utils/pdfGenerator";

export default function App() {
  const [vehicles, setVehicles] = useState<CombinedVehicleRow[] | null>(null);
  const [normalizedRows, setNormalizedRows] = useState<NormalizedRow[] | null>(null); // NEW STATE
  const [trend, setTrend] = useState<TrendPoint[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [filterText, setFilterText] = useState("");
  const [activeTab, setActiveTab] = useState<"vehicle" | "operator">("vehicle");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Row>(sheet, { raw: false });
      const res = computeAll(rows);
      setVehicles(res.vehicles);
      setNormalizedRows(res.normalizedRows); // STORE NORMALIZED ROWS
      setTrend(res.trend);
      setSummary(res.summary);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadPDF = () => {
    if (vehicles && summary && normalizedRows && trend) {
      generatePDF(vehicles, summary, normalizedRows, trend);
    }
  };

  // Prepare chart data
  const activeVehicles = vehicles?.filter((v) => v.total_hours_mohh > 0) ?? [];

  const topVehicles = activeVehicles.slice(0, 15).map((v) => ({
    name: v.vehicle_name,
    PA: v.pa,
    UA: v.ua,
  }));

  const topBreakdown = [...activeVehicles]
    .sort((a, b) => b.breakdown_hours - a.breakdown_hours)
    .slice(0, 10)
    .map((v) => ({ name: v.vehicle_name, hours: v.breakdown_hours }));

  const topDelay = [...activeVehicles]
    .sort((a, b) => b.delay_hours - a.delay_hours)
    .slice(0, 10)
    .map((v) => ({ name: v.vehicle_name, hours: v.delay_hours }));

  const topIdle = [...activeVehicles]
    .sort((a, b) => b.idle_hours - a.idle_hours)
    .slice(0, 10)
    .map((v) => ({ name: v.vehicle_name, hours: v.idle_hours }));

  const statusDistribution = summary
    ? [
        { name: "Ready", value: summary.totalReady, color: "#10b981" },
        { name: "Breakdown", value: summary.totalBreakdown, color: "#ef4444" },
        {
          name: "Delay/Idle",
          value:
            summary.totalMOHH - summary.totalReady - summary.totalBreakdown,
          color: "#f59e0b",
        },
      ].filter((item) => item.value > 0)
    : [];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Header
          hasData={!!vehicles && vehicles.length > 0}
          onDownloadPDF={handleDownloadPDF}
        />

        <FileUpload onFileChange={handleFileUpload} />

        {/* TAB NAVIGATION */}
        {vehicles && vehicles.length > 0 && (
          <div className="flex gap-2 mb-8 border-b border-slate-200">
            <button
              onClick={() => setActiveTab("vehicle")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "vehicle"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Vehicle Dashboard
            </button>
            <button
              onClick={() => setActiveTab("operator")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "operator"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Operator Analysis
            </button>
          </div>
        )}

        {/* VEHICLE TAB */}
        {activeTab === "vehicle" && (
          <>
            {summary && <SummaryCards summary={summary} />}

            {(trend && trend.length > 0) || (vehicles && vehicles.length > 0) ? (
              <>
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                  {trend && trend.length > 0 && <TrendChart data={trend} />}

                  {topVehicles.length > 0 && (
                    <TopVehiclesChart data={topVehicles} />
                  )}

                  {statusDistribution.length > 0 && (
                    <StatusPieChart data={statusDistribution} />
                  )}

                  {summary && summary.optionDistribution.length > 0 && (
                    <ActivityDistribution summary={summary} />
                  )}
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                  {topBreakdown.length > 0 && (
                    <HorizontalBarChart
                      title="Top 10 Breakdown Hours"
                      data={topBreakdown}
                      color="#ef4444"
                      gradient="from-red-500 to-rose-500"
                    />
                  )}

                  {topDelay.length > 0 && (
                    <HorizontalBarChart
                      title="Top 10 Delay Hours"
                      data={topDelay}
                      color="#f59e0b"
                      gradient="from-yellow-500 to-orange-500"
                    />
                  )}

                  {topIdle.length > 0 && (
                    <HorizontalBarChart
                      title="Top 10 Idle Hours"
                      data={topIdle}
                      color="#8b5cf6"
                      gradient="from-purple-500 to-violet-500"
                    />
                  )}
                </section>
              </>
            ) : null}

            {vehicles && (
              <VehicleTable
                vehicles={vehicles}
                filterText={filterText}
                onFilterChange={setFilterText}
              />
            )}
          </>
        )}

        {/* OPERATOR TAB - PASS NORMALIZED ROWS */}
        {activeTab === "operator" && normalizedRows && (
          <OperatorTab normalizedRows={normalizedRows} />
        )}
      </div>
    </main>
  );
}