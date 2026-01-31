import { useState } from "react";
import { Eye, FileText, Download } from "lucide-react";

interface DocumentFile {
  filename: string;
  path: string;
  size: number;
  mimetype?: string;
}

interface DocumentPreviewProps {
  title: string;
  document: DocumentFile;
  baseUrl?: string;
}

export const DocumentPreview = ({
  title,
  document,
  baseUrl = "https://burgersingfrontbackend.kamaaupoot.in",
}: DocumentPreviewProps) => {
  const [imageError, setImageError] = useState(false);
  
  // Clean the path - extract just the filename from full paths
  let cleanPath = document.path;
  
  // If it contains full path, extract just the filename
  if (cleanPath.includes('\\') || cleanPath.includes('/')) {
    // Get the last part after last slash or backslash
    cleanPath = cleanPath.split(/[\\/]/).pop() || cleanPath;
  }
  
  // Ensure it has onboarding/ prefix
  if (!cleanPath.startsWith('onboarding/')) {
    cleanPath = `onboarding/${cleanPath}`;
  }
  
  const documentUrl = `${baseUrl}/uploads/${cleanPath}`;
  const isPDF = document.filename.toLowerCase().endsWith(".pdf") || document.mimetype === "application/pdf";
  const isImage = document.filename.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <h4 className="font-semibold">{title}</h4>
      <div className="flex flex-col gap-3">
        {/* Image Preview */}
        {isImage && !imageError && (
          <img
            src={documentUrl}
            alt={title}
            className="w-full max-w-2xl rounded-lg border object-contain bg-muted max-h-96"
            onError={handleImageError}
          />
        )}

        {/* PDF Preview Placeholder */}
        {(isPDF || imageError) && (
          <div className="p-6 bg-muted rounded-lg flex items-center justify-center gap-3 min-h-32">
            <FileText className="w-8 h-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Document Preview</p>
              <p className="text-xs text-muted-foreground">
                {isPDF ? "PDF file - Click to open" : "Preview not available"}
              </p>
            </div>
          </div>
        )}

        {/* Document Info and Link */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="text-sm text-muted-foreground">
            {document.filename} • {(document.size / 1024).toFixed(2)} KB
          </div>
          <a
            href={documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={document.filename}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-md transition-colors"
          >
            <Eye className="w-4 h-4" />
            Open
          </a>
        </div>
      </div>
    </div>
  );
};
