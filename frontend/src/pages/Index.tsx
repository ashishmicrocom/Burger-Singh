import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChefHat, CreditCard, Bike, Users, ArrowRight, Sparkles, Shield, Clock } from "lucide-react";
import { RoleCard } from "@/components/RoleCard";
import { OutletSelector } from "@/components/OutletSelector";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiService } from "@/lib/api";
import { toast } from "sonner";

const FEATURES = [
  {
    icon: Clock,
    title: "Quick Process",
    description: "Complete onboarding in under 10 minutes",
  },
  {
    icon: Shield,
    title: "Secure Verification",
    description: "DigiLocker powered Aadhaar verification",
  },
  {
    icon: Sparkles,
    title: "Instant Access",
    description: "Get LMS access immediately after approval",
  },
];

const ROLE_ICONS: Record<string, any> = {
  cook: ChefHat,
  cashier: CreditCard,
  delivery: Bike,
  manager: Users,
};

const Index = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const FEATURES = [
    {
      icon: Clock,
      title: t("index.quickProcess"),
      description: t("index.quickProcessDesc"),
    },
    {
      icon: Shield,
      title: t("index.secureVerification"),
      description: t("index.secureVerificationDesc"),
    },
    {
      icon: Sparkles,
      title: t("index.instantAccess"),
      description: t("index.instantAccessDesc"),
    },
  ];
  
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedOutlet, setSelectedOutlet] = useState<string>("");
  const [errors, setErrors] = useState<{ role?: string; outlet?: string }>({});
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  // Fetch roles from backend
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await apiService.getRoles();
        if (response.success) {
          setRoles(response.roles);
        }
      } catch (error) {
        console.error("Failed to fetch roles:", error);
        toast.error("Failed to load roles");
      } finally {
        setIsLoadingRoles(false);
      }
    };

    fetchRoles();
  }, []);

  const handleStartOnboarding = () => {
    const newErrors: { role?: string; outlet?: string } = {};
    
    if (!selectedRole) {
      newErrors.role = t("index.pleaseSelectRole");
    }
    if (!selectedOutlet) {
      newErrors.outlet = t("index.pleaseSelectOutlet");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Navigate to onboarding with selected role and outlet
    navigate("/onboarding", { 
      state: { role: selectedRole, outlet: selectedOutlet } 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center">
              <img src="/burgersingh-logo.png" className="h-14 w-14" alt="" />
            </div>
            <div>
              <h1 className="font-bold text-foreground leading-tight">Burger Singh</h1>
              <p className="text-xs text-muted-foreground">Workforce Portal</p>
            </div>
            
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/login")}>
              {t("auth.staffLogin")}
            </Button>
            <LanguageToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Hero Section */}
        <div className="text-center mb-10 md:mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            {t("index.joinFamily")}
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {t("index.startJourney")}<br className="hidden md:block" /> 
            <span className="text-primary">{t("index.withUs")}</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("index.subtitle")}
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 animate-slide-up">
          {FEATURES.map((feature, index) => (
            <div 
              key={feature.title} 
              className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <feature.icon className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">{feature.title}</p>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Form */}
        <div className="max-w-2xl mx-auto">
          <div className="card-elevated p-6 md:p-8 animate-slide-up" style={{ animationDelay: "200ms" }}>
            {/* Step 1: Role Selection */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-foreground mb-1">
                1. {t("index.selectYourRole")}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {t("index.choosePosition")}
              </p>
              
              {isLoadingRoles ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">{t("index.loadingRoles")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {roles.map((role) => (
                    <RoleCard
                      key={role._id || role.id}
                      icon={ROLE_ICONS[role.id] || Users}
                      title={role.title}
                      description={role.description}
                      selected={selectedRole === role.id}
                      onClick={() => {
                        setSelectedRole(role.id);
                        setErrors(prev => ({ ...prev, role: undefined }));
                      }}
                    />
                  ))}
                </div>
              )}
              {errors.role && (
                <p className="mt-2 text-sm text-destructive">{errors.role}</p>
              )}
            </div>

            {/* Step 2: Outlet Selection */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-foreground mb-1">
                2. {t("index.selectOutlet")}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {t("index.chooseOutlet")}
              </p>
              
              <OutletSelector
                value={selectedOutlet}
                onChange={(id) => {
                  setSelectedOutlet(id);
                  setErrors(prev => ({ ...prev, outlet: undefined }));
                }}
                error={errors.outlet}
              />
            </div>

            {/* CTA Button */}
            <Button
              onClick={handleStartOnboarding}
              className="w-full h-14 text-base font-semibold rounded-xl bg-gradient-accent hover:opacity-90 transition-all duration-200 shadow-glow-accent"
            >
              {t("index.startOnboarding")}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-4">
              {t("index.terms")}
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Burger Singh {t("index.allRightsReserved")}</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
