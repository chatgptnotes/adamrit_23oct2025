import { useState } from 'react';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';
import { Button } from '@/components/ui/button';
import type { ProposedFile } from '@/lib/code-assistant/types';

export function DiffView({ files }: { files: ProposedFile[] }) {
  if (files.length === 0) return null;
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
        <span>📝</span> Proposed changes
      </h3>
      <div className="space-y-3">
        {files.map((f) => <FileDiff key={f.path} file={f} />)}
      </div>
    </div>
  );
}

function FileDiff({ file }: { file: ProposedFile }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border rounded">
      <div className="flex items-center justify-between p-2 bg-muted/30">
        <div className="flex items-center gap-2 text-sm font-mono">
          <span className={file.action === 'create' ? 'text-emerald-600' : 'text-amber-600'}>
            {file.action === 'create' ? '+new' : '~mod'}
          </span>
          <span>{file.path}</span>
          <span className="text-xs text-emerald-600">+{file.additions}</span>
          <span className="text-xs text-destructive">−{file.deletions}</span>
        </div>
        <Button size="sm" variant="ghost" onClick={() => setExpanded(!expanded)}>
          {expanded ? '▾ Collapse' : '▸ Expand diff'}
        </Button>
      </div>
      {expanded && (
        <div className="text-xs">
          <ReactDiffViewer
            oldValue={file.old_content}
            newValue={file.new_content}
            splitView={true}
            compareMethod={DiffMethod.LINES}
            useDarkTheme={typeof document !== 'undefined' && document.documentElement.classList.contains('dark')}
          />
        </div>
      )}
    </div>
  );
}
