import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, UserCheck, Building2, Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const getRoleOptions = (t: (key: string) => string): { id: UserRole; icon: typeof Shield; title: string; description: string; credentials: string }[] => [
  {
    id: "super_admin",
    icon: Shield,
    title: t("auth.superAdmin"),
    description: t("auth.superAdminDesc"),
    credentials: "admin@burgersingh.com / admin1234",
  },
  {
    id: "store_manager",
    icon: Building2,
    title: t("auth.outlet"),
    description: t("auth.outletDesc"),
    credentials: "ashishkumar074880029160@gmail.com / Ash@123",
  },
  {
    id: "field_coach",
    icon: UserCheck,
    title: t("auth.fieldCoach"),
    description: t("auth.fieldCoachDesc"),
    credentials: "ashish002916@gmail.com / Ash@123",
  },
];

const Login = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const { t } = useLanguage();
  const ROLE_OPTIONS = getRoleOptions(t);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    const roleData = ROLE_OPTIONS.find(r => r.id === role);
    if (roleData) {
      const [defaultEmail] = roleData.credentials.split(" / ");
      setEmail(defaultEmail);
      setPassword("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setIsLoading(true);
    
    try {
      const success = await login(email, password);
      
      if (success) {
        toast.success("Login successful!");
        
        // Wait a moment for auth context to update with user data
        setTimeout(() => {
          // This will be populated after login
          // Use a redirect component that checks user role
          window.location.href = "/login-redirect";
        }, 200);
      } else {
        toast.error("Invalid credentials. Please try again.");
      }
    } catch (error) {
      toast.error("Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center">
              <img src="public/burgersingh-logo.png" className="h-14 w-14" alt="" />
            </div>
            <div>
              <h1 className="font-bold text-foreground leading-tight">Burger Singh</h1>
              <p className="text-xs text-muted-foreground">Staff Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              {t("auth.newHire")}
            </Button>
            <LanguageToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {t("auth.signIn")}
            </h1>
            <p className="text-muted-foreground">
              {t("auth.selectRole")}
            </p>
          </div>

          {/* Role Selection */}
          <div className="space-y-3 mb-6">
            {ROLE_OPTIONS.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => handleRoleSelect(role.id)}
                className={cn(
                  "w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-4",
                  "hover:border-primary/50 hover:shadow-md",
                  selectedRole === role.id
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border bg-card"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center shrink-0",
                  selectedRole === role.id ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  <role.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{role.title}</p>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="card-elevated p-6 space-y-4">
            {selectedRole && (
              <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 text-xs text-accent">
                <p className="font-medium mb-1">Demo Credentials:</p>
                <p>{ROLE_OPTIONS.find(r => r.id === selectedRole)?.credentials}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("auth.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={!selectedRole}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.password")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={!selectedRole}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              disabled={!selectedRole || isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  {t("common.loading")}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  {t("auth.signIn")}
                </span>
              )}
            </Button>
          </form>
        </div>
      </main>

      <footer className="border-t border-border py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2024 Burger Singh. Powered by Microcom International.
        </div>
      </footer>
    </div>
  );
};

export default Login;