'use client';

import { useState, useRef, useEffect } from 'react';
import { processPdfFile } from '../app/upload/action';

interface UploadState {
  message?: string;
  error?: string;
  isPending: boolean;
  uploadedFileName?: string;
  selectedFile?: File | null;
}

export default function UploadPage() {
  const [state, setState] = useState<UploadState>({
    message: '',
    error: undefined,
    isPending: false,
    uploadedFileName: undefined,
    selectedFile: null,
  });

  const inputRef = useRef<HTMLInputElement | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleAttachClick = () => {
    inputRef.current?.click();
  };

  // Auto-hide UI (filename + message) after 5 seconds
  const startHideTimer = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

    hideTimerRef.current = setTimeout(() => {
      setState((prev) => ({
        ...prev,
        uploadedFileName: undefined,
        message: '',
      }));
    }, 5000); // Adjust delay here
  };

  // Called when file selected; set selectedFile then auto-upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;

    setState((prev) => ({
      ...prev,
      selectedFile: file,
      uploadedFileName: file ? file.name : undefined,
      error: undefined,
      message: prev.message,
    }));

    if (file) {
      setTimeout(() => uploadFile(file), 10);
    }
  };

  // Upload logic unchanged
  const uploadFile = async (file: File) => {
    setState((prev) => ({ ...prev, isPending: true, error: undefined, message: '' }));

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const result = await processPdfFile(formData);

      setState({
        message: result.success ? result.message : '',
        error: result.success ? undefined : result.error,
        isPending: false,
        uploadedFileName: result.success ? file.name : undefined,
        selectedFile: result.success ? file : null,
      });

      if (inputRef.current) inputRef.current.value = '';

      // Start auto-hide
      if (result.success) startHideTimer();

    } catch (error: unknown) {
      setState({
        message: '',
        error: `Upload failed: ${error instanceof Error ? error.message : String(error)}`,
        isPending: false,
        uploadedFileName: undefined,
        selectedFile: null,
      });
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  return (
    <div className="rounded-xl">
      {/* Hidden native file input */}
      <input
        ref={inputRef}
        id="pdf"
        name="pdf"
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        className="hidden"
        disabled={state.isPending}
      />

      <div className="flex flex-col gap-4">
        <div className="grid">

          {/* Show filename (auto-hide later) */}
          {state.uploadedFileName && (
            <div className="mt-3 p-3 bg-white rounded-lg text-sm text-black">
              📄 Uploaded: {state.uploadedFileName}
            </div>
          )}

          {/* Show message (auto-hide later) */}
          {state.message && (
            <p className="text-white text-md mt-2">
              {state.message}
            </p>
          )}
        </div>

        {/* Upload button */}
        <button
          type="button"
          onClick={handleAttachClick}
          disabled={state.isPending}
          aria-label="Attach PDF"
          className="flex items-center justify-center w-8 h-8 rounded-full text-black bg-white"
        >
          <span className="text-2xl leading-none">+</span>
        </button>
      </div>

      {/* Error Message */}
      {state.error && (
        <div className="mt-3 p-3 bg-red-100 border border-red-400 rounded-lg text-sm text-red-800">
          {state.error}
        </div>
      )}
    </div>
  );
}
