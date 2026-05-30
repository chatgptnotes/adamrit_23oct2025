import { useCallback, useRef, useState, type DragEvent } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Connection,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Zap, Filter, Play, Save, Trash2, ArrowLeft, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { flowNodeTypes } from './nodeTypes';
import FlowInspector from './FlowInspector';
import FlowChatbot from './FlowChatbot';
import { COMMON_TASKS } from '../commonTasks';
import type {
  FlowNodeKind,
  StoredNode,
  StoredEdge,
  FlowNodeData,
  TriggerConfig,
  ConditionConfig,
  ActionConfig,
} from '@/lib/taskOptimizerFlows';

// Default config + label for a freshly dropped node of each kind.
function defaultData(kind: FlowNodeKind): FlowNodeData {
  if (kind === 'trigger') {
    return { kind, label: 'When status changes', config: { event: 'status_changed', toStatus: 'done' } as TriggerConfig };
  }
  if (kind === 'condition') {
    return { kind, label: 'If', config: { field: 'suggestion_type', op: 'eq', value: 'automate' } as ConditionConfig };
  }
  return { kind, label: 'Notify', config: { type: 'notify', message: '{task} is {status}' } as ActionConfig };
}

const PALETTE: Array<{ kind: FlowNodeKind; label: string; Icon: typeof Zap; color: string }> = [
  { kind: 'trigger', label: 'Trigger', Icon: Zap, color: 'text-amber-600' },
  { kind: 'condition', label: 'Condition', Icon: Filter, color: 'text-violet-600' },
  { kind: 'action', label: 'Action', Icon: Play, color: 'text-emerald-600' },
];

let idCounter = 1;
const nextId = (kind: string) => `${kind}-${Date.now()}-${idCounter++}`;

export interface FlowCanvasProps {
  initialName: string;
  initialEnabled: boolean;
  initialNodes: StoredNode[];
  initialEdges: StoredEdge[];
  onSave: (data: { name: string; enabled: boolean; nodes: StoredNode[]; edges: StoredEdge[] }) => void;
  onBack: () => void;
  saving: boolean;
}

function CanvasInner({ initialName, initialEnabled, initialNodes, initialEdges, onSave, onBack, saving }: FlowCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes as unknown as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges as unknown as Edge[]);
  const [name, setName] = useState(initialName);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAssistant, setShowAssistant] = useState(false);

  // Replace the canvas graph with an AI-generated one and re-centre.
  const applyGeneratedFlow = useCallback(
    (newNodes: StoredNode[], newEdges: StoredEdge[], generatedName: string) => {
      setNodes(newNodes as unknown as Node[]);
      setEdges(newEdges as unknown as Edge[]);
      if (generatedName) setName(generatedName);
      setSelectedId(null);
      setTimeout(() => fitView({ padding: 0.2 }), 50);
    },
    [setNodes, setEdges, fitView],
  );

  const onConnect = useCallback((c: Connection) => setEdges(eds => addEdge(c, eds)), [setEdges]);

  const onDragStart = (e: DragEvent, kind: FlowNodeKind) => {
    e.dataTransfer.setData('application/flow-kind', kind);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      const kind = e.dataTransfer.getData('application/flow-kind') as FlowNodeKind;
      if (!kind) return;
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const node: Node = { id: nextId(kind), type: kind, position, data: defaultData(kind) as unknown as Record<string, unknown> };
      setNodes(nds => [...nds, node]);
    },
    [screenToFlowPosition, setNodes],
  );

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // Inspector edits a node's config in place.
  const updateNodeConfig = useCallback(
    (nodeId: string, config: StoredNode['data']['config']) => {
      setNodes(nds =>
        nds.map(n => (n.id === nodeId ? { ...n, data: { ...(n.data as FlowNodeData), config } } : n)),
      );
    },
    [setNodes],
  );

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setNodes(nds => nds.filter(n => n.id !== selectedId));
    setEdges(eds => eds.filter(e => e.source !== selectedId && e.target !== selectedId));
    setSelectedId(null);
  }, [selectedId, setNodes, setEdges]);

  const selectedNode = (nodes.find(n => n.id === selectedId) as unknown as StoredNode) ?? null;

  const handleSave = () => {
    onSave({
      name: name.trim() || 'Untitled automation',
      enabled,
      nodes: nodes as unknown as StoredNode[],
      edges: edges as unknown as StoredEdge[],
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
        </Button>
        <Input value={name} onChange={e => setName(e.target.value)} className="h-8 max-w-xs text-sm" placeholder="Automation name" />
        <div className="flex items-center gap-2">
          <Switch checked={enabled} onCheckedChange={setEnabled} id="flow-enabled" />
          <Label htmlFor="flow-enabled" className="text-xs">Enabled</Label>
        </div>
        <div className="ml-auto flex gap-2">
          {selectedId && (
            <Button variant="outline" size="sm" onClick={deleteSelected}>
              <Trash2 className="mr-1.5 h-4 w-4" /> Delete node
            </Button>
          )}
          <Button
            variant={showAssistant ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowAssistant(s => !s)}
          >
            <Bot className="mr-1.5 h-4 w-4" /> AI Assistant
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="mr-1.5 h-4 w-4" /> {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[170px_1fr_280px]">
        {/* Palette */}
        <div className="space-y-2 rounded-lg border p-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Drag onto canvas</p>
          {PALETTE.map(({ kind, label, Icon, color }) => (
            <div
              key={kind}
              draggable
              onDragStart={e => onDragStart(e, kind)}
              className="flex cursor-grab items-center gap-2 rounded-md border bg-card px-2 py-1.5 text-sm shadow-sm active:cursor-grabbing"
            >
              <Icon className={`h-4 w-4 ${color}`} />
              {label}
            </div>
          ))}
        </div>

        {/* Canvas — fills most of the viewport so the flow is easy to build. */}
        <div
          ref={wrapperRef}
          className="h-[calc(100vh-220px)] min-h-[520px] rounded-lg border"
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={flowNodeTypes}
            onNodeClick={(_, n) => setSelectedId(n.id)}
            onPaneClick={() => setSelectedId(null)}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable className="!hidden sm:!block" />
          </ReactFlow>
        </div>

        {/* Right column: AI assistant when toggled on, otherwise the inspector. */}
        <div className="h-[calc(100vh-220px)] min-h-[520px] overflow-y-auto rounded-lg border">
          {showAssistant ? (
            <FlowChatbot
              personas={Object.keys(COMMON_TASKS)}
              onApply={applyGeneratedFlow}
              onClose={() => setShowAssistant(false)}
            />
          ) : (
            <FlowInspector node={selectedNode} onChange={updateNodeConfig} />
          )}
        </div>
      </div>
    </div>
  );
}

// Provider wrapper so useReactFlow() (screenToFlowPosition) is available.
export default function FlowCanvas(props: FlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
