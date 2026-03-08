// Module 03 Mini Project — data-transformer
// A dataset analysis tool built with array and object methods only.
// No libraries. No loops. Just map, filter, reduce, and friends.
// Run: node index.js

const { sales }    = require("./data");
const transform    = require("./transform");
const analyze      = require("./analyze");
const report       = require("./report");

const pipeline = transform.pipeline(sales, [
  transform.normalizeKeys,
  transform.parseDates,
  transform.addDerivedFields,
]);

const summary = analyze.summarize(pipeline);
report.print(summary);
