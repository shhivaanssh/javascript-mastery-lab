function divider(char = "─", len = 48) {
  return char.repeat(len);
}

function currency(n) {
  return `$${n.toLocaleString()}`;
}

function bar(value, max, width = 20) {
  const filled = Math.round((value / max) * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
}

function printSection(title) {
  console.log(`\n${divider()}`);
  console.log(` ${title}`);
  console.log(divider());
}

function print(summary) {
  console.log(`\n${"═".repeat(48)}`);
  console.log("  SALES ANALYSIS REPORT");
  console.log(`${"═".repeat(48)}`);

  console.log(`\n  Total Orders   : ${summary.totalOrders}`);
  console.log(`  Total Revenue  : ${currency(summary.totalRevenue)}`);
  console.log(`  Avg Order Value: ${currency(summary.avgOrderValue)}`);

  printSection("REVENUE BY REGION");
  const maxRegionRev = Math.max(...Object.values(summary.byRegion).map(r => r.revenue));
  Object.entries(summary.byRegion)
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .forEach(([region, stats]) => {
      const b = bar(stats.revenue, maxRegionRev);
      console.log(`  ${region.padEnd(8)} ${b} ${currency(stats.revenue)}`);
    });

  printSection("REVENUE BY CATEGORY");
  Object.entries(summary.byCategory)
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .forEach(([cat, stats]) => {
      console.log(`  ${cat.padEnd(14)} ${currency(stats.revenue)}  (${stats.units} units)`);
    });

  printSection("TOP PRODUCTS");
  summary.topProducts.forEach(({ product, revenue, units }, i) => {
    console.log(`  ${i + 1}. ${product.padEnd(14)} ${currency(revenue)}  (${units} units)`);
  });

  printSection("REP LEADERBOARD");
  summary.topReps.forEach(({ rep, revenue, count }, i) => {
    const medal = ["🥇", "🥈", "🥉"][i] || "  ";
    console.log(`  ${medal} ${rep.padEnd(8)} ${currency(revenue).padStart(10)}  (${count} orders)`);
  });

  printSection("MONTHLY REVENUE");
  const maxMonthRev = Math.max(...summary.revenueByMonth.map(m => m.revenue));
  summary.revenueByMonth.forEach(({ period, revenue }) => {
    const b = bar(revenue, maxMonthRev, 16);
    console.log(`  ${period.padEnd(14)} ${b} ${currency(revenue)}`);
  });

  printSection("QUARTERLY BREAKDOWN");
  Object.entries(summary.byQuarter)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([quarter, stats]) => {
      console.log(`  ${quarter}  ${currency(stats.revenue).padStart(10)}  (${stats.count} orders)`);
    });

  console.log(`\n${"═".repeat(48)}\n`);
}

module.exports = { print };
