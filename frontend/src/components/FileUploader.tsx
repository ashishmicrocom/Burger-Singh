import { useState, useRef, useCallback } from "react";
import { Upload, X, FileText, Image, CheckCircle, AlertCircle, Loader2, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FileUploaderProps {
  label: string;
  accept?: string;
  maxSize?: number; // in MB
  onFileSelect: (file: File | null) => void;
  value?: File | null;
  error?: string;
  hint?: string;
  preview?: boolean;
  enableCamera?: boolean;
}

export const FileUploader = ({
  label,
  accept = "image/*,.pdf",
  maxSize = 5,
  onFileSelect,
  value,
  error,
  hint,
  preview = true,
  enableCamera = false,
}: FileUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = useCallback((file: File) => {
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      onFileSelect(null);
      return;
    }

    // Simulate upload progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null || prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 20;
      });
    }, 100);

    // Create preview for images
    if (preview && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }

    onFileSelect(file);
  }, [maxSize, onFileSelect, preview]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleRemove = useCallback(() => {
    onFileSelect(null);
    setPreviewUrl(null);
    setUploadProgress(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [onFileSelect]);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" } 
      });
      setStream(mediaStream);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Unable to access camera. Please check permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" });
            handleFile(file);
            stopCamera();
          }
        }, "image/jpeg", 0.9);
      }
    }
  }, [handleFile, stopCamera]);

  const isImage = value?.type.startsWith("image/");

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-foreground mb-2">
        {label}
      </label>

      {showCamera ? (
        <div className="border-2 border-primary rounded-xl overflow-hidden bg-black">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline
            className="w-full h-64 object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          <div className="p-4 bg-card flex gap-2 justify-center">
            <Button onClick={capturePhoto} className="flex-1">
              <Camera className="w-4 h-4 mr-2" />
              Capture Photo
            </Button>
            <Button onClick={stopCamera} variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      ) : !value ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200",
            isDragging 
              ? "border-primary bg-primary/5" 
              : "border-border hover:border-primary/50 hover:bg-muted/50",
            error && "border-destructive"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
          />
          <Upload className={cn(
            "w-10 h-10 mx-auto mb-3 transition-colors",
            isDragging ? "text-primary" : "text-muted-foreground"
          )} />
          <p className="text-sm text-foreground font-medium mb-1">
            {isDragging ? "Drop your file here" : "Drag & drop or click to upload"}
          </p>
          <p className="text-xs text-muted-foreground">
            {hint || `Max size: ${maxSize}MB`}
          </p>
          {enableCamera && (
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                startCamera();
              }}
              variant="outline"
              size="sm"
              className="mt-3"
            >
              <Camera className="w-4 h-4 mr-2" />
              Open Camera
            </Button>
          )}
        </div>
      ) : (
        <div className={cn(
          "border rounded-xl p-4 bg-card",
          error ? "border-destructive" : "border-border"
        )}>
          <div className="flex items-start gap-3">
            {/* Preview or Icon */}
            {previewUrl && isImage ? (
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                {isImage ? (
                  <Image className="w-6 h-6 text-muted-foreground" />
                ) : (
                  <FileText className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
            )}

            {/* File info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {value.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {(value.size / 1024 / 1024).toFixed(2)} MB
              </p>
              
              {/* Progress bar */}
              {uploadProgress !== null && uploadProgress < 100 && (
                <div className="mt-2 w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
              
              {/* Status */}
              {uploadProgress === 100 && (
                <div className="flex items-center gap-1 mt-1 text-success">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">Uploaded</span>
                </div>
              )}
            </div>

            {/* Remove button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1 mt-2 text-destructive">
          <AlertCircle className="w-3.5 h-3.5" />
          <span className="text-xs">{error}</span>
        </div>
      )}
    </div>
  );
};
