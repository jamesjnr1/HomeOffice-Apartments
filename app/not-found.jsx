import SiteChrome from '@/components/SiteChrome';
import NotFound from '@/views/NotFound';

export const metadata = { title: 'Page not found' };

export default function NotFoundPage() {
  return (
    <SiteChrome>
      <NotFound />
    </SiteChrome>
  );
}
