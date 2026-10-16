'use client';

import { LayoutSlot } from '@/lib/router';
import DashboardLayout from '@/views/dashboard/DashboardLayout';
import '@/views/dashboard/dashboard.css';

export default function Layout({ children }) {
  return <LayoutSlot layout={DashboardLayout}>{children}</LayoutSlot>;
}
