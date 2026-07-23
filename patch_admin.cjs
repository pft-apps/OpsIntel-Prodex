const fs = require('fs');
let content = fs.readFileSync('src/components/AdminCloudTab.tsx', 'utf8');

// replace state
content = content.replace(
  /const \[data, setData\] = useState<any\[\]>\(\[\]\);/,
  `const [data, setData] = useState<any[]>([]);
  const [cursors, setCursors] = useState<Record<string, any>>({});
  const [hasMore, setHasMore] = useState<Record<string, boolean>>({});
  const [loadingMore, setLoadingMore] = useState(false);`
);

// replace loadData
const loadDataRegex = /const loadData = async \(collection: CollectionType\) => \{[\s\S]*?setLoading\(false\);\n    \}\n  \};/;
const newLoadData = `const loadData = async (collection: CollectionType, loadMore: boolean = false) => {
    if (loadMore) setLoadingMore(true);
    else setLoading(true);
    
    if (!loadMore) setViewDoc(null);
    try {
      let results: any[] = [];
      let nextCursor = null;
      let more = false;
      
      const currentCursor = loadMore ? cursors[collection] : undefined;

      switch (collection) {
        case 'users': {
          const res = await loadUsersFromFirestore(currentCursor);
          results = res.data; nextCursor = res.lastDoc; more = res.hasMore;
          break;
        }
        case 'master_data': {
          const md = await loadMasterDataFromFirestore();
          results = md ? [md] : [];
          more = false;
          break;
        }
        case 'activity_logs': {
          const res = await loadActivityLogsFromFirestore(currentCursor);
          results = res.data; nextCursor = res.lastDoc; more = res.hasMore;
          break;
        }
        case 'leave_logs': {
          const res = await loadLeaveLogsFromFirestore(currentCursor);
          results = res.data; nextCursor = res.lastDoc; more = res.hasMore;
          break;
        }
        case 'audit_logs': {
          const res = await loadAuditLogsFromFirestore(currentCursor);
          results = res.data; nextCursor = res.lastDoc; more = res.hasMore;
          break;
        }
        case 'system_logs': {
          const res = await loadSystemLogsFromFirestore(currentCursor);
          results = res.data; nextCursor = res.lastDoc; more = res.hasMore;
          break;
        }
      }
      
      setData(prev => loadMore ? [...prev, ...results] : results);
      setCursors(prev => ({ ...prev, [collection]: nextCursor }));
      setHasMore(prev => ({ ...prev, [collection]: more }));
      
      setStats(prev => ({ 
        ...prev, 
        [collection]: loadMore ? prev[collection] + results.length : results.length 
      }));
    } catch (e) {
      console.error('Failed to load collection:', e);
    } finally {
      if (loadMore) setLoadingMore(false);
      else setLoading(false);
    }
  };`;
content = content.replace(loadDataRegex, newLoadData);

// replace loadAllStats
const loadAllStatsRegex = /const loadAllStats = async \(\) => \{[\s\S]*?setStats\(\{\s+users: u\.length,\s+master_data: md \? 1 : 0,\s+activity_logs: act\.length,\s+leave_logs: lv\.length,\s+audit_logs: aud\.length,\s+system_logs: sys\.length\s+\}\);\s+\} catch \(e\) \{[\s\S]*?\}\n  \};/;
const newLoadAllStats = `const loadAllStats = async () => {
    try {
      const u = await loadUsersFromFirestore();
      const md = await loadMasterDataFromFirestore();
      const act = await loadActivityLogsFromFirestore();
      const lv = await loadLeaveLogsFromFirestore();
      const aud = await loadAuditLogsFromFirestore();
      const sys = await loadSystemLogsFromFirestore();
      setStats({
        users: u.data.length,
        master_data: md ? 1 : 0,
        activity_logs: act.data.length,
        leave_logs: lv.data.length,
        audit_logs: aud.data.length,
        system_logs: sys.data.length
      });
      setCursors({
        users: u.lastDoc,
        activity_logs: act.lastDoc,
        leave_logs: lv.lastDoc,
        audit_logs: aud.lastDoc,
        system_logs: sys.lastDoc
      });
      setHasMore({
        users: u.hasMore,
        activity_logs: act.hasMore,
        leave_logs: lv.hasMore,
        audit_logs: aud.hasMore,
        system_logs: sys.hasMore
      });
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  };`;
content = content.replace(loadAllStatsRegex, newLoadAllStats);

// add Load More button to UI
const loadMoreButton = `
              <div className="divide-y divide-slate-100">
                {filteredData.map((doc, idx) => {`;
const newLoadMoreUI = `
              <div className="divide-y divide-slate-100 flex flex-col">
                {filteredData.map((doc, idx) => {`;
content = content.replace(loadMoreButton, newLoadMoreUI);

// find where to append load more button
const closingMapRegex = /<\/div>\n\s+\)\}\n\s+<\/div>/;
const newClosingMap = `</div>
                {hasMore[selectedCollection] && !search && (
                  <button 
                    onClick={() => loadData(selectedCollection, true)}
                    disabled={loadingMore}
                    className="p-3 text-xs font-bold text-blue-600 hover:bg-blue-50 transition w-full border-t border-slate-150 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loadingMore ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Load More (Next 20)'}
                  </button>
                )}
              </div>
            )}
          </div>`;
content = content.replace(closingMapRegex, newClosingMap);

fs.writeFileSync('src/components/AdminCloudTab.tsx', content);
console.log('AdminCloudTab.tsx updated successfully.');
