// Work with this dataset throughout the exercises

const employees = [
  { id: 1,  name: "Alice",   dept: "engineering", salary: 95000,  active: true,  skills: ["js", "node", "react"] },
  { id: 2,  name: "Bob",     dept: "marketing",   salary: 72000,  active: true,  skills: ["seo", "ads", "email"] },
  { id: 3,  name: "Carol",   dept: "engineering", salary: 110000, active: false, skills: ["python", "ml", "sql"] },
  { id: 4,  name: "David",   dept: "design",      salary: 85000,  active: true,  skills: ["figma", "css", "ux"] },
  { id: 5,  name: "Eve",     dept: "engineering", salary: 102000, active: true,  skills: ["js", "ts", "rust"] },
  { id: 6,  name: "Frank",   dept: "marketing",   salary: 68000,  active: false, skills: ["ads", "email"] },
  { id: 7,  name: "Grace",   dept: "design",      salary: 91000,  active: true,  skills: ["figma", "css", "ui"] },
  { id: 8,  name: "Henry",   dept: "engineering", salary: 88000,  active: true,  skills: ["java", "node", "sql"] },
];


// 1. Get names of all active employees
const activeNames = employees
  .filter(e => e.active)
  .map(e => e.name);
console.log(activeNames);
// ["Alice", "Bob", "David", "Eve", "Grace", "Henry"]


// 2. Total payroll (active only)
const totalPayroll = employees
  .filter(e => e.active)
  .reduce((sum, e) => sum + e.salary, 0);
console.log(totalPayroll); // 531000


// 3. Average salary by department
const avgByDept = employees.reduce((acc, e) => {
  if (!acc[e.dept]) acc[e.dept] = { total: 0, count: 0 };
  acc[e.dept].total += e.salary;
  acc[e.dept].count++;
  return acc;
}, {});

const deptAverages = Object.fromEntries(
  Object.entries(avgByDept).map(([dept, { total, count }]) => [
    dept,
    Math.round(total / count),
  ])
);
console.log(deptAverages);
// { engineering: ~98750, marketing: 70000, design: 88000 }


// 4. All unique skills across all employees
const allSkills = [...new Set(employees.flatMap(e => e.skills))];
console.log(allSkills);


// 5. Find the highest paid active engineer
const topEngineer = employees
  .filter(e => e.dept === "engineering" && e.active)
  .reduce((top, e) => e.salary > top.salary ? e : top);
console.log(topEngineer.name, topEngineer.salary); // Eve, 102000


// 6. Employees who know JavaScript (js or ts)
const jsDevs = employees.filter(e =>
  e.skills.some(s => ["js", "ts"].includes(s))
);
console.log(jsDevs.map(e => e.name)); // ["Alice", "Eve"]


// 7. Build a lookup map: id → employee
const byId = employees.reduce((map, e) => ({ ...map, [e.id]: e }), {});
console.log(byId[3].name); // "Carol"


// 8. Sort by salary descending, return name + salary
const ranked = [...employees]
  .sort((a, b) => b.salary - a.salary)
  .map(({ name, salary }) => `${name}: $${salary.toLocaleString()}`);
console.log(ranked);


// 9. Partition active vs inactive
const [active, inactive] = employees.reduce(
  ([yes, no], e) => e.active ? [[...yes, e], no] : [yes, [...no, e]],
  [[], []]
);
console.log("Active:", active.length, "Inactive:", inactive.length);


// 10. Department headcount and percentage
const headcount = employees.reduce((acc, e) => {
  acc[e.dept] = (acc[e.dept] || 0) + 1;
  return acc;
}, {});

const withPercent = Object.fromEntries(
  Object.entries(headcount).map(([dept, count]) => [
    dept,
    { count, percent: `${Math.round((count / employees.length) * 100)}%` },
  ])
);
console.log(withPercent);
