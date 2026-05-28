import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  email: string | null | undefined;
}

export function DirectorProjectLauncher({ email }: DirectorProjectLauncherProps) {
  const normalizedEmail = (email ?? '').toLowerCase();
  if (normalizedEmail !== DIRECTOR_LAUNCHER_EMAIL) {
    return null;
  }

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
                <TableHead className="w-12">#</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DIRECTOR_PROJECTS.map((project, index) => (
                <TableRow key={project.url}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-indigo-700 hover:text-indigo-900 hover:underline"
                    >
                      {project.name}
                    </a>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {project.description}
                  </TableCell>
                  <TableCell>
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 break-all hover:text-blue-800 hover:underline"
                    >
                      {project.url}
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </a>
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
