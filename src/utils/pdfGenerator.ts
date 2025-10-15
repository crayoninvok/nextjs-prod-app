// ============ pdfGenerator.ts ============
import { CombinedVehicleRow, Summary, NormalizedRow, TrendPoint } from '@/types/types';
import { computeOperatorDataFromRows, OperatorData } from '@/utils/utils_operator';

export function generatePDF(
  vehicles: CombinedVehicleRow[], 
  summary: Summary,
  normalizedRows: NormalizedRow[],
  trend: TrendPoint[]
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Vehicle Data
  const activeVehiclesData = vehicles.filter(v => v.total_hours_mohh > 0);
  const topPerformers = activeVehiclesData.slice(0, 10);
  const bottomPerformers = [...activeVehiclesData].sort((a, b) => a.pa - b.pa).slice(0, 10);

  // Top vehicles for chart
  const topVehiclesChart = activeVehiclesData.slice(0, 15);
  
  // Top breakdown/delay/idle
  const topBreakdown = [...activeVehiclesData]
    .sort((a, b) => b.breakdown_hours - a.breakdown_hours)
    .slice(0, 10);
  const topDelay = [...activeVehiclesData]
    .sort((a, b) => b.delay_hours - a.delay_hours)
    .slice(0, 10);
  const topIdle = [...activeVehiclesData]
    .sort((a, b) => b.idle_hours - a.idle_hours)
    .slice(0, 10);

  // Status distribution
  const statusDistribution = [
    { name: "Ready", value: summary.totalReady, color: "#10b981" },
    { name: "Breakdown", value: summary.totalBreakdown, color: "#ef4444" },
    {
      name: "Delay/Idle",
      value: summary.totalMOHH - summary.totalReady - summary.totalBreakdown,
      color: "#f59e0b",
    },
  ].filter((item) => item.value > 0);

  // Operator Data
  const operatorData = computeOperatorDataFromRows(normalizedRows);
  const activeOperators = operatorData.filter(op => op.totalHours > 0 && op.operator !== "UNASSIGNED");
  const rankedOperators = [...activeOperators]
    .sort((a, b) => {
      if (b.avgPA !== a.avgPA) return b.avgPA - a.avgPA;
      if (b.avgUA !== a.avgUA) return b.avgUA - a.avgUA;
      return b.totalHours - a.totalHours;
    })
    .map((op, idx) => ({ ...op, rank: idx + 1 }));
  
  const topOperators = rankedOperators.slice(0, 10);

  // Top 10 operators for PA/UA chart
  const top10OperatorsChart = rankedOperators.slice(0, 10);

  // Top 5 operators for hours distribution
  const top5HoursDistribution = [...activeOperators]
    .sort((a, b) => b.totalHours - a.totalHours)
    .slice(0, 5);

  // Performance distribution
  const performanceDistribution = [
    { name: "Excellent (≥90%)", value: activeOperators.filter(op => op.avgPA >= 90).length, color: "#10b981" },
    { name: "Good (75-89%)", value: activeOperators.filter(op => op.avgPA >= 75 && op.avgPA < 90).length, color: "#f59e0b" },
    { name: "Needs Improvement (<75%)", value: activeOperators.filter(op => op.avgPA < 75).length, color: "#ef4444" },
  ].filter(item => item.value > 0);

  // Option Distribution
  const optionsByStatus = ['READY', 'BREAKDOWN', 'DELAY', 'IDLE'].map(status => {
    const optionMap = new Map<string, number>();
    
    normalizedRows
      .filter(r => r.status === status && r.option && r.option.trim() !== "")
      .forEach(r => {
        const option = r.option!.trim();
        optionMap.set(option, (optionMap.get(option) || 0) + r.duration_sec);
      });

    const items = Array.from(optionMap.entries())
      .map(([name, seconds]) => ({
        name,
        value: seconds / 3600,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    return {
      status,
      items,
      total: items.reduce((sum, item) => sum + item.value, 0),
    };
  }).filter(data => data.items.length > 0);

  // Helper function to create simple bar chart SVG
  const createBarChart = (data: {name: string, value: number}[], maxValue: number, color: string, height = 200) => {
    const barWidth = 100 / data.length - 2;
    return `
      <svg width="100%" height="${height}" style="margin-top: 10px;">
        ${data.map((item, i) => {
          const barHeight = (item.value / maxValue) * (height - 30);
          const x = (i * (100 / data.length)) + 1;
          return `
            <rect x="${x}%" y="${height - barHeight - 20}" width="${barWidth}%" height="${barHeight}" 
                  fill="${color}" rx="4"/>
            <text x="${x + barWidth/2}%" y="${height - 5}" text-anchor="middle" font-size="9" fill="#64748b">
              ${item.name.length > 8 ? item.name.slice(0, 8) + '...' : item.name}
            </text>
            <text x="${x + barWidth/2}%" y="${height - barHeight - 25}" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e293b">
              ${item.value.toFixed(1)}
            </text>
          `;
        }).join('')}
      </svg>
    `;
  };

  // Helper for pie chart
  const createPieChart = (data: {name: string, value: number, color: string}[]) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;
    const cx = 100, cy = 100, r = 80;
    
    return `
      <svg width="250" height="250" style="margin: 20px auto; display: block;">
        ${data.map(item => {
          const angle = (item.value / total) * 360;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;
          
          const x1 = cx + r * Math.cos((startAngle - 90) * Math.PI / 180);
          const y1 = cy + r * Math.sin((startAngle - 90) * Math.PI / 180);
          const x2 = cx + r * Math.cos((endAngle - 90) * Math.PI / 180);
          const y2 = cy + r * Math.sin((endAngle - 90) * Math.PI / 180);
          
          const largeArc = angle > 180 ? 1 : 0;
          
          const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
          
          currentAngle += angle;
          
          return `<path d="${path}" fill="${item.color}" stroke="white" stroke-width="2"/>`;
        }).join('')}
        <circle cx="${cx}" cy="${cy}" r="40" fill="white"/>
      </svg>
      <div style="text-align: center; margin-top: -10px;">
        ${data.map(item => `
          <div style="display: inline-block; margin: 5px 10px;">
            <span style="display: inline-block; width: 12px; height: 12px; background: ${item.color}; border-radius: 2px; margin-right: 5px;"></span>
            <span style="font-size: 11px;">${item.name}: ${item.value} (${((item.value/total)*100).toFixed(1)}%)</span>
          </div>
        `).join('')}
      </div>
    `;
  };

  // Helper for stacked bar chart
  const createStackedBarChart = (data: {name: string, Ready: number, Delay: number, Idle: number, Breakdown: number}[]) => {
    const maxTotal = Math.max(...data.map(d => d.Ready + d.Delay + d.Idle + d.Breakdown));
    return `
      <svg width="100%" height="200" style="margin-top: 10px;">
        ${data.map((item, i) => {
          const barWidth = 100 / data.length - 4;
          const x = (i * (100 / data.length)) + 2;
          let currentY = 180;
          
          const segments = [
            { value: item.Ready, color: '#10b981' },
            { value: item.Delay, color: '#f59e0b' },
            { value: item.Idle, color: '#8b5cf6' },
            { value: item.Breakdown, color: '#ef4444' }
          ];
          
          return `
            ${segments.map(seg => {
              const height = (seg.value / maxTotal) * 150;
              currentY -= height;
              const rect = `<rect x="${x}%" y="${currentY}" width="${barWidth}%" height="${height}" fill="${seg.color}"/>`;
              return rect;
            }).join('')}
            <text x="${x + barWidth/2}%" y="195" text-anchor="middle" font-size="9" fill="#64748b">
              ${item.name.length > 8 ? item.name.slice(0, 8) + '...' : item.name}
            </text>
          `;
        }).join('')}
      </svg>
    `;
  };

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Fleet Performance Report - ${currentDate}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #1e293b;
          background: white;
          padding: 40px;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 3px solid #3b82f6;
        }
        .header h1 {
          font-size: 32px;
          color: #1e293b;
          margin-bottom: 8px;
          font-weight: 800;
        }
        .header p {
          color: #64748b;
          font-size: 14px;
        }
        .header .date {
          color: #3b82f6;
          font-weight: 600;
          margin-top: 8px;
        }
        .tab-header {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          padding: 20px 30px;
          margin: 40px 0 30px 0;
          border-radius: 12px;
          font-size: 24px;
          font-weight: 800;
          text-align: center;
          page-break-before: always;
        }
        .tab-header:first-of-type {
          page-break-before: auto;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 40px;
        }
        .summary-card {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 20px;
          border-radius: 12px;
          border: 2px solid #e2e8f0;
        }
        .summary-card h3 {
          font-size: 12px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        .summary-card .value {
          font-size: 36px;
          font-weight: 800;
          color: #1e293b;
        }
        .summary-card .label {
          font-size: 13px;
          color: #64748b;
          margin-top: 4px;
        }
        .chart-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 40px;
        }
        .chart-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          border: 2px solid #e2e8f0;
          page-break-inside: avoid;
        }
        .chart-card h3 {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e2e8f0;
        }
        .section {
          margin-bottom: 40px;
          page-break-inside: avoid;
        }
        .section-title {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e2e8f0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
          font-size: 11px;
        }
        th {
          background: #f1f5f9;
          padding: 12px 8px;
          text-align: left;
          font-weight: 700;
          color: #475569;
          border-bottom: 2px solid #cbd5e1;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.3px;
        }
        td {
          padding: 10px 8px;
          border-bottom: 1px solid #e2e8f0;
        }
        tr:hover {
          background: #f8fafc;
        }
        .rank-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 11px;
        }
        .rank-1 { background: #fef3c7; color: #92400e; }
        .rank-2 { background: #e5e7eb; color: #374151; }
        .rank-3 { background: #fed7aa; color: #9a3412; }
        .rank-other { background: #f1f5f9; color: #475569; }
        .badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 10px;
        }
        .badge-green { background: #dcfce7; color: #166534; }
        .badge-yellow { background: #fef3c7; color: #92400e; }
        .badge-red { background: #fee2e2; color: #991b1b; }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e2e8f0;
          text-align: center;
          color: #64748b;
          font-size: 11px;
        }
        .formula-box {
          background: #eff6ff;
          border: 1px solid #3b82f6;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 30px;
          font-size: 12px;
        }
        .activity-list {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-top: 12px;
        }
        .activity-section {
          background: #f8fafc;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        .activity-section h4 {
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 12px;
          color: #1e293b;
        }
        .activity-item {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px solid #e2e8f0;
          font-size: 11px;
        }
        .activity-item:last-child {
          border-bottom: none;
        }
        .activity-name {
          color: #475569;
          flex: 1;
        }
        .activity-value {
          font-weight: 600;
          color: #1e293b;
          margin-left: 12px;
        }
        @media print {
          body { padding: 20px; }
          .section { page-break-inside: avoid; }
          .chart-card { page-break-inside: avoid; }
          .tab-header { page-break-before: always; }
          .tab-header:first-of-type { page-break-before: auto; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Fleet Performance Report</h1>
        <p>Vehicle & Operator Analytics Dashboard</p>
        <p class="date">Generated on ${currentDate}</p>
      </div>

      <div class="formula-box">
        <strong>Calculation Formulas:</strong><br>
        PA (Physical Availability) = (MOHH − Breakdown) / MOHH × 100<br>
        UA (Utilization Availability) = (MOHH − Breakdown − Delay/Idle) / (MOHH − Breakdown) × 100
      </div>

      <!-- VEHICLE DASHBOARD SECTION -->
      <div class="tab-header">📊 Vehicle Dashboard</div>

      <div class="summary-grid">
        <div class="summary-card">
          <h3>Total Vehicles</h3>
          <div class="value">${summary.totalVehicles}</div>
          <div class="label">Fleet Size</div>
        </div>
        <div class="summary-card">
          <h3>Average PA</h3>
          <div class="value">${summary.avgPA.toFixed(1)}%</div>
          <div class="label">Physical Availability</div>
        </div>
        <div class="summary-card">
          <h3>Average UA</h3>
          <div class="value">${summary.avgUA.toFixed(1)}%</div>
          <div class="label">Utilization Availability</div>
        </div>
        <div class="summary-card">
          <h3>Total Breakdown</h3>
          <div class="value">${summary.totalBreakdown.toFixed(0)}h</div>
          <div class="label">Downtime Hours</div>
        </div>
      </div>

      <!-- Vehicle Charts -->
      <div class="chart-grid">
        <div class="chart-card">
          <h3>Top 15 Vehicles - PA Performance</h3>
          ${createBarChart(
            topVehiclesChart.map(v => ({ name: v.vehicle_name, value: v.pa })),
            100,
            '#10b981',
            220
          )}
        </div>

        <div class="chart-card">
          <h3>Status Distribution</h3>
          ${createPieChart(statusDistribution)}
        </div>

        <div class="chart-card">
          <h3>Top 10 Breakdown Hours</h3>
          ${createBarChart(
            topBreakdown.map(v => ({ name: v.vehicle_name, value: v.breakdown_hours })),
            Math.max(...topBreakdown.map(v => v.breakdown_hours)),
            '#ef4444',
            200
          )}
        </div>

        <div class="chart-card">
          <h3>Top 10 Delay Hours</h3>
          ${createBarChart(
            topDelay.map(v => ({ name: v.vehicle_name, value: v.delay_hours })),
            Math.max(...topDelay.map(v => v.delay_hours)),
            '#f59e0b',
            200
          )}
        </div>
      </div>

      ${topPerformers.length > 0 ? `
      <div class="section">
        <h2 class="section-title">Top 10 Vehicle Performers</h2>
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Vehicle Name</th>
              <th>Operator</th>
              <th>MOHH (h)</th>
              <th>Breakdown (h)</th>
              <th>Delay (h)</th>
              <th>Idle (h)</th>
              <th>Ready (h)</th>
              <th>PA (%)</th>
              <th>UA (%)</th>
              <th>Efficiency (%)</th>
            </tr>
          </thead>
          <tbody>
            ${topPerformers.map((v, idx) => `
              <tr>
                <td>
                  <span class="rank-badge rank-${Math.min(idx + 1, 3)}">${idx + 1 <= 3 ? (idx + 1 === 1 ? '🥇' : idx + 1 === 2 ? '🥈' : '🥉') : '#' + v.rank}</span>
                </td>
                <td style="font-weight: 600;">${v.vehicle_name}</td>
                <td>${v.operator || '-'}</td>
                <td>${v.total_hours_mohh.toFixed(1)}</td>
                <td>${v.breakdown_hours.toFixed(1)}</td>
                <td>${v.delay_hours.toFixed(1)}</td>
                <td>${v.idle_hours.toFixed(1)}</td>
                <td>${v.productive_hours_ready.toFixed(1)}</td>
                <td>
                  <span class="badge ${v.pa >= 90 ? 'badge-green' : v.pa >= 75 ? 'badge-yellow' : 'badge-red'}">
                    ${v.pa.toFixed(1)}%
                  </span>
                </td>
                <td>
                  <span class="badge ${v.ua >= 90 ? 'badge-green' : v.ua >= 75 ? 'badge-yellow' : 'badge-red'}">
                    ${v.ua.toFixed(1)}%
                  </span>
                </td>
                <td>${v.efficiency.toFixed(1)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      ${bottomPerformers.length > 0 ? `
      <div class="section">
        <h2 class="section-title">Bottom 10 Vehicle Performers (Needs Attention)</h2>
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Vehicle Name</th>
              <th>Operator</th>
              <th>MOHH (h)</th>
              <th>Breakdown (h)</th>
              <th>Delay (h)</th>
              <th>Idle (h)</th>
              <th>Ready (h)</th>
              <th>PA (%)</th>
              <th>UA (%)</th>
              <th>Efficiency (%)</th>
            </tr>
          </thead>
          <tbody>
            ${bottomPerformers.map(v => `
              <tr>
                <td>${v.rank}</td>
                <td style="font-weight: 600;">${v.vehicle_name}</td>
                <td>${v.operator || '-'}</td>
                <td>${v.total_hours_mohh.toFixed(1)}</td>
                <td style="color: #dc2626; font-weight: 600;">${v.breakdown_hours.toFixed(1)}</td>
                <td>${v.delay_hours.toFixed(1)}</td>
                <td>${v.idle_hours.toFixed(1)}</td>
                <td>${v.productive_hours_ready.toFixed(1)}</td>
                <td>
                  <span class="badge ${v.pa >= 90 ? 'badge-green' : v.pa >= 75 ? 'badge-yellow' : 'badge-red'}">
                    ${v.pa.toFixed(1)}%
                  </span>
                </td>
                <td>
                  <span class="badge ${v.ua >= 90 ? 'badge-green' : v.ua >= 75 ? 'badge-yellow' : 'badge-red'}">
                    ${v.ua.toFixed(1)}%
                  </span>
                </td>
                <td>${v.efficiency.toFixed(1)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      ${optionsByStatus.length > 0 ? `
      <div class="section">
        <h2 class="section-title">Vehicle Activity Distribution by Status</h2>
        <div class="activity-list">
          ${optionsByStatus.map(({ status, items, total }) => {
            if (items.length === 0) return '';
            return `
              <div class="activity-section">
                <h4>${status} Activities (${total.toFixed(1)}h total)</h4>
                ${items.map(item => `
                  <div class="activity-item">
                    <span class="activity-name">${item.name}</span>
                    <span class="activity-value">${item.value.toFixed(1)}h (${((item.value/total)*100).toFixed(1)}%)</span>
                  </div>
                `).join('')}
              </div>
            `;
          }).join('')}
        </div>
      </div>
      ` : ''}

      <!-- OPERATOR ANALYSIS SECTION -->
      <div class="tab-header">👥 Operator Analysis</div>

      <div class="summary-grid">
        <div class="summary-card">
          <h3>Total Operators</h3>
          <div class="value">${operatorData.length}</div>
          <div class="label">Active Operators</div>
        </div>
        <div class="summary-card">
          <h3>Avg Vehicles/Operator</h3>
          <div class="value">${activeOperators.length > 0 ? (activeOperators.reduce((sum, op) => sum + op.vehicleCount, 0) / activeOperators.length).toFixed(1) : '0'}</div>
          <div class="label">Per Operator</div>
        </div>
        <div class="summary-card">
          <h3>Best PA</h3>
          <div class="value">${activeOperators.length > 0 ? Math.max(...activeOperators.map(op => op.avgPA)).toFixed(1) : '0'}%</div>
          <div class="label">Top Performance</div>
        </div>
        <div class="summary-card">
          <h3>Best UA</h3>
          <div class="value">${activeOperators.length > 0 ? Math.max(...activeOperators.map(op => op.avgUA)).toFixed(1) : '0'}%</div>
          <div class="label">Top Utilization</div>
        </div>
      </div>

      <!-- Operator Charts -->
      <div class="chart-grid">
        <div class="chart-card">
          <h3>Top 10 Operators - PA Performance</h3>
          ${createBarChart(
            top10OperatorsChart.map(op => ({ name: op.operator, value: op.avgPA })),
            100,
            '#10b981',
            220
          )}
        </div>

        <div class="chart-card">
          <h3>PA Performance Distribution</h3>
          ${performanceDistribution.length > 0 ? createPieChart(performanceDistribution) : '<p style="text-align: center; padding: 40px; color: #94a3b8;">No data available</p>'}
        </div>

        <div class="chart-card" style="grid-column: 1 / -1;">
          <h3>Top 5 Operators - Hours Distribution</h3>
          ${top5HoursDistribution.length > 0 ? createStackedBarChart(
            top5HoursDistribution.map(op => ({
              name: op.operator,
              Ready: op.readyHours,
              Delay: op.totalDelay,
              Idle: op.totalIdle,
              Breakdown: op.totalBreakdown
            }))
          ) : '<p style="text-align: center; padding: 40px; color: #94a3b8;">No data available</p>'}
        </div>
      </div>

      ${topOperators.length > 0 ? `
      <div class="section">
        <h2 class="section-title">Top 10 Operator Performers</h2>
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Operator</th>
              <th>Vehicles</th>
              <th>Total Hours</th>
              <th>Ready (h)</th>
              <th>Breakdown (h)</th>
              <th>Delay (h)</th>
              <th>Idle (h)</th>
              <th>Avg PA (%)</th>
              <th>Avg UA (%)</th>
            </tr>
          </thead>
          <tbody>
            ${topOperators.map((op) => `
              <tr>
                <td>
                  <span class="rank-badge ${op.rank <= 3 ? `rank-${op.rank}` : 'rank-other'}">${op.rank <= 3 ? (op.rank === 1 ? '🥇' : op.rank === 2 ? '🥈' : '🥉') : '#' + op.rank}</span>
                </td>
                <td style="font-weight: 600;">${op.operator}</td>
                <td style="text-align: center;">${op.vehicleCount}</td>
                <td>${op.totalHours.toFixed(1)}</td>
                <td>${op.readyHours.toFixed(1)}</td>
                <td style="color: #dc2626;">${op.totalBreakdown.toFixed(1)}</td>
                <td style="color: #f59e0b;">${op.totalDelay.toFixed(1)}</td>
                <td style="color: #8b5cf6;">${op.totalIdle.toFixed(1)}</td>
                <td>
                  <span class="badge ${op.avgPA >= 90 ? 'badge-green' : op.avgPA >= 75 ? 'badge-yellow' : 'badge-red'}">
                    ${op.avgPA.toFixed(1)}%
                  </span>
                </td>
                <td>
                  <span class="badge ${op.avgUA >= 90 ? 'badge-green' : op.avgUA >= 75 ? 'badge-yellow' : 'badge-red'}">
                    ${op.avgUA.toFixed(1)}%
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      ${optionsByStatus.length > 0 ? `
      <div class="section">
        <h2 class="section-title">Operator Activity Distribution by Status</h2>
        <div class="activity-list">
          ${optionsByStatus.map(({ status, items, total }) => {
            if (items.length === 0) return '';
            return `
              <div class="activity-section">
                <h4>${status} Activities (${total.toFixed(1)}h total)</h4>
                ${items.map(item => `
                  <div class="activity-item">
                    <span class="activity-name">${item.name}</span>
                    <span class="activity-value">${item.value.toFixed(1)}h (${((item.value/total)*100).toFixed(1)}%)</span>
                  </div>
                `).join('')}
              </div>
            `;
          }).join('')}
        </div>
      </div>
      ` : ''}

      <div class="footer">
        <p><strong>Fleet Performance Dashboard</strong></p>
        <p>Complete Vehicle & Operator Analytics Report</p>
        <p>Generated on ${currentDate}</p>
        <p style="margin-top: 8px; font-size: 10px;">Comprehensive analysis of fleet physical availability (PA) and utilization availability (UA)</p>
      </div>
    </body>
    </html>
  `);

  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 250);
}