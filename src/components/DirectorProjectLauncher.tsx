import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ExternalLink, LayoutGrid, Pencil, Plus, Trash2, X, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DIRECTOR_LAUNCHER_EMAIL = 'cmd@hopehospital.com';

interface DirectorProject {
  id: string;
  name: string;
  url: string;
  description: string | null;
  sort_order: number;
}

interface DraftProject {
  name: string;
  url: string;
  description: string;
}

const EMPTY_DRAFT: DraftProject = { name: '', url: '', description: '' };

interface DirectorProjectLauncherProps {
  email: string | null | undefined;
}

export function DirectorProjectLauncher({ email }: DirectorProjectLauncherProps) {
  const normalizedEmail = (email ?? '').toLowerCase();
  const isAuthorised = normalizedEmail === DIRECTOR_LAUNCHER_EMAIL;

  const [projects, setProjects] = useState<DirectorProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<DraftProject>(EMPTY_DRAFT);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addDraft, setAddDraft] = useState<DraftProject>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('director_projects')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.warn('director_projects load error:', error);
      toast.error('Failed to load projects');
      setLoading(false);
      return;
    }
    setProjects((data ?? []) as DirectorProject[]);
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthorised) {
      fetchProjects();
    }
  }, [isAuthorised]);

  if (!isAuthorised) {
    return null;
  }

  const startEdit = (project: DirectorProject) => {
    setEditingId(project.id);
    setEditDraft({
      name: project.name,
      url: project.url,
      description: project.description ?? '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(EMPTY_DRAFT);
  };

  const saveEdit = async (id: string) => {
    if (!editDraft.name.trim() || !editDraft.url.trim()) {
      toast.error('Name and URL are required');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('director_projects')
      .update({
        name: editDraft.name.trim(),
        url: editDraft.url.trim(),
        description: editDraft.description.trim() || null,
      })
      .eq('id', id);
    setSaving(false);
    if (error) {
      toast.error('Update failed: ' + error.message);
      return;
    }
    toast.success('Saved');
    cancelEdit();
    await fetchProjects();
  };

  const deleteProject = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    const { error } = await supabase
      .from('director_projects')
      .delete()
      .eq('id', id);
    if (error) {
      toast.error('Delete failed: ' + error.message);
      return;
    }
    toast.success('Deleted');
    await fetchProjects();
  };

  const addProject = async () => {
    if (!addDraft.name.trim() || !addDraft.url.trim()) {
      toast.error('Name and URL are required');
      return;
    }
    setSaving(true);
    const nextSortOrder = (projects[projects.length - 1]?.sort_order ?? 0) + 10;
    const { error } = await supabase
      .from('director_projects')
      .insert({
        name: addDraft.name.trim(),
        url: addDraft.url.trim(),
        description: addDraft.description.trim() || null,
        sort_order: nextSortOrder,
      });
    setSaving(false);
    if (error) {
      toast.error('Add failed: ' + error.message);
      return;
    }
    toast.success('Project added');
    setAddDraft(EMPTY_DRAFT);
    setShowAddForm(false);
    await fetchProjects();
  };

  return (
    <Card className="border-l-4 border-l-indigo-500">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-indigo-600" />
          My Projects
        </CardTitle>
        {!showAddForm && (
          <Button
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Project
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {showAddForm && (
          <div className="mb-4 p-3 rounded-lg border border-indigo-200 bg-indigo-50/50 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input
                placeholder="Project name *"
                value={addDraft.name}
                onChange={(e) => setAddDraft({ ...addDraft, name: e.target.value })}
              />
              <Input
                placeholder="https://... *"
                value={addDraft.url}
                onChange={(e) => setAddDraft({ ...addDraft, url: e.target.value })}
              />
              <Input
                placeholder="Description (optional)"
                value={addDraft.description}
                onChange={(e) => setAddDraft({ ...addDraft, description: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAddForm(false);
                  setAddDraft(EMPTY_DRAFT);
                }}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={saving}
                onClick={addProject}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500 italic py-4">Loading projects...</p>
        ) : projects.length === 0 ? (
          <p className="text-sm text-gray-500 italic py-4">No projects yet. Click "Add Project" to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project, index) => {
                  const isEditing = editingId === project.id;
                  if (isEditing) {
                    return (
                      <TableRow key={project.id} className="bg-amber-50/40">
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <Input
                            value={editDraft.name}
                            onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                            className="h-8 text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={editDraft.description}
                            onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })}
                            className="h-8 text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={editDraft.url}
                            onChange={(e) => setEditDraft({ ...editDraft, url: e.target.value })}
                            className="h-8 text-sm"
                          />
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={saving}
                            onClick={() => saveEdit(project.id)}
                            className="h-7 px-2 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEdit}
                            className="h-7 px-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  }
                  return (
                    <TableRow key={project.id}>
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
                      <TableCell className="text-right space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(project)}
                          className="h-7 px-2 text-gray-600 hover:text-indigo-700 hover:bg-indigo-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteProject(project.id, project.name)}
                          className="h-7 px-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
