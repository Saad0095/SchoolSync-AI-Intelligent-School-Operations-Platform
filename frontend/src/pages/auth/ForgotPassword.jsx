import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // API Calling to be done
      setMessage("Password reset link sent to your email.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[100px] animate-pulse-soft" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/20 blur-[120px] animate-pulse-soft" style={{ animationDelay: "2s" }} />
      </div>

      <div className="w-full max-w-md p-8 bg-card/95 border border-border backdrop-blur-md rounded-2xl shadow-xl relative z-10 animate-slide-in">
        <h2 className="text-2xl font-bold mb-4 text-center text-foreground">
          Reset Password
        </h2>
        {message && (
          <div className="bg-primary/10 text-primary p-3 rounded mb-4 text-sm font-medium">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded mb-4 text-sm font-medium">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2 group">
            <Label htmlFor="email" className="text-sm font-medium text-foreground tracking-wide group-focus-within:text-primary transition-colors duration-200">
              Email Address
            </Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors duration-200">
                <Mail className="w-5 h-5" />
              </div>
              <Input
                id="email"
                type="email"
                placeholder="name@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 h-12 bg-background border-border focus-visible:ring-primary/50 transition-all duration-200 rounded-lg"
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className={`w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-all duration-300 hover:shadow-md cursor-pointer ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              "Send Reset Link"
            )}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <a href="/login" className="text-sm text-primary hover:text-primary/80 font-medium">
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
