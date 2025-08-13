import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const cases = [
  {
    caseId: 'CASE-001',
    clientName: 'John Doe',
    service: 'Housing Assistance',
    status: 'Active',
    lastUpdate: '2024-05-10',
  },
  {
    caseId: 'CASE-002',
    clientName: 'Jane Smith',
    service: 'Mental Health Support',
    status: 'Pending',
    lastUpdate: '2024-05-12',
  },
  {
    caseId: 'CASE-003',
    clientName: 'Mark Johnson',
    service: 'Food Stamps (SNAP)',
    status: 'Closed',
    lastUpdate: '2024-04-20',
  },
  {
    caseId: 'CASE-004',
    clientName: 'Emily Williams',
    service: 'Unemployment Insurance',
    status: 'Active',
    lastUpdate: '2024-05-11',
  },
    {
    caseId: 'CASE-005',
    clientName: 'Michael Brown',
    service: 'Job Training',
    status: 'On Hold',
    lastUpdate: '2024-05-01',
  },
];

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'Active':
      return 'default';
    case 'Pending':
      return 'secondary';
    case 'Closed':
      return 'outline';
    case 'On Hold':
        return 'destructive'
    default:
      return 'secondary';
  }
};

export default function CasesPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Case Management">
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Case
        </Button>
      </PageHeader>
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Client Cases</CardTitle>
            <CardDescription>
              Track and manage all client interactions and service requests.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case ID</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Service Requested</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Update</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.map((c) => (
                  <TableRow key={c.caseId}>
                    <TableCell className="font-medium">{c.caseId}</TableCell>
                    <TableCell>{c.clientName}</TableCell>
                    <TableCell>{c.service}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(c.status) as any}>
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{c.lastUpdate}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Close Case</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
