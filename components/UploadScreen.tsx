
import React, { useState, useRef, useCallback } from 'react';
import { ImageUploadIcon, CircleIcon, SquareIcon, DownloadIcon, SaveIcon } from './Icons';

interface UploadScreenProps {
  onImageUpload: (file: File) => void;
}

const UploadScreen: React.FC<UploadScreenProps> = ({ onImageUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File | null | undefined) => {
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
    } else {
      alert('Please upload a valid image file (PNG, JPG, etc.).');
    }
  }, [onImageUpload]);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    handleFile(file);
  };

  return (
    <div className="flex flex-col space-y-12 md:space-y-24">
      {/* Hero Section */}
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div className="text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-4 tracking-tight">
            Bring Your Photos to Life with <span className="text-sky-500">Cross-Stitch Patterns</span>
          </h1>
          <p className="text-lg text-slate-600 mb-8">
            Our AI-powered tool instantly transforms any image into a simple, beautiful silhouette pattern, ready for you to stitch.
          </p>
          <button
            onClick={handleButtonClick}
            className="inline-flex items-center gap-2 px-8 py-4 bg-sky-500 text-white font-bold text-lg rounded-lg shadow-lg hover:bg-sky-600 transition-transform hover:scale-105"
          >
            <ImageUploadIcon className="w-6 h-6" />
            Start with an Image
          </button>
        </div>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-colors h-full ${
            isDragging ? 'border-sky-500 bg-sky-50' : 'border-slate-300 bg-white'
          }`}
        >
          <ImageUploadIcon className="w-16 h-16 text-slate-400 mb-4" />
          <p className="text-slate-600 text-lg font-semibold mb-2">Drag & drop your image here</p>
          <p className="text-slate-400 text-sm mb-4">or click the button</p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>
      </div>

      {/* Features Section */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Powerful Features, Simple Interface</h2>
        <p className="text-slate-600 mb-12 max-w-2xl mx-auto">Everything you need to create the perfect silhouette pattern for your next project.</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard 
            icon={<ImageUploadIcon className="w-8 h-8 text-sky-500"/>} 
            title="Instant Conversion" 
            description="Upload any photo and our AI will generate a clean silhouette pattern in seconds." 
          />
          <FeatureCard 
            icon={<CircleIcon className="w-8 h-8 text-sky-500"/>} 
            title="Full Customization" 
            description="Adjust stitch count, silhouette detail, fill shapes, outline thickness, and thread colors." 
          />
          <FeatureCard 
            icon={<DownloadIcon className="w-8 h-8 text-sky-500"/>} 
            title="PDF & SVG Export" 
            description="Download your pattern with AI-generated instructions or as a scalable vector graphic." 
          />
           <FeatureCard 
            icon={<SaveIcon className="w-8 h-8 text-sky-500"/>} 
            title="Save Your Work" 
            description="Keep your favorite patterns safe in your personal gallery to access them anytime." 
          />
        </div>
      </div>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-left">
    <div className="mb-4">{icon}</div>
    <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
    <p className="text-slate-600 text-sm">{description}</p>
  </div>
);

export default UploadScreen;
