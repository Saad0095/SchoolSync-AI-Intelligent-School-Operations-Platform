import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ConfirmDialog = ({
  open,
  onOpenChange,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  loading = false,
  variant = "destructive",
}) => {
  const isDestructive = variant === "destructive";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full",
                isDestructive ? "bg-destructive/10" : "bg-primary/10"
              )}
            >
              <AlertTriangle
                className={cn(
                  "size-5",
                  isDestructive ? "text-destructive" : "text-primary"
                )}
              />
            </div>
            <DialogTitle className="text-lg font-semibold text-foreground">
              {title}
            </DialogTitle>
          </div>
        </DialogHeader>

        <p className="text-sm text-muted-foreground mt-2">{description}</p>

        <DialogFooter className="gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? "Processing..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDialog;
