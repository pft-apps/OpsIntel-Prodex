const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `            onToggleTimer={(id) => {
              setContainers((prev) =>
                prev.map((item) => {
                  if (item.id === id) {
                    if (item.timerState === 'running') {
                      const added = item.startTime ? Math.floor((Date.now() - item.startTime) / 1000) : 0;
                      return {
                        ...item,
                        accumulatedSeconds: item.accumulatedSeconds + added,
                        startTime: null,
                        timerState: 'paused'
                      };
                    } else if (item.timerState === 'paused') {
                      return {
                        ...item,
                        startTime: Date.now(),
                        timerState: 'running'
                      };
                    }
                  }
                  return item;
                })
              );
            }}`;

const replacement = `            onToggleTimer={(id) => {
              setContainers((prev) =>
                prev.map((item) => {
                  if (item.id === id) {
                    if (item.timerState === 'running') {
                      const added = item.startTime ? Math.floor((Date.now() - item.startTime) / 1000) : 0;
                      return {
                        ...item,
                        accumulatedSeconds: item.accumulatedSeconds + added,
                        startTime: null,
                        timerState: 'paused'
                      };
                    } else if (item.timerState === 'paused') {
                      return {
                        ...item,
                        startTime: Date.now(),
                        timerState: 'running'
                      };
                    }
                  } else if (item.timerState === 'running') {
                    const added = item.startTime ? Math.floor((Date.now() - item.startTime) / 1000) : 0;
                    return {
                      ...item,
                      accumulatedSeconds: item.accumulatedSeconds + added,
                      startTime: null,
                      timerState: 'paused'
                    };
                  }
                  return item;
                })
              );
            }}`;

content = content.replace(target, replacement);
fs.writeFileSync('src/App.tsx', content);
