import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/lib/api";
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter,
  ChevronRight,
  User,
  Phone,
  MapPin,
  Calendar,
  ArrowLeft,
  MoreVertical,
  Eye,
  Check,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ApplicationStatus = "pending" | "approved" | "rejected";

interface Application {
  id: string;
  name: string;
  phone: string;
  role: string;
  outlet: string;
  submittedAt: string;
  status: ApplicationStatus;
  aadhaarVerified: boolean;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingReview: 0,
    approved: 0,
    rejected: 0
  });
  const [applications, setApplications] = useState<Application[]>([]);
  const [filter, setFilter] = useState<ApplicationStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionType, setDecisionType] = useState<"approve" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Debounced search and filter
  useEffect(() => {
    const timer = setTimeout(() => {
      loadApplications();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStats(),
        loadApplications()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await apiService.getDashboardStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadApplications = async () => {
    try {
      const res = await apiService.getDashboardApplications(search, filter);
      if (res.success) {
        setApplications(res.data);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
      toast.error('Failed to load applications');
    }
  };

  const handleDecision = (app: Application, type: "approve" | "reject") => {
    setSelectedApp(app);
    setDecisionType(type);
    setShowDecisionModal(true);
  };

  const confirmDecision = async () => {
    if (!selectedApp || !decisionType) return;

    try {
      if (decisionType === "approve") {
        const res = await apiService.approveDashboardApplication(selectedApp.id);
        if (res.success) {
          toast.success(res.message || `${selectedApp.name}'s application approved!`);
        }
      } else {
        if (!rejectionReason.trim()) {
          toast.error('Please provide a rejection reason');
          return;
        }
        const res = await apiService.rejectDashboardApplication(selectedApp.id, rejectionReason);
        if (res.success) {
          toast.success(res.message || `${selectedApp.name}'s application rejected`);
        }
      }

      setShowDecisionModal(false);
      setSelectedApp(null);
      setDecisionType(null);
      setRejectionReason("");
      
      // Reload data
      await Promise.all([loadStats(), loadApplications()]);
    } catch (error: any) {
      console.error('Error processing decision:', error);
      toast.error(error.message || 'Failed to process decision');
    }
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case "pending":
        return <Badge className="badge-warning">Pending</Badge>;
      case "approved":
        return <Badge className="badge-success">Approved</Badge>;
      case "rejected":
        return <Badge className="badge-error">Rejected</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold text-foreground">Field Coach Dashboard</h1>
            <p className="text-xs text-muted-foreground">Review and approve applications</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
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
                <p className="text-2xl font-bold text-foreground">{stats.totalApplications}</p>
                <p className="text-xs text-muted-foreground">Total Applications</p>
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
                <p className="text-xs text-muted-foreground">Pending Review</p>
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
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </div>
          </div>
          <div className="card-elevated p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-destructive">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.rejected}</p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card-elevated p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or outlet..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              {(["all", "pending", "approved", "rejected"] as const).map((status) => (
                <Button
                  key={status}
                  variant={filter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(status)}
                  className={cn(
                    "capitalize",
                    filter === status && status === "pending" && "bg-warning text-warning-foreground",
                    filter === status && status === "approved" && "bg-success text-success-foreground",
                    filter === status && status === "rejected" && "bg-destructive text-destructive-foreground"
                  )}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-3">
          {loading ? (
            <div className="card-elevated p-12 text-center">
              <p className="text-muted-foreground">Loading applications...</p>
            </div>
          ) : applications.length > 0 ? (
            applications.map((app) => (
              <div 
                key={app.id} 
                className="card-elevated p-4 hover:shadow-lg transition-all duration-200"
              >
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
                        <MapPin className="w-3 h-3" />
                        {app.outlet}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {app.submittedAt}
                      </span>
                    </div>

                    {app.aadhaarVerified && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-success">
                        <CheckCircle className="w-3 h-3" />
                        Aadhaar Verified
                      </div>
                    )}
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
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          ) : (
            <div className="card-elevated p-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No applications found</p>
            </div>
          )}
        </div>
      </main>

      {/* Decision Modal */}
      <Dialog open={showDecisionModal} onOpenChange={setShowDecisionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decisionType === "approve" ? "Approve Application" : "Reject Application"}
            </DialogTitle>
            <DialogDescription>
              {decisionType === "approve" 
                ? `Are you sure you want to approve ${selectedApp?.name}'s application? They will receive LMS access.`
                : `Please provide a reason for rejecting ${selectedApp?.name}'s application.`
              }
            </DialogDescription>
          </DialogHeader>

          {decisionType === "reject" && (
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDecisionModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmDecision}
              className={decisionType === "approve" ? "bg-success hover:bg-success/90" : "bg-destructive hover:bg-destructive/90"}
              disabled={decisionType === "reject" && !rejectionReason.trim()}
            >
              {decisionType === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
