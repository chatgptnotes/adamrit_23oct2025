import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Zap, Filter, Play } from 'lucide-react';
import type { FlowNodeData } from '@/lib/taskOptimizerFlows';

// Visual treatment per node kind. Each node is a compact card with the right
// connection handles: trigger (source only), condition (both), action (target only).
const KIND_STYLE = {
  trigger: { ring: 'border-amber-300 bg-amber-50', icon: Zap, iconColor: 'text-amber-600', tag: 'Trigger' },
  condition: { ring: 'border-violet-300 bg-violet-50', icon: Filter, iconColor: 'text-violet-600', tag: 'Condition' },
  action: { ring: 'border-emerald-300 bg-emerald-50', icon: Play, iconColor: 'text-emerald-600', tag: 'Action' },
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

function BaseNode({ data, selected }: NodeProps) {
  const d = data as FlowNodeData;
  const style = KIND_STYLE[d.kind];
  const Icon = style.icon;
  return (
    <div
      className={`min-w-[160px] rounded-lg border-2 px-3 py-2 shadow-sm transition-shadow ${style.ring} ${
        selected ? 'ring-2 ring-primary ring-offset-1' : ''
      }`}
    >
      {d.kind !== 'trigger' && <Handle type="target" position={Position.Left} className="!h-2 !w-2" />}
      <div className="flex items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 ${style.iconColor}`} />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{style.tag}</span>
      </div>
      <p className="mt-0.5 text-sm font-medium leading-tight">{d.label}</p>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">{summarize(d)}</p>
      {d.kind !== 'action' && <Handle type="source" position={Position.Right} className="!h-2 !w-2" />}
    </div>
  );
}

// React Flow looks node components up by the node's `type` field.
export const flowNodeTypes = {
  trigger: BaseNode,
  condition: BaseNode,
  action: BaseNode,
};
