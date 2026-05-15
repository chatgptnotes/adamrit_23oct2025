// Renders DeepSeek's markdown plan. Phase 1: minimal renderer (paragraphs only).
// Phase 2 can swap in react-markdown for full GFM support if needed.

export function PlanView({ plan }: { plan: string }) {
  if (!plan) return null;
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
        <span>📋</span> DeepSeek's plan
      </h3>
      <div className="prose prose-sm max-w-none dark:prose-invert">
        {plan.split(/\n\n+/).map((para, i) => (
          <p key={i} className="my-2 whitespace-pre-wrap text-sm leading-relaxed">{para}</p>
        ))}
      </div>
    </div>
  );
}
