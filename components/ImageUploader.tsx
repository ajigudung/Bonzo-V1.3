import React, { useCallback, useRef, useState } from 'react';
import { UploadIcon } from './Icons';

interface ImageUploaderProps {
  onImageSelect: (file: File, objectUrl: string) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const clearNativeFileValue = useCallback(() => {
    // penting: agar pilih file yang sama tetap memicu onChange
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const handleFileChange = useCallback(
    (files: FileList | null) => {
      if (files && files[0]) {
        const file = files[0];
        const url = URL.createObjectURL(file);
        onImageSelect(file, url);
      }
    },
    [onImageSelect]
  );

  const onDragEnter = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileChange(e.dataTransfer.files);
        e.dataTransfer.clearData();
      }
    },
    [handleFileChange]
  );

  return (
    <div className="flex items-center justify-center w-full">
      <label
        htmlFor="dropzone-file"
        onClick={clearNativeFileValue}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dark-border border-dashed rounded-lg cursor-pointer bg-dark-bg hover:bg-gray-800 transition-colors ${
          isDragging ? 'border-brand-purple bg-gray-800' : ''
        }`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <UploadIcon className="w-10 h-3 mb-4 text-gray-500" />
          <p className="mb-2 text-sm text-gray-400">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
        </div>

        <input
          ref={inputRef}
          id="dropzone-file"
          type="file"
          className="hidden"
          accept="image/*"
          onClick={clearNativeFileValue}
          onChange={(e) => handleFileChange(e.target.files)}
        />
      </label>
    </div>
  );
};

export default ImageUploader;
