const fs = require('fs');

const appFile = fs.readFileSync('src/App.tsx', 'utf-8');

const sampleData = `[
  {
    id: "LOG-12345",
    type: "Core",
    priority: "High",
    category: "Development",
    customerTier: "Tier 1",
    activity: "Coding",
    employeeTargetHours: 8,
    employeeId: "emp-1",
    dateLogged: "2024-05-01",
    dateCompleted: "2024-05-02",
    output: "Feature X",
    volume: 1,
    hours: 6,
    isRework: false
  },
  {
    id: "LOG-12345_240501_1",
    parentId: "LOG-12345",
    type: "Core",
    priority: "High",
    category: "Development",
    customerTier: "Tier 1",
    activity: "Coding",
    employeeTargetHours: 8,
    employeeId: "emp-1",
    dateLogged: "2024-05-01",
    output: "Feature X",
    volume: 1,
    hours: 2,
    isRework: false
  },
  {
    id: "LOG-12345_240502_1",
    parentId: "LOG-12345",
    type: "Core",
    priority: "High",
    category: "Development",
    customerTier: "Tier 1",
    activity: "Coding",
    employeeTargetHours: 8,
    employeeId: "emp-1",
    dateLogged: "2024-05-02",
    dateCompleted: "2024-05-02",
    output: "Feature X",
    volume: 1,
    hours: 4,
    isRework: false
  }
]`;

const newAppFile = appFile.replace(
  "const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [];",
  `const INITIAL_ACTIVITY_LOGS: ActivityLog[] = ${sampleData};`
);

fs.writeFileSync('src/App.tsx', newAppFile);
