import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PromptField } from '@/components/admin/code-assistant/PromptField';
import { FileAttachmentPicker } from '@/components/admin/code-assistant/FileAttachmentPicker';
import { StatusBar } from '@/components/admin/code-assistant/StatusBar';
import { ErrorPanel } from '@/components/admin/code-assistant/ErrorPanel';
import { PlanView } from '@/components/admin/code-assistant/PlanView';
import { DiffView } from '@/components/admin/code-assistant/DiffView';
import { PreviewLink } from '@/components/admin/code-assistant/PreviewLink';
import { UsageMeter } from '@/components/admin/code-assistant/UsageMeter';
import { ConnectionBadges } from '@/components/admin/code-assistant/ConnectionBadges';
import { useGenerateCode, useCodeAssistantHealth } from '@/hooks/admin/useCodeAssistant';
import { validatePrompt, validateAttachments } from '@/lib/code-assistant/validate';
import type { ErrorView, FieldError, GenerationResult } from '@/lib/code-assistant/types';

export default function CodeAssistant() {
  const [prompt, setPrompt] = useState('');
  const [attached, setAttached] = useState<string[]>([]);
  const [promptErr, setPromptErr] = useState<FieldError | null>(null);
  const [attachErr, setAttachErr] = useState<FieldError | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const generate = useGenerateCode();
  const health = useCodeAssistantHealth();
  const isLoading = generate.isPending;

  // Elapsed-seconds tick while generating.
  useEffect(() => {
    if (!isLoading) { setElapsed(0); return; }
    const start = Date.now();
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
  }, [isLoading]);

  const errors = useMemo<ErrorView[]>(() => {
    if (generate.data && generate.data.ok === false) return [generate.data.error];
    if (generate.error) {
      return [{
        code: 'network-error',
        title: 'Network error',
        message: generate.error.message,
        hint: 'Check your connection and retry.',
      }];
    }
    return [];
  }, [generate.data, generate.error]);

  const success: GenerationResult | null = generate.data?.ok ? generate.data : null;

  const onSubmit = () => {
    const e1 = validatePrompt(prompt);
    if (e1) { setPromptErr(e1); return; }
    const e2 = validateAttachments(attached);
    if (e2) { setAttachErr(e2); return; }
    setPromptErr(null);
    setAttachErr(null);
    generate.mutate({ prompt, attached_files: attached });
  };

  const onClear = () => {
    setPrompt('');
    setAttached([]);
    setPromptErr(null);
    setAttachErr(null);
    generate.reset();
  };

  const deepseekMissing = health.data?.ok === true && health.data?.checks?.deepseek?.ok === false;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {deepseekMissing && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4">
          <h3 className="text-sm font-semibold text-destructive">DeepSeek API key not configured</h3>
          <p className="text-xs mt-1">
            <code>DEEPSEEK_API_KEY</code> is not set in Vercel env vars. Add it under
            Vercel → Settings → Environment Variables (Production + Preview scopes), then redeploy.
          </p>
        </div>
      )}

      <header className="space-y-2 border-b pb-4">
        <h2 className="text-xl font-semibold">Code Assistant</h2>
        <p className="text-sm text-muted-foreground">
          Type a prompt → DeepSeek edits the Adamrit codebase → preview deploys → you promote or revert.
        </p>
        <div className="flex justify-between items-center pt-2">
          <ConnectionBadges />
          <UsageMeter />
        </div>
      </header>

      <section className="space-y-4">
        <PromptField
          value={prompt}
          onChange={setPrompt}
          error={promptErr}
          onClearError={() => setPromptErr(null)}
          onPickExample={(t) => setPrompt(t)}
          disabled={isLoading}
        />

        <FileAttachmentPicker
          attached={attached}
          onChange={(next) => {
            setAttached(next);
            if (attachErr) setAttachErr(null);
          }}
          disabled={isLoading}
        />
        {attachErr && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <span>⚠</span>{attachErr.message}
          </p>
        )}

        <div className="flex gap-2">
          <Button onClick={onSubmit} disabled={isLoading || deepseekMissing}>
            {isLoading ? labelForLoadingStage(success?.generation_id ? 'building' : 'thinking') : 'Generate Code'}
          </Button>
          <Button variant="outline" onClick={onClear} disabled={isLoading}>
            Clear
          </Button>
        </div>
      </section>

      {isLoading && <StatusBar current="calling-deepseek" elapsedSec={elapsed} />}

      {errors.length > 0 && <ErrorPanel errors={errors} />}

      {success && (
        <div className="space-y-4">
          {success.plan && <PlanView plan={success.plan} />}
          {success.files.length > 0 && <DiffView files={success.files} />}
          <PreviewLink generationId={success.generation_id} />
        </div>
      )}
    </div>
  );
}

function labelForLoadingStage(s: 'thinking' | 'building'): string {
  return s === 'building' ? 'Waiting for Vercel build…' : 'DeepSeek is thinking…';
}
