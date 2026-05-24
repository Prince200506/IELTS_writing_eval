import { v4 as uuidv4 } from 'uuid';
import db from '../database/sqlite.js';

class AnalysisModel {
  constructor() {
    this.dimensions = ['TR', 'CC', 'LR', 'GRA'];
    this.task1Dimensions = ['TA', 'CC', 'LR', 'GRA'];
  }

  createAnalysisRecord(data) {
    const record = {
      id: uuidv4(),
      question: data.question || '',
      questionType: data.questionType || 'Task 2',
      essay: data.essay || '',
      analysis: {
        TR: data.analysis?.TR || null,
        CC: data.analysis?.CC || null,
        LR: data.analysis?.LR || null,
        GRA: data.analysis?.GRA || null
      },
      overallScore: 0,
      createdAt: new Date().toISOString()
    };

    record.overallScore = this.calculateOverallScore(record.analysis);

    return record;
  }

  calculateOverallScore(analysis) {
    const scores = [];
    
    if (analysis.TR?.score) scores.push(analysis.TR.score);
    if (analysis.CC?.score) scores.push(analysis.CC.score);
    if (analysis.LR?.score) scores.push(analysis.LR.score);
    if (analysis.GRA?.score) scores.push(analysis.GRA.score);

    if (scores.length === 0) return 0;

    const sum = scores.reduce((acc, score) => acc + score, 0);
    const average = sum / scores.length;

    return Math.round(average * 2) / 2;
  }

  async saveAnalysis(data) {
    try {
      const record = this.createAnalysisRecord(data);
      const result = await db.saveAnalysis(record);
      
      if (result.success) {
        return {
          success: true,
          id: record.id,
          overallScore: record.overallScore
        };
      } else {
        return {
          success: false,
          message: result.message || '保存失败',
          id: record.id
        };
      }
    } catch (error) {
      console.error('保存分析记录异常:', error.message);
      return {
        success: false,
        message: '保存异常',
        error: error.message
      };
    }
  }

  async getAnalysisById(id) {
    try {
      const record = await db.getAnalysisById(id);
      
      if (!record) {
        return {
          success: false,
          message: '记录不存在'
        };
      }

      return {
        success: true,
        data: this.formatAnalysisRecord(record)
      };
    } catch (error) {
      console.error('查询分析记录异常:', error.message);
      return {
        success: false,
        message: '查询异常',
        error: error.message
      };
    }
  }

  async getRecentAnalyses(limit = 10) {
    try {
      const records = await db.getRecentAnalyses(limit);
      
      return {
        success: true,
        data: records.map(record => this.formatHistoryRecord(record))
      };
    } catch (error) {
      console.error('查询历史记录异常:', error.message);
      return {
        success: false,
        message: '查询异常',
        data: [],
        error: error.message
      };
    }
  }

  async deleteAnalysis(id) {
    try {
      const result = await db.deleteAnalysis(id);
      
      return {
        success: result.success,
        message: result.success ? '删除成功' : '删除失败'
      };
    } catch (error) {
      console.error('删除分析记录异常:', error.message);
      return {
        success: false,
        message: '删除异常',
        error: error.message
      };
    }
  }

  formatAnalysisRecord(record) {
    return {
      id: record.id,
      question: record.question,
      questionType: record.question_type,
      essay: record.essay,
      analysis: record.analysis,
      overallScore: record.overall_score,
      createdAt: record.created_at
    };
  }

  formatHistoryRecord(record) {
    return {
      id: record.id,
      question: record.question.substring(0, 100) + '...',
      overallScore: record.overall_score,
      createdAt: record.created_at
    };
  }

  validateAnalysisInput(data) {
    const errors = [];

    if (!data.question || data.question.trim().length === 0) {
      errors.push('题目不能为空');
    }

    if (!data.essay || data.essay.trim().length === 0) {
      errors.push('作文不能为空');
    }

    if (data.essay && data.essay.length < 150) {
      errors.push('作文字数不足150字');
    }

    if (data.essay && data.essay.length > 5000) {
      errors.push('作文字数超过5000字限制');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  buildAnalysisResult(dimensionResults) {
    const analysis = {};

    this.dimensions.forEach(dim => {
      if (dimensionResults[dim]) {
        analysis[dim] = {
          score: dimensionResults[dim].score,
          justification: dimensionResults[dim].justification,
          details: dimensionResults[dim].details
        };
      }
    });

    return analysis;
  }
}

export default new AnalysisModel();