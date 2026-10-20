export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="h-9 w-72 animate-pulse rounded-lg bg-muted" />
      <div className="mt-8 grid max-w-xl grid-cols-2 gap-4">
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
      </div>
    </main>
  );
}
