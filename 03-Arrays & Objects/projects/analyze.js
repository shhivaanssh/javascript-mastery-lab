// Analyze — aggregate and derive insights from transformed data

function totalRevenue(records) {
  return records.reduce((sum, r) => sum + r.revenue, 0);
}

function byField(records, field) {
  return records.reduce((acc, r) => {
    const key = r[field];
    if (!acc[key]) acc[key] = { count: 0, revenue: 0, units: 0, orders: [] };
    acc[key].count++;
    acc[key].revenue += r.revenue;
    acc[key].units   += r.units;
    acc[key].orders.push(r.orderId);
    return acc;
  }, {});
}

function topN(records, field, n = 3) {
  const grouped = byField(records, field);
  return Object.entries(grouped)
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .slice(0, n)
    .map(([key, stats]) => ({ [field]: key, ...stats }));
}

function revenueByMonth(records) {
  const grouped = records.reduce((acc, r) => {
    const key = `${r.year}-${r.month}`;
    acc[key] = (acc[key] || 0) + r.revenue;
    return acc;
  }, {});

  return Object.entries(grouped)
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([period, revenue]) => ({ period, revenue }));
}

function repLeaderboard(records) {
  return Object.entries(byField(records, "rep"))
    .map(([rep, stats]) => ({ rep, ...stats }))
    .sort((a, b) => b.revenue - a.revenue);
}

function averageOrderValue(records) {
  return totalRevenue(records) / records.length;
}

function summarize(records) {
  return {
    totalOrders:    records.length,
    totalRevenue:   totalRevenue(records),
    avgOrderValue:  Math.round(averageOrderValue(records)),
    byRegion:       byField(records, "region"),
    byCategory:     byField(records, "category"),
    topProducts:    topN(records, "product"),
    topReps:        repLeaderboard(records),
    revenueByMonth: revenueByMonth(records),
    byQuarter:      byField(records, "quarter"),
  };
}

module.exports = { totalRevenue, byField, topN, revenueByMonth, repLeaderboard, summarize };
