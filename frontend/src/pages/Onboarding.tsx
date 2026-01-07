import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  ArrowLeft, 
  ArrowRight, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  UserPlus,
  Camera,
  FileText,
  CheckCircle,
  Edit2,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProgressStepper } from "@/components/ProgressStepper";
import { PhoneInput } from "@/components/PhoneInput";
import { DigiLockerButton } from "@/components/DigiLockerButton";
import { FileUploader } from "@/components/FileUploader";
import { toast } from "sonner";
import { apiService } from "@/lib/api";

const STEPS = [
  { id: 1, title: "Basic Details" },
  { id: 2, title: "Contact Details" },
  { id: 3, title: "Education" },
  { id: 4, title: "Work Experience" },
  { id: 5, title: "Other Information" },
  { id: 6, title: "Verification" },
];

interface FormData {
  // Step 1: Basic Details
  fullName: string;
  dob: string;
  gender: string;
  photo: File | null;

  // Step 2: Contact Details
  phone: string;
  phoneOtpVerified: boolean;
  phone2: string;
  email: string;
  emailOtpVerified: boolean;
  currentAddress: string;
  permanentAddress: string;
  sameAsCurrentAddress: boolean;

  // Step 3: Education
  qualification: string;
  specialization: string;
  educationStatus: string;
  educationCertificate: File | null;

  // Step 4: Work Experience
  totalExperience: string;
  lastDesignation: string;
  experienceDocument: File | null;

  // Step 5: Other Information
  maritalStatus: string;
  bloodGroup: string;
  tshirtSize: string;
  lowerSize: string;
  aadhaarNumber: string;
  panNumber: string;
  idDocuments: File | null;
  dateOfJoining: string;
  covidVaccinated: boolean;

  // Step 6: Verification
  aadhaarVerified: boolean;
  panDocument: File | null;

  // Employment Details (for final submission)
  hepatitisVaccinated: boolean;
  typhoidVaccinated: boolean;
  designation: string;
  fieldCoach: string;
  department: string;
  storeName: string;
}

const Onboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, outlet } = location.state || {};

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [onboardingId, setOnboardingId] = useState<string | null>(null);
  const [outletDetails, setOutletDetails] = useState<any>(null);
  const [fieldCoachName, setFieldCoachName] = useState<string>("");
  const [formData, setFormData] = useState<FormData>({
    // Step 1: Basic Details
    fullName: "",
    dob: "",
    gender: "",
    photo: null,

    // Step 2: Contact Details
    phone: "",
    phoneOtpVerified: false,
    phone2: "",
    email: "",
    emailOtpVerified: false,
    currentAddress: "",
    permanentAddress: "",
    sameAsCurrentAddress: false,

    // Step 3: Education
    qualification: "",
    specialization: "",
    educationStatus: "",
    educationCertificate: null,

    // Step 4: Work Experience
    totalExperience: "",
    lastDesignation: "",
    experienceDocument: null,

    // Step 5: Other Information
    maritalStatus: "",
    bloodGroup: "",
    tshirtSize: "",
    lowerSize: "",
    aadhaarNumber: "",
    panNumber: "",
    idDocuments: null,
    dateOfJoining: "",
    covidVaccinated: false,

    // Step 6: Verification
    aadhaarVerified: false,
    panDocument: null,

    // Employment Details (for final submission)
    hepatitisVaccinated: false,
    typhoidVaccinated: false,
    designation: "",
    fieldCoach: "",
    department: "",
    storeName: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  
  // OTP state
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpInput, setPhoneOtpInput] = useState("");
  const [phoneOtpTimer, setPhoneOtpTimer] = useState(0);
  const [phoneOtpLoading, setPhoneOtpLoading] = useState(false);
  
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpInput, setEmailOtpInput] = useState("");
  const [emailOtpTimer, setEmailOtpTimer] = useState(0);
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);

  // OTP timer countdown
  useEffect(() => {
    if (phoneOtpTimer > 0) {
      const timer = setTimeout(() => setPhoneOtpTimer(phoneOtpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [phoneOtpTimer]);

  useEffect(() => {
    if (emailOtpTimer > 0) {
      const timer = setTimeout(() => setEmailOtpTimer(emailOtpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [emailOtpTimer]);

  // Fetch outlet details and field coach
  useEffect(() => {
    const fetchOutletDetails = async () => {
      if (!outlet) return;
      
      try {
        // Fetch all outlets to find the selected one
        const response = await apiService.getOutlets();
        if (response.success && response.outlets) {
          const selectedOutlet = response.outlets.find((o: any) => o.id === outlet);
          if (selectedOutlet) {
            setOutletDetails(selectedOutlet);
            // Auto-populate storeName and fieldCoach in formData
            setFormData(prev => ({
              ...prev,
              storeName: selectedOutlet.name || outlet,
              fieldCoach: selectedOutlet.fieldCoach || ""
            }));
            setFieldCoachName(selectedOutlet.fieldCoach || "Not assigned");
          }
        }
      } catch (error) {
        console.error("Failed to fetch outlet details:", error);
      }
    };
    
    fetchOutletDetails();
  }, [outlet]);

  // Load existing draft from backend if available
  useEffect(() => {
    const loadDraft = async () => {
      const savedPhone = localStorage.getItem("onboarding_phone");
      if (savedPhone) {
        try {
          const response = await apiService.getDraft(savedPhone);
          if (response.success && response.onboarding) {
            const draft = response.onboarding;
            setFormData(prev => ({
              ...prev,
              fullName: draft.fullName || "",
              phone: draft.phone || "",
              email: draft.email || "",
              dob: draft.dob ? new Date(draft.dob).toISOString().split('T')[0] : "",
              address: draft.address || "",
              emergencyContact: draft.emergencyContact || "",
              emergencyPhone: draft.emergencyPhone || "",
              aadhaarVerified: draft.aadhaarVerified || false,
            }));
            setCurrentStep(draft.currentStep || 1);
            setOnboardingId(draft._id);
          }
        } catch (error) {
          console.log("No existing draft found");
        }
      }
    };

    loadDraft();
  }, []);

  const updateField = (field: keyof FormData, value: any) => {
    console.log(`🔄 updateField called: ${field} =`, value, `(type: ${typeof value})`);
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      console.log(`📦 Updated formData for ${field}:`, updated[field]);
      return updated;
    });
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  // Phone OTP handlers
  const handleSendPhoneOtp = async () => {
    if (!formData.phone || formData.phone.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setPhoneOtpLoading(true);
    try {
      const response = await apiService.sendPhoneOTP(formData.phone);
      if (response.success) {
        setPhoneOtpSent(true);
        setPhoneOtpTimer(60);
        toast.success("OTP sent to your phone");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send OTP");
    } finally {
      setPhoneOtpLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtpInput || phoneOtpInput.length !== 6) {
      toast.error("Please enter 6-digit OTP");
      return;
    }

    setPhoneOtpLoading(true);
    try {
      const response = await apiService.verifyPhoneOTP(formData.phone, phoneOtpInput);
      if (response.verified) {
        updateField("phoneOtpVerified", true);
        setPhoneOtpSent(false);
        setPhoneOtpInput("");
        toast.success("Phone verified successfully!");
      }
    } catch (error: any) {
      toast.error(error.message || "Invalid OTP");
    } finally {
      setPhoneOtpLoading(false);
    }
  };

  // Email OTP handlers
  const handleSendEmailOtp = async () => {
    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setEmailOtpLoading(true);
    try {
      const response = await apiService.sendEmailOTP(formData.email);
      if (response.success) {
        setEmailOtpSent(true);
        setEmailOtpTimer(60);
        toast.success("OTP sent to your email");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send OTP");
    } finally {
      setEmailOtpLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtpInput || emailOtpInput.length !== 6) {
      toast.error("Please enter 6-digit OTP");
      return;
    }

    setEmailOtpLoading(true);
    try {
      const response = await apiService.verifyEmailOTP(formData.email, emailOtpInput);
      if (response.verified) {
        updateField("emailOtpVerified", true);
        setEmailOtpSent(false);
        setEmailOtpInput("");
        toast.success("Email verified successfully!");
      }
    } catch (error: any) {
      toast.error(error.message || "Invalid OTP");
    } finally {
      setEmailOtpLoading(false);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (step === 1) {
      // Basic Details
      if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
      if (!formData.dob) newErrors.dob = "Date of birth is required";
      if (!formData.gender) newErrors.gender = "Gender is required";
      if (!formData.photo) newErrors.photo = "Live photo is required";
    }

    if (step === 2) {
      // Contact Details
      if (!formData.phone || formData.phone.length !== 10) newErrors.phone = "Valid 10-digit phone required";
      if (!formData.phoneOtpVerified) newErrors.phoneOtpVerified = "Please verify your phone number";
      if (!formData.email.trim()) newErrors.email = "Email is required";
      if (!formData.emailOtpVerified) newErrors.emailOtpVerified = "Please verify your email";
      if (!formData.currentAddress.trim()) newErrors.currentAddress = "Current address is required";
      if (!formData.sameAsCurrentAddress && !formData.permanentAddress.trim()) {
        newErrors.permanentAddress = "Permanent address is required";
      }
    }

    if (step === 3) {
      // Education
      if (!formData.qualification.trim()) newErrors.qualification = "Qualification is required";
      if (!formData.educationStatus) newErrors.educationStatus = "Education status is required";
    }

    if (step === 4) {
      // Work Experience
      if (!formData.totalExperience) newErrors.totalExperience = "Total experience is required";
    }

    if (step === 5) {
      // Other Information
      if (!formData.maritalStatus) newErrors.maritalStatus = "Marital status is required";
      if (!formData.bloodGroup) newErrors.bloodGroup = "Blood group is required";
      if (!formData.tshirtSize) newErrors.tshirtSize = "T-shirt size is required";
      if (!formData.lowerSize) newErrors.lowerSize = "Lower size is required";
      if (!formData.aadhaarNumber || formData.aadhaarNumber.length !== 12) {
        newErrors.aadhaarNumber = "Valid 12-digit Aadhaar number required";
      }
      if (!formData.panNumber || formData.panNumber.length !== 10) {
        newErrors.panNumber = "Valid 10-character PAN number required";
      }
      if (!formData.dateOfJoining) newErrors.dateOfJoining = "Date of joining is required";
    }

    if (step === 6) {
      // Verification
      if (!formData.aadhaarVerified) newErrors.aadhaarVerified = "Please verify your Aadhaar via DigiLocker";
      if (!formData.panDocument) newErrors.panDocument = "PAN document is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (validateStep(currentStep)) {
      // Save draft to backend
      try {
        console.log("\n📋 STEP", currentStep, "- Current formData state:");
        console.log("  Employment Details:");
        console.log("    covidVaccinated:", formData.covidVaccinated, typeof formData.covidVaccinated);
        console.log("    hepatitisVaccinated:", formData.hepatitisVaccinated, typeof formData.hepatitisVaccinated);
        console.log("    typhoidVaccinated:", formData.typhoidVaccinated, typeof formData.typhoidVaccinated);
        console.log("    designation:", formData.designation);
        console.log("    dateOfJoining:", formData.dateOfJoining);
        console.log("    department:", formData.department);
        
        const draftData = {
          // Step 1: Basic Details
          fullName: formData.fullName,
          dob: formData.dob,
          gender: formData.gender,
          
          // Step 2: Contact Details
          phone: formData.phone,
          phoneOtpVerified: formData.phoneOtpVerified,
          phone2: formData.phone2,
          email: formData.email,
          emailOtpVerified: formData.emailOtpVerified,
          currentAddress: formData.currentAddress,
          permanentAddress: formData.permanentAddress,
          sameAsCurrentAddress: formData.sameAsCurrentAddress,
          
          // Step 3: Education
          qualification: formData.qualification,
          specialization: formData.specialization,
          educationStatus: formData.educationStatus,
          
          // Step 4: Work Experience
          totalExperience: formData.totalExperience,
          lastDesignation: formData.lastDesignation,
          
          // Step 5: Other Information
          maritalStatus: formData.maritalStatus,
          bloodGroup: formData.bloodGroup,
          tshirtSize: formData.tshirtSize,
          lowerSize: formData.lowerSize,
          aadhaarNumber: formData.aadhaarNumber,
          panNumber: formData.panNumber,
          
          // Step 6: Verification
          aadhaarVerified: formData.aadhaarVerified,
          
          // Step 7: Employment Details
          covidVaccinated: formData.covidVaccinated,
          hepatitisVaccinated: formData.hepatitisVaccinated,
          typhoidVaccinated: formData.typhoidVaccinated,
          designation: formData.designation,
          dateOfJoining: formData.dateOfJoining,
          fieldCoach: fieldCoachName || formData.fieldCoach || "",
          department: formData.department,
          storeName: outletDetails?.name || outlet || "",
          
          role,
          outlet,
          currentStep: currentStep + 1
        };

        console.log("=== FRONTEND SENDING ===");
        console.log("Full formData state:", formData);
        console.log("Employment Details being sent:", {
          covidVaccinated: draftData.covidVaccinated,
          hepatitisVaccinated: draftData.hepatitisVaccinated,
          typhoidVaccinated: draftData.typhoidVaccinated,
          designation: draftData.designation,
          dateOfJoining: draftData.dateOfJoining,
          fieldCoach: draftData.fieldCoach,
          department: draftData.department,
          storeName: draftData.storeName
        });
        console.log("Outlet details:", outletDetails);
        console.log("Field coach name:", fieldCoachName);

        const response = await apiService.saveDraft(draftData);
        console.log("Save draft response:", response);
        
        if (response.success && response.onboarding) {
          const id = response.onboarding._id || response.onboarding.id;
          console.log("Setting onboarding ID:", id);
          setOnboardingId(id);
          localStorage.setItem("onboarding_phone", formData.phone);
          
          // Move to next step only after successful save
          if (currentStep < STEPS.length) {
            setCurrentStep(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        } else {
          toast.error("Failed to save progress. Please try again.");
        }
      } catch (error: any) {
        console.error("Failed to save draft:", error);
        toast.error(error.message || "Failed to save progress. Please try again.");
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    console.log("handleSubmit called, onboardingId:", onboardingId);
    
    if (!onboardingId) {
      toast.error("Please complete all steps first");
      console.error("No onboarding ID found");
      return;
    }

    // Validate current step before submission
    if (!validateStep(currentStep)) {
      toast.error("Please complete all required fields");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Save the current step data before submitting
      const draftData = {
        fullName: formData.fullName,
        dob: formData.dob,
        gender: formData.gender,
        phone: formData.phone,
        phoneOtpVerified: formData.phoneOtpVerified,
        phone2: formData.phone2,
        email: formData.email,
        emailOtpVerified: formData.emailOtpVerified,
        currentAddress: formData.currentAddress,
        permanentAddress: formData.permanentAddress,
        sameAsCurrentAddress: formData.sameAsCurrentAddress,
        qualification: formData.qualification,
        specialization: formData.specialization,
        educationStatus: formData.educationStatus,
        totalExperience: formData.totalExperience,
        lastDesignation: formData.lastDesignation,
        maritalStatus: formData.maritalStatus,
        bloodGroup: formData.bloodGroup,
        tshirtSize: formData.tshirtSize,
        lowerSize: formData.lowerSize,
        aadhaarNumber: formData.aadhaarNumber,
        panNumber: formData.panNumber,
        aadhaarVerified: formData.aadhaarVerified,
        covidVaccinated: formData.covidVaccinated,
        hepatitisVaccinated: formData.hepatitisVaccinated,
        typhoidVaccinated: formData.typhoidVaccinated,
        designation: formData.designation,
        dateOfJoining: formData.dateOfJoining,
        fieldCoach: fieldCoachName || formData.fieldCoach || "",
        department: formData.department,
        storeName: outletDetails?.name || outlet || "",
        role,
        outlet,
        currentStep: currentStep
      };

      console.log("Saving final draft before submission, aadhaarVerified:", formData.aadhaarVerified);
      await apiService.saveDraft(draftData);
      
      // Upload documents if not already uploaded
      const hasDocuments = formData.photo || formData.educationCertificate || 
                          formData.experienceDocument || formData.idDocuments || 
                          formData.panDocument;
      
      if (hasDocuments) {
        console.log("Uploading documents...");
        const uploadFormData = new FormData();
        
        if (formData.photo) uploadFormData.append('photo', formData.photo);
        if (formData.educationCertificate) uploadFormData.append('educationCertificate', formData.educationCertificate);
        if (formData.experienceDocument) uploadFormData.append('experienceDocument', formData.experienceDocument);
        if (formData.idDocuments) uploadFormData.append('idDocuments', formData.idDocuments);
        if (formData.panDocument) uploadFormData.append('panDocument', formData.panDocument);

        await apiService.uploadDocuments(onboardingId, uploadFormData);
        console.log("Documents uploaded successfully");
      }

      // Submit application
      console.log("Submitting application...");
      const response = await apiService.submitApplication(onboardingId);

      if (response.success) {
        // Clear draft data
        localStorage.removeItem("onboarding_phone");
        
        toast.success("Application submitted successfully!");
        navigate("/", { state: { submitted: true } });
      }
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error(error.message || "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        // Step 1: Basic Details
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <Label htmlFor="fullName" className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Full Name *
              </Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                placeholder="Enter your full name"
                className={errors.fullName ? "border-destructive" : ""}
              />
              {errors.fullName && <p className="mt-1 text-xs text-destructive">{errors.fullName}</p>}
            </div>

            <div>
              <Label htmlFor="dob" className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                Date of Birth *
              </Label>
              <Input
                id="dob"
                type="date"
                value={formData.dob}
                onChange={(e) => updateField("dob", e.target.value)}
                className={errors.dob ? "border-destructive" : ""}
              />
              {errors.dob && <p className="mt-1 text-xs text-destructive">{errors.dob}</p>}
            </div>

            <div>
              <Label htmlFor="gender" className="mb-2 block">Gender *</Label>
              <select
                id="gender"
                value={formData.gender}
                onChange={(e) => updateField("gender", e.target.value)}
                className={`w-full rounded-md border ${errors.gender ? 'border-destructive' : 'border-input'} bg-background px-3 py-2 text-sm`}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && <p className="mt-1 text-xs text-destructive">{errors.gender}</p>}
            </div>

            <FileUploader
              label="Live Photo (Camera Capture) *"
              accept="image/*"
              maxSize={2}
              value={formData.photo}
              onFileSelect={(file) => updateField("photo", file)}
              error={errors.photo}
              hint="Clear face photo, max 2MB"
              enableCamera={true}
            />
          </div>
        );

      case 2:
        // Step 2: Contact Details
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                Phone 1 (WhatsApp) *
              </Label>
              <PhoneInput
                value={formData.phone}
                onChange={(value) => updateField("phone", value)}
                error={errors.phone}
                disabled={formData.phoneOtpVerified}
              />
              
              {!formData.phoneOtpVerified && !phoneOtpSent && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={handleSendPhoneOtp}
                  disabled={phoneOtpLoading || !formData.phone || formData.phone.length !== 10}
                >
                  {phoneOtpLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Send OTP
                </Button>
              )}

              {phoneOtpSent && !formData.phoneOtpVerified && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={phoneOtpInput}
                      onChange={(e) => setPhoneOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleVerifyPhoneOtp}
                      disabled={phoneOtpLoading || phoneOtpInput.length !== 6}
                      size="sm"
                    >
                      {phoneOtpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                    </Button>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>OTP sent to +91 {formData.phone}</span>
                    {phoneOtpTimer > 0 ? (
                      <span>Resend in {phoneOtpTimer}s</span>
                    ) : (
                      <button onClick={handleSendPhoneOtp} className="text-primary hover:underline">
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>
              )}

              {formData.phoneOtpVerified && (
                <div className="mt-2 flex items-center gap-2 text-sm text-success">
                  <CheckCircle className="w-4 h-4" />
                  <span>Phone verified successfully</span>
                </div>
              )}
              
              {errors.phoneOtpVerified && <p className="mt-1 text-xs text-destructive">{errors.phoneOtpVerified}</p>}
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                Phone 2 (Optional)
              </Label>
              <PhoneInput
                value={formData.phone2}
                onChange={(value) => updateField("phone2", value)}
              />
            </div>

            <div>
              <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="your@email.com"
                className={errors.email ? "border-destructive" : ""}
                disabled={formData.emailOtpVerified}
              />
              
              {!formData.emailOtpVerified && !emailOtpSent && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={handleSendEmailOtp}
                  disabled={emailOtpLoading || !formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)}
                >
                  {emailOtpLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Send OTP
                </Button>
              )}

              {emailOtpSent && !formData.emailOtpVerified && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={emailOtpInput}
                      onChange={(e) => setEmailOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleVerifyEmailOtp}
                      disabled={emailOtpLoading || emailOtpInput.length !== 6}
                      size="sm"
                    >
                      {emailOtpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                    </Button>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>OTP sent to {formData.email}</span>
                    {emailOtpTimer > 0 ? (
                      <span>Resend in {emailOtpTimer}s</span>
                    ) : (
                      <button onClick={handleSendEmailOtp} className="text-primary hover:underline">
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>
              )}

              {formData.emailOtpVerified && (
                <div className="mt-2 flex items-center gap-2 text-sm text-success">
                  <CheckCircle className="w-4 h-4" />
                  <span>Email verified successfully</span>
                </div>
              )}

              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
              {errors.emailOtpVerified && <p className="mt-1 text-xs text-destructive">{errors.emailOtpVerified}</p>}
            </div>

            <div>
              <Label htmlFor="currentAddress" className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                Current Address *
              </Label>
              <Textarea
                id="currentAddress"
                value={formData.currentAddress}
                onChange={(e) => updateField("currentAddress", e.target.value)}
                placeholder="Enter your current address"
                rows={3}
                className={errors.currentAddress ? "border-destructive" : ""}
              />
              {errors.currentAddress && <p className="mt-1 text-xs text-destructive">{errors.currentAddress}</p>}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sameAddress"
                checked={formData.sameAsCurrentAddress}
                onChange={(e) => {
                  updateField("sameAsCurrentAddress", e.target.checked);
                  if (e.target.checked) {
                    updateField("permanentAddress", formData.currentAddress);
                  }
                }}
                className="rounded border-input"
              />
              <Label htmlFor="sameAddress" className="text-sm">Same as current address</Label>
            </div>

            {!formData.sameAsCurrentAddress && (
              <div>
                <Label htmlFor="permanentAddress" className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  Permanent Address *
                </Label>
                <Textarea
                  id="permanentAddress"
                  value={formData.permanentAddress}
                  onChange={(e) => updateField("permanentAddress", e.target.value)}
                  placeholder="Enter your permanent address"
                  rows={3}
                  className={errors.permanentAddress ? "border-destructive" : ""}
                />
                {errors.permanentAddress && <p className="mt-1 text-xs text-destructive">{errors.permanentAddress}</p>}
              </div>
            )}
          </div>
        );

      case 3:
        // Step 3: Education
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <Label htmlFor="qualification" className="mb-2 block">Qualification *</Label>
              <Input
                id="qualification"
                value={formData.qualification}
                onChange={(e) => updateField("qualification", e.target.value)}
                placeholder="e.g., B.Sc, MBA, 12th"
                className={errors.qualification ? "border-destructive" : ""}
              />
              {errors.qualification && <p className="mt-1 text-xs text-destructive">{errors.qualification}</p>}
            </div>

            <div>
              <Label htmlFor="specialization" className="mb-2 block">Specialization</Label>
              <Input
                id="specialization"
                value={formData.specialization}
                onChange={(e) => updateField("specialization", e.target.value)}
                placeholder="e.g., Computer Science, Commerce"
              />
            </div>

            <div>
              <Label htmlFor="educationStatus" className="mb-2 block">Status *</Label>
              <select
                id="educationStatus"
                value={formData.educationStatus}
                onChange={(e) => updateField("educationStatus", e.target.value)}
                className={`w-full rounded-md border ${errors.educationStatus ? 'border-destructive' : 'border-input'} bg-background px-3 py-2 text-sm`}
              >
                <option value="">Select status</option>
                <option value="completed">Completed</option>
                <option value="pursuing">Pursuing</option>
              </select>
              {errors.educationStatus && <p className="mt-1 text-xs text-destructive">{errors.educationStatus}</p>}
            </div>

            <FileUploader
              label="Marksheet/Certificate"
              accept="image/*,.pdf"
              maxSize={5}
              value={formData.educationCertificate}
              onFileSelect={(file) => updateField("educationCertificate", file)}
              hint="Upload education certificate, max 5MB"
            />
          </div>
        );

      case 4:
        // Step 4: Work Experience
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <Label htmlFor="totalExperience" className="mb-2 block">Total Years of Experience *</Label>
              <select
                id="totalExperience"
                value={formData.totalExperience}
                onChange={(e) => updateField("totalExperience", e.target.value)}
                className={`w-full rounded-md border ${errors.totalExperience ? 'border-destructive' : 'border-input'} bg-background px-3 py-2 text-sm`}
              >
                <option value="">Select experience</option>
                <option value="0">Fresher</option>
                <option value="1">1 Year</option>
                <option value="2">2 Years</option>
                <option value="3">3 Years</option>
                <option value="4">4 Years</option>
                <option value="5">5+ Years</option>
              </select>
              {errors.totalExperience && <p className="mt-1 text-xs text-destructive">{errors.totalExperience}</p>}
            </div>

            <div>
              <Label htmlFor="lastDesignation" className="mb-2 block">Last Designation</Label>
              <Input
                id="lastDesignation"
                value={formData.lastDesignation}
                onChange={(e) => updateField("lastDesignation", e.target.value)}
                placeholder="e.g., Assistant Manager, Chef"
              />
            </div>

            <FileUploader
              label="Experience Letter/Resume"
              accept="image/*,.pdf"
              maxSize={5}
              value={formData.experienceDocument}
              onFileSelect={(file) => updateField("experienceDocument", file)}
              hint="Upload experience letter or resume, max 5MB"
            />
          </div>
        );

      case 5:
        // Step 5: Other Relevant Information
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maritalStatus" className="mb-2 block">Marital Status *</Label>
                <select
                  id="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={(e) => updateField("maritalStatus", e.target.value)}
                  className={`w-full rounded-md border ${errors.maritalStatus ? 'border-destructive' : 'border-input'} bg-background px-3 py-2 text-sm`}
                >
                  <option value="">Select status</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                </select>
                {errors.maritalStatus && <p className="mt-1 text-xs text-destructive">{errors.maritalStatus}</p>}
              </div>

              <div>
                <Label htmlFor="bloodGroup" className="mb-2 block">Blood Group *</Label>
                <select
                  id="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={(e) => updateField("bloodGroup", e.target.value)}
                  className={`w-full rounded-md border ${errors.bloodGroup ? 'border-destructive' : 'border-input'} bg-background px-3 py-2 text-sm`}
                >
                  <option value="">Select blood group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
                {errors.bloodGroup && <p className="mt-1 text-xs text-destructive">{errors.bloodGroup}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateOfJoining" className="mb-2 block">Date of Joining *</Label>
                <Input
                  id="dateOfJoining"
                  type="date"
                  value={formData.dateOfJoining}
                  onChange={(e) => updateField("dateOfJoining", e.target.value)}
                  className={errors.dateOfJoining ? "border-destructive" : ""}
                />
                {errors.dateOfJoining && <p className="mt-1 text-xs text-destructive">{errors.dateOfJoining}</p>}
              </div>

              <div>
                <Label className="mb-3 block font-medium">Vaccination Status</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="covidVaccinated"
                    checked={formData.covidVaccinated}
                    onChange={(e) => updateField("covidVaccinated", e.target.checked)}
                    className="rounded border-input mt-2"
                  />
                  <Label htmlFor="covidVaccinated" className="text-sm font-normal mt-2">COVID-19 Vaccinated</Label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tshirtSize" className="mb-2 block">T-shirt Size *</Label>
                <select
                  id="tshirtSize"
                  value={formData.tshirtSize}
                  onChange={(e) => updateField("tshirtSize", e.target.value)}
                  className={`w-full rounded-md border ${errors.tshirtSize ? 'border-destructive' : 'border-input'} bg-background px-3 py-2 text-sm`}
                >
                  <option value="">Select</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                </select>
                {errors.tshirtSize && <p className="mt-1 text-xs text-destructive">{errors.tshirtSize}</p>}
              </div>

              <div>
                <Label htmlFor="lowerSize" className="mb-2 block">Lower Size *</Label>
                <select
                  id="lowerSize"
                  value={formData.lowerSize}
                  onChange={(e) => updateField("lowerSize", e.target.value)}
                  className={`w-full rounded-md border ${errors.lowerSize ? 'border-destructive' : 'border-input'} bg-background px-3 py-2 text-sm`}
                >
                  <option value="">Select</option>
                  <option value="28">28</option>
                  <option value="30">30</option>
                  <option value="32">32</option>
                  <option value="34">34</option>
                  <option value="36">36</option>
                  <option value="38">38</option>
                  <option value="40">40</option>
                </select>
                {errors.lowerSize && <p className="mt-1 text-xs text-destructive">{errors.lowerSize}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="aadhaarNumber" className="mb-2 block">Aadhaar Number *</Label>
              <Input
                id="aadhaarNumber"
                value={formData.aadhaarNumber}
                onChange={(e) => updateField("aadhaarNumber", e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder="Enter 12-digit Aadhaar number"
                maxLength={12}
                className={errors.aadhaarNumber ? "border-destructive" : ""}
              />
              {errors.aadhaarNumber && <p className="mt-1 text-xs text-destructive">{errors.aadhaarNumber}</p>}
            </div>

            <div>
              <Label htmlFor="panNumber" className="mb-2 block">PAN Number *</Label>
              <Input
                id="panNumber"
                value={formData.panNumber}
                onChange={(e) => updateField("panNumber", e.target.value.toUpperCase().slice(0, 10))}
                placeholder="Enter PAN number (e.g., ABCDE1234F)"
                maxLength={10}
                className={errors.panNumber ? "border-destructive" : ""}
              />
              {errors.panNumber && <p className="mt-1 text-xs text-destructive">{errors.panNumber}</p>}
            </div>

            <FileUploader
              label="ID Attachments (Aadhaar)"
              accept="image/*,.pdf"
              maxSize={5}
              value={formData.idDocuments}
              onFileSelect={(file) => updateField("idDocuments", file)}
              hint="Upload Aadhaar document, max 5MB"
            />

          </div>
        );

      case 6:
        // Step 6: Verification
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Verify Your Identity
              </h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                We use DigiLocker for secure Aadhaar verification. Your data is protected and never stored on our servers.
              </p>
            </div>

            <DigiLockerButton
              status={formData.aadhaarVerified ? "verified" : "idle"}
              onVerify={async () => {
                updateField("aadhaarVerified", true);
                return true;
              }}
            />

            {!formData.aadhaarVerified && (
              <div className="pt-4 border-t border-border">
                {/* <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <input
                    type="checkbox"
                    id="manualVerification"
                    checked={formData.aadhaarVerified}
                    onChange={(e) => updateField("aadhaarVerified", e.target.checked)}
                    className="mt-1 rounded border-input"
                  />
                  <div className="flex-1">
                    <Label htmlFor="manualVerification" className="text-sm font-medium cursor-pointer">
                      I confirm that I have uploaded valid Aadhaar documents and the information provided is accurate
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      By checking this box, you confirm that your Aadhaar details are correct and documents are authentic
                    </p>
                  </div>
                </div> */}
              </div>
            )}

            {errors.aadhaarVerified && (
              <p className="text-center text-sm text-destructive">{errors.aadhaarVerified}</p>
            )}

            <div className="pt-6 border-t border-border">
              <FileUploader
                label="PAN Document *"
                accept="image/*,.pdf"
                maxSize={5}
                value={formData.panDocument}
                onFileSelect={(file) => updateField("panDocument", file)}
                error={errors.panDocument}
                hint="Upload clear copy of PAN card, max 5MB"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => currentStep > 1 ? handleBack() : navigate("/")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold text-foreground">Onboarding</h1>
            <p className="text-xs text-muted-foreground">Step {currentStep} of {STEPS.length}</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Progress Stepper */}
        <ProgressStepper steps={STEPS} currentStep={currentStep} className="mb-8" />

        {/* Form Content */}
        <div className="max-w-lg mx-auto">
          <div className="card-elevated p-6 mb-6">
            {renderStep()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-3">
            {currentStep > 1 && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            
            {currentStep < STEPS.length ? (
              <Button onClick={handleNext} className="flex-1 btn-accent">
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="flex-1 bg-success hover:bg-success/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Submit Application
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Onboarding;
