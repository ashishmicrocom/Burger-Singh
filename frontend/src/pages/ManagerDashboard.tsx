import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/lib/api";
import { 
  Users, Clock, CheckCircle, XCircle, Plus, Search, 
  User, MapPin, Calendar, LogOut, ChevronRight, UserX,
  Phone, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type OnboardingStatus = "draft" | "in_progress" | "submitted" | "pending_approval" | "approved" | "rejected" | "deactivated" | "terminated";
type EmployeeStatus = "active" | "deactivation_pending" | "deactivated" | "terminated";

interface Onboarding {
  id: string;
  name: string;
  role: string;
  outlet: string;
  startedAt: string;
  status: OnboardingStatus;
}

interface Employee {
  id: string;
  name: string;
  phone: string;
  role: string;
  dateOfJoining: string;
  status: EmployeeStatus;
}

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOnboardings: 0,
    inProgress: 0,
    pendingApproval: 0,
    completed: 0
  });
  const [onboardings, setOnboardings] = useState<Onboarding[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [deactivationRequests, setDeactivationRequests] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedOnboarding, setSelectedOnboarding] = useState<Onboarding | null>(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showOnboardingDetailModal, setShowOnboardingDetailModal] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [activeTab, setActiveTab] = useState("onboarding");

  // Load data on mount and tab change
  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === "onboarding") {
        loadOnboardings(search);
      } else if (activeTab === "employees") {
        loadEmployees(search);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load stats
      const statsRes = await apiService.getManagerStats();
      if (statsRes.success) {
        setStats(statsRes.data);
      }

      // Load data based on active tab
      if (activeTab === "onboarding") {
        await loadOnboardings();
      } else if (activeTab === "employees") {
        await loadEmployees();
      } else if (activeTab === "deactivation") {
        await loadDeactivationRequests();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadOnboardings = async (searchQuery?: string) => {
    try {
      const res = await apiService.getManagerOnboardings(searchQuery);
      if (res.success) {
        setOnboardings(res.data);
      }
    } catch (error) {
      console.error('Error loading onboardings:', error);
      toast.error('Failed to load onboardings');
    }
  };

  const loadEmployees = async (searchQuery?: string) => {
    try {
      const res = await apiService.getManagerEmployees(searchQuery);
      if (res.success) {
        setEmployees(res.data);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      toast.error('Failed to load employees');
    }
  };

  const loadDeactivationRequests = async () => {
    try {
      const res = await apiService.getManagerDeactivationRequests();
      if (res.success) {
        setDeactivationRequests(res.data);
      }
    } catch (error) {
      console.error('Error loading deactivation requests:', error);
      toast.error('Failed to load deactivation requests');
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const getOnboardingStatusBadge = (status: OnboardingStatus) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline" className="border-muted-foreground text-muted-foreground">Draft</Badge>;
      case "in_progress":
        return <Badge className="bg-warning/20 text-warning border-warning/30">In Progress</Badge>;
      case "submitted":
        return <Badge className="bg-info/20 text-info border-info/30">Submitted</Badge>;
      case "pending_approval":
        return <Badge variant="outline" className="border-accent text-accent">Pending Approval</Badge>;
      case "approved":
        return <Badge className="bg-success/20 text-success border-success/30">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Rejected</Badge>;
      case "deactivated":
        return <Badge variant="outline" className="text-muted-foreground border-muted-foreground">Deactivated</Badge>;
      case "terminated":
        return <Badge className="bg-red-500/20 text-red-700 border-red-500/30">Terminated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getEmployeeStatusBadge = (status: EmployeeStatus) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success/20 text-success border-success/30">Active</Badge>;
      case "deactivation_pending":
        return <Badge className="bg-warning/20 text-warning border-warning/30">Deactivation Pending</Badge>;
      case "deactivated":
        return <Badge variant="outline" className="text-muted-foreground border-muted-foreground">Deactivated</Badge>;
      case "terminated":
        return <Badge className="bg-red-500/20 text-red-700 border-red-500/30">Terminated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredOnboardings = onboardings;

  const filteredEmployees = employees;

  const handleDeactivateRequest = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowDeactivateModal(true);
  };

  const handleViewOnboardingDetails = (onboarding: Onboarding) => {
    setSelectedOnboarding(onboarding);
    setShowOnboardingDetailModal(true);
  };

  const confirmDeactivation = async () => {
    if (!selectedEmployee || !deactivateReason.trim()) return;

    try {
      const res = await apiService.requestEmployeeDeactivation(selectedEmployee.id, deactivateReason);
      if (res.success) {
        toast.success(res.message || `Deactivation request sent for ${selectedEmployee.name}. Waiting for Field Coach approval.`);
        setShowDeactivateModal(false);
        setSelectedEmployee(null);
        setDeactivateReason("");
        // Reload employees to reflect new status
        await loadEmployees();
      }
    } catch (error: any) {
      console.error('Error requesting deactivation:', error);
      toast.error(error.message || 'Failed to submit deactivation request');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <div className="flex items-center justify-center">
              <img src="public/burgersingh-logo.png" className="h-14 w-14" alt="" />
            </div>
          <div className="flex-1">
            <h1 className="font-semibold text-foreground">{t("dashboard.outletDashboard")}</h1>
            <p className="text-xs text-muted-foreground">
              {user?.storeName} ({user?.storeCode}) • {user?.name}
            </p>
          </div>
          <LanguageToggle />
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card-elevated p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-foreground">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalOnboardings}</p>
                <p className="text-xs text-muted-foreground">{t("dashboard.totalOnboardings")}</p>
              </div>
            </div>
          </div>
          <div className="card-elevated p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-warning">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.inProgress}</p>
                <p className="text-xs text-muted-foreground">{t("dashboard.inProgress")}</p>
              </div>
            </div>
          </div>
          <div className="card-elevated p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-accent">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.pendingApproval}</p>
                <p className="text-xs text-muted-foreground">{t("dashboard.pendingApprovals")}</p>
              </div>
            </div>
          </div>
          <div className="card-elevated p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-success">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">{t("dashboard.completed")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <TabsList className="bg-card border">
              <TabsTrigger value="onboarding">{t("dashboard.onboarding")}</TabsTrigger>
              <TabsTrigger value="employees">
                {t("dashboard.employees")}
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-muted rounded-full">{employees.length}</span>
              </TabsTrigger>
              <TabsTrigger value="deactivation">
                <UserX className="w-3 h-3 mr-1" />
                {t("dashboard.deactivation")}
              </TabsTrigger>
            </TabsList>
            
            <Button onClick={() => navigate("/")} className="bg-gradient-accent shadow-glow-accent">
              <Plus className="w-4 h-4 mr-2" />
              {t("dashboard.startNewOnboarding")}
            </Button>
          </div>

          {/* Search */}
          <div className="card-elevated p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("dashboard.searchByName")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Onboarding Tab */}
          <TabsContent value="onboarding" className="space-y-3 mt-0">
            <h2 className="font-semibold text-foreground">{t("dashboard.recentOnboardings")}</h2>
            {filteredOnboardings.map((item) => (
              <div 
                key={item.id} 
                className="card-elevated p-4 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => handleViewOnboardingDetails(item)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{item.name}</h3>
                      {getOnboardingStatusBadge(item.status)}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>{item.role}</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {item.outlet}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.startedAt}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Employees Tab */}
          <TabsContent value="employees" className="space-y-3 mt-0">
            <h2 className="font-semibold text-foreground">{t("dashboard.storeEmployees")}</h2>
            {filteredEmployees.map((emp) => (
              <div key={emp.id} className="card-elevated p-4 hover:shadow-lg transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{emp.name}</h3>
                      {getEmployeeStatusBadge(emp.status)}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>{emp.role}</span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {emp.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {t("dashboard.joined")}: {emp.dateOfJoining}
                      </span>
                    </div>
                  </div>
                  {emp.status === "active" && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => handleDeactivateRequest(emp)}
                    >
                      <UserX className="w-4 h-4 mr-1" />
                      {t("dashboard.deactivate")}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Deactivation Tab */}
          <TabsContent value="deactivation" className="space-y-3 mt-0">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <h2 className="font-semibold text-foreground">{t("dashboard.deactivationRequests")}</h2>
            </div>
            
            {loading ? (
              <div className="card-elevated p-8 text-center text-muted-foreground">
                {t("common.loading")}
              </div>
            ) : deactivationRequests.length === 0 ? (
              <div className="card-elevated p-8 text-center text-muted-foreground">
                {t("dashboard.noPendingRequests")}
              </div>
            ) : (
              deactivationRequests.map((emp) => (
                <div key={emp.id} className="card-elevated p-4 border-l-4 border-l-warning">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
                      <UserX className="w-6 h-6 text-warning" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{emp.name}</h3>
                        {getEmployeeStatusBadge(emp.status)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t("dashboard.waitingApproval")}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Onboarding Detail Modal */}
      <Dialog open={showOnboardingDetailModal} onOpenChange={setShowOnboardingDetailModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("dashboard.onboardingDetails")}</DialogTitle>
            <DialogDescription>{t("dashboard.completeInfo")} {selectedOnboarding?.name}</DialogDescription>
          </DialogHeader>
          
          {selectedOnboarding && (
            <div className="space-y-4 mt-4">
              {/* Basic Information */}
              <div className="space-y-3 p-4 border rounded-lg">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {t("dashboard.basicInformation")}
                </h4>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t("dashboard.fullName")}:</span> 
                    <span className="font-medium ml-2">{selectedOnboarding.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("dashboard.role")}:</span> 
                    <span className="font-medium ml-2">{selectedOnboarding.role}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("dashboard.outlet")}:</span> 
                    <span className="font-medium ml-2">{selectedOnboarding.outlet}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("dashboard.startedAt")}:</span> 
                    <span className="font-medium ml-2">{selectedOnboarding.startedAt}</span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-3 p-4 border rounded-lg">
                <h4 className="font-semibold text-foreground">{t("dashboard.currentStatus")}</h4>
                <div>
                  {getOnboardingStatusBadge(selectedOnboarding.status)}
                  <p className="text-sm text-muted-foreground mt-2">
                    {selectedOnboarding.status === "draft" && t("dashboard.statusDraft")}
                    {selectedOnboarding.status === "in_progress" && t("dashboard.statusInProgress")}
                    {selectedOnboarding.status === "submitted" && t("dashboard.statusSubmitted")}
                    {selectedOnboarding.status === "pending_approval" && t("dashboard.statusPendingApproval")}
                    {selectedOnboarding.status === "approved" && t("dashboard.statusApproved")}
                    {selectedOnboarding.status === "rejected" && t("dashboard.statusRejected")}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                <h4 className="font-semibold text-foreground">{t("dashboard.nextSteps")}</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedOnboarding.status === "draft" && t("dashboard.nextStepDraft")}
                  {selectedOnboarding.status === "in_progress" && t("dashboard.nextStepInProgress")}
                  {selectedOnboarding.status === "submitted" && t("dashboard.nextStepSubmitted")}
                  {selectedOnboarding.status === "pending_approval" && t("dashboard.nextStepPendingApproval")}
                  {selectedOnboarding.status === "approved" && t("dashboard.nextStepApproved")}
                  {selectedOnboarding.status === "rejected" && t("dashboard.nextStepRejected")}
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOnboardingDetailModal(false)}>
              {t("dashboard.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivation Modal */}
      <Dialog open={showDeactivateModal} onOpenChange={setShowDeactivateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dashboard.requestDeactivation")}</DialogTitle>
            <DialogDescription>
              {t("dashboard.submitDeactivation")} {selectedEmployee?.name}. {t("dashboard.sentToCoach")}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="text-sm font-medium text-foreground mb-2 block">
              {t("dashboard.reasonForDeactivation")} *
            </label>
            <Textarea
              placeholder={t("dashboard.enterReason")}
              value={deactivateReason}
              onChange={(e) => setDeactivateReason(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDeactivateModal(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={confirmDeactivation}
              className="bg-destructive hover:bg-destructive/90"
              disabled={!deactivateReason.trim()}
            >
              {t("dashboard.submitRequest")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerDashboard;