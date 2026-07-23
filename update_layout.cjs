const fs = require('fs');

let content = fs.readFileSync('src/components/LogTab.tsx', 'utf8');

const targetStr = `                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <span className="text-rose-500 font-bold mr-1">*</span><Hash className="h-3.5 w-3.5 text-blue-600" /> ACTIVITY REFERENCE NUMBER/CODE
                    </label>
                    <input
                      id="activity-reference-input"
                      type="text"
                      value={c.refNumber}
                      onChange={(e) => updateContainer(c.id, { refNumber: e.target.value, validationError: '' })}
                      disabled={!isFieldEditable}
                      required
                      placeholder="Enter reference number or code..."
                      className={\`w-full bg-white border disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed rounded-xl px-4 py-3 text-xs text-slate-950 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition shadow-sm \${
                        isRefDup 
                          ? 'border-rose-500 ring-2 ring-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-pulse' 
                          : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                      }\`}
                    />
                    {isRefDup && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-2 flex items-center gap-1.5 bg-rose-50 border border-rose-200/50 p-2 rounded-lg animate-fadeIn">
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        <span>Duplicate Reference Number detected in database.</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* TYPE & LABEL FIELDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      ACTIVITY TYPE
                    </label>
                    <div className="flex gap-2 bg-slate-100 p-1 border border-slate-200 rounded-xl">
                      <button
                        id="activity-type-core-btn"
                        type="button"
                        disabled={!isFieldEditable}
                        onClick={() => { updateContainer(c.id, { type: 'Core', activityName: '', selectedBu: '', refNumber: c.refNumber === 'N/A' ? '' : c.refNumber }); }}
                        className={\`flex-1 text-center py-2 rounded-lg text-xs font-bold transition-all duration-200 \${
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
                        className={\`flex-1 text-center py-2 rounded-lg text-xs font-bold transition-all duration-200 \${
                          c.type === 'Non-Core'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed'
                        }\`}
                      >
                        Non-Core
                      </button>
                    </div>
                  </div>`;

const replacement = `                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      ACTIVITY TYPE
                    </label>
                    <div className="flex gap-2 bg-slate-100 p-1 border border-slate-200 rounded-xl h-[42px] mt-[10px]">
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

                {/* TYPE & LABEL FIELDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      {c.type === 'Core' && <span className="text-rose-500 font-bold mr-1">*</span>}
                      <Hash className="h-3.5 w-3.5 text-blue-600" /> ACTIVITY REFERENCE NUMBER/CODE
                    </label>
                    <input
                      id="activity-reference-input"
                      type="text"
                      value={c.refNumber}
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
                  </div>`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacement);
  fs.writeFileSync('src/components/LogTab.tsx', content);
  console.log("Successfully replaced!");
} else {
  console.log("Could not find the target string.");
}
