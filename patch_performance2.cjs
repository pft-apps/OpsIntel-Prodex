const fs = require('fs');
let text = fs.readFileSync('src/components/PerformanceTab.tsx', 'utf8');

const target = `            <div className="flex justify-between">
              <span>B (Total Count of "Rework" = Yes):</span>
              <span className="font-bold text-slate-800">{reworkCount} logs</span>
            </div>`;
const rep = `            <div className="flex justify-between">
              <span>B (Total Inaccurate Rework Count):</span>
              <span className="font-bold text-slate-800">{reworkCount} logs</span>
            </div>`;

text = text.replace(target, rep);
fs.writeFileSync('src/components/PerformanceTab.tsx', text);
