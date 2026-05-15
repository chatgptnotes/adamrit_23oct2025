import { usePreviewStatus } from '@/hooks/admin/useCodeAssistant';
import { ErrorPanel } from './ErrorPanel';

export function PreviewLink({ generationId }: { generationId: string }) {
  const { data, isLoading } = usePreviewStatus(generationId);

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        🔍 Polling Vercel for preview status…
      </div>
    );
  }

  if (data?.ok === false) {
    return <ErrorPanel errors={[data.error]} />;
  }

  if (data?.status === 'building') {
    return (
      <div className="rounded-lg border bg-card p-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="animate-pulse">🔨</span>
          <span>Vercel is building the preview… {data.elapsed_sec}s elapsed</span>
        </div>
      </div>
    );
  }

  if (data?.status === 'ready') {
    return (
      <div className="rounded-lg border bg-card p-4 space-y-2">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <span>🔍</span> Preview deployment
        </h3>
        <div className="text-sm">
          <a
            href={data.preview_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline break-all"
          >
            {data.preview_url}
          </a>
        </div>
        <p className="text-xs text-muted-foreground">
          ✅ Ready in {data.build_time_sec ?? '?'}s
        </p>
      </div>
    );
  }

  return null;
}
