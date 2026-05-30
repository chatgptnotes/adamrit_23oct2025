import { useState } from 'react';
import { Bot, Send, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { generateFlowFromPrompt } from '@/lib/generateFlowFromPrompt';
import type { StoredNode, StoredEdge } from '@/lib/taskOptimizerFlows';

export interface FlowChatbotProps {
  personas: string[];
  onApply: (nodes: StoredNode[], edges: StoredEdge[], name: string) => void;
  onClose: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

const EXAMPLES = [
  'When a task is automated, notify the ward and set it to in progress',
  'If time saved is over 30 minutes, tag it as a quick win',
  'When a billing task is done, send a WhatsApp summary',
];

export default function FlowChatbot({ personas, onApply, onClose }: FlowChatbotProps) {
  const [persona, setPersona] = useState(personas[0] ?? '');
  const [customPersona, setCustomPersona] = useState('');
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'Tell me what you want to automate and I\'ll build the workflow on the canvas — tailored to your role. For example:',
    },
  ]);

  const resolvedPersona = persona === 'Other' ? customPersona.trim() : persona;

  const handleSend = async () => {
    const text = instruction.trim();
    if (!text || loading) return;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInstruction('');
    setLoading(true);
    try {
      const flow = await generateFlowFromPrompt({ persona: resolvedPersona || 'staff member', instruction: text });
      onApply(flow.nodes, flow.edges, flow.name);
      const summary = `Built ${flow.nodes.length} node${flow.nodes.length === 1 ? '' : 's'} — applied to the canvas.`;
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: flow.explanation ? `${flow.explanation}\n\n${summary}` : summary },
      ]);
    } catch (error: unknown) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: error instanceof Error ? error.message : 'Something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-lg border bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 border-b p-3">
        <Bot className="h-4 w-4 text-primary" />
        <p className="flex-1 text-sm font-semibold">AI Workflow Assistant</p>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} title="Close">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Persona */}
      <div className="space-y-1.5 border-b p-3">
        <p className="text-xs font-medium text-muted-foreground">I am a…</p>
        <Select value={persona} onValueChange={setPersona}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select your role" /></SelectTrigger>
          <SelectContent>
            {personas.map(p => (
              <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
            ))}
            <SelectItem value="Other" className="text-xs">Other…</SelectItem>
          </SelectContent>
        </Select>
        {persona === 'Other' && (
          <Input
            value={customPersona}
            onChange={e => setCustomPersona(e.target.value)}
            placeholder="Type your role"
            className="h-8 text-xs"
          />
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[90%] whitespace-pre-wrap rounded-lg px-3 py-2 text-xs ${
              m.role === 'user'
                ? 'ml-auto bg-primary text-primary-foreground'
                : 'mr-auto bg-muted text-foreground'
            }`}
          >
            {m.text}
          </div>
        ))}
        {messages.length === 1 && (
          <div className="space-y-1.5 pt-1">
            {EXAMPLES.map(ex => (
              <button
                key={ex}
                type="button"
                onClick={() => setInstruction(ex)}
                className="block w-full rounded-md border border-dashed px-2 py-1.5 text-left text-[11px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {ex}
              </button>
            ))}
          </div>
        )}
        {loading && (
          <div className="mr-auto flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Designing your workflow…
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="space-y-2 border-t p-3">
        <Textarea
          value={instruction}
          onChange={e => setInstruction(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend();
          }}
          placeholder="Describe the automation you want…"
          rows={3}
          className="text-xs"
        />
        <Button size="sm" className="w-full" onClick={handleSend} disabled={loading || !instruction.trim()}>
          {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />}
          Generate workflow
        </Button>
      </div>
    </div>
  );
}
