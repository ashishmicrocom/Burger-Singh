import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, Clock, CheckCircle, XCircle, Search, User, Phone, 
  MapPin, Calendar, LogOut, MoreVertical, Eye, Check, X,
  UserX, FileText, Mail, AlertTriangle, Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DocumentPreview } from "@/components/DocumentPreview";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { apiService } from "@/lib/api";

type ApplicationStatus = "pending" | "approved" | "rejected" | "deactivated" | "terminated";
type DeactivationStatus = "pending" | "approved" | "rejected";

interface Application {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  outlet: string;
  outletCode: string;
  submittedAt: string;
  status: ApplicationStatus;
  aadhaarVerified: boolean;
  panVerified: boolean;
  dateOfBirth: string;
  qualification: string;
  
  // Additional fields from 7-step form
  gender?: string;
  phone2?: string;
  phoneOtpVerified?: boolean;
  emailOtpVerified?: boolean;
  currentAddress?: string;
  permanentAddress?: string;
  specialization?: string;
  educationStatus?: string;
  totalExperience?: string;
  lastDesignation?: string;
  maritalStatus?: string;
  bloodGroup?: string;
  tshirtSize?: string;
  lowerSize?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  covidVaccinated?: boolean;
  hepatitisVaccinated?: boolean;
  typhoidVaccinated?: boolean;
  designation?: string;
  dateOfJoining?: string;
  fieldCoach?: string;
  department?: string;
  storeName?: string;
  
  // Employment History
  hasEmploymentHistory?: boolean;
  previousEmployment?: Array<{
    role: string;
    outlet: {
      name: string;
      code: string;
    };
    joinDate: string;
    endDate: string;
    terminationReason?: string;
  }>;
  
  // Documents
  photo?: any;
  educationCertificate?: any;
  experienceDocument?: any;
  idDocuments?: any;
  panDocument?: any;
  certificates?: any;
}

interface DeactivationRequest {
  id: string;
  employeeName: string;
  employeePhone: string;
  role: string;
  outlet: string;
  requestedBy: string;
  requestedAt: string;
  reason: string;
  status: DeactivationStatus;
}

const FieldCoachDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [deactivations, setDeactivations] = useState<DeactivationRequest[]>([]);
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingReview: 0,
    approved: 0,
    deactivationRequests: 0
  });
  const [filter, setFilter] = useState<ApplicationStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [selectedDeactivation, setSelectedDeactivation] = useState<DeactivationRequest | null>(null);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [showDeactivationModal, setShowDeactivationModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [decisionType, setDecisionType] = useState<"approve" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [activeTab, setActiveTab] = useState("onboarding");

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Reload applications when filters change
  useEffect(() => {
    if (activeTab === "onboarding") {
      const timer = setTimeout(() => {
        loadApplications();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [search, filter, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, applicationsRes, deactivationsRes] = await Promise.all([
        apiService.getFieldCoachStats(),
        apiService.getFieldCoachApplications({ status: filter, search }),
        apiService.getFieldCoachDeactivations()
      ]);
      
      setStats(statsRes.stats);
      setApplications(applicationsRes.applications);
      setDeactivations(deactivationsRes.deactivations);
    } catch (error: any) {
      console.error("Load data error:", error);
      toast.error(error.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async () => {
    try {
      const response = await apiService.getFieldCoachApplications({ status: filter, search });
      setApplications(response.applications);
    } catch (error: any) {
      console.error("Load applications error:", error);
      toast.error(error.message || "Failed to load applications");
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const filteredApps = applications;

  const handleDecision = (app: Application, type: "approve" | "reject") => {
    setSelectedApp(app);
    setDecisionType(type);
    setShowDecisionModal(true);
  };

  const confirmDecision = async () => {
    if (!selectedApp || !decisionType) return;

    try {
      if (decisionType === "approve") {
        await apiService.approveFieldCoachApplication(selectedApp.id);
        toast.success(`${selectedApp.name}'s application approved! LMS account will be created.`);
      } else {
        if (!rejectionReason.trim()) {
          toast.error("Please provide a rejection reason");
          return;
        }
        await apiService.rejectFieldCoachApplication(selectedApp.id, rejectionReason);
        toast.info(`${selectedApp.name}'s application rejected. Notification sent to store.`);
      }

      // Reload data
      await loadData();
      
      setShowDecisionModal(false);
      setSelectedApp(null);
      setDecisionType(null);
      setRejectionReason("");
    } catch (error: any) {
      toast.error(error.message || `Failed to ${decisionType} application`);
    }
  };

  const handleDeactivationDecision = (deactivation: DeactivationRequest, type: "approve" | "reject") => {
    setSelectedDeactivation(deactivation);
    setDecisionType(type);
    setShowDeactivationModal(true);
  };

  const confirmDeactivationDecision = async () => {
    if (!selectedDeactivation || !decisionType) return;

    try {
      if (decisionType === "approve") {
        await apiService.approveDeactivation(selectedDeactivation.id);
        toast.success(`Deactivation approved for ${selectedDeactivation.employeeName}. Employee has been deactivated.`);
      } else {
        await apiService.rejectDeactivation(selectedDeactivation.id, rejectionReason);
        toast.info(`Deactivation rejected for ${selectedDeactivation.employeeName}.`);
      }

      // Reload data to reflect changes
      await loadData();

      setShowDeactivationModal(false);
      setSelectedDeactivation(null);
      setDecisionType(null);
      setRejectionReason("");
    } catch (error: any) {
      console.error("Deactivation decision error:", error);
      toast.error(error.message || "Failed to process deactivation request");
    }
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-warning/20 text-warning border-warning/30">Pending</Badge>;
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

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <div className="flex items-center justify-center">
              <img src="public/burgersingh-logo.png" className="h-14 w-14" alt="" />
            </div>
          <div className="flex-1">
            <h1 className="font-semibold text-foreground">{t("dashboard.fieldCoachDashboard")}</h1>
            <p className="text-xs text-muted-foreground">{t("dashboard.welcome")}, {user?.name}</p>
          </div>
          <LanguageToggle />
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card-elevated p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-foreground">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalApplications}</p>
                <p className="text-xs text-muted-foreground">{t("dashboard.totalApplications")}</p>
              </div>
            </div>
          </div>
          <div className="card-elevated p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-warning">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.pendingReview}</p>
                <p className="text-xs text-muted-foreground">{t("dashboard.pendingReview")}</p>
              </div>
            </div>
          </div>
          <div className="card-elevated p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-success">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.approved}</p>
                <p className="text-xs text-muted-foreground">{t("dashboard.approved")}</p>
              </div>
            </div>
          </div>
          <div className="card-elevated p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-destructive">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.deactivationRequests}</p>
                <p className="text-xs text-muted-foreground">{t("dashboard.deactivationRequests")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-card border">
            <TabsTrigger value="onboarding">
              {t("dashboard.onboardingApprovals")}
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-warning/20 text-warning rounded-full">
                {stats.pendingReview}
              </span>
            </TabsTrigger>
            <TabsTrigger value="deactivation">
              <UserX className="w-3 h-3 mr-1" />
              {t("dashboard.deactivationRequests")}
              {stats.deactivationRequests > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-destructive/20 text-destructive rounded-full">
                  {stats.deactivationRequests}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Onboarding Tab */}
          <TabsContent value="onboarding" className="mt-0 space-y-4">
            {/* Filters */}
            <div className="card-elevated p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={t("dashboard.searchByNamePhoneOutlet")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {(["all", "pending", "approved", "rejected"] as const).map((status) => (
                    <Button
                      key={status}
                      variant={filter === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilter(status)}
                      className="capitalize"
                    >
                      {t(`dashboard.${status}`)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Applications */}
            <div className="space-y-3">
              {filteredApps.map((app) => (
                <div key={app.id} className="card-elevated p-4 hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-semibold text-foreground">{app.name}</h3>
                          <p className="text-sm text-muted-foreground">{app.role}</p>
                        </div>
                        {getStatusBadge(app.status)}
                      </div>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {app.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {app.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {app.outlet}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {app.submittedAt}
                        </span>
                      </div>

                      <div className="flex gap-2 mt-2">
                        {app.aadhaarVerified && (
                          <span className="text-xs text-success flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            {t("dashboard.aadhaarVerified")}
                          </span>
                        )}
                        {app.panVerified && (
                          <span className="text-xs text-success flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            {t("dashboard.panVerified")}
                          </span>
                        )}
                        {!app.aadhaarVerified && (
                          <span className="text-xs text-destructive flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            {t("dashboard.aadhaarNotVerified")}
                          </span>
                        )}
                      </div>
                    </div>

                    {app.status === "pending" && (
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-success border-success/30 hover:bg-success/10"
                          onClick={() => handleDecision(app, "approve")}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => handleDecision(app, "reject")}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border shadow-lg">
                        <DropdownMenuItem onClick={() => {
                          setSelectedApp(app);
                          setShowDetailModal(true);
                        }}>
                          <Eye className="w-4 h-4 mr-2" />
                          {t("dashboard.viewFullDetails")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedApp(app);
                          setShowDocumentsModal(true);
                        }}>
                          <FileText className="w-4 h-4 mr-2" />
                          {t("dashboard.viewDocuments")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Deactivation Tab */}
          <TabsContent value="deactivation" className="mt-0 space-y-4">
            {deactivations.filter(d => d.status === "pending").length === 0 ? (
              <div className="card-elevated p-8 text-center text-muted-foreground">
                {t("dashboard.noPendingRequests")}
              </div>
            ) : (
              <div className="space-y-3">
                {deactivations.filter(d => d.status === "pending").map((deactivation) => (
                  <div key={deactivation.id} className="card-elevated p-4 border-l-4 border-l-destructive">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                        <UserX className="w-6 h-6 text-destructive" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h3 className="font-semibold text-foreground">{deactivation.employeeName}</h3>
                            <p className="text-sm text-muted-foreground">{deactivation.role} • {deactivation.outlet}</p>
                          </div>
                          <Badge className="bg-warning/20 text-warning border-warning/30">Pending</Badge>
                        </div>
                        
                        <div className="text-xs text-muted-foreground mb-2">
                          <p><span className="font-medium">{t("dashboard.requestedBy")}:</span> {deactivation.requestedBy}</p>
                          <p><span className="font-medium">{t("dashboard.date")}:</span> {deactivation.requestedAt}</p>
                        </div>
                        
                        <div className="p-3 bg-muted/50 rounded-lg text-sm">
                          <p className="font-medium text-foreground mb-1">{t("dashboard.reason")}:</p>
                          <p className="text-muted-foreground">{deactivation.reason}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          className="bg-success hover:bg-success/90"
                          onClick={() => handleDeactivationDecision(deactivation, "approve")}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          {t("dashboard.approve")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => handleDeactivationDecision(deactivation, "reject")}
                        >
                          <X className="w-4 h-4 mr-1" />
                          {t("dashboard.reject")}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Onboarding Decision Modal */}
      <Dialog open={showDecisionModal} onOpenChange={setShowDecisionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decisionType === "approve" ? t("dashboard.approveApplication") : t("dashboard.rejectApplication")}
            </DialogTitle>
            <DialogDescription>
              {decisionType === "approve" 
                ? t("dashboard.approvingCreatesLMS").replace("{name}", selectedApp?.name || "")
                : t("dashboard.provideRejectionReason").replace("{name}", selectedApp?.name || "")
              }
            </DialogDescription>
          </DialogHeader>

          {decisionType === "reject" && (
            <Textarea
              placeholder={t("dashboard.enterRejectionReason")}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDecisionModal(false)}>
              {t("dashboard.cancel")}
            </Button>
            <Button
              onClick={confirmDecision}
              className={decisionType === "approve" ? "bg-success hover:bg-success/90" : "bg-destructive hover:bg-destructive/90"}
              disabled={decisionType === "reject" && !rejectionReason.trim()}
            >
              {decisionType === "approve" ? t("dashboard.approveAndCreateLMS") : t("dashboard.reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivation Decision Modal */}
      <Dialog open={showDeactivationModal} onOpenChange={setShowDeactivationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decisionType === "approve" ? t("dashboard.approveDeactivation") : t("dashboard.rejectDeactivation")}
            </DialogTitle>
            <DialogDescription>
              {decisionType === "approve" 
                ? t("dashboard.approvingDeactivatesLMS").replace("{name}", selectedDeactivation?.employeeName || "")
                : t("dashboard.rejectingKeepsActive").replace("{name}", selectedDeactivation?.employeeName || "")
              }
            </DialogDescription>
          </DialogHeader>

          {decisionType === "reject" && (
            <Textarea
              placeholder={t("dashboard.enterReasonForRejection")}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDeactivationModal(false)}>
              {t("dashboard.cancel")}
            </Button>
            <Button
              onClick={confirmDeactivationDecision}
              className={decisionType === "approve" ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"}
              disabled={decisionType === "reject" && !rejectionReason.trim()}
            >
              {decisionType === "approve" ? t("dashboard.approveDeactivation") : t("dashboard.reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Application Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("dashboard.completeApplicationDetails")}</DialogTitle>
            <DialogDescription>{t("dashboard.fullInformationFor")} {selectedApp?.name}</DialogDescription>
          </DialogHeader>
          
          {selectedApp && (
            <div className="space-y-6 mt-4">
              {/* Personal Information */}
              <div className="space-y-3 p-4 border rounded-lg">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {t("dashboard.personalInformation")}
                </h4>
                <div className="grid md:grid-cols-3 gap-3 text-sm">
                  <div><span className="text-muted-foreground">{t("dashboard.fullName")}:</span> <span className="font-medium">{selectedApp.name}</span></div>
                  <div><span className="text-muted-foreground">{t("dashboard.gender")}:</span> <span className="font-medium capitalize">{selectedApp.gender && selectedApp.gender !== '' ? selectedApp.gender : <span className="text-muted-foreground">{t("dashboard.notProvided")}</span>}</span></div>
                  <div><span className="text-muted-foreground">{t("dashboard.dateOfBirth")}:</span> <span className="font-medium">{selectedApp.dateOfBirth && selectedApp.dateOfBirth !== '' ? selectedApp.dateOfBirth : <span className="text-muted-foreground">{t("dashboard.notProvided")}</span>}</span></div>
                  <div><span className="text-muted-foreground">{t("dashboard.maritalStatus")}:</span> <span className="font-medium capitalize">{selectedApp.maritalStatus && selectedApp.maritalStatus !== '' ? selectedApp.maritalStatus : <span className="text-muted-foreground">{t("dashboard.notProvided")}</span>}</span></div>
                  <div><span className="text-muted-foreground">{t("dashboard.bloodGroup")}:</span> <span className="font-medium">{selectedApp.bloodGroup && selectedApp.bloodGroup !== '' ? selectedApp.bloodGroup : <span className="text-muted-foreground">{t("dashboard.notProvided")}</span>}</span></div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="space-y-3 p-4 border rounded-lg">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {t("dashboard.contactInformation")}
                </h4>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t("dashboard.phone1")}:</span> <span className="font-medium">{selectedApp.phone}</span>
                    {selectedApp.phoneOtpVerified && <span className="ml-2 text-xs text-success">✓ {t("dashboard.verified")}</span>}
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("dashboard.phone2")}: </span> 
                    <span className="font-medium">{selectedApp.phone2 && selectedApp.phone2 !== '' ? selectedApp.phone2 : <span className="text-muted-foreground">{t("dashboard.notProvided")}</span>}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("dashboard.email")}:</span> <span className="font-medium">{selectedApp.email}</span>
                    {selectedApp.emailOtpVerified && <span className="ml-2 text-xs text-success">✓ {t("dashboard.verified")}</span>}
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-muted-foreground">{t("dashboard.currentAddress")}:</span>
                    <p className="font-medium">{selectedApp.currentAddress && selectedApp.currentAddress !== '' ? selectedApp.currentAddress : <span className="text-muted-foreground">{t("dashboard.notProvided")}</span>}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-muted-foreground">{t("dashboard.permanentAddress")}:</span>
                    <p className="font-medium">{selectedApp.permanentAddress && selectedApp.permanentAddress !== '' ? selectedApp.permanentAddress : <span className="text-muted-foreground">{t("dashboard.notProvided")}</span>}</p>
                  </div>
                </div>
              </div>

              {/* Education Details */}
              <div className="space-y-3 p-4 border rounded-lg">
                <h4 className="font-semibold text-foreground">{t("dashboard.education")}</h4>
                <div className="grid md:grid-cols-3 gap-3 text-sm">
                  <div><span className="text-muted-foreground">{t("dashboard.qualification")}:</span> <span className="font-medium">{selectedApp.qualification}</span></div>
                  <div><span className="text-muted-foreground">{t("dashboard.specialization")}:</span> <span className="font-medium">{selectedApp.specialization && selectedApp.specialization !== '' ? selectedApp.specialization : <span className="text-muted-foreground">{t("dashboard.notProvided")}</span>}</span></div>
                  <div><span className="text-muted-foreground">{t("dashboard.educationStatus")}:</span> <span className="font-medium capitalize">{selectedApp.educationStatus && selectedApp.educationStatus !== '' ? selectedApp.educationStatus : <span className="text-muted-foreground">{t("dashboard.notProvided")}</span>}</span></div>
                </div>
              </div>

              {/* Work Experience */}
              <div className="space-y-3 p-4 border rounded-lg">
                <h4 className="font-semibold text-foreground">{t("dashboard.workExperience")}</h4>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">{t("dashboard.totalExperience")}:</span> <span className="font-medium">{selectedApp.totalExperience && selectedApp.totalExperience !== '' ? `${selectedApp.totalExperience} ${t("dashboard.years")}` : <span className="text-muted-foreground">{t("dashboard.notProvided")}</span>}</span></div>
                  <div><span className="text-muted-foreground">{t("dashboard.lastDesignation")}:</span> <span className="font-medium">{selectedApp.lastDesignation && selectedApp.lastDesignation !== '' ? selectedApp.lastDesignation : <span className="text-muted-foreground">{t("dashboard.notProvided")}</span>}</span></div>
                </div>
              </div>

              {/* Employment Details */}
              <div className="space-y-3 p-4 border rounded-lg">
                <h4 className="font-semibold text-foreground">{t("dashboard.employmentDetails")}</h4>
                <div className="grid md:grid-cols-3 gap-3 text-sm">
                  <div><span className="text-muted-foreground">{t("dashboard.role")}:</span> <span className="font-medium">{selectedApp.role}</span></div>
                  {/* <div><span className="text-muted-foreground">Designation:</span> <span className="font-medium">{selectedApp.designation && selectedApp.designation !== '' ? selectedApp.designation : <span className="text-muted-foreground">Not Provided</span>}</span></div>
                  <div><span className="text-muted-foreground">Department:</span> <span className="font-medium capitalize">{selectedApp.department && selectedApp.department !== '' ? selectedApp.department : <span className="text-muted-foreground">Not Provided</span>}</span></div> */}
                  <div><span className="text-muted-foreground">{t("dashboard.store")}:</span> <span className="font-medium">{selectedApp.outlet}</span></div>
                  <div><span className="text-muted-foreground">{t("dashboard.storeCode")}:</span> <span className="font-medium">{selectedApp.outletCode}</span></div>
                  <div><span className="text-muted-foreground">{t("dashboard.storeName")}:</span> <span className="font-medium">{selectedApp.storeName && selectedApp.storeName !== '' ? selectedApp.storeName : <span className="text-muted-foreground">{t("dashboard.notProvided")}</span>}</span></div>
                  <div><span className="text-muted-foreground">{t("dashboard.dateOfJoining")}:</span> <span className="font-medium">{selectedApp.dateOfJoining && selectedApp.dateOfJoining !== '' ? selectedApp.dateOfJoining : <span className="text-muted-foreground">{t("dashboard.notProvided")}</span>}</span></div>
                  <div><span className="text-muted-foreground">{t("dashboard.fieldCoach")}:</span> <span className="font-medium">{selectedApp.fieldCoach && selectedApp.fieldCoach !== '' ? selectedApp.fieldCoach : <span className="text-muted-foreground">{t("dashboard.notProvided")}</span>}</span></div>
                  <div><span className="text-muted-foreground">{t("dashboard.appliedOn")}:</span> <span className="font-medium">{selectedApp.submittedAt}</span></div>
                </div>
              </div>

              {/* ID Details */}
              <div className="space-y-3 p-4 border rounded-lg">
                <h4 className="font-semibold text-foreground">{t("dashboard.idVerification")}</h4>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">{t("dashboard.aadhaar")}:</span> <span className="font-medium">{selectedApp.aadhaarNumber && selectedApp.aadhaarNumber !== '' ? selectedApp.aadhaarNumber : <span className="text-muted-foreground">{t("dashboard.notProvided")}</span>}</span></div>
                  <div><span className="text-muted-foreground">{t("dashboard.pan")}:</span> <span className="font-medium">{selectedApp.panNumber && selectedApp.panNumber !== '' ? selectedApp.panNumber : <span className="text-muted-foreground">{t("dashboard.notProvided")}</span>}</span></div>
                </div>
                <div className="flex gap-4 mt-2">
                  <span className={cn(
                    "text-sm flex items-center gap-1",
                    selectedApp.aadhaarVerified ? "text-success" : "text-destructive"
                  )}>
                    {selectedApp.aadhaarVerified ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {selectedApp.aadhaarVerified ? t("dashboard.aadhaarVerified") : t("dashboard.aadhaarNotVerified")}
                  </span>
                  {/* <span className={cn(
                    "text-sm flex items-center gap-1",
                    selectedApp.panVerified ? "text-success" : "text-destructive"
                  )}>
                    {selectedApp.panVerified ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    PAN {selectedApp.panVerified ? 'Verified' : 'Not Verified'}
                  </span> */}
                </div>
              </div>

              {/* Uniform & Vaccination */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3 p-4 border rounded-lg">
                  <h4 className="font-semibold text-foreground">{t("dashboard.uniformSize")}</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">{t("dashboard.tshirt")}:</span> <span className="font-medium">{selectedApp.tshirtSize && selectedApp.tshirtSize !== '' ? selectedApp.tshirtSize : <span className="text-muted-foreground">{t("dashboard.notProvided")}</span>}</span></div>
                    <div><span className="text-muted-foreground">{t("dashboard.lower")}:</span> <span className="font-medium">{selectedApp.lowerSize && selectedApp.lowerSize !== '' ? selectedApp.lowerSize : <span className="text-muted-foreground">{t("dashboard.notProvided")}</span>}</span></div>
                  </div>
                </div>
                
                <div className="space-y-3 p-4 border rounded-lg">
                  <h4 className="font-semibold text-foreground">{t("dashboard.vaccinationStatus")}</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      {selectedApp.covidVaccinated ? <CheckCircle className="w-4 h-4 text-success" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
                      <span className={selectedApp.covidVaccinated ? "text-success font-medium" : ""}>{selectedApp.covidVaccinated ? t("dashboard.covidVaccinated") : t("dashboard.covidNotVaccinated")}</span>
                    </div>
                    {/* <div className="flex items-center gap-2">
                      {selectedApp.hepatitisVaccinated ? <CheckCircle className="w-4 h-4 text-success" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
                      <span className={selectedApp.hepatitisVaccinated ? "text-success font-medium" : ""}>Hepatitis {selectedApp.hepatitisVaccinated ? "Vaccinated" : "Not Vaccinated"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedApp.typhoidVaccinated ? <CheckCircle className="w-4 h-4 text-success" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
                      <span className={selectedApp.typhoidVaccinated ? "text-success font-medium" : ""}>Typhoid {selectedApp.typhoidVaccinated ? "Vaccinated" : "Not Vaccinated"}</span>
                    </div> */}
                  </div>
                </div>
              </div>

              {/* Employment History - Show if applicant has previous employment */}
              {selectedApp.hasEmploymentHistory && selectedApp.previousEmployment && selectedApp.previousEmployment.length > 0 && (
                <div className="space-y-3 p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-yellow-700" />
                    <h4 className="font-semibold text-yellow-900">{t("dashboard.previousEmploymentHistory")}</h4>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-white border border-yellow-300 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-yellow-800">
                      {t("dashboard.workedPreviously")}
                    </p>
                  </div>
                  <div className="space-y-3">
                    {selectedApp.previousEmployment.map((employment: any, index: number) => (
                      <div key={index} className="p-3 bg-white border rounded-lg space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-sm">{employment.role}</p>
                            <p className="text-xs text-muted-foreground">{employment.outlet?.name || 'N/A'} ({employment.outlet?.code || 'N/A'})</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Employment #{selectedApp.previousEmployment.length - index}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Start Date:</span>
                            <p className="font-medium">{employment.joinDate ? new Date(employment.joinDate).toLocaleDateString() : 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">End Date:</span>
                            <p className="font-medium">{employment.endDate ? new Date(employment.endDate).toLocaleDateString() : 'N/A'}</p>
                          </div>
                        </div>
                        {employment.terminationReason && (
                          <div className="pt-2 border-t">
                            <span className="text-xs text-muted-foreground">Termination Reason:</span>
                            <p className="text-sm mt-1 text-destructive font-medium">{employment.terminationReason}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Documents Modal */}
      <Dialog open={showDocumentsModal} onOpenChange={setShowDocumentsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Uploaded Documents</DialogTitle>
            <DialogDescription>All documents submitted by {selectedApp?.name}</DialogDescription>
          </DialogHeader>
          
          {selectedApp && (
            <div className="space-y-4 mt-4">
              {selectedApp.photo && (() => {
                // Clean the path - extract just the filename from full paths
                let cleanPath = selectedApp.photo.path;
                
                // If it contains full path, extract just the filename
                if (cleanPath.includes('\\') || cleanPath.includes('/')) {
                  cleanPath = cleanPath.split(/[\\/]/).pop() || cleanPath;
                }
                
                // Ensure it has onboarding/ prefix
                if (!cleanPath.startsWith('onboarding/')) {
                  cleanPath = `onboarding/${cleanPath}`;
                }
                
                const photoUrl = `http://localhost:5000/uploads/${cleanPath}`;
                
                return (
                  <div className="p-4 border rounded-lg space-y-3">
                    <h4 className="font-semibold">Live Photo</h4>
                    <div className="flex flex-col gap-3">
                      <img 
                        src={photoUrl}
                        alt="Live Photo"
                        className="w-full max-w-md rounded-lg border object-cover"
                      />
                      <a 
                        href={photoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        {selectedApp.photo.filename} ({(selectedApp.photo.size / 1024).toFixed(2)} KB) - Click to open full size
                      </a>
                    </div>
                  </div>
                );
              })()}

              {selectedApp.educationCertificate && (
                <DocumentPreview
                  title="Education Certificate"
                  document={selectedApp.educationCertificate}
                />
              )}

              {selectedApp.experienceDocument && (
                <DocumentPreview
                  title="Experience Document"
                  document={selectedApp.experienceDocument}
                />
              )}

              {selectedApp.idDocuments && (
                <DocumentPreview
                  title="ID Documents (Aadhaar/PAN Copy)"
                  document={selectedApp.idDocuments}
                />
              )}

              {selectedApp.panDocument && (
                <DocumentPreview
                  title="PAN Document"
                  document={selectedApp.panDocument}
                />
              )}

              {selectedApp.certificates && (
                <DocumentPreview
                  title="Other Certificates"
                  document={selectedApp.certificates}
                />
              )}

              {!selectedApp.photo && !selectedApp.educationCertificate && !selectedApp.experienceDocument && 
               !selectedApp.idDocuments && !selectedApp.panDocument && !selectedApp.certificates && (
                <div className="p-8 text-center text-muted-foreground border rounded-lg">
                  No documents uploaded
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FieldCoachDashboard;