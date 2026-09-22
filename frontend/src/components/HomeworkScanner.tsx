import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, RefreshCw, CheckCircle, ArrowLeft, Sparkles, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Circle, ListOrdered } from 'lucide-react';
import { TunsayAvatar } from './TunsayAvatar';
import { HomeworkProblem, Language } from '../types';
import { MOCK_PROBLEMS, BACKEND_MOCK_WORKSHEET_PROBLEMS } from '../data/mockProblems';
import { processHomeworkImage, fetchBackendMockExercises } from '../services/ocrService';

interface HomeworkScannerProps {
  language?: Language;
  onHomeworkConfirmed: (problem: HomeworkProblem, allProblems?: HomeworkProblem[]) => void;
  onCancel: () => void;
}

export const HomeworkScanner: React.FC<HomeworkScannerProps> = ({
  language = 'km',
  onHomeworkConfirmed,
  onCancel
}) => {
  const isKhmer = language === 'km';
  const [stage, setStage] = useState<'capture' | 'preview' | 'analyzing' | 'confirm'>('capture');
  const [imageUri, setImageUri] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedProblem, setSelectedProblem] = useState<HomeworkProblem>(MOCK_PROBLEMS[0]);
  const [detectedProblems, setDetectedProblems] = useState<HomeworkProblem[]>([]);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleLoadBackendMockWorksheet = async () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setSelectedFile(null);
    setOcrError(null);
    setImageUri('https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=600&auto=format&fit=crop&q=80');
    setStage('analyzing');
    setStatusMessage(isKhmer ? 'កំពុងទាញយកលំហាត់ Q5, Q6, Q7 ពី Backend Gateway...' : 'Fetching backend mock exercises (Q5, Q6, Q7)...');

    try {
      const result = await fetchBackendMockExercises();
      if (result.success && result.problems.length > 0) {
        setDetectedProblems(result.problems);
        setSelectedProblem(result.problems[0]);
        setStage('confirm');
      } else {
        setDetectedProblems(BACKEND_MOCK_WORKSHEET_PROBLEMS);
        setSelectedProblem(BACKEND_MOCK_WORKSHEET_PROBLEMS[0]);
        setStage('confirm');
      }
    } catch {
      setDetectedProblems(BACKEND_MOCK_WORKSHEET_PROBLEMS);
      setSelectedProblem(BACKEND_MOCK_WORKSHEET_PROBLEMS[0]);
      setStage('confirm');
    }
  };

  const handleSelectSample = (problem: HomeworkProblem) => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setSelectedFile(null);
    setOcrError(null);
    setSelectedProblem(problem);

    const isBackendMulti = BACKEND_MOCK_WORKSHEET_PROBLEMS.some(p => p.id === problem.id);
    if (isBackendMulti) {
      setDetectedProblems(BACKEND_MOCK_WORKSHEET_PROBLEMS);
    } else {
      setDetectedProblems([problem]);
    }

    setImageUri(problem.imageUri || 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80');
    setStage('preview');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      setSelectedFile(file);
      setOcrError(null);
      setImageUri(url);
      setStage('preview');
    }
  };

  const handleConfirmPhoto = async () => {
    setStage('analyzing');
    setOcrError(null);

    // If it's a real uploaded file, run actual OCR pipeline
    if (selectedFile) {
      setStatusMessage(isKhmer ? 'កំពុងដំណើរការ OCR & VLM លើលំហាត់របស់អ្នក...' : 'Running OCR & VLM pipeline on your worksheet...');
      try {
        const result = await processHomeworkImage(selectedFile);
        if (result.success && result.problems.length > 0) {
          const probs = result.problems.map(p => ({
            ...p,
            imageUri: imageUri
          }));
          setDetectedProblems(probs);
          setSelectedProblem(probs[0]);
          setStage('confirm');
          return;
        } else {
          setOcrError(result.error || (isKhmer ? 'មិនអាចអានអត្ថបទពីសន្លឹកកិច្ចការបានទេ។ សូមសាកល្បងរូបភាពច្បាស់ជាងនេះ។' : 'Could not detect clear questions from the image. Please try a clearer photo.'));
          setStage('confirm');
          return;
        }
      } catch (err: any) {
        setOcrError(err?.message || 'Error processing OCR');
        setStage('confirm');
        return;
      }
    }

    // Sample fallback simulation
    setTimeout(() => {
      setStage('confirm');
    }, 1500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isKhmer ? 'ស្កែនលំហាត់' : 'Homework Scanner'}
      className="w-full max-w-xl mx-auto bg-white rounded-3xl border-3 border-[#1B4332] shadow-[6px_6px_0px_#1B4332] overflow-hidden animate-fadeIn text-[#1B4332] max-h-[85vh] flex flex-col"
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
          <Camera className="w-4 h-4 stroke-[2.5]" /> {isKhmer ? 'ស្កែនលំហាត់ (OCR + VLM)' : 'Homework Scanner (OCR + VLM)'}
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
                {isKhmer ? 'ថតរូប ឬ ដាក់ឯកសារលំហាត់' : 'Upload or Scan Homework'}
              </p>
              <p className="text-xs font-bold text-[#1B4332]/80 mt-0.5 max-w-xs">
                {isKhmer 
                  ? 'គាំទ្ររូបភាព JPG, PNG ឬឯកសារ PDF' 
                  : 'Supports JPG, PNG photos or PDF worksheets'}
              </p>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 px-5 py-2.5 bg-[#2D6A4F] hover:bg-[#40916C] text-white font-black rounded-2xl border-3 border-[#1B4332] shadow-[3px_3px_0px_#1B4332] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#1B4332] transition-all flex items-center gap-2 cursor-pointer text-xs sm:text-sm"
              >
                <Upload className="w-4 h-4 stroke-[2.5]" />
                {isKhmer ? 'ជ្រើសរើសរូបថត / PDF' : 'Upload Photo / PDF'}
              </button>
            </div>

            {/* Featured Multi-Exercise Worksheet (Backend Mock) */}
            <div className="p-3.5 bg-[#D8F3DC] rounded-2xl border-2 border-[#2D6A4F] text-left flex items-center justify-between gap-3 shadow-[2px_2px_0px_#1B4332]">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-black text-xs text-[#1B4332]">
                  <Sparkles className="w-3.5 h-3.5 text-[#2D6A4F] shrink-0" />
                  <span className="truncate">{isKhmer ? 'សន្លឹកកិច្ចការចម្រុះ (Backend Mock Q5, Q6, Q7)' : 'Multi-Exercise Worksheet (Backend Mock)'}</span>
                </div>
                <p className="text-[11px] font-bold text-[#1B4332]/80 mt-0.5 line-clamp-1">
                  {isKhmer ? 'សាកល្បងជ្រើសរើសក្នុងចំណោមលំហាត់ ៣ នៅលើសន្លឹកកិច្ចការតែមួយ' : 'Includes 3 exercises: Adjusting Tens, Money, Doubling'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLoadBackendMockWorksheet}
                className="px-3.5 py-1.5 bg-[#2D6A4F] hover:bg-[#40916C] text-white font-black text-xs rounded-xl border-2 border-[#1B4332] shadow-[2px_2px_0px_#1B4332] shrink-0 cursor-pointer hover:-translate-y-0.5 active:translate-y-0.5 transition-all"
              >
                {isKhmer ? 'សាកល្បង' : 'Try Demo'}
              </button>
            </div>

            {/* Sample Demo Homework Buttons */}
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
            <div className="relative rounded-2xl overflow-hidden border-3 border-[#1B4332] shadow-[4px_4px_0px_#1B4332] max-h-64 bg-black/5 flex items-center justify-center">
              {selectedFile?.type === 'application/pdf' ? (
                <div className="p-8 text-center">
                  <span className="text-4xl">📄</span>
                  <p className="font-black text-sm mt-2 text-[#1B4332]">{selectedFile.name}</p>
                </div>
              ) : (
                <img
                  src={imageUri}
                  alt="Homework preview"
                  className="w-full h-full object-contain max-h-64"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23E8F5E9%22 width=%22400%22 height=%22300%22/%3E%3Ctext fill=%22%231B4332%22 font-family=%22sans-serif%22 font-size=%2218%22 dy=%22.3em%22 text-anchor=%22middle%22 x=%22200%22 y=%22150%22%3EImage unavailable%3C/text%3E%3C/svg%3E';
                  }}
                />
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStage('capture')}
                className="flex-1 py-3 px-4 rounded-2xl border-3 border-[#1B4332] bg-white text-[#1B4332] font-black text-sm flex items-center justify-center gap-1.5 shadow-[3px_3px_0px_#1B4332] hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 stroke-[2.5]" /> {isKhmer ? 'ថតសារថ្មី' : 'Retake / Reselect'}
              </button>
              <button
                type="button"
                onClick={handleConfirmPhoto}
                className="flex-1 py-3 px-4 rounded-2xl bg-[#2D6A4F] text-white font-black text-sm border-3 border-[#1B4332] shadow-[3px_3px_0px_#1B4332] flex items-center justify-center gap-1.5 hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <CheckCircle className="w-4 h-4 stroke-[2.5]" /> {isKhmer ? 'ដំណើរការ OCR' : 'Analyze with OCR'}
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
                {isKhmer ? 'ទន្សាយកំពុងអានលំហាត់របស់អ្នក...' : 'Tunsay is reading your homework...'}
              </h3>
              <p className="text-xs font-bold text-[#1B4332]/70">
                {statusMessage || (isKhmer ? 'PaddleOCR & Gemini VLM កំពុងវិភាគ...' : 'Detecting layout, text, and diagrams...')}
              </p>
            </div>
            <div className="w-48 h-3 bg-[#E8F5E9] border-2 border-[#1B4332] rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-[#2D6A4F] animate-pulse rounded-full w-3/4" />
            </div>
          </div>
        )}

        {/* Stage 4: Confirm Analyzed Question */}
        {stage === 'confirm' && (
          <div className="p-5 sm:p-6 space-y-4">
            {ocrError ? (
              <div className="p-4 bg-amber-50 rounded-2xl border-3 border-amber-500 text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-black text-sm text-amber-800">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  {isKhmer ? 'ដំណឹងពីសេវា OCR' : 'OCR Service Notice'}
                </div>
                <p className="text-xs font-semibold">{ocrError}</p>
                <div className="pt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleLoadBackendMockWorksheet}
                    className="px-3 py-1.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-black rounded-xl border-2 border-[#1B4332] shadow-[2px_2px_0px_#1B4332] cursor-pointer flex items-center gap-1.5 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                    <span>{isKhmer ? 'ប្រើលំហាត់គំរូពី Backend (Q5, Q6, Q7)' : 'Use Backend Exercises (Q5, Q6, Q7)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStage('capture')}
                    className="px-3 py-1.5 bg-white text-[#1B4332] text-xs font-black rounded-xl border-2 border-[#1B4332] shadow-[2px_2px_0px_#1B4332] cursor-pointer"
                  >
                    {isKhmer ? 'ថតសារថ្មី' : 'Retake'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Header Banner */}
                <div className="flex items-center gap-3 p-3.5 bg-[#40916C] rounded-2xl border-3 border-[#1B4332] shadow-[3px_3px_0px_#1B4332]">
                  <TunsayAvatar size="sm" state="explaining" showBadge={false} />
                  <div className="flex-1">
                    <p className="font-black text-sm text-white">
                      {detectedProblems.length > 1
                        ? (isKhmer 
                            ? `រកឃើញលំហាត់ចំនួន ${detectedProblems.length} នៅលើសន្លឹកកិច្ចការរបស់អ្នក!` 
                            : `Found ${detectedProblems.length} exercises on your worksheet!`)
                        : (isKhmer 
                            ? 'ខ្ញុំឃើញលំហាត់របស់អ្នកហើយ! តោះដោះស្រាយជាមួយគ្នា!' 
                            : "I can see your homework problem. Let's solve it together!")}
                    </p>
                    <p className="text-xs font-bold text-white/90">
                      {isKhmer 
                        ? 'សូមជ្រើសរើសលំហាត់ដែលអ្នកចង់ដោះស្រាយជាមួយទន្សាយ៖' 
                        : 'Choose which exercise you would like to solve with Tunsay:'}
                    </p>
                  </div>
                </div>

                {/* Exercises Card List */}
                <div className="space-y-2 text-left">
                  <div className="flex items-center justify-between text-xs font-black text-[#1B4332]">
                    <span className="flex items-center gap-1.5">
                      <ListOrdered className="w-4 h-4 text-[#2D6A4F]" />
                      {isKhmer 
                        ? `បញ្ជីលំហាត់ដែលរកឃើញ (${detectedProblems.length})` 
                        : `Available Exercises (${detectedProblems.length})`}
                    </span>
                    <span className="text-[11px] font-bold text-[#1B4332]/70">
                      {isKhmer ? 'ចុចលើលំហាត់ដើម្បីជ្រើសរើស' : 'Click an exercise card to select'}
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-56 sm:max-h-64 overflow-y-auto pr-1">
                    {detectedProblems.map((prob, idx) => {
                      const isSelected = selectedProblem.id === prob.id;
                      return (
                        <button
                          key={prob.id}
                          type="button"
                          onClick={() => setSelectedProblem(prob)}
                          className={`w-full text-left p-3.5 rounded-2xl border-3 transition-all cursor-pointer flex flex-col gap-1.5 ${
                            isSelected
                              ? 'bg-[#E8F5E9] border-[#2D6A4F] shadow-[3px_3px_0px_#1B4332] ring-2 ring-[#2D6A4F]'
                              : 'bg-white border-[#1B4332]/30 hover:border-[#1B4332] hover:bg-[#F0FDF4] shadow-[1.5px_1.5px_0px_#1B4332]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {isSelected ? (
                                <CheckCircle2 className="w-5 h-5 text-[#2D6A4F] shrink-0" />
                              ) : (
                                <Circle className="w-5 h-5 text-gray-400 shrink-0" />
                              )}
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-black shrink-0 ${
                                  isSelected
                                    ? 'bg-[#2D6A4F] text-white'
                                    : 'bg-gray-100 text-[#1B4332] border border-[#1B4332]/20'
                                }`}
                              >
                                {isKhmer ? `លំហាត់ទី ${idx + 1}` : `Exercise ${idx + 1}`}
                              </span>
                              <span className="font-black text-xs text-[#1B4332] truncate">
                                {isKhmer ? prob.titleKhmer : prob.titleEng}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                                isSelected
                                  ? 'bg-[#2D6A4F]/20 text-[#1B4332]'
                                  : 'text-gray-400'
                              }`}
                            >
                              {isSelected ? (isKhmer ? '✓ បានជ្រើស' : '✓ Selected') : (isKhmer ? 'ជ្រើសរើស' : 'Select')}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-[#1B4332]/90 pl-7 line-clamp-2 whitespace-pre-line text-left">
                            {isKhmer ? prob.problemStatementKhmer : prob.problemStatementEng}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Exercise Preview Box */}
                <div className="p-3 bg-[#D8F3DC] rounded-2xl border-2 border-[#2D6A4F] text-left space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-black text-[#1B4332] uppercase">
                    <Sparkles className="w-3.5 h-3.5 text-[#2D6A4F]" />
                    <span>
                      {isKhmer 
                        ? `ខ្លឹមសារលំហាត់ដែលបានជ្រើសរើស (${selectedProblem.titleKhmer || selectedProblem.titleEng})៖` 
                        : `Selected Problem Statement (${selectedProblem.titleEng}):`}
                    </span>
                  </div>
                  <p className="font-bold text-xs text-[#1B4332] whitespace-pre-line max-h-20 overflow-y-auto pr-1">
                    {isKhmer ? selectedProblem.problemStatementKhmer : selectedProblem.problemStatementEng}
                  </p>
                </div>
              </>
            )}

            {/* Bottom Actions */}
            <div className="flex flex-wrap sm:flex-nowrap gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setStage('capture')}
                className="py-2.5 px-4 rounded-2xl border-3 border-[#1B4332] bg-white text-[#1B4332] font-black text-xs sm:text-sm shadow-[3px_3px_0px_#1B4332] flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:-translate-y-0.5 shrink-0"
              >
                <RefreshCw className="w-4 h-4 stroke-[2.5]" /> 
                {isKhmer ? 'ថតឡើងវិញ' : 'Retake'}
              </button>

              {detectedProblems.length > 1 && (
                <button
                  type="button"
                  onClick={() => onHomeworkConfirmed(selectedProblem, detectedProblems)}
                  className="flex-1 py-2.5 px-3 rounded-2xl bg-[#E8F5E9] text-[#1B4332] font-black text-xs sm:text-sm border-3 border-[#1B4332] shadow-[3px_3px_0px_#1B4332] flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0.5"
                >
                  <ListOrdered className="w-4 h-4 stroke-[2.5] text-[#2D6A4F]" />
                  <span>{isKhmer ? `ដោះស្រាយទាំងអស់ (${detectedProblems.length})` : `Solve All (${detectedProblems.length})`}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onHomeworkConfirmed(selectedProblem, detectedProblems.length > 0 ? detectedProblems : [selectedProblem])}
                className="flex-1 py-2.5 px-4 rounded-2xl bg-[#2D6A4F] text-white font-black text-xs sm:text-sm border-3 border-[#1B4332] shadow-[3px_3px_0px_#1B4332] flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0.5"
              >
                <span>{isKhmer ? 'ដោះស្រាយលំហាត់នេះ' : 'Solve Selected'}</span>
                <CheckCircle className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
