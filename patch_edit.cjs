const fs = require('fs');
let text = fs.readFileSync('src/components/DatabaseTab.tsx', 'utf8');

const target1 = `    volume: number;
    isRework: boolean;
    status: 'Completed' | 'Paused';`;
const rep1 = `    volume: number;
    isRework: boolean;
    consideredAccurate?: boolean;
    remarks?: string;
    status: 'Completed' | 'Paused';`;

const target2 = `    output: '',
    volume: 1,
    isRework: false,
    status: 'Paused',`;
const rep2 = `    output: '',
    volume: 1,
    isRework: false,
    consideredAccurate: false,
    remarks: '',
    status: 'Paused',`;

const target3 = `      output: (!targetLog.dateCompleted || targetLog.output === 'Continue later' || targetLog.output === 'Continue Later') ? '' : (targetLog.output || ''),
      volume: targetLog.volume !== undefined ? targetLog.volume : 1,
      isRework: targetLog.isRework || false,
      status: targetLog.dateCompleted ? 'Completed' : 'Paused',`;
const rep3 = `      output: (!targetLog.dateCompleted || targetLog.output === 'Continue later' || targetLog.output === 'Continue Later') ? '' : (targetLog.output || ''),
      volume: targetLog.volume !== undefined ? targetLog.volume : 1,
      isRework: targetLog.isRework || false,
      consideredAccurate: targetLog.consideredAccurate || false,
      remarks: targetLog.remarks || '',
      status: targetLog.dateCompleted ? 'Completed' : 'Paused',`;

const target4 = `      volume: Number(editForm.volume),
      isRework: editForm.isRework,
      dateCompleted: finalDateCompleted,`;
const rep4 = `      volume: Number(editForm.volume),
      isRework: editForm.isRework,
      consideredAccurate: editForm.consideredAccurate,
      remarks: editForm.remarks,
      dateCompleted: finalDateCompleted,`;

text = text.replace(target1, rep1).replace(target2, rep2).replace(target3, rep3).replace(target4, rep4);
fs.writeFileSync('src/components/DatabaseTab.tsx', text);
