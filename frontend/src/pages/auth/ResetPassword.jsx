import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/utils/api";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { newPassword });
      toast.success("Password reset successfully");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to reset password. The link might be expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Lock className="h-6 w-6 text-primary" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
          Set new password
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle>Reset your password</CardTitle>
            <CardDescription>Enter your new password below.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleReset} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !newPassword || !confirmPassword}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
