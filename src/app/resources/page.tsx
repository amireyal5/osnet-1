import { PageHeader } from '@/components/page-header';
import ResourceForm from './resource-form';

export default function ResourcesPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Resource Finder" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <ResourceForm />
      </main>
    </div>
  );
}
