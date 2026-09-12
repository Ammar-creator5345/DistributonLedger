import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function BackupPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-lg">Backup</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-xs text-muted-foreground">
          Download a complete JSON snapshot of your business data — settings, salesmen, price
          list, vouchers, unsaleable sales and inventory.
        </p>
        <a href="/api/backup" className={cn(buttonVariants({ variant: "outline" }))}>
          Download backup now
        </a>
      </CardContent>
    </Card>
  );
}
