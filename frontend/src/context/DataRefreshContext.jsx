import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const DataRefreshContext = createContext(null);

export function DataRefreshProvider({ children }) {
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [lastRefreshAt, setLastRefreshAt] = useState(null);

  const refreshAll = useCallback(() => {
    setRefreshVersion((value) => value + 1);
    setLastRefreshAt(Date.now());
  }, []);

  const value = useMemo(() => ({
    refreshVersion,
    lastRefreshAt,
    refreshAll,
  }), [refreshVersion, lastRefreshAt, refreshAll]);

  return (
    <DataRefreshContext.Provider value={value}>
      {children}
    </DataRefreshContext.Provider>
  );
}

export function useDataRefresh() {
  const context = useContext(DataRefreshContext);
  if (!context) {
    throw new Error('useDataRefresh must be used within a DataRefreshProvider');
  }
  return context;
}
