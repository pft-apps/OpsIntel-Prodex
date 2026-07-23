const fs = require('fs');
let text = fs.readFileSync('src/components/PerformanceTab.tsx', 'utf8');

const target1 = `  // KPI 7. Accuracy = (A - B) / A, Where A = Total "Completed Count", B = total count of "Rework" that is tagged "Yes"
  const reworkCount = periodMainLogs.filter((log) => !!log.isRework).length;`;
const rep1 = `  // KPI 7. Accuracy = (A - B) / A, Where A = Total "Completed Count", B = total count of "Rework" that is tagged "Yes" AND "Considered Accurate" is not "Yes"
  const reworkCount = periodMainLogs.filter((log) => !!log.isRework && !log.consideredAccurate).length;`;

const target2 = `          \`B (Total Rework Count): \${reworkCount} logs\``;
const rep2 = `          \`B (Total Inaccurate Rework Count): \${reworkCount} logs\``;

const target3 = `            <div className="flex justify-between">
              <span>B (Total "Rework" Count):</span>
              <span className="font-bold text-slate-800">{reworkCount} logs</span>
            </div>`;
const rep3 = `            <div className="flex justify-between">
              <span>B (Total Inaccurate Rework Count):</span>
              <span className="font-bold text-slate-800">{reworkCount} logs</span>
            </div>`;

text = text.replace(target1, rep1).replace(target2, rep2).replace(target3, rep3);
fs.writeFileSync('src/components/PerformanceTab.tsx', text);
