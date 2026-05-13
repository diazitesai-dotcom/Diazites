import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type RunPayloadPreviewProps = {
  title: string;
  payload: Record<string, unknown> | null;
  emptyHint?: string;
};

export function RunPayloadPreview({
  title,
  payload,
  emptyHint = "Pending — run hasn't reached this step yet.",
}: RunPayloadPreviewProps) {
  return (
    <Card size="sm" className="border-white/[0.06]">
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {payload && Object.keys(payload).length > 0 ? (
          <pre className="max-h-72 overflow-auto rounded-lg border border-border/60 bg-background/60 p-3 text-[11px] leading-relaxed text-muted-foreground">
            {JSON.stringify(payload, null, 2)}
          </pre>
        ) : (
          <p className="text-xs text-muted-foreground">{emptyHint}</p>
        )}
      </CardContent>
    </Card>
  );
}
