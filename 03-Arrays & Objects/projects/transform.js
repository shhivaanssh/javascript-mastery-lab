// Transform — clean and reshape raw data before analysis

function normalizeKeys(records) {
  return records.map(record =>
    Object.fromEntries(
      Object.entries(record).map(([k, v]) => [
        k.toLowerCase().replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
        v,
      ])
    )
  );
}
// Order_ID → orderId, Unit_Price → unitPrice, etc.


function parseDates(records) {
  return records.map(record => ({
    ...record,
    date:  new Date(record.date),
    month: new Date(record.date).toLocaleString("default", { month: "long" }),
    year:  new Date(record.date).getFullYear(),
    quarter: `Q${Math.ceil((new Date(record.date).getMonth() + 1) / 3)}`,
  }));
}


function addDerivedFields(records) {
  return records.map(record => ({
    ...record,
    revenue: record.units * record.unitPrice,
    revenueLabel: `$${(record.units * record.unitPrice).toLocaleString()}`,
  }));
}


// pipeline — apply an array of transform functions in sequence
function pipeline(data, transforms) {
  return transforms.reduce((records, fn) => fn(records), data);
}


// filterBy — generic predicate-based filter builder
function filterBy(field, value) {
  return (records) => records.filter(r => r[field] === value);
}


// sortBy — build a comparator for any field
function sortBy(field, direction = "asc") {
  return (records) => [...records].sort((a, b) => {
    if (a[field] < b[field]) return direction === "asc" ? -1 : 1;
    if (a[field] > b[field]) return direction === "asc" ? 1 : -1;
    return 0;
  });
}


module.exports = { normalizeKeys, parseDates, addDerivedFields, pipeline, filterBy, sortBy };
