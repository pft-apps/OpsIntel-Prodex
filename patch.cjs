const fs = require('fs');
let text = fs.readFileSync('src/components/DatabaseTab.tsx', 'utf8');

const target = `        {/* Rework? */}
        <td className="px-4 py-3 text-xs text-center whitespace-nowrap">
          {row.isRework ? (
            <span className="bg-rose-50 text-rose-600 border border-rose-200/60 px-1.5 py-0.5 rounded text-[9px] font-bold">
              Yes
            </span>
          ) : row.isRework === false ? (
            <span className="bg-slate-50 text-slate-500 border border-slate-200/60 px-1.5 py-0.5 rounded text-[9px] font-medium">
              No
            </span>
          ) : (
            <span className="text-slate-350">—</span>
          )}
        </td>

        {/* Transaction Count */}`;

const replacement = `        {/* Rework? */}
        <td className="px-4 py-3 text-xs text-center whitespace-nowrap">
          {row.isRework ? (
            <span className="bg-rose-50 text-rose-600 border border-rose-200/60 px-1.5 py-0.5 rounded text-[9px] font-bold">
              Yes
            </span>
          ) : row.isRework === false ? (
            <span className="bg-slate-50 text-slate-500 border border-slate-200/60 px-1.5 py-0.5 rounded text-[9px] font-medium">
              No
            </span>
          ) : (
            <span className="text-slate-350">—</span>
          )}
        </td>

        {/* Considered Accurate */}
        <td className="px-4 py-3 text-xs text-center whitespace-nowrap">
          {row.isRework ? (
            row.consideredAccurate ? (
              <span className="bg-emerald-50 text-emerald-600 border border-emerald-200/60 px-1.5 py-0.5 rounded text-[9px] font-bold">Yes</span>
            ) : (
              <span className="bg-rose-50 text-rose-600 border border-rose-200/60 px-1.5 py-0.5 rounded text-[9px] font-bold">No</span>
            )
          ) : (
            <span className="text-slate-350">—</span>
          )}
        </td>

        {/* Remarks */}
        <td className="px-4 py-3 text-xs text-center text-slate-700 max-w-[150px] truncate">
          {row.isRework && row.remarks ? row.remarks : <span className="text-slate-350">—</span>}
        </td>

        {/* Transaction Count */}`;

text = text.replace(target, replacement);
fs.writeFileSync('src/components/DatabaseTab.tsx', text);
