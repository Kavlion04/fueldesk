import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/auth")({
  beforeLoad: ({ location, navigate }) => {
    navigate({ to: "/" });
  },
  component: () => null,
});

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
        {label}
      </div>
      {children}
    </label>
  );
}
