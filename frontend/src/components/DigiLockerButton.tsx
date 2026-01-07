import { useState } from "react";
import { Shield, CheckCircle, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type VerificationStatus = "idle" | "loading" | "verified" | "failed";

interface DigiLockerButtonProps {
  onVerify?: () => Promise<boolean>;
  status?: VerificationStatus;
  className?: string;
}

export const DigiLockerButton = ({ 
  onVerify, 
  status: externalStatus,
  className 
}: DigiLockerButtonProps) => {
  const [internalStatus, setInternalStatus] = useState<VerificationStatus>("idle");
  const status = externalStatus ?? internalStatus;

  const handleVerify = async () => {
    setInternalStatus("loading");
    try {
      // Simulate DigiLocker verification
      if (onVerify) {
        const success = await onVerify();
        setInternalStatus(success ? "verified" : "failed");
      } else {
        // Demo: simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        setInternalStatus("verified");
      }
    } catch {
      setInternalStatus("failed");
    }
  };

  if (status === "verified") {
    return (
      <div className={cn("rounded-xl border border-success/30 bg-success/5 p-4", className)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-success" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-success">Aadhaar Verified</p>
            <p className="text-sm text-muted-foreground">Your identity has been verified via DigiLocker</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className={cn("rounded-xl border border-destructive/30 bg-destructive/5 p-4", className)}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-destructive" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-destructive">Verification Failed</p>
            <p className="text-sm text-muted-foreground">Please try again or upload manually</p>
          </div>
        </div>
        <Button 
          onClick={handleVerify}
          variant="outline"
          className="w-full"
        >
          Retry Verification
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <Button
        onClick={handleVerify}
        disabled={status === "loading"}
        className="w-full h-14 bg-[#1A73E8] hover:bg-[#1557B0] text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Connecting to DigiLocker...
          </>
        ) : (
          <>
            <Shield className="w-5 h-5 mr-2" />
            Verify with DigiLocker
            <ExternalLink className="w-4 h-4 ml-2 opacity-70" />
          </>
        )}
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        Secure verification powered by Government of India
      </p>
    </div>
  );
};
