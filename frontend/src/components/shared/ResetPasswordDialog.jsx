import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, Eye, EyeOff, Loader2 } from "lucide-react";
import { adminResetPassword } from "@/services/userService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Reusable dialog for admins to reset another user's password.
 * @param {{ open: boolean, onOpenChange: (open: boolean) => void, user: { _id: string, name: string } | null, onSuccess?: () => void }} props
 */
const ResetPasswordDialog = ({ open, onOpenChange, user, onSuccess }) => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setPassword("");
    setConfirm("");
    setShow(false);
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!password) {
      toast.error("Please enter a new password");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await adminResetPassword(user._id, password);
      toast.success(`Password reset for ${user.name}`);
      onSuccess?.();
      handleClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const strength =
    password.length === 0
      ? null
      : password.length < 8
        ? { label: "Weak", cls: "bg-destructive" }
        : password.length < 12
          ? { label: "Fair", cls: "bg-warning" }
          : { label: "Strong", cls: "bg-success" };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound size={18} className="text-primary" aria-hidden="true" />
            Reset Password
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground -mt-2">
          Set a new password for <span className="font-medium text-foreground">{user?.name}</span>.
        </p>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reset-password">New Password</Label>
            <div className="relative">
              <Input
                id="reset-password"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {strength && (
              <div className="flex items-center gap-2 mt-1">
                <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${strength.cls}`}
                    style={{
                      width:
                        strength.label === "Weak"
                          ? "33%"
                          : strength.label === "Fair"
                            ? "66%"
                            : "100%",
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{strength.label}</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reset-confirm">Confirm Password</Label>
            <Input
              id="reset-confirm"
              type={show ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            />
            {confirm && password !== confirm && (
              <p className="text-xs text-destructive mt-1">Passwords do not match</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !password || password !== confirm}
          >
            {loading && <Loader2 size={14} className="mr-1.5 animate-spin" />}
            {loading ? "Resetting…" : "Reset Password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResetPasswordDialog;
