import React, { useState } from 'react';
import { FaImage, FaKeyboard, FaPaperPlane, FaRobot } from 'react-icons/fa';
import UploadButton from './UploadButton';

const InputSection = ({ onSubmit, loading }) => {
  const [questionText, setQuestionText] = useState('');
  const [essayText, setEssayText] = useState('');
  const [questionType, setQuestionType] = useState('Task 2');
  const [hasUploadedImage, setHasUploadedImage] = useState(false);
  const [uploadedImageFile, setUploadedImageFile] = useState(null);
  const [analyzeImageDirectly, setAnalyzeImageDirectly] = useState(false);

  const handleSubmit = () => {
    if (analyzeImageDirectly && !uploadedImageFile) {
      alert('请上传题目图片');
      return;
    }
    
    if (!analyzeImageDirectly && !questionText.trim()) {
      alert('请输入或上传题目');
      return;
    }
    
    if (!essayText.trim()) {
      alert('请输入您的作文');
      return;
    }
    
    if (essayText.trim().split(/\s+/).length < 150) {
      alert('作文字数不足150字，请继续补充');
      return;
    }
    
    onSubmit({ 
      question: questionText, 
      essay: essayText, 
      questionType,
      questionImage: uploadedImageFile,
      analyzeImageDirectly
    });
  };

  const handleUploadSuccess = (data) => {
    setHasUploadedImage(true);
    
    if (analyzeImageDirectly) {
      setUploadedImageFile(data);
      setQuestionText('已上传题目图片，将由 AI 直接分析');
    } else {
      if (questionText.trim()) {
        const userChoice = window.confirm(
          '检测到您已输入题目文字。\n\n点击「确定」将图片识别内容追加到现有文字后；\n点击「取消」将替换为图片识别内容。'
        );
        if (userChoice) {
          setQuestionText(questionText + '\n\n' + data);
        } else {
          setQuestionText(data);
        }
      } else {
        setQuestionText(data);
      }
    }
  };

  const handleUploadError = (errorMessage) => {
    alert(errorMessage);
  };

  const handleAnalyzeModeChange = (isDirect) => {
    setAnalyzeImageDirectly(isDirect);
    setHasUploadedImage(false);
    setUploadedImageFile(null);
    if (isDirect) {
      setQuestionText('');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
          <h1 className="text-3xl font-bold text-white mb-2">IELTS Writing Assistant</h1>
          <p className="text-blue-100">基于 AI 的雅思作文专业评分与分析工具</p>
        </div>

        <div className="p-8 space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="text-lg font-semibold text-gray-800">
                题目类型
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setQuestionType('Task 1')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    questionType === 'Task 1'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Task 1
                </button>
                <button
                  onClick={() => setQuestionType('Task 2')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    questionType === 'Task 2'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Task 2
                </button>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="text-lg font-semibold text-gray-800">
                题目输入
              </label>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <FaKeyboard className="text-blue-500" />
                <span>文本</span>
                <span className="text-gray-300">+</span>
                <FaImage className="text-purple-500" />
                <span>图片</span>
              </div>
            </div>

            <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-4">
                <FaRobot className="text-3xl text-purple-600" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 mb-2">图片分析模式</h4>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="analyzeMode"
                        checked={!analyzeImageDirectly}
                        onChange={() => handleAnalyzeModeChange(false)}
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">
                        识别图片文字后编辑
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="analyzeMode"
                        checked={analyzeImageDirectly}
                        onChange={() => handleAnalyzeModeChange(true)}
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">
                        直接让 AI 分析图片内容
                      </span>
                    </label>
                  </div>
                </div>
              </div>
              {analyzeImageDirectly && (
                <div className="mt-3 text-xs text-purple-700 bg-purple-100 p-2 rounded">
                  <strong>提示：</strong>AI 将直接识别并分析图片中的题目内容（如图表、数据等），无需手动输入文字。适合包含复杂图表的题目。
                </div>
              )}
            </div>

            <div className="space-y-4">
              {!analyzeImageDirectly && (
                <div>
                  <textarea
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="请输入雅思写作题目（支持手动输入或图片识别后编辑）..."
                    rows="4"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-all duration-300 resize-none"
                    disabled={loading}
                  />
                  {hasUploadedImage && questionText && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
                      <FaImage />
                      <span>已包含图片识别内容，您可以继续编辑</span>
                    </div>
                  )}
                </div>
              )}

              {analyzeImageDirectly && hasUploadedImage && (
                <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded">
                  <div className="flex items-center gap-2 text-green-700">
                    <FaImage className="text-xl" />
                    <span className="font-medium">已上传题目图片，AI 将直接分析图片内容</span>
                  </div>
                </div>
              )}

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gradient-to-br from-blue-50 to-purple-50">
                <div className="flex flex-col items-center justify-center">
                  <FaImage className="text-4xl text-purple-400 mb-3" />
                  <p className="text-sm text-gray-600 mb-3 text-center">
                    {analyzeImageDirectly 
                      ? '上传题目图片，AI 将直接分析图片中的题目内容'
                      : '上传题目图片，自动识别并添加到文本框中'
                    }
                  </p>
                  <UploadButton 
                    onUploadSuccess={handleUploadSuccess}
                    onUploadError={handleUploadError}
                    mode={analyzeImageDirectly ? 'direct' : 'ocr'}
                  />
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                <p className="text-xs text-blue-700">
                  <strong>提示：</strong>
                  {analyzeImageDirectly 
                    ? '选择"直接让 AI 分析图片内容"模式后，AI 将自动识别图片中的题目信息（如图表、数据、问题要求等），无需手动输入。适合包含复杂图表的 Task 1 题目。'
                    : '您可以直接输入题目文字，或上传题目图片进行识别，也可以两者结合使用。图片识别后的内容会自动填入文本框，您可以继续编辑完善。'
                  }
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-lg font-semibold text-gray-800 mb-4 block">
              您的作文
            </label>
            <textarea
              value={essayText}
              onChange={(e) => setEssayText(e.target.value)}
              placeholder="请输入您的雅思作文（至少 150 字）..."
              rows="12"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-all duration-300 resize-none font-mono text-sm"
              disabled={loading}
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-gray-500">
                字数：{essayText.trim().split(/\s+/).filter(word => word.length > 0).length} 字
              </p>
              <p className="text-xs text-gray-400">
                建议 Task 1 至少 150 字，Task 2 至少 250 字
              </p>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`
                flex items-center gap-3 px-8 py-4 rounded-lg font-semibold text-lg
                transition-all duration-300 transform
                ${loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:scale-105'
                }
              `}
            >
              {loading ? (
                <>
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  分析中...
                </>
              ) : (
                <>
                  <FaPaperPlane />
                  开始分析
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputSection;