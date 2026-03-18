import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { FiUploadCloud, FiX } from "react-icons/fi";

interface Props {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  accept?: string;
  isDisabled?: boolean;
}

export default function FileUploader({
  onFilesChange,
  maxFiles = 5,
  accept = "image/*,application/pdf",
  isDisabled = false,
}: Props) {
  const [files, setFiles] = useState<File[]>([]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { [accept]: [] },
    maxFiles,
    disabled: isDisabled,
    onDrop: (acceptedFiles) => {
      const newFiles = [...files, ...acceptedFiles];
      setFiles(newFiles);
      onFilesChange(newFiles);
    },
  });

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesChange(newFiles);
  };

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-10 text-center transition cursor-pointer ${
          isDragActive
            ? "border-purple-500 bg-purple-50"
            : "border-gray-300 bg-gray-50"
        } ${isDisabled ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="space-y-3">
          <FiUploadCloud className="mx-auto h-10 w-10 text-gray-500" />
          <p className="font-medium">
            {isDragActive
              ? "Drop files here..."
              : "Drag & drop documents or click to select"}
          </p>
          <p className="text-sm text-gray-500">
            PDF, JPG, PNG • Max {maxFiles} files
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-6">
          <p className="font-medium mb-2">Uploaded files:</p>
          <div className="space-y-2">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-3 bg-gray-100 rounded-md"
              >
                <p className="truncate max-w-xs">{file.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                  <button
                    onClick={() => removeFile(idx)}
                    className="text-red-600 hover:text-red-800 transition"
                  >
                    <FiX />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
