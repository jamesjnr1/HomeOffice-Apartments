'use client';

import { LayoutSlot } from '@/lib/router';
import AdminLayout from '@/views/admin/AdminLayout';
import '@/views/admin/admin.css';

export default function Layout({ children }) {
  return <LayoutSlot layout={AdminLayout}>{children}</LayoutSlot>;
}
