"use client";

import { useState, useEffect } from "react";
import { claimsApi, type ClaimDocument } from "@/lib/api/claims";

interface ClaimDocumentsSectionProps {
  claimId: string;
  claimStatus: string;
}

export default function ClaimDocumentsSection({
  claimId,
  claimStatus,
}: ClaimDocumentsSectionProps) {
  const [documents, setDocuments] = useState<ClaimDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isTerminal = claimStatus === "Paid" || claimStatus === "Rejected";

  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimId]);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const docs = await claimsApi.getClaimDocuments(claimId);
      setDocuments(docs);
    } catch (err: any) {
      setError(err?.message || "Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setUploadError(
        "File size exceeds 10MB limit. Please choose a smaller file.",
      );
      return;
    }
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowed.includes(file.type)) {
      setUploadError(
        "Only PDF, JPEG, and PNG files are allowed. Please choose a valid file type.",
      );
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      await claimsApi.uploadDocument(claimId, file);
      await fetchDocuments();
    } catch (err: any) {
      console.error("Document upload error:", err);
      let errorMsg = "Failed to upload document. Please try again.";

      if (err?.message) {
        if (
          err.message.includes("401") ||
          err.message.includes("Unauthorized") ||
          err.message.includes("JWT")
        ) {
          errorMsg =
            "Session expired. Please log in again to upload documents.";
        } else if (
          err.message.includes("403") ||
          err.message.includes("Forbidden")
        ) {
          errorMsg =
            "You don't have permission to upload documents for this claim.";
        } else if (
          err.message.includes("404") ||
          err.message.includes("not found")
        ) {
          errorMsg = "Claim not found. Please refresh the page and try again.";
        } else if (
          err.message.includes("terminal") ||
          err.message.includes("Paid") ||
          err.message.includes("Rejected")
        ) {
          errorMsg =
            "Cannot upload documents to a closed claim (Paid/Rejected).";
        } else if (
          err.message.includes("Invalid file type") ||
          err.message.includes("Validation failed") ||
          err.message.includes("file type") ||
          err.message.includes("expected type")
        ) {
          errorMsg =
            "Invalid file type. Only PDF, JPEG, and PNG files are allowed.";
        } else if (
          err.message.includes("File too large") ||
          err.message.includes("maxSize") ||
          err.message.includes("exceeds")
        ) {
          errorMsg =
            "File size exceeds 10MB limit. Please choose a smaller file.";
        } else {
          errorMsg = err.message;
        }
      }

      setUploadError(errorMsg);
    } finally {
      setIsUploading(false);
      // Reset the input
      e.target.value = "";
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    setDeletingId(documentId);
    try {
      await claimsApi.deleteDocument(claimId, documentId);
      setDocuments((prev) => prev.filter((d) => d.id !== documentId));
    } catch (err: any) {
      console.error("Document delete error:", err);
      let errorMsg = "Failed to delete document. Please try again.";

      if (err?.message) {
        if (
          err.message.includes("401") ||
          err.message.includes("Unauthorized") ||
          err.message.includes("JWT")
        ) {
          errorMsg = "Session expired. Please log in again.";
        } else if (
          err.message.includes("403") ||
          err.message.includes("Forbidden")
        ) {
          errorMsg = "You don't have permission to delete this document.";
        } else if (
          err.message.includes("404") ||
          err.message.includes("not found")
        ) {
          errorMsg = "Document not found. It may have been already deleted.";
        } else {
          errorMsg = err.message;
        }
      }

      alert(errorMsg);
    } finally {
      setDeletingId(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (filename: string) => {
    if (filename.toLowerCase().endsWith(".pdf")) {
      return (
        <svg
          className="w-5 h-5 text-red-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M4 18h12a2 2 0 002-2V6l-4-4H4a2 2 0 00-2 2v12a2 2 0 002 2zm5-9a1 1 0 112 0v3a1 1 0 11-2 0V9z" />
        </svg>
      );
    }
    return (
      <svg
        className="w-5 h-5 text-blue-500"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
      </svg>
    );
  };

  return (
    <div>
      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span className="w-1 h-6 bg-blue-600 rounded-full" />
        Documents {!isLoading && `(${documents.length})`}
      </h4>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-3">
          {error}
          <button
            onClick={fetchDocuments}
            className="ml-2 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          Loading documents...
        </div>
      ) : (
        <>
          {documents.length > 0 ? (
            <div className="space-y-2 mb-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between bg-gray-50 rounded-lg border border-gray-200 px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {getFileIcon(doc.originalFilename)}
                    <div className="min-w-0">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 truncate block"
                      >
                        {doc.originalFilename}
                      </a>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(doc.fileSizeBytes)} &middot;{" "}
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {(claimStatus === "Pending" || claimStatus === "OnHold") && (
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      className="text-red-500 hover:text-red-700 text-sm ml-3 flex-shrink-0 disabled:opacity-50"
                    >
                      {deletingId === doc.id ? "..." : "Delete"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-4">
              No documents uploaded yet.
            </p>
          )}
        </>
      )}

      {/* Upload section — hidden for terminal statuses */}
      {!isTerminal && (
        <div>
          {uploadError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-700 mb-2">
              {uploadError}
            </div>
          )}
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 cursor-pointer transition-colors text-sm font-medium">
            {isUploading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                Uploading...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Upload Document
              </>
            )}
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>
          <p className="text-xs text-gray-500 mt-1">
            PDF, JPEG, or PNG. Max 10MB.
          </p>

          {documents.length > 0 && (
            <div className="mt-4 flex justify-end">
              <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                Save Documents
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
