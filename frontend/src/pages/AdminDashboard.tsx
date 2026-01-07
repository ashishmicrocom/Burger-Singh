import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, Clock, CheckCircle, XCircle, Search, Settings, 
  Building2, TrendingUp, LogOut, BarChart3, Download, Filter,
  Phone, Mail, Calendar, Eye, UserX, RefreshCw, AlertTriangle,
  CreditCard, FileText, MoreVertical, Plus, Trash2, Edit, Shield,
  Home, UserCog, Store, LayoutDashboard, ChevronRight, Menu, X, User, Briefcase, Upload, Link, Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DocumentPreview } from "@/components/DocumentPreview";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { apiService } from "@/lib/api";

// Mock Data
interface StoreData {
  id: string;
  code: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  fieldCoach: string;
  fieldCoachId?: string;
  fieldCoachEmail: string;
  status: "active" | "inactive";
  employeeCount: number;
  createdAt: string;
}

interface RoleData {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  createdAt: string;
}

const INITIAL_STORES: StoreData[] = [
  { id: "1", code: "BS-CP-001", name: "Connaught Place", email: "cp@burgersingh.com", fieldCoach: "Amit Sharma", fieldCoachEmail: "amit@burgersingh.com", status: "active", employeeCount: 24, createdAt: "2023-01-15" },
  { id: "2", code: "BS-CH-002", name: "Cyber Hub", email: "cyberhub@burgersingh.com", fieldCoach: "Ravi Kumar", fieldCoachEmail: "ravi@burgersingh.com", status: "active", employeeCount: 18, createdAt: "2023-03-20" },
  { id: "3", code: "BS-KR-003", name: "Koramangala", email: "koramangala@burgersingh.com", fieldCoach: "Sunita Verma", fieldCoachEmail: "sunita@burgersingh.com", status: "active", employeeCount: 22, createdAt: "2023-05-10" },
  { id: "4", code: "BS-AW-004", name: "Andheri West", email: "andheri@burgersingh.com", fieldCoach: "Amit Sharma", fieldCoachEmail: "amit@burgersingh.com", status: "inactive", employeeCount: 0, createdAt: "2023-08-05" },
];

const INITIAL_ROLES: RoleData[] = [
  { id: "1", name: "Super Admin", description: "Full system access with all permissions", permissions: ["all"], userCount: 2, createdAt: "2023-01-01" },
  { id: "2", name: "Store Manager", description: "Manage store operations and initiate onboarding", permissions: ["view_employees", "initiate_onboarding", "view_store_data"], userCount: 15, createdAt: "2023-01-01" },
  { id: "3", name: "Field Coach", description: "Approve onboarding and deactivation requests", permissions: ["approve_onboarding", "approve_deactivation", "view_assigned_stores"], userCount: 8, createdAt: "2023-01-01" },
  { id: "4", name: "Cook", description: "Kitchen staff role", permissions: ["view_schedule", "mark_attendance"], userCount: 45, createdAt: "2023-02-15" },
  { id: "5", name: "Cashier", description: "Front desk operations", permissions: ["view_schedule", "mark_attendance"], userCount: 32, createdAt: "2023-02-15" },
  { id: "6", name: "Delivery", description: "Delivery personnel", permissions: ["view_schedule", "mark_attendance", "view_orders"], userCount: 28, createdAt: "2023-02-15" },
];

interface Employee {
  id: string;
  name: string;
  phone: string;
  email: string;
  aadhaarNumber: string;
  panNumber: string;
  designation: string;
  store: string;
  storeCode: string;
  fieldCoach: string;
  dateOfJoining: string;
  status: "pending" | "approved" | "rejected" | "active" | "deactivated" | "terminated";
  employeeStatus?: "active" | "deactivation_pending" | "deactivated" | "terminated";
  aadhaarVerified: boolean;
  panVerified: boolean;
  createdAt: string;
  
  // Additional fields from onboarding form
  gender?: string;
  phone2?: string;
  phoneOtpVerified?: boolean;
  emailOtpVerified?: boolean;
  currentAddress?: string;
  permanentAddress?: string;
  qualification?: string;
  specialization?: string;
  educationStatus?: string;
  totalExperience?: string;
  lastDesignation?: string;
  maritalStatus?: string;
  bloodGroup?: string;
  tshirtSize?: string;
  lowerSize?: string;
  covidVaccinated?: boolean;
  hepatitisVaccinated?: boolean;
  typhoidVaccinated?: boolean;
  department?: string;
  storeName?: string;
  dateOfBirth?: string;
  role?: string;
  
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
  
  // Deactivation/Termination Details
  deactivationReason?: string;
  deactivationApprovedAt?: string;
  terminationReason?: string;
  terminatedAt?: string;
  
  // Employee Key
  employeeKey?: string;
}

const MOCK_EMPLOYEES: Employee[] = [
  { id: "1", name: "Rahul Sharma", phone: "+91 98765 43210", email: "rahul@email.com", aadhaarNumber: "XXXX-XXXX-1234", panNumber: "ABCDE1234F", designation: "Cook", store: "Connaught Place", storeCode: "BS-CP-001", fieldCoach: "Amit Sharma", dateOfJoining: "2024-01-15", status: "active", aadhaarVerified: true, panVerified: true, createdAt: "2024-01-10" },
  { id: "2", name: "Priya Patel", phone: "+91 87654 32109", email: "priya@email.com", aadhaarNumber: "XXXX-XXXX-5678", panNumber: "FGHIJ5678K", designation: "Cashier", store: "Cyber Hub", storeCode: "BS-CH-002", fieldCoach: "Ravi Kumar", dateOfJoining: "2024-01-14", status: "pending", aadhaarVerified: true, panVerified: false, createdAt: "2024-01-12" },
  { id: "3", name: "Amit Kumar", phone: "+91 76543 21098", email: "amit.k@email.com", aadhaarNumber: "XXXX-XXXX-9012", panNumber: "KLMNO9012P", designation: "Delivery", store: "Koramangala", storeCode: "BS-KR-003", fieldCoach: "Sunita Verma", dateOfJoining: "2024-01-13", status: "approved", aadhaarVerified: true, panVerified: true, createdAt: "2024-01-08" },
  { id: "4", name: "Neha Singh", phone: "+91 65432 10987", email: "neha@email.com", aadhaarNumber: "XXXX-XXXX-3456", panNumber: "PQRST3456U", designation: "Cook", store: "Andheri West", storeCode: "BS-AW-004", fieldCoach: "Amit Sharma", dateOfJoining: "2024-01-12", status: "rejected", aadhaarVerified: false, panVerified: true, createdAt: "2024-01-05" },
  { id: "5", name: "Vikram Yadav", phone: "+91 54321 09876", email: "vikram@email.com", aadhaarNumber: "", panNumber: "", designation: "Manager", store: "Connaught Place", storeCode: "BS-CP-001", fieldCoach: "Amit Sharma", dateOfJoining: "2023-06-01", status: "active", aadhaarVerified: false, panVerified: false, createdAt: "2023-05-20" },
];

type ActiveSection = "dashboard" | "employees" | "outlets" | "field-coaches" | "roles" | "settings";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  
  // State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<ActiveSection>("dashboard");
  const [loading, setLoading] = useState(false);
  
  // Dashboard stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingApprovals: 0,
    activeOutlets: 0,
    totalRoles: 0
  });
  
  // Data
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stores, setStores] = useState<StoreData[]>([]);
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [fieldCoaches, setFieldCoaches] = useState<any[]>([]);
  
  // Employee filters
  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [coachFilter, setCoachFilter] = useState<string>("all");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [terminationReason, setTerminationReason] = useState("");
  const [deactivationReason, setDeactivationReason] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  // Outlet modals
  const [showAddOutletModal, setShowAddOutletModal] = useState(false);
  const [showEditOutletModal, setShowEditOutletModal] = useState(false);
  const [showDeleteOutletModal, setShowDeleteOutletModal] = useState(false);
  const [showImportOutletModal, setShowImportOutletModal] = useState(false);
  const [selectedOutlet, setSelectedOutlet] = useState<StoreData | null>(null);
  const [newOutlet, setNewOutlet] = useState({ 
    name: "", 
    code: "", 
    email: "", 
    password: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    fieldCoach: "" 
  });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  
  // Export link state
  const [showExportLinkModal, setShowExportLinkModal] = useState(false);
  const [exportLink, setExportLink] = useState("");
  const [exportLinkExpiry, setExportLinkExpiry] = useState("");
  const [generatingLink, setGeneratingLink] = useState(false);
  
  // Role modals
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showDeleteRoleModal, setShowDeleteRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleData | null>(null);
  const [newRole, setNewRole] = useState({ name: "", description: "" });

  // Field Coach state
  const [showAddCoachModal, setShowAddCoachModal] = useState(false);
  const [showEditCoachModal, setShowEditCoachModal] = useState(false);
  const [showDeleteCoachModal, setShowDeleteCoachModal] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<any | null>(null);
  const [newCoach, setNewCoach] = useState({ 
    name: "", 
    email: "", 
    phone: "", 
    password: "",
    assignedOutlets: [] as string[]
  });

  // Load data on mount and section change
  useEffect(() => {
    loadData();
  }, [activeSection]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeSection === "dashboard") {
        const [statsRes, outletsRes, rolesRes] = await Promise.all([
          apiService.getAdminStats(),
          apiService.getOutlets(),
          apiService.getRoles()
        ]);
        console.log('Admin stats loaded:', statsRes.stats);
        setStats(statsRes.stats);
        setStores(outletsRes.outlets);
        setRoles(rolesRes.roles);
      } else if (activeSection === "employees") {
        await loadEmployees();
        const outletsRes = await apiService.getOutlets();
        const coachesRes = await apiService.getFieldCoaches();
        setStores(outletsRes.outlets);
        setFieldCoaches(coachesRes.coaches);
      } else if (activeSection === "outlets") {
        const [outletsRes, coachesRes] = await Promise.all([
          apiService.getOutlets(),
          apiService.getFieldCoaches()
        ]);
        setStores(outletsRes.outlets);
        setFieldCoaches(coachesRes.coaches);
      } else if (activeSection === "roles") {
        const rolesRes = await apiService.getRoles();
        setRoles(rolesRes.roles);
      } else if (activeSection === "field-coaches") {
        const [coachesRes, outletsRes] = await Promise.all([
          apiService.getFieldCoaches(),
          apiService.getOutlets()
        ]);
        setFieldCoaches(coachesRes.coaches);
        setStores(outletsRes.outlets);
      }
    } catch (error: any) {
      console.error("Load data error:", error);
      toast.error(error.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const filters: any = {};
      if (search) filters.search = search;
      if (storeFilter !== "all") filters.store = storeFilter;
      if (statusFilter !== "all") filters.status = statusFilter;
      if (coachFilter !== "all") filters.fieldCoach = coachFilter;
      if (activeTab !== "all") filters.tab = activeTab;

      const response = await apiService.getAllEmployees(filters);
      setEmployees(response.employees);
    } catch (error: any) {
      console.error("Load employees error:", error);
      toast.error(error.message || "Failed to load employees");
    }
  };

  // Reload employees when filters change
  useEffect(() => {
    if (activeSection === "employees") {
      const timer = setTimeout(() => {
        loadEmployees();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [search, storeFilter, statusFilter, coachFilter, activeTab, activeSection]);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  // Calculate pending count
  const pendingCount = employees.filter(emp => emp.status === "pending").length;

  // Employee filtering
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.phone.includes(search) ||
      emp.aadhaarNumber.includes(search) ||
      emp.panNumber.toLowerCase().includes(search.toLowerCase());
    
    const matchesStore = storeFilter === "all" || emp.storeCode === storeFilter;
    const matchesStatus = statusFilter === "all" || emp.status === statusFilter;
    const matchesCoach = coachFilter === "all" || emp.fieldCoach === coachFilter;
    
    let matchesTab = true;
    if (activeTab === "pending") matchesTab = emp.status === "pending";
    if (activeTab === "long-pending") {
      const createdDate = new Date(emp.createdAt);
      const daysSince = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      matchesTab = emp.status === "pending" && daysSince > 5;
    }
    if (activeTab === "missing-docs") matchesTab = !emp.aadhaarVerified || !emp.panVerified;
    if (activeTab === "rehire") matchesTab = emp.status === "deactivated";
    if (activeTab === "terminated") matchesTab = emp.employeeStatus === "terminated";

    return matchesSearch && matchesStore && matchesStatus && matchesCoach && matchesTab;
  });

  const handleExport = async () => {
    try {
      const filters: any = {};
      if (search) filters.search = search;
      if (storeFilter !== "all") filters.store = storeFilter;
      if (statusFilter !== "all") filters.status = statusFilter;
      if (coachFilter !== "all") filters.fieldCoach = coachFilter;
      if (activeTab !== "all") filters.tab = activeTab;

      await apiService.exportEmployeesCSV(filters);
      toast.success("Export downloaded successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to export employees");
    }
  };

  const handleExportUsers = async () => {
    setGeneratingLink(true);
    try {
      const filters: any = {};
      if (search) filters.search = search;
      if (storeFilter !== "all") filters.store = storeFilter;
      if (statusFilter !== "all") filters.status = statusFilter;
      if (coachFilter !== "all") filters.fieldCoach = coachFilter;
      if (activeTab !== "all") filters.tab = activeTab;

      const response = await apiService.generateExportLink(filters);
      setExportLink(response.link);
      setExportLinkExpiry(response.expiresAt);
      setShowExportLinkModal(true);
      toast.success("Export link generated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate export link");
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyExportLink = () => {
    navigator.clipboard.writeText(exportLink);
    toast.success("Link copied to clipboard!");
  };

  const handleTerminateEmployee = async () => {
    if (!selectedEmployee || !terminationReason.trim()) {
      toast.error("Please provide a termination reason");
      return;
    }

    try {
      await apiService.terminateEmployee(selectedEmployee.id, terminationReason);
      toast.success(`${selectedEmployee.name} has been terminated`);
      setShowTerminateModal(false);
      setTerminationReason("");
      setSelectedEmployee(null);
      loadEmployees();
    } catch (error: any) {
      toast.error(error.message || "Failed to terminate employee");
    }
  };

  const handleDeactivateEmployee = async () => {
    if (!selectedEmployee || !deactivationReason.trim()) {
      toast.error("Please provide a deactivation reason");
      return;
    }

    try {
      await apiService.deactivateEmployee(selectedEmployee.id, deactivationReason);
      toast.success(`${selectedEmployee.name} has been deactivated`);
      setShowDeactivateModal(false);
      setDeactivationReason("");
      setSelectedEmployee(null);
      loadEmployees();
    } catch (error: any) {
      toast.error(error.message || "Failed to deactivate employee");
    }
  };

  const handleRehireEmployee = async (employee: Employee) => {
    if (!employee) return;
    
    try {
      await apiService.rehireEmployee(employee.id);
      toast.success(`${employee.name} has been rehired successfully`);
      loadEmployees();
    } catch (error: any) {
      toast.error(error.message || "Failed to rehire employee");
    }
  };

  const getStatusBadge = (status: Employee["status"], employeeStatus?: Employee["employeeStatus"]) => {
    // Prioritize employeeStatus for deactivated and terminated employees
    if (employeeStatus === 'terminated') {
      return <Badge className="bg-red-500/20 text-red-700 border-red-500/30">Terminated</Badge>;
    }
    if (employeeStatus === 'deactivated') {
      return <Badge variant="outline" className="text-muted-foreground">Deactivated</Badge>;
    }
    if (employeeStatus === 'deactivation_pending') {
      return <Badge className="bg-warning/20 text-warning border-warning/30">Deactivation Pending</Badge>;
    }
    
    const badges = {
      pending: <Badge className="bg-warning/20 text-warning border-warning/30">Pending</Badge>,
      approved: <Badge className="bg-success/20 text-success border-success/30">Approved</Badge>,
      rejected: <Badge className="bg-destructive/20 text-destructive border-destructive/30">Rejected</Badge>,
      active: <Badge className="bg-primary/20 text-primary border-primary/30">Active</Badge>,
      deactivated: <Badge variant="outline" className="text-muted-foreground">Deactivated</Badge>,
      terminated: <Badge className="bg-red-500/20 text-red-700 border-red-500/30">Terminated</Badge>,
    };
    return badges[status];
  };

  // Outlet handlers
  const handleAddOutlet = async () => {
    if (!newOutlet.name || !newOutlet.code || !newOutlet.email || !newOutlet.password || !newOutlet.address || !newOutlet.city) {
      toast.error("Please fill all required fields (name, code, email, password, address, city)");
      return;
    }
    
    try {
      await apiService.createOutlet({
        name: newOutlet.name,
        code: newOutlet.code,
        email: newOutlet.email,
        password: newOutlet.password,
        phone: newOutlet.phone,
        address: newOutlet.address,
        city: newOutlet.city,
        state: newOutlet.state,
        pincode: newOutlet.pincode,
        fieldCoach: newOutlet.fieldCoach || undefined
      });
      setNewOutlet({ name: "", code: "", email: "", password: "", phone: "", address: "", city: "", state: "", pincode: "", fieldCoach: "" });
      setShowAddOutletModal(false);
      toast.success("Outlet created successfully!");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to create outlet");
    }
  };

  const handleEditOutlet = async () => {
    if (!selectedOutlet) return;
    
    try {
      await apiService.updateOutlet(selectedOutlet.id, {
        name: newOutlet.name || selectedOutlet.name,
        code: newOutlet.code || selectedOutlet.code,
        email: newOutlet.email || selectedOutlet.email,
        fieldCoach: newOutlet.fieldCoach || undefined
      });
      setShowEditOutletModal(false);
      setSelectedOutlet(null);
      toast.success("Outlet updated successfully!");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to update outlet");
    }
  };

  const handleDeleteOutlet = async () => {
    if (!selectedOutlet) return;
    
    try {
      await apiService.deleteOutlet(selectedOutlet.id);
      setShowDeleteOutletModal(false);
      setSelectedOutlet(null);
      toast.success("Outlet deleted successfully!");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete outlet");
    }
  };

  const handleToggleOutletStatus = async (outletId: string) => {
    try {
      const response = await apiService.toggleOutletStatus(outletId);
      toast.success(response.message || "Outlet status updated successfully!");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to update outlet status");
    }
  };

  const handleImportOutlets = async () => {
    if (!importFile) {
      toast.error("Please select a file to import");
      return;
    }

    if (!importFile.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error("Please upload a valid Excel or CSV file (.xlsx, .xls, or .csv)");
      return;
    }

    setImporting(true);
    try {
      // Dynamically import xlsx library
      const XLSX = await import('xlsx');
      
      // Read the file
      const data = await importFile.arrayBuffer();
      const workbook = XLSX.read(data);
      
      // Get the first sheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      if (jsonData.length === 0) {
        toast.error("The Excel file is empty");
        setImporting(false);
        return;
      }

      // Send to backend for bulk import
      const response = await apiService.bulkImportOutlets(jsonData);
      
      toast.success(`${response.successCount} outlets imported successfully${response.failureCount > 0 ? `, ${response.failureCount} failed` : ''}`);
      
      if (response.errors && response.errors.length > 0) {
        console.log("Import errors:", response.errors);
      }
      
      setShowImportOutletModal(false);
      setImportFile(null);
      loadData();
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error(error.message || "Failed to import outlets");
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleExcel = () => {
    // Create sample data
    const sampleData = [
      {
        code: "BS-DEL-001",
        name: "Delhi Store 1",
        email: "delhi1@burgersingh.com",
        password: "Password@123",
        phone: "+91 9876543210",
        address: "123 Main Street",
        city: "Delhi",
        state: "Delhi",
        pincode: "110001"
      },
      {
        code: "BS-MUM-001",
        name: "Mumbai Store 1",
        email: "mumbai1@burgersingh.com",
        password: "Password@123",
        phone: "+91 9876543211",
        address: "456 Park Road",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001"
      }
    ];

    // Create CSV content
    const headers = "code,name,email,password,phone,address,city,state,pincode\n";
    const rows = sampleData.map(row => 
      `${row.code},${row.name},${row.email},${row.password},${row.phone},"${row.address}",${row.city},${row.state},${row.pincode}`
    ).join("\n");
    
    const csvContent = headers + rows;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'outlet_import_sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Role handlers
  const handleAddRole = async () => {
    if (!newRole.name || !newRole.description) {
      toast.error("Please fill all required fields");
      return;
    }
    
    try {
      await apiService.createRole({
        id: newRole.name.toLowerCase().replace(/\s+/g, '_'),
        title: newRole.name,
        description: newRole.description,
        category: 'employee'
      });
      setNewRole({ name: "", description: "" });
      setShowAddRoleModal(false);
      toast.success("Role created successfully!");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to create role");
    }
  };

  const handleEditRole = async () => {
    if (!selectedRole) return;
    
    try {
      await apiService.updateRole(selectedRole.id, {
        title: newRole.name || selectedRole.name,
        description: newRole.description || selectedRole.description
      });
      setShowEditRoleModal(false);
      setSelectedRole(null);
      toast.success("Role updated successfully!");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to update role");
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;
    
    if (selectedRole.userCount > 0) {
      toast.error("Cannot delete role with active users");
      return;
    }
    
    try {
      await apiService.deleteRole(selectedRole.id);
      setShowDeleteRoleModal(false);
      setSelectedRole(null);
      toast.success("Role deleted successfully!");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete role");
    }
    if (selectedRole.userCount > 0) {
      toast.error("Cannot delete role with active users");
      return;
    }
    setRoles(roles.filter(r => r.id !== selectedRole.id));
    setShowDeleteRoleModal(false);
    setSelectedRole(null);
    toast.success("Role deleted successfully!");
  };

  // Field Coach handlers
  const handleAddCoach = async () => {
    if (!newCoach.name || !newCoach.email || !newCoach.password) {
      toast.error("Please fill all required fields");
      return;
    }
    
    try {
      await apiService.createFieldCoach({
        name: newCoach.name,
        email: newCoach.email,
        phone: newCoach.phone,
        password: newCoach.password,
        assignedOutlets: newCoach.assignedOutlets
      });
      setNewCoach({ name: "", email: "", phone: "", password: "", assignedOutlets: [] });
      setShowAddCoachModal(false);
      toast.success("Field Coach created successfully!");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to create field coach");
    }
  };

  const handleEditCoach = async () => {
    if (!selectedCoach) return;
    
    try {
      await apiService.updateFieldCoach(selectedCoach.id, {
        name: newCoach.name || selectedCoach.name,
        email: newCoach.email || selectedCoach.email,
        phone: newCoach.phone || selectedCoach.phone,
        assignedOutlets: newCoach.assignedOutlets.length > 0 ? newCoach.assignedOutlets : selectedCoach.assignedOutlets
      });
      setShowEditCoachModal(false);
      setSelectedCoach(null);
      toast.success("Field Coach updated successfully!");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to update field coach");
    }
  };

  const handleDeleteCoach = async () => {
    if (!selectedCoach) return;
    
    try {
      await apiService.deleteUser(selectedCoach.id);
      setShowDeleteCoachModal(false);
      setSelectedCoach(null);
      toast.success("Field Coach deleted successfully!");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete field coach");
    }
  };

  const sidebarItems = [
    { id: "dashboard" as ActiveSection, label: t("admin.dashboard"), icon: LayoutDashboard },
    { id: "employees" as ActiveSection, label: t("admin.employees"), icon: Users },
    { id: "outlets" as ActiveSection, label: t("admin.outlets"), icon: Store },
    { id: "field-coaches" as ActiveSection, label: t("admin.fieldCoaches"), icon: UserCog },
    { id: "roles" as ActiveSection, label: t("admin.roles"), icon: Shield },
    { id: "settings" as ActiveSection, label: t("admin.settings"), icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 bg-card border-r transition-all duration-300",
        sidebarOpen ? "w-64" : "w-0 lg:w-16",
        !sidebarOpen && "overflow-hidden"
      )}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="h-16 flex items-center gap-3 px-4 border-b">
            <div className="flex items-center justify-center">
              <img src="public/burgersingh-logo.png" className="h-14 w-14" alt="" />
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <h1 className="font-bold text-foreground truncate">Burger Singh</h1>
                <p className="text-xs text-muted-foreground">{t("admin.superAdmin")}</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                  activeSection === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </button>
            ))}
          </nav>

          {/* User Section */}
          <div className="p-3 border-t">
            <div className={cn("flex items-center gap-3", !sidebarOpen && "justify-center")}>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-primary" />
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              className={cn("w-full mt-3 justify-start", !sidebarOpen && "justify-center px-0")}
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              {sidebarOpen && <span className="ml-2">Logout</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-40 h-16 bg-card border-b flex items-center gap-4 px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="shrink-0"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <div className="flex-1">
            <h2 className="font-semibold text-foreground capitalize">{activeSection}</h2>
            <p className="text-xs text-muted-foreground">
              {activeSection === "dashboard" && "Overview of your system"}
              {activeSection === "employees" && "Manage all employees"}
              {activeSection === "outlets" && "Manage store outlets"}
              {activeSection === "roles" && "Manage user roles"}
              {activeSection === "settings" && "System settings"}
            </p>
          </div>
          <LanguageToggle />
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {/* Dashboard Section */}
          {activeSection === "dashboard" && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card border rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-primary">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? (
                      <span className="animate-pulse">...</span>
                    ) : (
                      stats.totalUsers || 0
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">{t("admin.totalUsers")}</p>
                </div>
                <div className="bg-card border rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-warning">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? (
                      <span className="animate-pulse">...</span>
                    ) : (
                      stats.pendingApprovals || 0
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">{t("admin.pendingApprovals")}</p>
                </div>
                <div className="bg-card border rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-success">
                      <Store className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? (
                      <span className="animate-pulse">...</span>
                    ) : (
                      stats.activeOutlets || 0
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">{t("admin.activeOutlets")}</p>
                </div>
                <div className="bg-card border rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-accent">
                      <Shield className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? (
                      <span className="animate-pulse">...</span>
                    ) : (
                      stats.totalRoles || 0
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">{t("admin.totalRoles")}</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-card border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4">{t("admin.quickActions")}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setActiveSection("outlets")}>
                    <Store className="w-5 h-5" />
                    <span className="text-sm">{t("admin.manageOutlets")}</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setActiveSection("roles")}>
                    <Shield className="w-5 h-5" />
                    <span className="text-sm">{t("admin.manageRoles")}</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setActiveSection("employees")}>
                    <Users className="w-5 h-5" />
                    <span className="text-sm">{t("admin.viewEmployees")}</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={handleExport}>
                    <Download className="w-5 h-5" />
                    <span className="text-sm">{t("admin.exportData")}</span>
                  </Button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-card border rounded-xl p-6">
                  <h3 className="font-semibold text-foreground mb-4">{t("admin.recentOutlets")}</h3>
                  <div className="space-y-3">
                    {stores.slice(0, 4).map((store) => (
                      <div key={store.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium text-foreground">{store.name}</p>
                          <p className="text-xs text-muted-foreground">{store.code}</p>
                        </div>
                        <Badge variant={store.status === "active" ? "default" : "secondary"}>
                          {store.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card border rounded-xl p-6">
                  <h3 className="font-semibold text-foreground mb-4">{t("admin.roleDistribution")}</h3>
                  <div className="space-y-3">
                    {roles.slice(0, 4).map((role) => (
                      <div key={role.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium text-foreground">{role.name}</p>
                          <p className="text-xs text-muted-foreground">{role.description}</p>
                        </div>
                        <Badge variant="outline">{role.userCount} {t("admin.users")}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Employees Section */}
          {activeSection === "employees" && (
            <div className="space-y-6">
              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-card border">
                  <TabsTrigger value="all">{t("admin.allUsers")}</TabsTrigger>
                  <TabsTrigger value="pending" className="relative">
                    {t("dashboard.pending")}
                    {pendingCount > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs bg-warning/20 text-warning rounded-full">{pendingCount}</span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="long-pending">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {t("admin.longPending")}
                  </TabsTrigger>
                  <TabsTrigger value="missing-docs">
                    <FileText className="w-3 h-3 mr-1" />
                    {t("admin.missingDocs")}
                  </TabsTrigger>
                  <TabsTrigger value="rehire">
                    <RefreshCw className="w-3 h-3 mr-1" />
                    {t("admin.rehire")}
                  </TabsTrigger>
                  <TabsTrigger value="terminated">
                    <XCircle className="w-3 h-3 mr-1" />
                    {t("dashboard.terminated")}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Filters */}
              <div className="bg-card border rounded-xl p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={t("admin.searchPlaceholder")}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Select value={storeFilter} onValueChange={setStoreFilter}>
                      <SelectTrigger className="w-[160px]">
                        <Building2 className="w-4 h-4 mr-2" />
                        <SelectValue placeholder={t("admin.store")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("admin.allStores")}</SelectItem>
                        {stores.map(store => (
                          <SelectItem key={store.code} value={store.code}>{store.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={coachFilter} onValueChange={setCoachFilter}>
                      <SelectTrigger className="w-[160px]">
                        <Users className="w-4 h-4 mr-2" />
                        <SelectValue placeholder={t("dashboard.fieldCoach")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("admin.allCoaches")}</SelectItem>
                        {fieldCoaches.map(coach => (
                          <SelectItem key={coach.id} value={coach.name}>{coach.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[140px]">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder={t("dashboard.status")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("admin.allStatus")}</SelectItem>
                        <SelectItem value="pending">{t("dashboard.pending")}</SelectItem>
                        <SelectItem value="approved">{t("dashboard.approved")}</SelectItem>
                        <SelectItem value="rejected">{t("dashboard.rejected")}</SelectItem>
                        <SelectItem value="active">{t("dashboard.active")}</SelectItem>
                        <SelectItem value="deactivated">{t("dashboard.deactivated")}</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button variant="outline" onClick={handleExport}>
                      <Download className="w-4 h-4 mr-2" />
                      {t("admin.exportCSV")}
                    </Button>

                    <Button variant="outline" onClick={handleExportUsers} disabled={generatingLink}>
                      {generatingLink ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Generate Export Link
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Employees Table */}
              <div className="bg-card border rounded-xl overflow-hidden">
                {loading ? (
                  <div className="p-8 text-center text-muted-foreground">
                    {t("admin.loadingEmployees")}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("admin.employee")}</TableHead>
                        <TableHead>{t("admin.contact")}</TableHead>
                        <TableHead>{t("admin.store")}</TableHead>
                        <TableHead>{t("dashboard.fieldCoach")}</TableHead>
                        <TableHead>{t("admin.verification")}</TableHead>
                        <TableHead>{t("dashboard.status")}</TableHead>
                        <TableHead>{t("admin.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map((emp) => (
                        <TableRow key={emp.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{emp.name}</p>
                            <p className="text-sm text-muted-foreground">{emp.designation}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="w-3 h-3" /> {emp.phone}
                            </p>
                            <p className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="w-3 h-3" /> {emp.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-foreground">{emp.store}</p>
                          <p className="text-xs text-muted-foreground">{emp.storeCode}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-foreground">{emp.fieldCoach}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className={cn("text-xs flex items-center gap-1", emp.aadhaarVerified ? "text-success" : "text-destructive")}>
                              {emp.aadhaarVerified ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              Aadhaar
                            </span>
                            {/* <span className={cn("text-xs flex items-center gap-1", emp.panVerified ? "text-success" : "text-destructive")}>
                              {emp.panVerified ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              PAN
                            </span> */}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(emp.status, emp.employeeStatus)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover border shadow-lg">
                              <DropdownMenuItem onClick={() => { setSelectedEmployee(emp); setShowDetailModal(true); }}>
                                <Eye className="w-4 h-4 mr-2" />
                                {t("dashboard.viewFullDetails")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setSelectedEmployee(emp); setShowDocumentsModal(true); }}>
                                <FileText className="w-4 h-4 mr-2" />
                                {t("dashboard.viewDocuments")}
                              </DropdownMenuItem>
                              {emp.employeeKey && (
                                <DropdownMenuItem 
                                  onClick={() => {
                                    // const url = `https://burgersingfrontbackend.kamaaupoot.in/api/public/employee/${emp.employeeKey}`;
                                    const url = `https://burgersingfrontbackend.kamaaupoot.in/api/public/employee/${emp.employeeKey}`;
                                    navigator.clipboard.writeText(url);
                                    toast.success("Employee URL copied to clipboard!");
                                  }}
                                >
                                  <CreditCard className="w-4 h-4 mr-2" />
                                  {t("admin.copyEmployeeURL")}
                                </DropdownMenuItem>
                              )}
                              {(emp.status === "deactivated" || emp.employeeStatus === "deactivated") && (
                                <DropdownMenuItem onClick={() => handleRehireEmployee(emp)}>
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  {t("admin.initiateRehire")}
                                </DropdownMenuItem>
                              )}
                              {(emp.status === "approved" || !emp.employeeStatus || emp.employeeStatus === "active") && emp.status !== "deactivated" && emp.status !== "terminated" && emp.employeeStatus !== "terminated" && emp.employeeStatus !== "deactivated" && (
                                <>
                                  <DropdownMenuItem onClick={() => { 
                                    setSelectedEmployee(emp); 
                                    setShowDeactivateModal(true); 
                                  }}>
                                    <UserX className="w-4 h-4 mr-2" />
                                    {t("admin.deactivate")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => { 
                                      setSelectedEmployee(emp); 
                                      setShowTerminateModal(true); 
                                    }} 
                                    className="text-destructive"
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    {t("admin.terminate")}
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                )}
                {!loading && employees.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    {t("admin.noEmployeesFound")}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Outlets Section */}
          {activeSection === "outlets" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Store Outlets</h3>
                  <p className="text-sm text-muted-foreground">Manage all store locations</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setImportFile(null); setShowImportOutletModal(true); }}>
                    <Upload className="w-4 h-4 mr-2" />
                    Import Data
                  </Button>
                  <Button onClick={() => { setNewOutlet({ name: "", code: "", email: "", password: "", phone: "", address: "", city: "", state: "", pincode: "", fieldCoach: "" }); setShowAddOutletModal(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Outlet
                  </Button>
                </div>
              </div>

              <div className="bg-card border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Outlet Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Field Coach</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stores.map((store) => (
                      <TableRow key={store.id}>
                        <TableCell className="font-medium">{store.name}</TableCell>
                        <TableCell>{store.code}</TableCell>
                        <TableCell>{store.email}</TableCell>
                        <TableCell>{store.fieldCoach}</TableCell>
                        <TableCell>{store.employeeCount}</TableCell>
                        <TableCell>
                          <Badge variant={store.status === "active" ? "default" : "secondary"}>
                            {store.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleOutletStatus(store.id)}
                              title={store.status === "active" ? "Deactivate outlet" : "Activate outlet"}
                            >
                              {store.status === "active" ? (
                                <XCircle className="w-4 h-4 text-destructive" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-success" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedOutlet(store);
                                setNewOutlet({ 
                                  name: store.name, 
                                  code: store.code, 
                                  email: store.email || "",
                                  password: "",
                                  phone: store.phone || "",
                                  address: store.address || "",
                                  city: store.city || "",
                                  state: store.state || "",
                                  pincode: store.pincode || "",
                                  fieldCoach: store.fieldCoachId || ""
                                });
                                setShowEditOutletModal(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => { setSelectedOutlet(store); setShowDeleteOutletModal(true); }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Roles Section */}
          {activeSection === "roles" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">User Roles</h3>
                  <p className="text-sm text-muted-foreground">Manage role-based access control</p>
                </div>
                <Button onClick={() => { setNewRole({ name: "", description: "" }); setShowAddRoleModal(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Role
                </Button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map((role) => (
                  <div key={role.id} className="bg-card border rounded-xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-primary" />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border shadow-lg">
                          <DropdownMenuItem onClick={() => {
                            setSelectedRole(role);
                            setNewRole({ name: role.name, description: role.description });
                            setShowEditRoleModal(true);
                          }}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Role
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => { setSelectedRole(role); setShowDeleteRoleModal(true); }}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Role
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <h4 className="font-semibold text-foreground mb-1">{role.name}</h4>
                    <p className="text-sm text-muted-foreground mb-4">{role.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{role.userCount} users</Badge>
                      <span className="text-xs text-muted-foreground">Created: {role.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Field Coaches Section */}
          {activeSection === "field-coaches" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Field Coaches</h3>
                  <p className="text-sm text-muted-foreground">Manage field coach accounts</p>
                </div>
                <Button onClick={() => { setNewCoach({ name: "", email: "", phone: "", password: "", assignedOutlets: [] }); setShowAddCoachModal(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Field Coach
                </Button>
              </div>

              <div className="bg-card border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Assigned Outlets</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fieldCoaches.map((coach) => (
                      <TableRow key={coach.id}>
                        <TableCell className="font-medium">{coach.name}</TableCell>
                        <TableCell>{coach.email}</TableCell>
                        <TableCell>{coach.phone || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {coach.assignedOutlets?.length > 0 ? (
                              coach.assignedOutlets.slice(0, 2).map((outletId: string) => {
                                const outlet = stores.find(s => s.id === outletId);
                                return outlet ? (
                                  <Badge key={outletId} variant="outline" className="text-xs">
                                    {outlet.code}
                                  </Badge>
                                ) : null;
                              })
                            ) : (
                              <span className="text-sm text-muted-foreground">None</span>
                            )}
                            {coach.assignedOutlets?.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{coach.assignedOutlets.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={coach.isActive ? "default" : "secondary"}>
                            {coach.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedCoach(coach);
                                setNewCoach({ 
                                  name: coach.name, 
                                  email: coach.email, 
                                  phone: coach.phone || "",
                                  password: "",
                                  assignedOutlets: coach.assignedOutlets || []
                                });
                                setShowEditCoachModal(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => { setSelectedCoach(coach); setShowDeleteCoachModal(true); }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Settings Section */}
          {activeSection === "settings" && (
            <div className="space-y-6">
              <div className="bg-card border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4">System Settings</h3>
                <p className="text-muted-foreground">Configure system preferences and notifications.</p>
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive email alerts for approvals</p>
                    </div>
                    <Badge variant="default">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Auto-approve Rehires</p>
                      <p className="text-sm text-muted-foreground">Automatically approve returning employees</p>
                    </div>
                    <Badge variant="secondary">Disabled</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Long Pending Threshold</p>
                      <p className="text-sm text-muted-foreground">Days before marking as long pending</p>
                    </div>
                    <Badge variant="outline">5 days</Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Employee Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Employee Details</DialogTitle>
            <DialogDescription>Full information for {selectedEmployee?.name}</DialogDescription>
          </DialogHeader>
          
          {selectedEmployee && (
            <div className="space-y-6 mt-4">
              {/* Personal Information */}
              <div className="space-y-3 p-4 border rounded-lg">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Personal Information
                </h4>
                <div className="grid md:grid-cols-3 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Full Name:</span> <span className="font-medium">{selectedEmployee.name}</span></div>
                  <div><span className="text-muted-foreground">Gender:</span> <span className="font-medium capitalize">{selectedEmployee.gender && selectedEmployee.gender !== '' ? selectedEmployee.gender : <span className="text-muted-foreground">Not Provided</span>}</span></div>
                  <div><span className="text-muted-foreground">Date of Birth:</span> <span className="font-medium">{selectedEmployee.dateOfBirth && selectedEmployee.dateOfBirth !== '' ? selectedEmployee.dateOfBirth : <span className="text-muted-foreground">Not Provided</span>}</span></div>
                  <div><span className="text-muted-foreground">Marital Status:</span> <span className="font-medium capitalize">{selectedEmployee.maritalStatus && selectedEmployee.maritalStatus !== '' ? selectedEmployee.maritalStatus : <span className="text-muted-foreground">Not Provided</span>}</span></div>
                  <div><span className="text-muted-foreground">Blood Group:</span> <span className="font-medium">{selectedEmployee.bloodGroup && selectedEmployee.bloodGroup !== '' ? selectedEmployee.bloodGroup : <span className="text-muted-foreground">Not Provided</span>}</span></div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="space-y-3 p-4 border rounded-lg">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Contact Information
                </h4>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Phone 1:</span> <span className="font-medium">{selectedEmployee.phone}</span>
                    {selectedEmployee.phoneOtpVerified && <span className="ml-2 text-xs text-success">✓ Verified</span>}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone 2:</span> 
                    <span className="font-medium">{selectedEmployee.phone2 && selectedEmployee.phone2 !== '' ? selectedEmployee.phone2 : <span className="text-muted-foreground">Not Provided</span>}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span> <span className="font-medium">{selectedEmployee.email}</span>
                    {selectedEmployee.emailOtpVerified && <span className="ml-2 text-xs text-success">✓ Verified</span>}
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-muted-foreground">Current Address:</span>
                    <p className="font-medium">{selectedEmployee.currentAddress && selectedEmployee.currentAddress !== '' ? selectedEmployee.currentAddress : <span className="text-muted-foreground">Not Provided</span>}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-muted-foreground">Permanent Address:</span>
                    <p className="font-medium">{selectedEmployee.permanentAddress && selectedEmployee.permanentAddress !== '' ? selectedEmployee.permanentAddress : <span className="text-muted-foreground">Not Provided</span>}</p>
                  </div>
                </div>
              </div>

              {/* Education Details */}
              <div className="space-y-3 p-4 border rounded-lg">
                <h4 className="font-semibold text-foreground">Education</h4>
                <div className="grid md:grid-cols-3 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Qualification:</span> <span className="font-medium">{selectedEmployee.qualification || <span className="text-muted-foreground">Not Provided</span>}</span></div>
                  <div><span className="text-muted-foreground">Specialization:</span> <span className="font-medium">{selectedEmployee.specialization && selectedEmployee.specialization !== '' ? selectedEmployee.specialization : <span className="text-muted-foreground">Not Provided</span>}</span></div>
                  <div><span className="text-muted-foreground">Status:</span> <span className="font-medium capitalize">{selectedEmployee.educationStatus && selectedEmployee.educationStatus !== '' ? selectedEmployee.educationStatus : <span className="text-muted-foreground">Not Provided</span>}</span></div>
                </div>
              </div>

              {/* Work Experience */}
              <div className="space-y-3 p-4 border rounded-lg">
                <h4 className="font-semibold text-foreground">Work Experience</h4>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Total Experience:</span> <span className="font-medium">{selectedEmployee.totalExperience && selectedEmployee.totalExperience !== '' ? `${selectedEmployee.totalExperience} years` : <span className="text-muted-foreground">Not Provided</span>}</span></div>
                  <div><span className="text-muted-foreground">Last Designation:</span> <span className="font-medium">{selectedEmployee.lastDesignation && selectedEmployee.lastDesignation !== '' ? selectedEmployee.lastDesignation : <span className="text-muted-foreground">Not Provided</span>}</span></div>
                </div>
              </div>

              {/* Employment Details */}
              <div className="space-y-3 p-4 border rounded-lg">
                <h4 className="font-semibold text-foreground">Employment Details</h4>
                <div className="grid md:grid-cols-3 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Role:</span> <span className="font-medium">{selectedEmployee.role || selectedEmployee.designation || <span className="text-muted-foreground">Not Provided</span>}</span></div>
                  <div><span className="text-muted-foreground">Designation:</span> <span className="font-medium">{selectedEmployee.designation || <span className="text-muted-foreground">Not Provided</span>}</span></div>
                  {/* <div><span className="text-muted-foreground">Department:</span> <span className="font-medium capitalize">{selectedEmployee.department && selectedEmployee.department !== '' ? selectedEmployee.department : <span className="text-muted-foreground">Not Provided</span>}</span></div> */}
                  <div><span className="text-muted-foreground">Store:</span> <span className="font-medium">{(selectedEmployee.store && selectedEmployee.store !== 'N/A') ? selectedEmployee.store : <span className="text-muted-foreground">Not Assigned</span>}</span></div>
                  <div><span className="text-muted-foreground">Store Code:</span> <span className="font-medium">{(selectedEmployee.storeCode && selectedEmployee.storeCode !== 'N/A') ? selectedEmployee.storeCode : <span className="text-muted-foreground">Not Assigned</span>}</span></div>
                  <div><span className="text-muted-foreground">Store Name:</span> <span className="font-medium">{(selectedEmployee.storeName && selectedEmployee.storeName !== '' && selectedEmployee.storeName !== 'N/A') ? selectedEmployee.storeName : ((selectedEmployee.store && selectedEmployee.store !== 'N/A') ? selectedEmployee.store : <span className="text-muted-foreground">Not Assigned</span>)}</span></div>
                  <div><span className="text-muted-foreground">Date of Joining:</span> <span className="font-medium">{selectedEmployee.dateOfJoining}</span></div>
                  <div><span className="text-muted-foreground">Field Coach:</span> <span className="font-medium">{(selectedEmployee.fieldCoach && selectedEmployee.fieldCoach !== '') ? selectedEmployee.fieldCoach : <span className="text-muted-foreground">Not Assigned</span>}</span></div>
                  <div><span className="text-muted-foreground">Created On:</span> <span className="font-medium">{selectedEmployee.createdAt}</span></div>
                </div>
              </div>

              {/* ID Details */}
              <div className="space-y-3 p-4 border rounded-lg">
                <h4 className="font-semibold text-foreground">ID & Verification</h4>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Aadhaar:</span> <span className="font-medium">{selectedEmployee.aadhaarNumber && selectedEmployee.aadhaarNumber !== '' ? selectedEmployee.aadhaarNumber : <span className="text-muted-foreground">Not Provided</span>}</span></div>
                  <div><span className="text-muted-foreground">PAN:</span> <span className="font-medium">{selectedEmployee.panNumber && selectedEmployee.panNumber !== '' ? selectedEmployee.panNumber : <span className="text-muted-foreground">Not Provided</span>}</span></div>
                </div>
                <div className="flex gap-4 mt-2">
                  <span className={cn(
                    "text-sm flex items-center gap-1",
                    selectedEmployee.aadhaarVerified ? "text-success" : "text-destructive"
                  )}>
                    {selectedEmployee.aadhaarVerified ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    Aadhaar {selectedEmployee.aadhaarVerified ? 'Verified' : 'Not Verified'}
                  </span>
                  {/* <span className={cn(
                    "text-sm flex items-center gap-1",
                    selectedEmployee.panVerified ? "text-success" : "text-destructive"
                  )}>
                    {selectedEmployee.panVerified ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    PAN {selectedEmployee.panVerified ? 'Verified' : 'Not Verified'}
                  </span> */}
                </div>
              </div>

              {/* Uniform & Vaccination */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3 p-4 border rounded-lg">
                  <h4 className="font-semibold text-foreground">Uniform Size</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">T-shirt:</span> <span className="font-medium">{selectedEmployee.tshirtSize && selectedEmployee.tshirtSize !== '' ? selectedEmployee.tshirtSize : <span className="text-muted-foreground">Not Provided</span>}</span></div>
                    <div><span className="text-muted-foreground">Lower:</span> <span className="font-medium">{selectedEmployee.lowerSize && selectedEmployee.lowerSize !== '' ? selectedEmployee.lowerSize : <span className="text-muted-foreground">Not Provided</span>}</span></div>
                  </div>
                </div>
                
                <div className="space-y-3 p-4 border rounded-lg">
                  <h4 className="font-semibold text-foreground">Vaccination Status</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      {selectedEmployee.covidVaccinated ? <CheckCircle className="w-4 h-4 text-success" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
                      <span>COVID-19</span>
                    </div>
                    {/* <div className="flex items-center gap-2">
                      {selectedEmployee.hepatitisVaccinated ? <CheckCircle className="w-4 h-4 text-success" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
                      <span>Hepatitis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedEmployee.typhoidVaccinated ? <CheckCircle className="w-4 h-4 text-success" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
                      <span>Typhoid</span>
                    </div> */}
                  </div>
                </div>
              </div>

              {/* Employment History - Show if applicant has previous employment */}
              {selectedEmployee.hasEmploymentHistory && selectedEmployee.previousEmployment && selectedEmployee.previousEmployment.length > 0 && (
                <div className="space-y-3 p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-yellow-700" />
                    <h4 className="font-semibold text-yellow-900">Previous Employment History</h4>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-white border border-yellow-300 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-yellow-800">
                      This applicant has worked at Burger Singh previously. Review their employment history below before approving.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {selectedEmployee.previousEmployment.map((employment: any, index: number) => (
                      <div key={index} className="p-3 bg-white border rounded-lg space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-sm">{employment.role}</p>
                            <p className="text-xs text-muted-foreground">{employment.outlet?.name || 'N/A'} ({employment.outlet?.code || 'N/A'})</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Employment #{selectedEmployee.previousEmployment.length - index}
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

              {/* Deactivation/Termination Details */}
              {(selectedEmployee.employeeStatus === 'deactivated' || selectedEmployee.employeeStatus === 'terminated') && (
                <div className="space-y-3 p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                  <h4 className="font-semibold text-yellow-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {selectedEmployee.employeeStatus === 'terminated' ? 'Termination' : 'Deactivation'} Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    {selectedEmployee.employeeStatus === 'deactivated' && selectedEmployee.deactivationReason && (
                      <div>
                        <span className="text-muted-foreground">Deactivation Reason:</span>
                        <p className="font-medium text-yellow-900 mt-1">{selectedEmployee.deactivationReason}</p>
                      </div>
                    )}
                    {selectedEmployee.employeeStatus === 'deactivated' && selectedEmployee.deactivationApprovedAt && (
                      <div>
                        <span className="text-muted-foreground">Deactivated On:</span>
                        <p className="font-medium">{selectedEmployee.deactivationApprovedAt}</p>
                      </div>
                    )}
                    {selectedEmployee.employeeStatus === 'terminated' && selectedEmployee.terminationReason && (
                      <div>
                        <span className="text-muted-foreground">Termination Reason:</span>
                        <p className="font-medium text-red-900 mt-1">{selectedEmployee.terminationReason}</p>
                      </div>
                    )}
                    {selectedEmployee.employeeStatus === 'terminated' && selectedEmployee.terminatedAt && (
                      <div>
                        <span className="text-muted-foreground">Terminated On:</span>
                        <p className="font-medium">{selectedEmployee.terminatedAt}</p>
                      </div>
                    )}
                  </div>
                  {selectedEmployee.employeeStatus === 'deactivated' && (
                    <Button 
                      onClick={() => {
                        handleRehireEmployee(selectedEmployee);
                        setShowDetailModal(false);
                      }}
                      className="w-full mt-3"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Rehire Employee
                    </Button>
                  )}
                </div>
              )}

              {/* Status */}
              <div className="space-y-3 p-4 border rounded-lg">
                <h4 className="font-semibold text-foreground">Current Status</h4>
                <div className="flex items-center gap-3">
                  {getStatusBadge(selectedEmployee.status, selectedEmployee.employeeStatus)}
                </div>
              </div>

              {/* Employee Key & URL */}
              {selectedEmployee.employeeKey && (
                <div className="space-y-3 p-4 border rounded-lg bg-blue-50 border-blue-200">
                  <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Employee Access Key
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs text-muted-foreground">Employee Key:</span>
                      <p className="font-mono text-sm font-medium text-blue-900 mt-1">{selectedEmployee.employeeKey}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Public URL:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 px-3 py-2 bg-white border rounded text-xs overflow-x-auto">
                          {/* {`https://burgersingfrontbackend.kamaaupoot.in/api/public/employee/${selectedEmployee.employeeKey}`} */}
                          {`https://burgersingfrontbackend.kamaaupoot.in/api/public/employee/${selectedEmployee.employeeKey}`}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // const url = `https://burgersingfrontbackend.kamaaupoot.in/api/public/employee/${selectedEmployee.employeeKey}`;
                            const url = `https://burgersingfrontbackend.kamaaupoot.in/api/public/employee/${selectedEmployee.employeeKey}`;
                            navigator.clipboard.writeText(url);
                            toast.success("URL copied to clipboard!");
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
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
            <DialogDescription>All documents submitted by {selectedEmployee?.name}</DialogDescription>
          </DialogHeader>
          
          {selectedEmployee && (
            <div className="space-y-4 mt-4">
              {selectedEmployee.photo && (() => {
                // Clean the path - extract just the filename from full paths
                let cleanPath = selectedEmployee.photo.path;
                
                // If it contains full path, extract just the filename
                if (cleanPath.includes('\\') || cleanPath.includes('/')) {
                  cleanPath = cleanPath.split(/[\\\/]/).pop() || cleanPath;
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
                        {selectedEmployee.photo.filename} ({(selectedEmployee.photo.size / 1024).toFixed(2)} KB) - Click to open full size
                      </a>
                    </div>
                  </div>
                );
              })()}

              {selectedEmployee.educationCertificate && (
                <DocumentPreview
                  title="Education Certificate"
                  document={selectedEmployee.educationCertificate}
                />
              )}

              {selectedEmployee.experienceDocument && (
                <DocumentPreview
                  title="Experience Document"
                  document={selectedEmployee.experienceDocument}
                />
              )}

              {selectedEmployee.idDocuments && (
                <DocumentPreview
                  title="ID Documents (Aadhaar/PAN Copy)"
                  document={selectedEmployee.idDocuments}
                />
              )}

              {selectedEmployee.panDocument && (
                <DocumentPreview
                  title="PAN Document"
                  document={selectedEmployee.panDocument}
                />
              )}

              {selectedEmployee.certificates && (
                <DocumentPreview
                  title="Other Certificates"
                  document={selectedEmployee.certificates}
                />
              )}

              {!selectedEmployee.photo && !selectedEmployee.educationCertificate && !selectedEmployee.experienceDocument && 
               !selectedEmployee.idDocuments && !selectedEmployee.panDocument && !selectedEmployee.certificates && (
                <div className="p-8 text-center text-muted-foreground border rounded-lg">
                  No documents uploaded
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Terminate Employee Modal */}
      <Dialog open={showTerminateModal} onOpenChange={setShowTerminateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terminate Employee</DialogTitle>
            <DialogDescription>
              This action will terminate the employee and move them to the Terminated tab.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedEmployee && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">{selectedEmployee.name}</p>
                <p className="text-xs text-muted-foreground">{selectedEmployee.role}</p>
              </div>
            )}
            <div>
              <Label htmlFor="termination-reason">Termination Reason *</Label>
              <Textarea 
                id="termination-reason"
                value={terminationReason}
                onChange={(e) => setTerminationReason(e.target.value)}
                placeholder="Enter reason for termination..."
                className="min-h-[100px] mt-2"
              />
            </div>
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-800">
                Terminating an employee will end their current employment. This action will be recorded in their employment history.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowTerminateModal(false);
              setTerminationReason("");
            }}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleTerminateEmployee}
              disabled={!terminationReason.trim()}
            >
              Terminate Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Employee Modal */}
      <Dialog open={showDeactivateModal} onOpenChange={setShowDeactivateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Employee</DialogTitle>
            <DialogDescription>
              This action will deactivate the employee immediately without field coach verification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedEmployee && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">{selectedEmployee.name}</p>
                <p className="text-xs text-muted-foreground">{selectedEmployee.role}</p>
              </div>
            )}
            <div>
              <Label htmlFor="deactivation-reason">Deactivation Reason *</Label>
              <Textarea 
                id="deactivation-reason"
                value={deactivationReason}
                onChange={(e) => setDeactivationReason(e.target.value)}
                placeholder="Enter reason for deactivation..."
                className="min-h-[100px] mt-2"
              />
            </div>
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-800">
                This will immediately deactivate the employee. They will no longer appear in active employee lists across all dashboards.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDeactivateModal(false);
              setDeactivationReason("");
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleDeactivateEmployee}
              disabled={!deactivationReason.trim()}
            >
              Deactivate Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Outlet Modal */}
      <Dialog open={showAddOutletModal} onOpenChange={setShowAddOutletModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Outlet</DialogTitle>
            <DialogDescription>Create a new store outlet</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="outlet-name">Outlet Name *</Label>
              <Input id="outlet-name" value={newOutlet.name} onChange={(e) => setNewOutlet({ ...newOutlet, name: e.target.value })} placeholder="e.g., Connaught Place" />
            </div>
            <div>
              <Label htmlFor="outlet-code">Store Code *</Label>
              <Input id="outlet-code" value={newOutlet.code} onChange={(e) => setNewOutlet({ ...newOutlet, code: e.target.value })} placeholder="e.g., BS-CP-001" />
            </div>
            <div>
              <Label htmlFor="outlet-address">Address *</Label>
              <Input id="outlet-address" value={newOutlet.address} onChange={(e) => setNewOutlet({ ...newOutlet, address: e.target.value })} placeholder="e.g., 123 Main Street" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="outlet-city">City *</Label>
                <Input id="outlet-city" value={newOutlet.city} onChange={(e) => setNewOutlet({ ...newOutlet, city: e.target.value })} placeholder="e.g., Delhi" />
              </div>
              <div>
                <Label htmlFor="outlet-state">State</Label>
                <Input id="outlet-state" value={newOutlet.state} onChange={(e) => setNewOutlet({ ...newOutlet, state: e.target.value })} placeholder="e.g., Delhi" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="outlet-pincode">Pincode</Label>
                <Input id="outlet-pincode" value={newOutlet.pincode} onChange={(e) => setNewOutlet({ ...newOutlet, pincode: e.target.value })} placeholder="e.g., 110001" />
              </div>
              <div>
                <Label htmlFor="outlet-phone">Phone</Label>
                <Input id="outlet-phone" value={newOutlet.phone} onChange={(e) => setNewOutlet({ ...newOutlet, phone: e.target.value })} placeholder="e.g., +91 98765 43210" />
              </div>
            </div>
            <div>
              <Label htmlFor="outlet-email">Store Email *</Label>
              <Input id="outlet-email" type="email" value={newOutlet.email} onChange={(e) => setNewOutlet({ ...newOutlet, email: e.target.value })} placeholder="e.g., store@burgersingh.com" />
            </div>
            <div>
              <Label htmlFor="outlet-password">Password *</Label>
              <Input id="outlet-password" type="password" value={newOutlet.password} onChange={(e) => setNewOutlet({ ...newOutlet, password: e.target.value })} placeholder="Minimum 6 characters" />
              <p className="text-xs text-muted-foreground mt-1">Store managers will use this email and password to login</p>
            </div>
            <div>
              <Label htmlFor="outlet-coach">Field Coach</Label>
              <Select value={newOutlet.fieldCoach} onValueChange={(val) => setNewOutlet({ ...newOutlet, fieldCoach: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Field Coach" />
                </SelectTrigger>
                <SelectContent>
                  {fieldCoaches.map(coach => (
                    <SelectItem key={coach.id} value={coach.id}>{coach.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowAddOutletModal(false)}>Cancel</Button>
            <Button onClick={handleAddOutlet}>Create Outlet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Outlet Modal */}
      <Dialog open={showEditOutletModal} onOpenChange={setShowEditOutletModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Outlet</DialogTitle>
            <DialogDescription>Update outlet information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="edit-outlet-name">Outlet Name</Label>
              <Input id="edit-outlet-name" value={newOutlet.name} onChange={(e) => setNewOutlet({ ...newOutlet, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="edit-outlet-code">Store Code</Label>
              <Input id="edit-outlet-code" value={newOutlet.code} onChange={(e) => setNewOutlet({ ...newOutlet, code: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="edit-outlet-email">Store Email</Label>
              <Input id="edit-outlet-email" type="email" value={newOutlet.email} onChange={(e) => setNewOutlet({ ...newOutlet, email: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="edit-outlet-coach">Field Coach</Label>
              <Select value={newOutlet.fieldCoach} onValueChange={(val) => setNewOutlet({ ...newOutlet, fieldCoach: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Field Coach" />
                </SelectTrigger>
                <SelectContent>
                  {fieldCoaches.map(coach => (
                    <SelectItem key={coach.id} value={coach.id}>{coach.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowEditOutletModal(false)}>Cancel</Button>
            <Button onClick={handleEditOutlet}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Outlet Modal */}
      <Dialog open={showDeleteOutletModal} onOpenChange={setShowDeleteOutletModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Outlet</DialogTitle>
            <DialogDescription>Are you sure you want to delete "{selectedOutlet?.name}"? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowDeleteOutletModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteOutlet}>Delete Outlet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Outlets Modal */}
      <Dialog open={showImportOutletModal} onOpenChange={setShowImportOutletModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Outlets from Excel/CSV</DialogTitle>
            <DialogDescription>Upload an Excel (.xlsx, .xls) or CSV file to import multiple outlets at once</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="max-w-xs mx-auto"
              />
              {importFile && (
                <p className="text-sm text-green-600 mt-2">
                  Selected: {importFile.name}
                </p>
              )}
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-sm mb-2">Required Columns (Excel/CSV):</h4>
              <ul className="text-xs space-y-1 text-blue-800">
                <li>• <strong>code</strong> - Unique outlet code (e.g., BS-DEL-001)</li>
                <li>• <strong>name</strong> - Outlet name</li>
                <li>• <strong>email</strong> - Outlet email (must be unique)</li>
                <li>• <strong>password</strong> - Login password</li>
                <li>• <strong>address</strong> - Full address</li>
                <li>• <strong>city</strong> - City name</li>
                <li>• <strong>state</strong> - State name (optional)</li>
                <li>• <strong>pincode</strong> - Postal code (optional)</li>
                <li>• <strong>phone</strong> - Contact number (optional)</li>
              </ul>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={downloadSampleExcel}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Sample
              </Button>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => {
              setShowImportOutletModal(false);
              setImportFile(null);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleImportOutlets}
              disabled={!importFile || importing}
            >
              {importing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Outlets
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Link Modal */}
      <Dialog open={showExportLinkModal} onOpenChange={setShowExportLinkModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Shareable Export Link</DialogTitle>
            <DialogDescription>Share this link with anyone to allow them to download the employee data</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">Export link generated successfully!</p>
                <p className="text-xs text-green-700 mt-1">This link will expire on {exportLinkExpiry ? new Date(exportLinkExpiry).toLocaleString() : 'N/A'}</p>
              </div>
            </div>

            <div>
              <Label htmlFor="export-link" className="text-sm font-medium mb-2 block">Shareable Link</Label>
              <div className="flex gap-2">
                <Input 
                  id="export-link"
                  value={exportLink} 
                  readOnly 
                  className="font-mono text-xs"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={copyExportLink}
                  title="Copy to clipboard"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Link className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-800">
                  <p className="font-medium mb-1">How to use:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Copy and share this link with anyone</li>
                    <li>No login required - anyone with the link can download the data</li>
                    <li>The link will expire after 24 hours for security</li>
                    <li>Data is exported in JSON format</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center pt-2">
              <a 
                href={exportLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <Eye className="h-3 w-3" />
                Preview data in new tab
              </a>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button onClick={() => setShowExportLinkModal(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Role Modal */}
      <Dialog open={showAddRoleModal} onOpenChange={setShowAddRoleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Role</DialogTitle>
            <DialogDescription>Create a new user role</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="role-name">Role Name *</Label>
              <Input id="role-name" value={newRole.name} onChange={(e) => setNewRole({ ...newRole, name: e.target.value })} placeholder="e.g., Kitchen Supervisor" />
            </div>
            <div>
              <Label htmlFor="role-desc">Description *</Label>
              <Input id="role-desc" value={newRole.description} onChange={(e) => setNewRole({ ...newRole, description: e.target.value })} placeholder="e.g., Supervises kitchen operations" />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowAddRoleModal(false)}>Cancel</Button>
            <Button onClick={handleAddRole}>Create Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Modal */}
      <Dialog open={showEditRoleModal} onOpenChange={setShowEditRoleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>Update role information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="edit-role-name">Role Name</Label>
              <Input id="edit-role-name" value={newRole.name} onChange={(e) => setNewRole({ ...newRole, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="edit-role-desc">Description</Label>
              <Input id="edit-role-desc" value={newRole.description} onChange={(e) => setNewRole({ ...newRole, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowEditRoleModal(false)}>Cancel</Button>
            <Button onClick={handleEditRole}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Role Modal */}
      <Dialog open={showDeleteRoleModal} onOpenChange={setShowDeleteRoleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              {selectedRole?.userCount && selectedRole.userCount > 0 
                ? `Cannot delete "${selectedRole?.name}" as it has ${selectedRole?.userCount} active users.`
                : `Are you sure you want to delete "${selectedRole?.name}"? This action cannot be undone.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowDeleteRoleModal(false)}>Cancel</Button>
            {(!selectedRole?.userCount || selectedRole.userCount === 0) && (
              <Button variant="destructive" onClick={handleDeleteRole}>Delete Role</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Field Coach Modal */}
      <Dialog open={showAddCoachModal} onOpenChange={setShowAddCoachModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Field Coach</DialogTitle>
            <DialogDescription>Create a new field coach account</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coach-name">Name *</Label>
                <Input 
                  id="coach-name" 
                  value={newCoach.name} 
                  onChange={(e) => setNewCoach({...newCoach, name: e.target.value})} 
                  placeholder="Enter name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coach-email">Email *</Label>
                <Input 
                  id="coach-email" 
                  type="email"
                  value={newCoach.email} 
                  onChange={(e) => setNewCoach({...newCoach, email: e.target.value})} 
                  placeholder="coach@burgersingh.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coach-phone">Phone</Label>
                <Input 
                  id="coach-phone" 
                  value={newCoach.phone} 
                  onChange={(e) => setNewCoach({...newCoach, phone: e.target.value})} 
                  placeholder="+91 XXXXXXXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coach-password">Password *</Label>
                <Input 
                  id="coach-password" 
                  type="password"
                  value={newCoach.password} 
                  onChange={(e) => setNewCoach({...newCoach, password: e.target.value})} 
                  placeholder="Enter password"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assigned Outlets</Label>
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                <div className="space-y-2">
                  {stores.map((store) => (
                    <div key={store.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`outlet-${store.id}`}
                        checked={newCoach.assignedOutlets.includes(store.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewCoach({...newCoach, assignedOutlets: [...newCoach.assignedOutlets, store.id]});
                          } else {
                            setNewCoach({...newCoach, assignedOutlets: newCoach.assignedOutlets.filter(id => id !== store.id)});
                          }
                        }}
                        className="rounded"
                      />
                      <label htmlFor={`outlet-${store.id}`} className="text-sm cursor-pointer">
                        {store.name} ({store.code})
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCoachModal(false)}>Cancel</Button>
            <Button onClick={handleAddCoach}>Create Field Coach</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Field Coach Modal */}
      <Dialog open={showEditCoachModal} onOpenChange={setShowEditCoachModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Field Coach</DialogTitle>
            <DialogDescription>Update field coach information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-coach-name">Name</Label>
                <Input 
                  id="edit-coach-name" 
                  value={newCoach.name} 
                  onChange={(e) => setNewCoach({...newCoach, name: e.target.value})} 
                  placeholder={selectedCoach?.name}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-coach-email">Email</Label>
                <Input 
                  id="edit-coach-email" 
                  type="email"
                  value={newCoach.email} 
                  onChange={(e) => setNewCoach({...newCoach, email: e.target.value})} 
                  placeholder={selectedCoach?.email}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-coach-phone">Phone</Label>
              <Input 
                id="edit-coach-phone" 
                value={newCoach.phone} 
                onChange={(e) => setNewCoach({...newCoach, phone: e.target.value})} 
                placeholder={selectedCoach?.phone || "+91 XXXXXXXXXX"}
              />
            </div>
            <div className="space-y-2">
              <Label>Assigned Outlets</Label>
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                <div className="space-y-2">
                  {stores.map((store) => (
                    <div key={store.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`edit-outlet-${store.id}`}
                        checked={newCoach.assignedOutlets.includes(store.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewCoach({...newCoach, assignedOutlets: [...newCoach.assignedOutlets, store.id]});
                          } else {
                            setNewCoach({...newCoach, assignedOutlets: newCoach.assignedOutlets.filter(id => id !== store.id)});
                          }
                        }}
                        className="rounded"
                      />
                      <label htmlFor={`edit-outlet-${store.id}`} className="text-sm cursor-pointer">
                        {store.name} ({store.code})
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditCoachModal(false)}>Cancel</Button>
            <Button onClick={handleEditCoach}>Update Field Coach</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Field Coach Modal */}
      <Dialog open={showDeleteCoachModal} onOpenChange={setShowDeleteCoachModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Field Coach</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedCoach?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowDeleteCoachModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteCoach}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
