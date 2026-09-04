import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, School, Mail, Lock, Loader2, ArrowRight } from "lucide-react";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { user } = await login(email, password);

      const role =
        user.role == "super-admin" || user.role == "campus-admin"
          ? "admin"
          : user.role;
      navigate(`/${role}/dashboard`);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[100px] animate-pulse-soft" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/20 blur-[120px] animate-pulse-soft" style={{ animationDelay: "2s" }} />
      </div>
      <Card className="w-full max-w-md shadow-xl border-border bg-card/95 backdrop-blur-md rounded-2xl overflow-hidden relative z-10 animate-slide-in">
        <div className="h-2 w-full bg-gradient-to-r from-primary to-accent" />
        
        <CardHeader className="space-y-3 px-8 text-center">
          <div className="mx-auto w-32 h-32 flex items-center justify-center">
            <img src="/logo.png" alt="SchoolSync Logo" className="w-full h-full object-contain" />
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight text-foreground">
            Welcome to SchoolSync
          </CardTitle>
          <p className="text-sm text-muted-foreground font-medium">
            Sign in to your account to continue
          </p>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          {error && (
            <Alert
              variant="destructive"
              className="mb-6 bg-destructive/10 border-destructive/20"
            >
              <AlertDescription className="text-destructive">
                {error}
              </AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2 group">
              <Label 
                htmlFor="email" 
                className="text-sm font-medium text-foreground tracking-wide group-focus-within:text-primary transition-colors duration-200"
              >
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
                  className="pl-10 h-12 bg-background border-border focus-visible:ring-primary/50 transition-all duration-200 rounded-lg"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <div className="flex items-center justify-between">
                <Label 
                  htmlFor="password" 
                  className="text-sm font-medium text-foreground tracking-wide group-focus-within:text-primary transition-colors duration-200"
                >
                  Password
                </Label>
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors duration-200">
                  <Lock className="w-5 h-5" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 bg-background border-border focus-visible:ring-primary/50 transition-all duration-200 rounded-lg"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors duration-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="text-right mt-1">
                <a href="/forgot-password" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors duration-200">
                  Forgot password?
                </a>
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
                <span className="flex items-center justify-center">
                  Sign In <ArrowRight className="w-4 h-4 ml-2" />
                </span>
              )}
            </Button>
          </form>
          
          <p className="text-center text-xs text-muted-foreground mt-6">
            Secure connection • School Management System
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
