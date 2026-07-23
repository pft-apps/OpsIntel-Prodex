const fs = require('fs');
let content = fs.readFileSync('src/components/LogTab.tsx', 'utf8');

// 1. Update validation logic for start/resume button
content = content.replace(
  "if (!c.refNumber || !c.refNumber.trim()) {\\n      updateContainer(id, { validationError: 'Please enter an Activity Reference Number/Code.' });\\n      return;\\n    }",
  "if (c.type === 'Core' && (!c.refNumber || !c.refNumber.trim())) {\\n      updateContainer(id, { validationError: 'Please enter an Activity Reference Number/Code.' });\\n      return;\\n    }"
);

// 2. Update isStartDisabled definition
content = content.replace(
  "const isStartDisabled = !c.date || !c.activityName || !c.desc.trim() || !c.refNumber.trim() || !hasEffectiveEmployee || !c.selectedBu || isRefDup;",
  "const isStartDisabled = !c.date || !c.activityName || !c.desc.trim() || (c.type === 'Core' && !c.refNumber.trim()) || !hasEffectiveEmployee || !c.selectedBu || (c.type === 'Core' && isRefDup);"
);

// 3. Update the type buttons to set/reset refNumber
content = content.replace(
  "onClick={() => { updateContainer(c.id, { type: 'Core', activityName: '', selectedBu: '' }); }}",
  "onClick={() => { updateContainer(c.id, { type: 'Core', activityName: '', selectedBu: '', refNumber: c.refNumber === 'N/A' ? '' : c.refNumber }); }}"
);

content = content.replace(
  "onClick={() => { updateContainer(c.id, { type: 'Non-Core', activityName: '', selectedBu: 'N/A' }); }}",
  "onClick={() => { updateContainer(c.id, { type: 'Non-Core', activityName: '', selectedBu: 'N/A', refNumber: 'N/A' }); }}"
);

// 4. Swap the UI blocks
// The UI structure is:
/*
                {/* REPORTING DATE & REF CODE * /
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    // Date block
                  </div>
                  <div>
                    // Ref Code block
                  </div>
                </div>

                {/* TYPE & LABEL FIELDS * /
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    // Type block
                  </div>
                  <div className="md:col-span-2">
                    // Label block
                  </div>
                </div>
*/

// Let's replace the whole section starting from "{/* REPORTING DATE & REF CODE */}" 
// to just before "{/* BUSINESS UNIT SELECTION */}" 

const startMarker = "{/* REPORTING DATE & REF CODE */}";
const endMarker = "{/* BUSINESS UNIT SELECTION */}";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex > -1 && endIndex > -1) {
  const newSection = \`{/* REPORTING DATE & ACTIVITY TYPE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div>
                    <div className="grid grid-cols-2 gap-3 items-end">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                          <span className="text-rose-500 font-bold mr-1">*</span>Reporting Date
                        </label>
                        <div className="relative">
                          <input
                            id="reporting-date-input"
                            type="date"
                            value={c.date}
                            onChange={(e) => updateContainer(c.id, { date: e.target.value, validationError: '' })}
                            disabled={isFormLocked}
                            required
                            className="w-full bg-white border border-slate-200 disabled:bg-slate-50 disabled:text-slate-500 rounded-xl pl-4 pr-10 py-3 text-xs text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm"
                          />
                          <Calendar className="absolute right-4 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                          Date Today
                        </label>
                        <input
                          id="todays-date-display"
                          type="text"
                          readOnly
                          value={getTodayDateString()}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-500 cursor-not-allowed shadow-sm text-left"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      ACTIVITY TYPE
                    </label>
                    <div className="flex gap-2 bg-slate-100 p-1 border border-slate-200 rounded-xl h-[42px] mt-[26px]">
                      <button
                        id="activity-type-core-btn"
                        type="button"
                        disabled={!isFieldEditable}
                        onClick={() => { updateContainer(c.id, { type: 'Core', activityName: '', selectedBu: '', refNumber: c.refNumber === 'N/A' ? '' : c.refNumber }); }}
                        className={\`flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all duration-200 \${
                          c.type === 'Core'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed'
                        }\`}
                      >
                        Core Activity
                      </button>
                      <button
                        id="activity-type-noncore-btn"
                        type="button"
                        disabled={!isFieldEditable}
                        onClick={() => { updateContainer(c.id, { type: 'Non-Core', activityName: '', selectedBu: 'N/A', refNumber: 'N/A' }); }}
                        className={\`flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all duration-200 \${
                          c.type === 'Non-Core'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed'
                        }\`}
                      >
                        Non-Core
                      </button>
                    </div>
                  </div>
                </div>

                {/* REF CODE & LABEL FIELDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      {c.type === 'Core' && <span className="text-rose-500 font-bold mr-1">*</span>}
                      <Hash className="h-3.5 w-3.5 text-blue-600" /> ACTIVITY REFERENCE NUMBER/CODE
                    </label>
                    <input
                      id="activity-reference-input"
                      type="text"
                      value={c.type === 'Non-Core' ? 'N/A' : c.refNumber}
                      onChange={(e) => updateContainer(c.id, { refNumber: e.target.value, validationError: '' })}
                      disabled={!isFieldEditable || c.type === 'Non-Core'}
                      required={c.type === 'Core'}
                      placeholder={c.type === 'Non-Core' ? 'N/A' : 'Enter reference number or code...'}
                      className={\`w-full bg-white border disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed rounded-xl px-4 py-3 text-xs text-slate-950 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition shadow-sm \${
                        (isRefDup && c.type === 'Core')
                          ? 'border-rose-500 ring-2 ring-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-pulse'
                          : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                      }\`}
                    />
                    {(isRefDup && c.type === 'Core') && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-2 flex items-center gap-1.5 bg-rose-50 border border-rose-200/50 p-2 rounded-lg animate-fadeIn">
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        <span>Duplicate Reference Number detected in database.</span>
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                      <span className="text-rose-500 font-bold mr-1">*</span>ACTIVITY LABEL / CATEGORY
                    </label>
                    {c.type === 'Core' ? (
                      <select
                        id="core-activity-name-input"
                        value={c.activityName}
                        onChange={(e) => updateContainer(c.id, { activityName: e.target.value })}
                        disabled={!isFieldEditable}
                        required
                        className="w-full bg-white border border-slate-200 disabled:bg-slate-50 disabled:text-slate-500 rounded-xl px-4 py-3 text-xs text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm"
                      >
                        <option value="">Select Core Service label...</option>
                        {(masterData.services || [])
                          .filter((item) => {
                            if (loggedInUser?.role === 'user' && masterData.regularUserAccount?.assignedServices && masterData.regularUserAccount.assignedServices.length > 0) {
                              const code = typeof item === 'string' ? '' : item.code;
                              return masterData.regularUserAccount.assignedServices.includes(code);
                            }
                            return true;
                          })
                          .map((item, index) => {
                            const name = typeof item === 'string' ? item : item.name;
                            const code = typeof item === 'string' ? \`SV-\${index}\` : item.code;
                            return (
                              <option key={index} value={name}>
                                [{code}] {name}
                              </option>
                            );
                          })}
                      </select>
                    ) : (
                      <select
                        id="noncore-activity-select"
                        value={c.activityName}
                        onChange={(e) => updateContainer(c.id, { activityName: e.target.value })}
                        disabled={!isFieldEditable}
                        required
                        className="w-full bg-white border border-slate-200 disabled:bg-slate-50 disabled:text-slate-500 rounded-xl px-4 py-3 text-xs text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm"
                      >
                        <option value="">Select Non-Core activity category...</option>
                        {(masterData.nonCoreActivities || []).map((nc, index) => {
                          const name = typeof nc === 'string' ? nc : nc.name;
                          return (
                            <option key={index} value={name}>
                              {name}
                            </option>
                          );
                        })}
                      </select>
                    )}
                  </div>
                </div>

                `;

  content = content.substring(0, startIndex) + newSection + content.substring(endIndex);
} else {
  console.log("Could not find markers!");
}

fs.writeFileSync('src/components/LogTab.tsx', content);
