import React, { useRef, useState } from 'react';
import { FaCloudUploadAlt, FaSpinner, FaCheckCircle, FaTimesCircle, FaImage } from 'react-icons/fa';

const UploadButton = ({ onUploadSuccess, onUploadError, mode = 'ocr' }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadStatus('error');
      onUploadError?.('不支持的图片格式，请上传 JPG、PNG 或 WebP 格式的图片');
      setTimeout(() => setUploadStatus(null), 3000);
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadStatus('error');
      onUploadError?.('图片大小超过 10MB 限制');
      setTimeout(() => setUploadStatus(null), 3000);
      return;
    }

    setUploading(true);
    setUploadStatus(null);

    try {
      if (mode === 'direct') {
        setUploadStatus('success');
        onUploadSuccess?.(file);
        setTimeout(() => setUploadStatus(null), 2000);
      } else {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch('/api/upload-question', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (result.success && result.data?.text) {
          setUploadStatus('success');
          onUploadSuccess?.(result.data.text);
          setTimeout(() => setUploadStatus(null), 2000);
        } else {
          throw new Error(result.message || 'OCR 识别失败');
        }
      }
    } catch (error) {
      setUploadStatus('error');
      onUploadError?.(error.message || '图片上传失败，请重试');
      setTimeout(() => setUploadStatus(null), 3000);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const getButtonText = () => {
    if (uploading) return mode === 'direct' ? '上传中...' : '识别中...';
    if (uploadStatus === 'success') return mode === 'direct' ? '上传成功' : '识别成功';
    if (uploadStatus === 'error') return mode === 'direct' ? '上传失败' : '识别失败';
    return mode === 'direct' ? '上传题目图片' : '上传题目图片';
  };

  const getHelpText = () => {
    if (mode === 'direct') {
      return '图片将直接发送给 AI 进行分析';
    }
    return '图片将自动识别文字并填入文本框';
  };

  return (
    <div className="relative inline-block">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />
      
      <button
        onClick={handleClick}
        disabled={uploading}
        className={`
          flex items-center gap-2 px-6 py-3 rounded-lg font-medium
          transition-all duration-300 transform hover:scale-105
          ${uploading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
          }
          ${uploadStatus === 'success' ? 'bg-green-500' : ''}
          ${uploadStatus === 'error' ? 'bg-red-500' : ''}
        `}
      >
        {uploading && <FaSpinner className="animate-spin text-lg" />}
        {uploadStatus === 'success' && <FaCheckCircle className="text-lg" />}
        {uploadStatus === 'error' && <FaTimesCircle className="text-lg" />}
        {!uploading && !uploadStatus && (mode === 'direct' ? <FaImage className="text-lg" /> : <FaCloudUploadAlt className="text-lg" />)}
        
        <span>{getButtonText()}</span>
      </button>

      <div className="mt-2 text-xs text-gray-500 text-center">
        {getHelpText()}
        <br />
        支持 JPG、PNG、WebP 格式，最大 10MB
      </div>
    </div>
  );
};

export default UploadButton;