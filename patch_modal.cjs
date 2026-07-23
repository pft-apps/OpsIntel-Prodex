const fs = require('fs');
let text = fs.readFileSync('src/components/DatabaseTab.tsx', 'utf8');

const target = `              {/* Rework */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Rework?</label>
                <select
                  value={editForm.isRework ? 'Yes' : 'No'}
                  disabled={isOriginalPaused}
                  onChange={(e) => setEditForm({ ...editForm, isRework: e.target.value === 'Yes' })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-150"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>`;

const rep = `              {/* Rework */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Rework?</label>
                <select
                  value={editForm.isRework ? 'Yes' : 'No'}
                  disabled={isOriginalPaused}
                  onChange={(e) => setEditForm({ ...editForm, isRework: e.target.value === 'Yes' })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-150"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>

            {editForm.isRework && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 mt-6 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.consideredAccurate || false}
                      onChange={(e) => setEditForm({ ...editForm, consideredAccurate: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Considered Accurate</span>
                  </label>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Remarks</label>
                  <textarea
                    value={editForm.remarks || ''}
                    onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    rows={2}
                  />
                </div>
              </div>
            )}`;

text = text.replace(target, rep);
fs.writeFileSync('src/components/DatabaseTab.tsx', text);
