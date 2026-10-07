'use client';

import React from 'react';
import { DatabaseProvider } from '@/lib/useDatabase';

export function Providers({ children }: { children: React.ReactNode }) {
  return <DatabaseProvider>{children}</DatabaseProvider>;
}
