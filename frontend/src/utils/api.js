const API_BASE_URL = '/api';

const createApiClient = () => {
  const request = async (url, options = {}) => {
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 120000,
    };

    const config = { ...defaultOptions, ...options };

    if (options.headers && options.headers['Content-Type'] === 'multipart/form-data') {
      delete config.headers['Content-Type'];
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      const response = await fetch(`${API_BASE_URL}${url}`, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `请求失败: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('请求超时，请稍后重试');
      }
      console.error('API请求错误:', error.message);
      throw new Error(error.message || '请求失败');
    }
  };

  return {
    get: (url, params) => {
      const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
      return request(`${url}${queryString}`, { method: 'GET' });
    },
    post: (url, data, options = {}) => {
      return request(url, {
        method: 'POST',
        body: data instanceof FormData ? data : JSON.stringify(data),
        ...options,
      });
    },
    delete: (url) => {
      return request(url, { method: 'DELETE' });
    },
  };
};

const apiClient = createApiClient();

export const analyzeEssay = async (question, essay, questionType = 'Task 2', questionImage = null, analyzeImageDirectly = false) => {
  try {
    if (questionImage && analyzeImageDirectly) {
      const formData = new FormData();
      formData.append('questionImage', questionImage);
      formData.append('essay', essay);
      formData.append('questionType', questionType);
      formData.append('analyzeImageDirectly', 'true');
      formData.append('question', question || '');

      return await apiClient.post('/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 180000,
      });
    }

    if (questionImage) {
      const formData = new FormData();
      formData.append('question', question || '');
      formData.append('essay', essay);
      formData.append('questionType', questionType);
      formData.append('questionImage', questionImage);

      return await apiClient.post('/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 180000,
      });
    }

    return await apiClient.post('/analyze', {
      question,
      essay,
      questionType,
    });
  } catch (error) {
    throw new Error(error.message || '分析请求失败');
  }
};

export const uploadQuestionImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    return await apiClient.post('/upload-question', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
    });
  } catch (error) {
    throw new Error(error.message || '图片上传失败');
  }
};

export const getAnalysisHistory = async (limit = 10) => {
  try {
    return await apiClient.get('/history', { limit });
  } catch (error) {
    throw new Error(error.message || '获取历史记录失败');
  }
};

export const getAnalysisResult = async (id) => {
  try {
    return await apiClient.get(`/result/${id}`);
  } catch (error) {
    throw new Error(error.message || '获取分析结果失败');
  }
};

export const deleteAnalysisResult = async (id) => {
  try {
    return await apiClient.delete(`/result/${id}`);
  } catch (error) {
    throw new Error(error.message || '删除记录失败');
  }
};

export const checkApiStatus = async () => {
  try {
    return await apiClient.get('/status');
  } catch (error) {
    throw new Error(error.message || 'API状态检查失败');
  }
};

export default {
  analyzeEssay,
  uploadQuestionImage,
  getAnalysisHistory,
  getAnalysisResult,
  deleteAnalysisResult,
  checkApiStatus,
};