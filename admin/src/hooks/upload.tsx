import { useState, useRef, ChangeEvent, useCallback } from 'react';
import axiosInstance from '../services/axios';

export type FileUploadCallback = (filePath: string) => void;

export const useFileUpload = () => {
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadComplete, setUploadComplete] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetUploadState = useCallback(() => {
    setUploadProgress(0);
    setUploadComplete(false);
  }, []);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    setUploadProgress(0);
    setUploadComplete(false);

    try {
      const { data } = await axiosInstance.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        }
      });

      setUploadComplete(true);
      return data.filePath;
      
    } catch (err) {
      console.error('Upload error:', err);
      return null;
    }
  };

  return {
    uploadProgress,
    uploadComplete,
    fileInputRef,
    handleFileUpload,
    resetUploadState
  };
};