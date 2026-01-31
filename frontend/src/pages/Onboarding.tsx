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
  idType: string;
  idDocuments: File | null;
  dateOfJoining: string;
  covidVaccinated: boolean;

  // Step 6: Verification
  aadhaarVerified: boolean;
  panVerified: boolean;
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
  
  // Check if returning from Digilocker BEFORE any state initialization
  const urlParams = new URLSearchParams(window.location.search);
  const isDigilockerReturn = urlParams.get('type') === 'digilocker' && !!urlParams.get('client_id');
  
  // Get role and outlet from location state or localStorage
  const getRoleAndOutlet = () => {
    const stateRole = location.state?.role;
    const stateOutlet = location.state?.outlet;
    
    if (stateRole && stateOutlet) {
      // Save to localStorage for persistence across redirects
      localStorage.setItem('onboarding_role', stateRole);
      localStorage.setItem('onboarding_outlet', stateOutlet);
      return { role: stateRole, outlet: stateOutlet };
    }
    
    // Try to restore from localStorage
    return {
      role: localStorage.getItem('onboarding_role'),
      outlet: localStorage.getItem('onboarding_outlet')
    };
  };
  
  const { role, outlet } = getRoleAndOutlet();

  // If returning from Digilocker, start with loading state
  const [isDigilockerLoading, setIsDigilockerLoading] = useState<boolean>(isDigilockerReturn);
  const [currentStep, setCurrentStep] = useState(isDigilockerReturn ? 6 : 1);
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
    idType: "aadhaar",
    idDocuments: null,
    dateOfJoining: "",
    covidVaccinated: false,

    // Step 6: Verification
    aadhaarVerified: false,
    panVerified: false,
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

  // Verification state for Aadhaar and PAN
  const [aadhaarTransactionId, setAadhaarTransactionId] = useState<string>("");
  const [aadhaarEsignUrl, setAadhaarEsignUrl] = useState<string>("");
  const [aadhaarVerificationLoading, setAadhaarVerificationLoading] = useState(false);
  const [aadhaarStatusChecking, setAadhaarStatusChecking] = useState(false);
  
  const [panVerifying, setPanVerifying] = useState(false);

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

  // Check for Digilocker completion on page load
  useEffect(() => {
    const handleDigilockerReturn = async () => {
      // Parse URL parameters from Surepass redirect
      const urlParams = new URLSearchParams(window.location.search);
      const clientId = urlParams.get('client_id');
      const status = urlParams.get('status');
      const type = urlParams.get('type');
      
      // Check if this is a Digilocker return
      if (type === 'digilocker' && clientId) {
        console.log('🔄 Detected return from Digilocker');
        console.log('📝 Client ID:', clientId);
        console.log('📝 Status:', status);
        
        // Clean URL immediately
        window.history.replaceState({}, '', window.location.pathname);
        
        // Get saved data
        const savedPhone = localStorage.getItem("onboarding_phone");
        const savedOnboardingId = localStorage.getItem("onboarding_id");
        
        if (!savedPhone) {
          console.error('❌ No saved phone found');
          toast.error("Session expired. Please start over.");
          return;
        }
        
        console.log('📞 Saved phone:', savedPhone);
        console.log('📋 Saved onboarding ID:', savedOnboardingId);
        
        // Show loading state
        if (status === 'success') {
          toast.info("Verifying your Aadhaar with Digilocker...");
        } else {
          toast.warning("Digilocker verification was not completed. Please try again.");
        }
        
        try {
          // Step 1: Verify with backend (backend will check with Surepass and update database)
          console.log('📡 Calling backend to verify Digilocker status...');
          const verificationResponse = await apiService.checkAadhaarVerificationStatus(
            clientId,
            savedOnboardingId,
            status // Pass the status from URL
          );
          
          console.log('📊 Verification response:', verificationResponse);
          
          // Step 2: Load the updated draft from database
          console.log('📥 Loading draft from database...');
          const draftResponse = await apiService.getDraft(savedPhone);
          
          if (!draftResponse.success || !draftResponse.onboarding) {
            throw new Error('Failed to load onboarding data');
          }
          
          const draft = draftResponse.onboarding;
          console.log('✅ Draft loaded:', {
            id: draft._id,
            name: draft.fullName,
            aadhaarVerified: draft.aadhaarVerified
          });
          
          // Step 3: Update form state with all draft data
          setFormData(prev => ({
            ...prev,
            fullName: draft.fullName || "",
            dob: draft.dob ? new Date(draft.dob).toISOString().split('T')[0] : "",
            gender: draft.gender || "",
            phone: draft.phone || "",
            phoneOtpVerified: draft.phoneOtpVerified || false,
            phone2: draft.phone2 || "",
            email: draft.email || "",
            emailOtpVerified: draft.emailOtpVerified || false,
            currentAddress: draft.currentAddress || "",
            permanentAddress: draft.permanentAddress || "",
            sameAsCurrentAddress: draft.sameAsCurrentAddress || false,
            qualification: draft.qualification || "",
            specialization: draft.specialization || "",
            educationStatus: draft.educationStatus || "",
            totalExperience: draft.totalExperience || "",
            lastDesignation: draft.lastDesignation || "",
            maritalStatus: draft.maritalStatus || "",
            bloodGroup: draft.bloodGroup || "",
            tshirtSize: draft.tshirtSize || "",
            lowerSize: draft.lowerSize || "",
            aadhaarNumber: draft.aadhaarNumber || "",
            panNumber: draft.panNumber || "",
            idType: draft.idType || "",
            dateOfJoining: draft.dateOfJoining ? new Date(draft.dateOfJoining).toISOString().split('T')[0] : "",
            covidVaccinated: draft.covidVaccinated || false,
            aadhaarVerified: draft.aadhaarVerified || false,
            panVerified: draft.panVerified || false,
            hepatitisVaccinated: draft.hepatitisVaccinated || false,
            typhoidVaccinated: draft.typhoidVaccinated || false,
            designation: draft.designation || "",
            fieldCoach: draft.fieldCoach || "",
            department: draft.department || "",
            storeName: draft.storeName || "",
          }));
          
          setOnboardingId(draft._id);
          
          // Step 4: Navigate to Step 6 (Verification)
          setCurrentStep(6);
          setIsDigilockerLoading(false);
          console.log('✅ Navigated to Step 6');
          
          // Step 5: Show verification result
          if (draft.aadhaarVerified) {
            toast.success("✅ Your Aadhaar has been verified successfully via Digilocker!");
            localStorage.removeItem('digilocker_client_id');
          } else if (status === 'success') {
            toast.info("Verification completed. Your Aadhaar is now verified!");
          } else {
            toast.warning("Verification not completed. Please try again.");
          }
          
        } catch (error: any) {
          console.error('❌ Error handling Digilocker return:', error);
          toast.error(error.message || "Failed to verify Aadhaar. Please try again.");
          
          // Still try to load the draft and go to step 6
          try {
            const savedPhone = localStorage.getItem("onboarding_phone");
            if (savedPhone) {
              const draftResponse = await apiService.getDraft(savedPhone);
              if (draftResponse.success && draftResponse.onboarding) {
                const draft = draftResponse.onboarding;
                setFormData(prev => ({
                  ...prev,
                  fullName: draft.fullName || "",
                  dob: draft.dob ? new Date(draft.dob).toISOString().split('T')[0] : "",
                  gender: draft.gender || "",
                  phone: draft.phone || "",
                  phoneOtpVerified: draft.phoneOtpVerified || false,
                  phone2: draft.phone2 || "",
                  email: draft.email || "",
                  emailOtpVerified: draft.emailOtpVerified || false,
                  currentAddress: draft.currentAddress || "",
                  permanentAddress: draft.permanentAddress || "",
                  sameAsCurrentAddress: draft.sameAsCurrentAddress || false,
                  qualification: draft.qualification || "",
                  specialization: draft.specialization || "",
                  educationStatus: draft.educationStatus || "",
                  totalExperience: draft.totalExperience || "",
                  lastDesignation: draft.lastDesignation || "",
                  maritalStatus: draft.maritalStatus || "",
                  bloodGroup: draft.bloodGroup || "",
                  tshirtSize: draft.tshirtSize || "",
                  lowerSize: draft.lowerSize || "",
                  aadhaarNumber: draft.aadhaarNumber || "",
                  panNumber: draft.panNumber || "",
                  idType: draft.idType || "",
                  dateOfJoining: draft.dateOfJoining ? new Date(draft.dateOfJoining).toISOString().split('T')[0] : "",
                  covidVaccinated: draft.covidVaccinated || false,
                  aadhaarVerified: draft.aadhaarVerified || false,
                  panVerified: draft.panVerified || false,
                }));
                setOnboardingId(draft._id);
                setCurrentStep(6);
              }
            }
          } catch (loadError) {
            console.error('❌ Failed to load draft:', loadError);
          }
        } finally {
          // Always set loading to false when done
          setIsDigilockerLoading(false);
        }
      } else {
        // Not returning from Digilocker, set loading to false
        setIsDigilockerLoading(false);
      }
    };
    
    handleDigilockerReturn();
  }, []); // Run only once on mount

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

  // Load existing draft from backend if available (only on fresh page load, not Digilocker return)
  useEffect(() => {
    const loadDraft = async () => {
      // Skip if returning from Digilocker (check URL first since it's more reliable)
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('type') === 'digilocker' || urlParams.get('client_id')) {
        console.log('⏭️ Skipping general draft load - returning from Digilocker');
        return;
      }
      
      const savedPhone = localStorage.getItem("onboarding_phone");
      if (savedPhone) {
        try {
          const response = await apiService.getDraft(savedPhone);
          if (response.success && response.onboarding) {
            const draft = response.onboarding;
            
            // Map all draft fields to formData
            setFormData(prev => ({
              ...prev,
              // Step 1
              fullName: draft.fullName || "",
              dob: draft.dob ? new Date(draft.dob).toISOString().split('T')[0] : "",
              gender: draft.gender || "",
              
              // Step 2
              phone: draft.phone || "",
              phoneOtpVerified: draft.phoneOtpVerified || false,
              phone2: draft.phone2 || "",
              email: draft.email || "",
              emailOtpVerified: draft.emailOtpVerified || false,
              currentAddress: draft.currentAddress || "",
              permanentAddress: draft.permanentAddress || "",
              sameAsCurrentAddress: draft.sameAsCurrentAddress || false,
              
              // Step 3
              qualification: draft.qualification || "",
              specialization: draft.specialization || "",
              educationStatus: draft.educationStatus || "",
              
              // Step 4
              totalExperience: draft.totalExperience || "",
              lastDesignation: draft.lastDesignation || "",
              
              // Step 5
              maritalStatus: draft.maritalStatus || "",
              bloodGroup: draft.bloodGroup || "",
              tshirtSize: draft.tshirtSize || "",
              lowerSize: draft.lowerSize || "",
              aadhaarNumber: draft.aadhaarNumber || "",
              panNumber: draft.panNumber || "",
              idType: draft.idType || "",
              dateOfJoining: draft.dateOfJoining ? new Date(draft.dateOfJoining).toISOString().split('T')[0] : "",
              covidVaccinated: draft.covidVaccinated || false,
              
              // Step 6
              aadhaarVerified: draft.aadhaarVerified || false,
              panVerified: draft.panVerified || false,
              
              // Employment
              hepatitisVaccinated: draft.hepatitisVaccinated || false,
              typhoidVaccinated: draft.typhoidVaccinated || false,
              designation: draft.designation || "",
              fieldCoach: draft.fieldCoach || "",
              department: draft.department || "",
              storeName: draft.storeName || "",
            }));
            
            // Restore transaction ID if exists in database
            if (draft.aadhaarTransactionId) {
              setAadhaarTransactionId(draft.aadhaarTransactionId);
              console.log('📦 Restored transaction ID from database:', draft.aadhaarTransactionId);
            }
            
            // Restore to saved step from database
            setCurrentStep(draft.currentStep || 1);
            setOnboardingId(draft._id);
            
            console.log('✅ Draft loaded successfully, current step:', draft.currentStep);
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

  // PAN Verification handler
  const handleVerifyPAN = async () => {
    if (!formData.panNumber || formData.panNumber.length !== 10) {
      toast.error("Please enter a valid 10-character PAN number");
      return;
    }

    setPanVerifying(true);
    try {
      const response = await apiService.verifyPAN(
        formData.panNumber,
        formData.fullName,
        formData.dob,
        onboardingId || undefined
      );
      
      if (response.success && response.verified) {
        updateField("panVerified", true);
        toast.success("PAN verified successfully!");
      } else {
        toast.error(response.message || "PAN verification failed");
      }
    } catch (error: any) {
      toast.error(error.message || "PAN verification failed");
    } finally {
      setPanVerifying(false);
    }
  };

  // Aadhaar Verification handlers (Digilocker via Surepass)
  const handleInitiateAadhaarVerification = async () => {
    // Validation
    if (!formData.fullName || formData.fullName.trim().length < 2) {
      toast.error("Please enter your full name in Step 1");
      return;
    }

    console.log('🔍 Initiating Digilocker verification');

    setAadhaarVerificationLoading(true);
    try {
      // Use production URL for redirect
      const redirectUrl = window.location.hostname === 'localhost' 
        ? 'https://burgersingfrontend.kamaaupoot.in/onboarding'
        : window.location.origin + '/onboarding';

      console.log('🔗 Using redirect URL:', redirectUrl);
      
      const response = await apiService.initiateAadhaarVerification(
        redirectUrl,
        onboardingId
      );

      console.log('✅ Digilocker response:', response);
      
      if (response.success && response.digilockerUrl) {
        console.log('📝 Storing client ID:', response.clientId);
        toast.success(response.message || "Digilocker Link initiated. Redirecting to verification portal...");
        
        // Store client_id for later status check
        if (response.clientId) {
          localStorage.setItem('digilocker_client_id', response.clientId);
          console.log('💾 Stored client_id in localStorage:', response.clientId);
        }
        
        // Also store onboarding_id for restoration after redirect
        if (onboardingId) {
          localStorage.setItem('onboarding_id', onboardingId);
          console.log('💾 Stored onboarding_id in localStorage:', onboardingId);
        }
        
        // Make sure phone is saved for draft restoration
        if (formData.phone) {
          localStorage.setItem('onboarding_phone', formData.phone);
          console.log('💾 Stored phone in localStorage:', formData.phone);
        }
        
        // Save current step so we can restore to step 6 after redirect
        localStorage.setItem('onboarding_step', '6');
        
        // Redirect to Surepass Digilocker portal
        setTimeout(() => {
          window.location.href = response.digilockerUrl;
        }, 1500);
      } else {
        console.error('❌ Digilocker initiation failed:', response);
        toast.error(response.message || "Failed to initiate Aadhaar verification via Digilocker");
      }
    } catch (error: any) {
      console.error('❌ Digilocker error:', error);
      toast.error(error.message || "Failed to initiate Aadhaar verification");
    } finally {
      setAadhaarVerificationLoading(false);
    }
  };

  const handleCheckAadhaarStatus = async () => {
    if (!onboardingId) {
      toast.error("No onboarding record found. Please complete previous steps first.");
      return;
    }

    console.log('🔍 Checking status from database...');
    console.log('📋 Onboarding ID:', onboardingId);

    setAadhaarStatusChecking(true);
    try {
      const clientId = localStorage.getItem('digilocker_client_id') || undefined;
      
      const response = await apiService.checkAadhaarVerificationStatus(
        clientId,
        onboardingId
      );
      
      console.log('📊 Status response:', response);
      
      if (response.success && response.verified) {
        updateField("aadhaarVerified", true);
        localStorage.removeItem('digilocker_client_id');
        toast.success("Aadhaar verified successfully via Digilocker!");
        
        // Save the verification status to backend immediately
        try {
          await apiService.saveDraft({
            ...formData,
            aadhaarVerified: true,
            phone: formData.phone
          });
          console.log('✅ Verification status saved to backend');
        } catch (saveError) {
          console.error('Failed to save verification status:', saveError);
          toast.warning("Verification successful but failed to save. Please proceed to next step.");
        }
      } else if (response.success && !response.verified) {
        toast.info(response.message || "Digilocker verification is still pending. Please complete the verification process.");
      } else {
        const errorMsg = response.message || "Aadhaar verification status check failed";
        if (errorMsg.includes('expired') || errorMsg.includes('not found')) {
          toast.error("Digilocker session expired or not found. Please initiate verification again.");
          localStorage.removeItem('digilocker_client_id');
        } else {
          toast.error(errorMsg);
        }
      }
    } catch (error: any) {
      console.error('❌ Status check error:', error);
      console.error('📊 Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      const errorMsg = error.message || "Failed to check Aadhaar verification status";
      const backendError = error.response?.data?.message || '';
      const backendDebug = error.response?.data?.debug;
      
      console.log('🔍 Backend debug info:', backendDebug);
      
      if (errorMsg.includes('expired') || errorMsg.includes('not found') || backendError.includes('expired') || backendError.includes('not found') || errorMsg.includes('404')) {
        toast.error("Digilocker session expired or not found. Please initiate verification again.");
        localStorage.removeItem('digilocker_client_id');
      } else {
        toast.error(backendError || errorMsg);
      }
    } finally {
      setAadhaarStatusChecking(false);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (step === 1) {
      // Basic Details
      if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
      if (!formData.dob) {
        newErrors.dob = "Date of birth is required";
      } else {
        const dobDate = new Date(formData.dob);
        const today = new Date();
        const age = today.getFullYear() - dobDate.getFullYear() - 
          (today.getMonth() < dobDate.getMonth() || 
           (today.getMonth() === dobDate.getMonth() && today.getDate() < dobDate.getDate()) ? 1 : 0);
        
        if (dobDate > today) {
          newErrors.dob = "Date of birth cannot be in the future";
        } else if (age < 18) {
          newErrors.dob = "You must be at least 18 years old";
        } else if (age > 100) {
          newErrors.dob = "Please enter a valid date of birth";
        }
      }
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
      // Aadhaar is always required for Digilocker verification
      if (!formData.aadhaarNumber || formData.aadhaarNumber.length !== 12) {
        newErrors.aadhaarNumber = "Valid 12-digit Aadhaar number required";
      }
      // PAN is optional - validate format only if provided
      if (formData.panNumber && formData.panNumber.length > 0) {
        if (formData.panNumber.length !== 10) {
          newErrors.panNumber = "PAN number must be 10 characters";
        } else {
          const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
          if (!panRegex.test(formData.panNumber)) {
            newErrors.panNumber = "Invalid PAN format. Format: ABCDE1234F (5 letters, 4 digits, 1 letter)";
          }
        }
      }
      if (!formData.dateOfJoining) newErrors.dateOfJoining = "Date of joining is required";
    }

    if (step === 6) {
      // Aadhaar verification is required via Digilocker
      if (!formData.aadhaarVerified) {
        newErrors.aadhaarVerified = "Please verify your Aadhaar via Digilocker";
      }
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
          idType: formData.idType,
          
          // Step 6: Verification
          aadhaarVerified: formData.aadhaarVerified,
          panVerified: formData.panVerified,
          
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
          
          // Upload documents immediately after Step 5 (before verification step)
          // This ensures documents are saved even if user is redirected for Aadhaar verification
          if (currentStep === 5) {
            const hasDocuments = formData.photo || formData.educationCertificate || 
                                formData.experienceDocument || formData.idDocuments || 
                                formData.panDocument;
            
            if (hasDocuments) {
              try {
                console.log("📤 Uploading documents after Step 5...");
                const uploadFormData = new FormData();
                
                if (formData.photo) uploadFormData.append('photo', formData.photo);
                if (formData.educationCertificate) uploadFormData.append('educationCertificate', formData.educationCertificate);
                if (formData.experienceDocument) uploadFormData.append('experienceDocument', formData.experienceDocument);
                if (formData.idDocuments) uploadFormData.append('idDocuments', formData.idDocuments);
                if (formData.panDocument) uploadFormData.append('panDocument', formData.panDocument);

                await apiService.uploadDocuments(id, uploadFormData);
                console.log("✅ Documents uploaded successfully");
                toast.success("Documents uploaded successfully");
              } catch (uploadError: any) {
                console.error("❌ Failed to upload documents:", uploadError);
                toast.error("Failed to upload documents: " + (uploadError.message || "Unknown error"));
                // Don't prevent navigation - user can retry upload later
              }
            }
          }
          
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
        idType: formData.idType,
        aadhaarVerified: formData.aadhaarVerified,
        panVerified: formData.panVerified,
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
      
      // Documents are already uploaded on Step 5 (after user clicks Next on Step 5)
      // This prevents document loss during Aadhaar redirect
      console.log("📝 Documents were uploaded after Step 5");

      // Submit application
      console.log("Submitting application...");
      const response = await apiService.submitApplication(onboardingId);

      if (response.success) {
        // Clear draft data
        localStorage.removeItem("onboarding_phone");
        localStorage.removeItem("onboarding_role");
        localStorage.removeItem("onboarding_outlet");
        localStorage.removeItem("aadhaar_transaction_id");
        
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

  // PAN Verification Component
  const PANVerificationComponent = ({ formData, updateField, errors }: any) => (
    <div className="space-y-6">
      <div className="p-6 border rounded-lg bg-card">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <h4 className="font-semibold">PAN Details</h4>
              <p className="text-sm text-muted-foreground mt-1">
                PAN: {formData.panNumber}
              </p>
            </div>
            {formData.panVerified && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Verified</span>
              </div>
            )}
          </div>

          {!formData.panVerified ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Click the button below to verify your PAN details with the Income Tax Department.
              </p>
              <Button
                type="button"
                onClick={handleVerifyPAN}
                disabled={panVerifying}
                className="w-full"
              >
                {panVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying PAN...
                  </>
                ) : (
                  "Verify PAN"
                )}
              </Button>
            </div>
          ) : (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200">
                ✓ Your PAN has been successfully verified
              </p>
            </div>
          )}
        </div>
      </div>
      {errors.panVerified && (
        <p className="text-center text-sm text-destructive">{errors.panVerified}</p>
      )}
    </div>
  );

  // Aadhaar Verification Component via Digilocker
  const AadhaarVerificationComponent = ({ formData, updateField, errors }: any) => {
    // Check if returning from Digilocker
    const urlParams = new URLSearchParams(window.location.search);
    const digilockerStatus = urlParams.get('status');
    
    return (
      <div className="space-y-6">
        <div className="p-6 border rounded-lg bg-card">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <h4 className="font-semibold">Aadhaar Verification via Digilocker</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Aadhaar: XXXX XXXX {formData.aadhaarNumber?.slice(-4) || '****'}
                </p>
              </div>
              {formData.aadhaarVerified && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Verified</span>
                </div>
              )}
            </div>

            {!formData.aadhaarVerified ? (
              <div className="space-y-4">
                {/* Show validation warnings if data is missing */}
                {(!formData.fullName || !formData.email || !formData.currentAddress) && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <h5 className="font-medium text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                      ⚠️ Missing Required Information
                    </h5>
                    <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
                      {!formData.fullName && <li>Full Name (from Step 1)</li>}
                      {!formData.email && <li>Email Address (from Step 2)</li>}
                      {!formData.currentAddress && <li>Current Address (from Step 2)</li>}
                    </ul>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                      Please go back and complete these fields before verifying with Digilocker.
                    </p>
                  </div>
                )}

                {digilockerStatus === 'success' && !formData.aadhaarVerified ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        ℹ️ Digilocker verification in progress. Please wait...
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={handleCheckAadhaarStatus}
                      disabled={aadhaarStatusChecking}
                      className="w-full"
                    >
                      {aadhaarStatusChecking ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Checking Status...
                        </>
                      ) : (
                        "Check Verification Status"
                      )}
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">How it works:</h5>
                      <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                        <li>Click "Verify with Digilocker" button below</li>
                        <li>You'll be redirected to Digilocker portal</li>
                        <li>Login with your Aadhaar or mobile number</li>
                        <li>Grant access to verify your Aadhaar</li>
                        <li>Return here automatically after verification</li>
                      </ol>
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground">
                          <strong>Important:</strong> Complete the verification on Digilocker portal. You will be redirected back automatically.
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={handleInitiateAadhaarVerification}
                      disabled={aadhaarVerificationLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {aadhaarVerificationLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Connecting to Digilocker...
                        </>
                      ) : (
                        "Verify with Digilocker"
                      )}
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✓ Your Aadhaar has been successfully verified via Digilocker
                </p>
              </div>
            )}
          </div>
        </div>
        {errors.aadhaarVerified && (
          <p className="text-center text-sm text-destructive">{errors.aadhaarVerified}</p>
        )}
      </div>
    );
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
                max={new Date().toISOString().split('T')[0]}
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
                  min={new Date().toISOString().split('T')[0]}
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
              <Label htmlFor="panNumber" className="mb-2 block">PAN Number (Optional)</Label>
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
              label="ID Attachment (Aadhaar)"
              accept="image/*,.pdf"
              maxSize={5}
              value={formData.idDocuments}
              onFileSelect={(file) => updateField("idDocuments", file)}
              hint="Upload Aadhaar document, max 5MB"
            />

          </div>
        );

      case 6:
        // Step 6: Aadhaar Verification via Digilocker
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Verify Your Aadhaar via Digilocker
              </h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Verify your Aadhaar using Digilocker - India's secure digital document wallet
              </p>
            </div>

            <AadhaarVerificationComponent 
              formData={formData}
              updateField={updateField}
              errors={errors}
            />
          </div>
        );

      default:
        return null;
    }
  };

  // Show loading screen while processing Digilocker return
  if (isDigilockerLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold mb-2">Verifying your Aadhaar...</h2>
          <p className="text-muted-foreground">Please wait while we confirm your verification with Digilocker.</p>
        </div>
      </div>
    );
  }

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
