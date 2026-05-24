import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp, FaTrophy, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const ResultSection = ({ result, loading }) => {
  const [expandedDimensions, setExpandedDimensions] = useState({
    TR: true,
    CC: false,
    LR: false,
    GRA: false
  });

  const dimensionNames = {
    TR: 'Task Response',
    CC: 'Coherence & Cohesion',
    LR: 'Lexical Resource',
    GRA: 'Grammatical Range & Accuracy'
  };

  const toggleDimension = (dimension) => {
    setExpandedDimensions(prev => ({
      ...prev,
      [dimension]: !prev[dimension]
    }));
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 7) return 'text-blue-600';
    if (score >= 6) return 'text-yellow-600';
    if (score >= 5) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 8) return 'bg-green-100 border-green-300';
    if (score >= 7) return 'bg-blue-100 border-blue-300';
    if (score >= 6) return 'bg-yellow-100 border-yellow-300';
    if (score >= 5) return 'bg-orange-100 border-orange-300';
    return 'bg-red-100 border-red-300';
  };

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto mt-8 p-8 bg-white rounded-2xl shadow-xl">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-purple-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-xl font-semibold text-gray-700 mb-2">AI 分析中...</p>
          <p className="text-sm text-gray-500">正在处理您的作文，预计需要 30-60 秒</p>
        </div>
      </div>
    );
  }

  if (!result || !result.analysis) {
    return null;
  }

  const { analysis, overallScore } = result;

  return (
    <div className="w-full max-w-5xl mx-auto mt-8 animate-fade-in">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">分析完成</h2>
            <p className="text-blue-100">基于 IELTS 官方评分标准的专业分析</p>
          </div>
          <div className="flex flex-col items-center">
            <FaTrophy className="text-6xl mb-2 text-yellow-300" />
            <div className={`text-5xl font-bold ${overallScore >= 7 ? 'text-yellow-300' : 'text-white'}`}>
              {overallScore}
            </div>
            <div className="text-sm text-blue-100 mt-1">Overall Band</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-b-2xl shadow-xl p-6">
        <div className="grid grid-cols-4 gap-4 mb-6">
          {Object.keys(analysis).map(dimension => (
            <div
              key={dimension}
              className={`p-4 rounded-lg border-2 ${getScoreBgColor(analysis[dimension].score)} transition-all duration-300 hover:shadow-lg cursor-pointer`}
              onClick={() => toggleDimension(dimension)}
            >
              <div className="text-xs font-semibold text-gray-600 mb-1">
                {dimensionNames[dimension]}
              </div>
              <div className={`text-3xl font-bold ${getScoreColor(analysis[dimension].score)}`}>
                {analysis[dimension].score}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {Object.keys(analysis).map(dimension => (
            <div
              key={dimension}
              className="border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-md"
            >
              <button
                onClick={() => toggleDimension(dimension)}
                className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className={`text-2xl font-bold ${getScoreColor(analysis[dimension].score)}`}>
                    {analysis[dimension].score}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {dimensionNames[dimension]}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {analysis[dimension].justification?.substring(0, 80)}...
                    </p>
                  </div>
                </div>
                <div className="text-gray-400">
                  {expandedDimensions[dimension] ? <FaChevronUp /> : <FaChevronDown />}
                </div>
              </button>

              {expandedDimensions[dimension] && (
                <div className="px-6 py-5 bg-white border-t border-gray-200 animate-slide-down">
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <span className="text-purple-600">评分理由</span>
                    </h4>
                    <p className="text-gray-600 leading-relaxed">
                      {analysis[dimension].justification}
                    </p>
                  </div>

                  {analysis[dimension].details && (
                    <>
                      {analysis[dimension].details.strengths?.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-green-600 mb-2 flex items-center gap-2">
                            <FaCheckCircle /> 优势
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-gray-600">
                            {analysis[dimension].details.strengths.map((strength, idx) => (
                              <li key={idx} className="leading-relaxed">{strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {analysis[dimension].details.weaknesses?.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-orange-600 mb-2 flex items-center gap-2">
                            <FaExclamationTriangle /> 需要改进
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-gray-600">
                            {analysis[dimension].details.weaknesses.map((weakness, idx) => (
                              <li key={idx} className="leading-relaxed">{weakness}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {analysis[dimension].details.problematic_sentences?.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-red-600 mb-2">问题句子</h4>
                          <div className="space-y-2">
                            {analysis[dimension].details.problematic_sentences.map((sentence, idx) => (
                              <div key={idx} className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
                                <p className="text-gray-700 italic">&ldquo;{sentence}&rdquo;</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {analysis[dimension].details.errors?.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-red-600 mb-2">错误示例</h4>
                          <div className="space-y-2">
                            {analysis[dimension].details.errors.map((error, idx) => (
                              <div key={idx} className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
                                <p className="text-gray-700">{error}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {analysis[dimension].details.suggestions?.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-blue-600 mb-2">改进建议</h4>
                          <ul className="list-decimal list-inside space-y-1 text-gray-600">
                            {analysis[dimension].details.suggestions.map((suggestion, idx) => (
                              <li key={idx} className="leading-relaxed">{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-down {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 2000px; }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ResultSection;