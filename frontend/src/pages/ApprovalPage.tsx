import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, AlertCircle, Loader2, Clock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { apiService } from "@/lib/api";

interface ApprovalData {
  fullName: string;
  email: string;
  phone: string;
  storeName: string;
  designation: string;
  department: string;
}

type ApprovalStatus = "loading" | "valid" | "expired" | "error" | "processing" | "success" | "rejected";

const ApprovalPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const token = searchParams.get("token");
  const action = searchParams.get("action");
  
  const [status, setStatus] = useState<ApprovalStatus>("loading");
  const [approvalData, setApprovalData] = useState<ApprovalData | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Validate token on mount
  useEffect(() => {
    validateToken();
  }, [id, token]);

  const validateToken = async () => {
    try {
      if (!id || !token) {
        setStatus("error");
        toast.error("Invalid approval link. Missing ID or token.");
        return;
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'https://burgersingfrontbackend.kamaaupoot.in/api';
      const response = await fetch(
        `${apiUrl}/onboarding/${id}/check-token?token=${token}`
      );

      const data = await response.json();

      if (!data.isValid) {
        setStatus("expired");
        toast.error("Approval link has expired or is invalid.");
        return;
      }

      // Fetch application details
      const appResponse = await fetch(`${apiUrl}/onboarding/${id}`);
      const appData = await appResponse.json();

      if (appData.success && appData.application) {
        setApprovalData({
          fullName: appData.application.fullName || "N/A",
          email: appData.application.email || "N/A",
          phone: appData.application.phone || "N/A",
          storeName: appData.application.storeName || "N/A",
          designation: appData.application.designation || "N/A",
          department: appData.application.department || "N/A"
        });
        setStatus("valid");
      } else {
        setStatus("error");
        toast.error("Unable to load application details.");
      }
    } catch (error) {
      setStatus("error");
      toast.error("Error validating approval link");
      console.error(error);
    }
  };

  const handleApprove = async () => {
    try {
      setIsProcessing(true);
      setStatus("processing");

      const apiUrl = import.meta.env.VITE_API_URL || 'https://burgersingfrontbackend.kamaaupoot.in/api';
      const response = await fetch(
        `${apiUrl}/onboarding/${id}/approve-with-token?token=${token}`,
        { method: "GET" }
      );

      const data = await response.json();

      if (data.success) {
        setStatus("success");
        toast.success("✅ Application approved! LMS account created.");
        
        // Redirect after 3 seconds
        setTimeout(() => {
          navigate("/");
        }, 3000);
      } else {
        setStatus("error");
        toast.error(data.message || "Failed to approve application");
      }
    } catch (error) {
      setStatus("error");
      toast.error("Error processing approval");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    try {
      if (!rejectionReason.trim()) {
        toast.error("Please provide a rejection reason");
        return;
      }

      setIsProcessing(true);
      setStatus("processing");

      const apiUrl = import.meta.env.VITE_API_URL || 'https://burgersingfrontbackend.kamaaupoot.in/api';
      const response = await fetch(
        `${apiUrl}/onboarding/${id}/reject-with-token?token=${token}&reason=${encodeURIComponent(rejectionReason)}`,
        { method: "GET" }
      );

      const data = await response.json();

      if (data.success) {
        setStatus("rejected");
        toast.success("❌ Application rejected. Notifications sent.");
        
        // Redirect after 3 seconds
        setTimeout(() => {
          navigate("/");
        }, 3000);
      } else {
        setStatus("error");
        toast.error(data.message || "Failed to reject application");
      }
    } catch (error) {
      setStatus("error");
      toast.error("Error processing rejection");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        {/* Loading State */}
        {status === "loading" && (
          <div className="p-12 text-center">
            <Loader2 className="w-16 h-16 text-orange-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-800">Validating Token...</h2>
            <p className="text-gray-600 mt-2">Please wait while we verify your approval link.</p>
          </div>
        )}

        {/* Expired/Invalid State */}
        {status === "expired" && (
          <div className="p-12 text-center">
            <Clock className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800">Link Expired</h2>
            <p className="text-gray-600 mt-2">
              This approval link has expired. Please contact the HR team to resend the request.
            </p>
            <Button
              onClick={() => navigate("/")}
              className="mt-6 bg-orange-500 hover:bg-orange-600"
            >
              Go to Home
            </Button>
          </div>
        )}

        {/* Error State */}
        {status === "error" && (
          <div className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800">Error</h2>
            <p className="text-gray-600 mt-2">
              We encountered an error processing your request. Please contact the HR team.
            </p>
            <Button
              onClick={() => navigate("/")}
              className="mt-6 bg-orange-500 hover:bg-orange-600"
            >
              Go to Home
            </Button>
          </div>
        )}

        {/* Success State */}
        {status === "success" && (
          <div className="p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-600">✅ Approved!</h2>
            <p className="text-gray-600 mt-2">
              Application has been approved. LMS account has been created.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Redirecting to home in 3 seconds...
            </p>
          </div>
        )}

        {/* Rejected State */}
        {status === "rejected" && (
          <div className="p-12 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-600">❌ Rejected</h2>
            <p className="text-gray-600 mt-2">
              Application has been rejected. Notifications have been sent.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Redirecting to home in 3 seconds...
            </p>
          </div>
        )}

        {/* Valid State - Approval Form */}
        {status === "valid" && approvalData && (
          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Onboarding Approval Review
              </h2>
              <p className="text-gray-600">
                Please review the candidate details below and approve or reject the application.
              </p>
            </div>

            {/* Candidate Details */}
            <div className="bg-gray-50 p-6 rounded-lg mb-8 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Candidate Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Full Name</label>
                  <p className="text-lg text-gray-900 font-medium">{approvalData.fullName}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Email</label>
                  <p className="text-lg text-gray-900">{approvalData.email}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Phone</label>
                  <p className="text-lg text-gray-900">{approvalData.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Store Name</label>
                  <p className="text-lg text-gray-900">{approvalData.storeName}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Designation</label>
                  <p className="text-lg text-gray-900">{approvalData.designation}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Department</label>
                  <p className="text-lg text-gray-900">{approvalData.department}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons - Processing State */}
            {isProcessing && (
              <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                <span className="text-blue-700 font-medium">Processing your decision...</span>
              </div>
            )}

            {/* Action Buttons - Normal State */}
            {status === "valid" && (
              <>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded">
                  <p className="text-sm text-blue-700">
                    <strong>Note:</strong> Approving this application will automatically create the candidate's LMS account and send notifications to all stakeholders.
                  </p>
                </div>

                {/* Rejection Reason Input */}
                <div className="mb-8">
                  <label className="text-sm font-semibold text-gray-600 mb-2 block">
                    Rejection Reason (if applicable)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="If you decide to reject, please provide a reason that will be communicated to the candidate and HR team..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                    rows={4}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button
                    onClick={handleApprove}
                    disabled={isProcessing}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 text-lg h-auto rounded-lg transition duration-200"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Approve Application
                  </Button>
                  <Button
                    onClick={handleReject}
                    disabled={isProcessing}
                    variant="outline"
                    className="flex-1 border-red-500 text-red-600 hover:bg-red-50 font-semibold py-3 text-lg h-auto rounded-lg transition duration-200"
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    Reject Application
                  </Button>
                </div>

                <p className="text-xs text-gray-500 text-center mt-6">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Notifications will be sent to the candidate and store email upon your decision.
                </p>
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ApprovalPage;
