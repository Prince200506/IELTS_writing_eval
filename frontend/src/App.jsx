import React, { useState } from 'react';
import InputSection from './components/InputSection';
import ResultSection from './components/ResultSection';
import { analyzeEssay } from './utils/api';

const App = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async ({ question, essay, questionType }) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await analyzeEssay(question, essay, questionType);
      
      if (response.success && response.data) {
        setResult({
          analysis: response.data.analysis,
          overallScore: response.data.overallScore,
          id: response.data.id
        });
      } else {
        throw new Error(response.message || '分析失败');
      }
    } catch (err) {
      setError(err.message || '分析请求失败，请稍后重试');
      console.error('分析错误:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <InputSection onSubmit={handleSubmit} loading={loading} />
        
        {error && (
          <div className="w-full max-w-5xl mx-auto mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <ResultSection result={result} loading={loading} />

        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>IELTS Writing Assistant By HAISNAP</p>
          <p className="mt-2">基于 AI 的雅思作文专业评分与分析工具</p>
        </footer>
      </div>
    </div>
  );
};

export default App;