import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Zap, Filter, Play } from 'lucide-react';
import type { FlowNodeData } from '@/lib/taskOptimizerFlows';

// JotForm-style step cards: a coloured header bar (icon + type) on top of a
// white body with the step's label and a one-line summary. Handles are small
// rounded dots, source on the right, target on the left.
const KIND_STYLE = {
  trigger: { header: 'bg-amber-500', body: 'border-amber-200', icon: Zap, tag: 'Trigger', handle: '!bg-amber-500' },
  condition: { header: 'bg-violet-500', body: 'border-violet-200', icon: Filter, tag: 'Condition', handle: '!bg-violet-500' },
  action: { header: 'bg-emerald-500', body: 'border-emerald-200', icon: Play, tag: 'Action', handle: '!bg-emerald-500' },
} as const;

function summarize(data: FlowNodeData): string {
  const c = data.config as unknown as Record<string, unknown>;
  if (data.kind === 'trigger') return `status → ${c.toStatus ?? 'any'}`;
  if (data.kind === 'condition') return `${c.field} ${c.op} "${c.value}"`;
  if (data.kind === 'action') {
    if (c.type === 'set_status') return `set status → ${c.setStatus ?? 'in_progress'}`;
    if (c.type === 'whatsapp') return `WhatsApp${c.enabled ? '' : ' (off)'}`;
    return String(c.type ?? 'action');
  }
  return '';
}

const HANDLE_BASE = '!h-2.5 !w-2.5 !border-2 !border-white';

function BaseNode({ data, selected }: NodeProps) {
  const d = data as FlowNodeData;
  const style = KIND_STYLE[d.kind];
  const Icon = style.icon;
  return (
    <div
      className={`w-[200px] overflow-hidden rounded-xl border bg-card shadow-md transition-shadow ${style.body} ${
        selected ? 'ring-2 ring-primary ring-offset-2' : 'hover:shadow-lg'
      }`}
    >
      {d.kind !== 'trigger' && (
        <Handle type="target" position={Position.Left} className={`${HANDLE_BASE} ${style.handle}`} />
      )}

      {/* Header bar */}
      <div className={`flex items-center gap-1.5 px-3 py-1.5 ${style.header}`}>
        <Icon className="h-3.5 w-3.5 text-white" />
        <span className="text-[10px] font-bold uppercase tracking-wide text-white">{style.tag}</span>
      </div>

      {/* Body */}
      <div className="px-3 py-2">
        <p className="text-sm font-semibold leading-tight text-foreground">{d.label}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{summarize(d)}</p>
      </div>

      {d.kind !== 'action' && (
        <Handle type="source" position={Position.Right} className={`${HANDLE_BASE} ${style.handle}`} />
      )}
    </div>
  );
}

// React Flow looks node components up by the node's `type` field.
export const flowNodeTypes = {
  trigger: BaseNode,
  condition: BaseNode,
  action: BaseNode,
};
