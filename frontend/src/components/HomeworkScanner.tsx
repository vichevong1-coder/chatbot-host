import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, RefreshCw, CheckCircle, ArrowLeft, Sparkles, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { TunsayAvatar } from './TunsayAvatar';
import { HomeworkProblem, Language } from '../types';
import { MOCK_PROBLEMS } from '../data/mockProblems';
import { processHomeworkImage } from '../services/ocrService';

interface HomeworkScannerProps {
  language?: Language;
  /** Called with ALL detected problems from the scan (or [sampleProblem] for single samples) */
  onHomeworkConfirmed: (problems: HomeworkProblem[], initialIndex?: number) => void;
  onCancel: () => void;
}

export const HomeworkScanner: React.FC<HomeworkScannerProps> = ({
  language = 'km',
  onHomeworkConfirmed,
  onCancel
}) => {
  const isKhmer = language === 'km';
  const [stage, setStage] = useState<'capture' | 'preview' | 'analyzing' | 'confirm' | 'error'>('capture');
  const [imageUri, setImageUri] = useState<string>('');
  const [selectedProblem, setSelectedProblem] = useState<HomeworkProblem>(MOCK_PROBLEMS[0]);
  const [scannedProblems, setScannedProblems] = useState<HomeworkProblem[]>([]);
  const [ocrError, setOcrError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadedFileRef = useRef<File | null>(null);   // <-- stores the actual File
  const sampleScrollRef = useRef<HTMLDivElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handleSelectSample = (problem: HomeworkProblem) => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setSelectedProblem(problem);
    setImageUri(problem.imageUri || 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80');
    setStage('preview');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      uploadedFileRef.current = file;   // <-- keep the File object for OCR
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      setImageUri(url);
      setStage('preview');
    }
  };

  const handleConfirmPhoto = async () => {
    setStage('analyzing');
    setOcrError('');

    // If a real file was uploaded, run OCR on it
    if (uploadedFileRef.current) {
      try {
        const result = await processHomeworkImage(uploadedFileRef.current);
        if (result.success && result.problems.length > 0) {
          setScannedProblems(result.problems);
          setSelectedProblem(result.problems[0]);
          setStage('confirm');
        } else {
          // OCR returned no problems — show the error
          setOcrError(result.error || (isKhmer ? 'មិនអាចអានលំហាត់បានទេ។' : 'Could not read homework from image.'));
          setStage('error');
        }
      } catch (err: any) {
        setOcrError(err?.message || (isKhmer ? 'មានបញ្ហាក្នុងការដំណើរការ។' : 'Processing error.'));
        setStage('error');
      }
    } else {
      // Sample problem selected — no OCR needed, just confirm
      setTimeout(() => {
        setStage('confirm');
      }, 900);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isKhmer ? 'ស្កែនលំហាត់' : 'Homework Scanner'}
      className="w-full max-w-lg mx-auto bg-white rounded-3xl border-3 border-[#1B4332] shadow-[6px_6px_0px_#1B4332] overflow-hidden animate-fadeIn text-[#1B4332] max-h-[85vh] flex flex-col"
    >
      {/* Header */}
      <div className="p-4 bg-[#1B4332] border-b-3 border-[#1B4332] flex items-center justify-between text-white shrink-0">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 bg-[#40916C] text-[#1B4332] rounded-xl border-2 border-[#1B4332] shadow-[2px_2px_0px_#1B4332] flex items-center gap-1 text-xs font-black cursor-pointer hover:-translate-y-0.5 transition-transform"
        >
          <ArrowLeft className="w-4 h-4 stroke-[3]" /> {isKhmer ? 'ត្រឡប់' : 'Back'}
        </button>
        <div className="flex items-center gap-1.5 font-black text-sm text-[#40916C] drop-shadow-[1px_1px_0px_#1B4332]">
          <Camera className="w-4 h-4 stroke-[2.5]" /> {isKhmer ? 'ស្កែនលំហាត់' : 'Homework Scanner'}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Stage 1: Capture / Select Sample */}
        {stage === 'capture' && (
          <div className="p-5 sm:p-6 space-y-5 text-center">
            {/* Camera Frame */}
            <div className="relative w-full aspect-4/3 max-h-56 bg-[#E8F5E9] rounded-2xl border-3 border-dashed border-[#1B4332] flex flex-col items-center justify-center p-4 text-center group hover:bg-[#40916C]/30 transition-colors">
              {/* Viewfinder Corners */}
              <div className="absolute top-3 left-3 w-5 h-5 border-t-4 border-l-4 border-[#1B4332] rounded-tl-lg" />
              <div className="absolute top-3 right-3 w-5 h-5 border-t-4 border-r-4 border-[#1B4332] rounded-tr-lg" />
              <div className="absolute bottom-3 left-3 w-5 h-5 border-b-4 border-l-4 border-[#1B4332] rounded-bl-lg" />
              <div className="absolute bottom-3 right-3 w-5 h-5 border-b-4 border-r-4 border-[#1B4332] rounded-br-lg" />

              <TunsayAvatar size="sm" state="idle" showBadge={false} className="mb-1" />
              <p className="text-sm sm:text-base font-black text-[#1B4332] font-heading flex items-center justify-center gap-1.5">
                <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-[#1B4332]" />
                {isKhmer ? 'ថតរូបលំហាត់របស់អ្នក' : 'Scan your homework'}
              </p>
              <p className="text-xs font-bold text-[#1B4332]/80 mt-0.5 max-w-xs">
                {isKhmer 
                  ? 'ដាក់ក្រដាសលំហាត់របស់អ្នកឲ្យចំកណ្តាលស៊ុម' 
                  : 'Fit your homework page inside the frame'}
              </p>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 px-5 py-2.5 bg-[#2D6A4F] hover:bg-[#40916C] text-[#1B4332] font-black rounded-2xl border-3 border-[#1B4332] shadow-[3px_3px_0px_#1B4332] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#1B4332] transition-all flex items-center gap-2 cursor-pointer text-xs sm:text-sm"
              >
                <Upload className="w-4 h-4 stroke-[2.5]" />
                {isKhmer ? 'ជ្រើសរើសរូបថត' : 'Upload Photo'}
              </button>
            </div>

            {/* Sample Demo Homework Buttons - Single Row Horizontal Scroll with < > */}
            <div className="space-y-2 pt-1 text-left">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-black text-[#1B4332] uppercase tracking-wider">
                  {isKhmer 
                    ? 'ឬ ជ្រើសរើសលំហាត់គំរូសម្រាប់ការសាកល្បង៖' 
                    : 'Or select sample homework to try:'}
                </p>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => sampleScrollRef.current?.scrollBy({ left: -220, behavior: 'smooth' })}
                    className="p-1 bg-white hover:bg-[#40916C] text-[#1B4332] rounded-lg border-2 border-[#1B4332] shadow-[1.5px_1.5px_0px_#1B4332] cursor-pointer hover:-translate-y-0.5 active:translate-y-0.5 transition-all"
                    aria-label="Previous sample"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => sampleScrollRef.current?.scrollBy({ left: 220, behavior: 'smooth' })}
                    className="p-1 bg-white hover:bg-[#40916C] text-[#1B4332] rounded-lg border-2 border-[#1B4332] shadow-[1.5px_1.5px_0px_#1B4332] cursor-pointer hover:-translate-y-0.5 active:translate-y-0.5 transition-all"
                    aria-label="Next sample"
                  >
                    <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                </div>
              </div>

              <div 
                ref={sampleScrollRef}
                className="flex gap-2.5 overflow-x-auto scrollbar-none scroll-smooth pb-1 px-1"
              >
                {MOCK_PROBLEMS.map((prob) => (
                  <button
                    key={prob.id}
                    type="button"
                    onClick={() => handleSelectSample(prob)}
                    className="p-3 rounded-2xl border-3 border-[#1B4332] bg-[#E8F5E9] hover:bg-[#40916C] text-left transition-all shadow-[2px_2px_0px_#1B4332] flex flex-col justify-between cursor-pointer group shrink-0 w-[210px] sm:w-[230px]"
                  >
                    <div>
                      <span className="text-[10px] font-black text-[#1B4332] bg-white px-2 py-0.5 rounded-full border-2 border-[#1B4332] inline-block">
                        {isKhmer 
                          ? `ថ្នាក់ទី ${prob.grade} • ${prob.subject === 'math' ? 'គណិត' : prob.subject === 'science' ? 'វិទ្យាសាស្ត្រ' : 'អង់គ្លេស'}` 
                          : `Grade ${prob.grade} • ${prob.subject === 'math' ? 'Math' : prob.subject === 'science' ? 'Science' : 'English'}`}
                      </span>
                      <p className="font-black text-xs text-[#1B4332] mt-2 line-clamp-2 leading-tight">
                        {isKhmer ? prob.titleKhmer : prob.titleEng}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t-2 border-[#1B4332]/15">
                      <span className="text-[10px] font-black text-[#1B4332]">
                        {isKhmer ? 'សាកល្បង' : 'Try sample'}
                      </span>
                      <Sparkles className="w-3.5 h-3.5 text-[#2D6A4F]" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Stage 2: Preview */}
        {stage === 'preview' && (
          <div className="p-6 space-y-5 text-center">
            <div className="relative rounded-2xl overflow-hidden border-3 border-[#1B4332] shadow-[4px_4px_0px_#1B4332] max-h-[60vh] bg-black/5 flex items-center justify-center p-2">
              <img
                src={imageUri}
                alt="Homework preview"
                className="max-h-[55vh] w-auto max-w-full object-contain rounded-xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23E8F5E9%22 width=%22400%22 height=%22300%22/%3E%3Ctext fill=%22%231B4332%22 font-family=%22sans-serif%22 font-size=%2218%22 dy=%22.3em%22 text-anchor=%22middle%22 x=%22200%22 y=%22150%22%3EImage unavailable%3C/text%3E%3C/svg%3E';
                }}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStage('capture')}
                className="flex-1 py-3 px-4 rounded-2xl border-3 border-[#1B4332] bg-white text-[#1B4332] font-black text-sm flex items-center justify-center gap-1.5 shadow-[3px_3px_0px_#1B4332] hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 stroke-[2.5]" /> {isKhmer ? 'ថតសារថ្មី' : 'Retake'}
              </button>
              <button
                type="button"
                onClick={handleConfirmPhoto}
                className="flex-1 py-3 px-4 rounded-2xl bg-[#2D6A4F] text-[#1B4332] font-black text-sm border-3 border-[#1B4332] shadow-[3px_3px_0px_#1B4332] flex items-center justify-center gap-1.5 hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <CheckCircle className="w-4 h-4 stroke-[2.5]" /> {isKhmer ? 'ប្រើរូបនេះ' : 'Use Photo'}
              </button>
            </div>
          </div>
        )}

        {/* Stage 3: Tunsay Reading Analysis */}
        {stage === 'analyzing' && (
          <div className="p-10 text-center space-y-4">
            <TunsayAvatar size="lg" state="thinking" showBadge={false} className="mx-auto" />
            <div className="space-y-1">
              <h3 className="text-lg font-black text-[#1B4332] font-heading flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-[#2D6A4F] animate-spin" />
                {isKhmer ? 'ReanMoreកំពុងអានលំហាត់របស់អ្នក...' : 'Tunsay is reading your homework...'}
              </h3>
            </div>
            <div className="w-48 h-3 bg-[#E8F5E9] border-2 border-[#1B4332] rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-[#A7CDB4] animate-pulse rounded-full w-3/4" />
            </div>
          </div>
        )}

        {/* Stage 4: Confirm Analyzed Question */}
        {stage === 'confirm' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-[#40916C] rounded-2xl border-3 border-[#1B4332] shadow-[3px_3px_0px_#1B4332]">
              <TunsayAvatar size="sm" state="explaining" showBadge={false} />
              <div>
                <p className="font-black text-sm text-[#1B4332]">
                  {isKhmer 
                    ? 'ខ្ញុំឃើញលំហាត់របស់អ្នកហើយ! តោះដោះស្រាយវាជាមួយគ្នា!' 
                    : "I can see your homework problem. Let's solve it together!"}
                </p>
              </div>
            </div>

            {/* Multi-Problem Carousel Selector */}
            {scannedProblems.length > 1 && (
              <div className="space-y-1.5 text-left">
                <p className="text-xs font-black text-[#1B4332] uppercase tracking-wider">
                  {isKhmer ? 'សំណួរដែលរកឃើញ (ជ្រើសរើសមួយ)៖' : 'Detected Problems (Select one):'}
                </p>
                <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1.5 px-0.5">
                  {scannedProblems.map((prob, idx) => {
                    const isSelected = selectedProblem.id === prob.id;
                    return (
                      <button
                        key={prob.id || idx}
                        type="button"
                        onClick={() => setSelectedProblem(prob)}
                        className={`px-3 py-2 rounded-2xl border-2 border-[#1B4332] font-black text-xs shrink-0 cursor-pointer transition-all flex flex-col items-center justify-center min-w-[105px] sm:min-w-[115px] ${
                          isSelected
                            ? 'bg-[#1B4332] text-white shadow-[2px_2px_0px_#40916C] scale-102'
                            : 'bg-[#E8F5E9] text-[#1B4332] hover:bg-[#40916C]/30 shadow-[1.5px_1.5px_0px_#1B4332]'
                        }`}
                      >
                        <span className="text-[10px] font-black leading-tight opacity-80">
                          {isKhmer ? 'លំហាត់ទី' : 'Scanned Problem'}
                        </span>
                        <span className="text-xs font-black leading-tight">
                          {isKhmer ? `${idx + 1}` : `${idx + 1}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="p-4 bg-[#E8F5E9] rounded-2xl border-3 border-[#1B4332] shadow-[3px_3px_0px_#1B4332] space-y-1.5 text-left">
              <p className="text-xs font-black text-[#1B4332] uppercase tracking-wider">
                {isKhmer ? 'សំណួរដែលស្កែនបាន៖' : 'Detected Question:'}
              </p>
              <p className="font-black text-base text-[#1B4332] leading-relaxed">
                {isKhmer ? selectedProblem.problemStatementKhmer : selectedProblem.problemStatementEng}
              </p>
            </div>

            <p className="text-center font-black text-sm text-[#1B4332]">
              {isKhmer ? 'តើសំណួរនេះត្រឹមត្រូវទេ?' : 'Does this look correct?'}
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStage('capture')}
                className="flex-1 py-3 px-4 rounded-2xl border-3 border-[#1B4332] bg-white text-[#1B4332] font-black text-xs sm:text-sm shadow-[3px_3px_0px_#1B4332] flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0.5"
              >
                <RefreshCw className="w-4 h-4 stroke-[2.5]" /> {isKhmer ? 'ថតឡើងវិញ' : 'Retake Photo'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const queue = scannedProblems.length > 0 ? scannedProblems : [selectedProblem];
                  const selectedIdx = queue.findIndex(p => p.id === selectedProblem.id);
                  onHomeworkConfirmed(queue, selectedIdx >= 0 ? selectedIdx : 0);
                }}
                className="flex-1 py-3 px-4 rounded-2xl bg-[#2D6A4F] text-[#1B4332] font-black text-xs sm:text-sm border-3 border-[#1B4332] shadow-[3px_3px_0px_#1B4332] flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0.5"
              >
                <span>{isKhmer ? 'តោះចាប់ផ្តើម!' : "Yes, let's start!"}</span>
                <CheckCircle className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}

        {/* Stage 5: Error */}
        {stage === 'error' && (
          <div className="p-8 text-center space-y-4">
            <AlertCircle className="w-14 h-14 text-red-500 mx-auto" />
            <h3 className="text-lg font-black text-[#1B4332]">
              {isKhmer ? 'មានបញ្ហា!' : 'Something went wrong'}
            </h3>
            <p className="text-sm font-bold text-[#1B4332]/70">{ocrError}</p>
            <button
              type="button"
              onClick={() => { setStage('capture'); uploadedFileRef.current = null; }}
              className="mt-2 px-6 py-3 bg-[#2D6A4F] text-white font-black rounded-2xl border-3 border-[#1B4332] shadow-[3px_3px_0px_#1B4332] flex items-center gap-2 mx-auto cursor-pointer hover:-translate-y-0.5 transition-all"
            >
              <RefreshCw className="w-4 h-4 stroke-[2.5]" />
              {isKhmer ? 'ព្យាយាមម្តងទៀត' : 'Try Again'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
