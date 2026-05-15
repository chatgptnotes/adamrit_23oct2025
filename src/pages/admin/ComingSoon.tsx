export default function ComingSoon({ name }: { name?: string }) {
  return (
    <div className="rounded-lg border bg-card p-8 text-center">
      <h2 className="text-lg font-semibold mb-2">Coming soon</h2>
      <p className="text-sm text-muted-foreground">
        {name ? `The "${name}" tab` : 'This tab'} is part of a later phase.
        See the Super-Admin Code Assistant plan for the roadmap.
      </p>
    </div>
  );
}
