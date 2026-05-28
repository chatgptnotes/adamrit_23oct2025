import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ExternalLink, LayoutGrid } from 'lucide-react';

const DIRECTOR_LAUNCHER_EMAIL = 'cmd@hopehospital.com';

interface DirectorProject {
  name: string;
  url: string;
  description: string;
}

const DIRECTOR_PROJECTS: ReadonlyArray<DirectorProject> = [
  {
    name: 'Fluxio',
    url: 'https://fluxio.work/',
    description: 'Fluxio workspace',
  },
  {
    name: 'Hopetech',
    url: 'https://hopetech.me',
    description: 'Hopetech portal',
  },
  {
    name: 'Pulse of Project',
    url: 'https://www.pulseofproject.com/',
    description: 'Pulse of Project dashboard',
  },
  {
    name: 'Hisab',
    url: 'https://hisab.work',
    description: 'Hisab accounts',
  },
  {
    name: 'Proposalos',
    url: 'https://proposalos.in',
    description: 'Proposalos',
  },
  {
    name: 'NABH Online',
    url: 'https://www.nabh.online/',
    description: 'NABH Online',
  },
];

interface DirectorProjectLauncherProps {
  email?: string | null;
}

export function DirectorProjectLauncher(_props: DirectorProjectLauncherProps) {
  const openProject = (rawUrl: string): void => {
    try {
      const url = new URL(rawUrl);
      url.searchParams.set('login_hint', DIRECTOR_LAUNCHER_EMAIL);
      window.open(url.toString(), '_blank', 'noopener,noreferrer');
    } catch {
      window.open(rawUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card className="border-l-4 border-l-indigo-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-indigo-600" />
          My Projects
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>URL</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DIRECTOR_PROJECTS.map((project, index) => (
                <TableRow key={project.url}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {project.description}
                  </TableCell>
                  <TableCell className="text-sm text-blue-600 break-all">
                    {project.url}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openProject(project.url)}
                      className="inline-flex items-center gap-2"
                    >
                      Open
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
