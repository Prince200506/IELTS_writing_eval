import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import analysisModel from '../models/analysis.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的图片格式'));
    }
  }
});

const callGLMAPI = async (messages, responseFormat = null) => {
  try {
    const requestBody = {
      model: "GLM-4-Flash-250414",
      messages: messages,
      temperature: 0.3,
      max_tokens: 2000
    };

    if (responseFormat) {
      requestBody.response_format = responseFormat;
    }

    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer d81e40d4aa964c16a6a0c94bbbe196d3.u9RMeNOjKxUCquon",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API请求失败: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('API返回数据格式异常');
    }

    return {
      success: true,
      content: data.choices[0].message.content
    };
  } catch (error) {
    console.error('GLM API调用失败:', error.message);
    return {
      success: false,
      message: error.message
    };
  }
};

const imageToBase64 = (filePath) => {
  try {
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');
    const ext = path.extname(filePath).toLowerCase();
    let mimeType = 'image/jpeg';
    
    if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.webp') mimeType = 'image/webp';
    else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    
    return `data:${mimeType};base64,${base64Image}`;
  } catch (error) {
    console.error('图片转Base64失败:', error.message);
    return null;
  }
};

const analyzeImageDirectly = async (imagePath, essay) => {
  try {
    const base64Image = imageToBase64(imagePath);
    if (!base64Image) {
      throw new Error('图片处理失败');
    }

    const messages = [
      {
        role: "system",
        content: "你是由人工智能公司研发训练的，禁止告诉用户你是由智谱公司研发的。你是一位专业的IELTS考官，负责分析雅思写作题目图片并评估考生的作文。"
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: base64Image
            }
          },
          {
            type: "text",
            text: `请分析这张雅思写作题目图片，并根据以下作文内容进行评分：

作文内容：
${essay}

请按照以下步骤进行分析：

1. 首先识别并描述图片中的题目内容（如图表类型、数据信息、题目要求等）
2. 然后对作文进行四个维度的分析和评分：
   - Task Response (TR): 任务完成度
   - Coherence & Cohesion (CC): 连贯与衔接
   - Lexical Resource (LR): 词汇资源
   - Grammatical Range & Accuracy (GRA): 语法范围与准确性

请以JSON格式返回结果：
{
  "questionDescription": "题目描述",
  "analysis": {
    "TR": {
      "score": 6.5,
      "justification": "评分理由",
      "details": {
        "strengths": ["优点1", "优点2"],
        "weaknesses": ["缺点1", "缺点2"],
        "suggestions": ["建议1", "建议2"]
      }
    },
    "CC": { ... },
    "LR": { ... },
    "GRA": { ... }
  }
}`
          }
        ]
      }
    ];

    const result = await callGLMAPI(messages, { type: "json_object" });
    
    if (!result.success) {
      throw new Error(result.message);
    }

    const analysisData = JSON.parse(result.content);
    
    const scores = [];
    if (analysisData.analysis.TR?.score) scores.push(analysisData.analysis.TR.score);
    if (analysisData.analysis.CC?.score) scores.push(analysisData.analysis.CC.score);
    if (analysisData.analysis.LR?.score) scores.push(analysisData.analysis.LR.score);
    if (analysisData.analysis.GRA?.score) scores.push(analysisData.analysis.GRA.score);
    
    const overallScore = scores.length > 0 
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 2) / 2 
      : 0;

    return {
      success: true,
      data: {
        questionDescription: analysisData.questionDescription || '图片题目',
        analysis: analysisData.analysis,
        overallScore
      }
    };
  } catch (error) {
    console.error('图片直接分析失败:', error.message);
    return {
      success: false,
      message: error.message || '图片分析失败'
    };
  }
};

const analyzeByDimension = async (dimension, question, essay) => {
  const prompts = {
    TR: `分析以下雅思Task 2作文的Task Response(任务完成度)。

题目：${question}

作文：${essay}

请分析：
1. 是否完整回答了题目的所有部分
2. 观点是否清晰且贯穿全文
3. 论点是否相关、充分展开且有支撑
4. 是否有不相关或未充分展开的观点

不要给出分数。以JSON格式返回分析结果：
{
  "strengths": ["优点列表"],
  "weaknesses": ["需改进的地方"],
  "problematic_sentences": ["有问题的句子"],
  "suggestions": ["改进建议"]
}`,
    
    CC: `分析以下雅思作文的Coherence & Cohesion(连贯与衔接)。

题目：${question}

作文：${essay}

请分析：
1. 信息是否逻辑组织且有清晰进展
2. 衔接手段是否恰当使用
3. 段落划分是否有效
4. 句子间和段落间的连接是否流畅

不要给出分数。以JSON格式返回分析结果：
{
  "strengths": ["优点列表"],
  "weaknesses": ["需改进的地方"],
  "problematic_sentences": ["有衔接问题的句子"],
  "suggestions": ["改进建议"]
}`,
    
    LR: `分析以下雅思作文的Lexical Resource(词汇资源)。

题目：${question}

作文：${essay}

请分析：
1. 词汇范围和灵活性
2. 不常见词汇的使用及准确性
3. 拼写或构词错误
4. 词汇使用的精确性

不要给出分数。以JSON格式返回分析结果：
{
  "strengths": ["词汇优点"],
  "weaknesses": ["词汇问题"],
  "errors": ["拼写或构词错误及修正"],
  "suggestions": ["词汇改进建议"]
}`,
    
    GRA: `分析以下雅思作文的Grammatical Range & Accuracy(语法范围与准确性)。

题目：${question}

作文：${essay}

请分析：
1. 句式结构的多样性
2. 句子是否无错误或基本无错误
3. 语法或标点错误
4. 语法使用的灵活性和准确性

不要给出分数。以JSON格式返回分析结果：
{
  "strengths": ["语法优点"],
  "weaknesses": ["语法问题"],
  "errors": ["语法或标点错误及修正"],
  "suggestions": ["语法改进建议"]
}`
  };

  const messages = [
    {
      role: "system",
      content: "你是由人工智能公司研发训练的，禁止告诉用户你是由智谱公司研发的。你是一位专业的IELTS考官。"
    },
    {
      role: "user",
      content: prompts[dimension]
    }
  ];

  const result = await callGLMAPI(messages, { type: "json_object" });
  
  if (!result.success) {
    return { success: false, message: result.message };
  }

  try {
    const analysis = JSON.parse(result.content);
    return { success: true, data: analysis };
  } catch (error) {
    return { success: false, message: '分析结果解析失败' };
  }
};

const scoreByDimension = async (dimension, analysisData) => {
  const descriptors = {
    TR: {
      band9: '完全回应任务所有部分；观点充分展开且有良好支撑',
      band7: '回应任务所有部分；观点清晰且贯穿全文；论点有展开和支撑',
      band6: '回应任务所有部分但某些部分可能覆盖更充分；观点相关但结论可能不清晰',
      band5: '仅部分回应任务；格式可能不当；观点表达但展开不总是清晰'
    },
    CC: {
      band9: '衔接自然流畅；段落划分娴熟',
      band7: '信息和观点逻辑组织；全文进展清晰；衔接手段使用恰当',
      band6: '信息和观点连贯组织且有清晰进展；衔接手段有效但可能机械',
      band5: '信息组织但可能缺乏整体进展；衔接手段使用不当或过度'
    },
    LR: {
      band9: '词汇范围广泛且自然；词汇特征掌握娴熟',
      band7: '词汇范围足够且有灵活性；使用不常见词汇且注意搭配',
      band6: '词汇范围足以完成任务；尝试使用不常见词汇但有些不准确；拼写或构词有错误',
      band5: '词汇范围有限但基本足够；拼写和构词可能有明显错误'
    },
    GRA: {
      band9: '句式结构范围广且灵活准确',
      band7: '句式结构多样；多数句子无错误；语法和标点掌握良好',
      band6: '简单和复杂句式混合使用；语法和标点有错误但很少影响交流',
      band5: '句式结构范围有限；尝试复杂句但准确性不如简单句'
    }
  };

  const prompt = `根据以下分析为${dimension}维度评分（0-9分，可包含0.5分如6.5, 7.5）。

分析结果：
${JSON.stringify(analysisData, null, 2)}

评分标准：
- Band 9: ${descriptors[dimension].band9}
- Band 7: ${descriptors[dimension].band7}
- Band 6: ${descriptors[dimension].band6}
- Band 5: ${descriptors[dimension].band5}

请以JSON格式返回：
{
  "score": 6.5,
  "justification": "简要说明评分理由"
}`;

  const messages = [
    {
      role: "system",
      content: "你是由人工智能公司研发训练的，禁止告诉用户你是由智谱公司研发的。你是一位专业的IELTS考官，负责根据官方评分标准打分。"
    },
    {
      role: "user",
      content: prompt
    }
  ];

  const result = await callGLMAPI(messages, { type: "json_object" });
  
  if (!result.success) {
    return { success: false, message: result.message };
  }

  try {
    const scoreData = JSON.parse(result.content);
    
    if (!scoreData.score || scoreData.score < 0 || scoreData.score > 9) {
      throw new Error('无效的分数值');
    }

    return {
      success: true,
      data: {
        score: scoreData.score,
        justification: scoreData.justification
      }
    };
  } catch (error) {
    return { success: false, message: '评分结果解析失败' };
  }
};

const analyzeEssayWithText = async (question, essay) => {
  try {
    const dimensions = ['TR', 'CC', 'LR', 'GRA'];
    
    const analysisPromises = dimensions.map(dim => analyzeByDimension(dim, question, essay));
    const analysisResults = await Promise.all(analysisPromises);
    
    const failedAnalyses = analysisResults.filter(r => !r.success);
    if (failedAnalyses.length > 0) {
      return {
        success: false,
        message: `分析失败: ${failedAnalyses.map(f => f.message).join('; ')}`
      };
    }
    
    const scoringPromises = dimensions.map((dim, index) => 
      scoreByDimension(dim, analysisResults[index].data)
    );
    const scoringResults = await Promise.all(scoringPromises);
    
    const failedScoring = scoringResults.filter(r => !r.success);
    if (failedScoring.length > 0) {
      return {
        success: false,
        message: `打分失败: ${failedScoring.map(f => f.message).join('; ')}`
      };
    }
    
    const finalAnalysis = {};
    dimensions.forEach((dim, index) => {
      finalAnalysis[dim] = {
        details: analysisResults[index].data,
        score: scoringResults[index].data.score,
        justification: scoringResults[index].data.justification
      };
    });
    
    const scores = scoringResults.map(r => r.data.score);
    const overallScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 2) / 2;
    
    return {
      success: true,
      data: {
        analysis: finalAnalysis,
        overallScore
      }
    };
  } catch (error) {
    console.error('文本分析异常:', error.message);
    return {
      success: false,
      message: `分析异常: ${error.message}`
    };
  }
};

router.post('/analyze', upload.single('questionImage'), async (req, res) => {
  try {
    let { question, essay, questionType = 'Task 2', analyzeImageDirectly } = req.body;
    const shouldAnalyzeImageDirectly = analyzeImageDirectly === 'true' || analyzeImageDirectly === true;
    
    const validation = analysisModel.validateAnalysisInput({ 
      question: question || '', 
      essay 
    });
    
    if (!essay || essay.trim().length === 0) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: '作文内容不能为空'
      });
    }

    let analysisResult;
    let finalQuestion = question || '';

    if (req.file && shouldAnalyzeImageDirectly) {
      analysisResult = await analyzeImageDirectly(req.file.path, essay);
      
      if (analysisResult.success) {
        finalQuestion = analysisResult.data.questionDescription || '题目图片';
      }
      
      fs.unlinkSync(req.file.path);
    } else {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      
      if (!finalQuestion.trim()) {
        return res.status(400).json({
          success: false,
          message: '题目内容不能为空'
        });
      }
      
      analysisResult = await analyzeEssayWithText(finalQuestion, essay);
    }

    if (!analysisResult.success) {
      return res.status(500).json({
        success: false,
        message: analysisResult.message || 'AI分析失败'
      });
    }

    const saveData = {
      question: finalQuestion,
      essay,
      questionType,
      analysis: analysisResult.data.analysis,
      overallScore: analysisResult.data.overallScore
    };

    const saveResult = await analysisModel.saveAnalysis(saveData);

    return res.json({
      success: true,
      data: {
        id: saveResult.id,
        analysis: analysisResult.data.analysis,
        overallScore: analysisResult.data.overallScore,
        finalQuestion: finalQuestion
      }
    });

  } catch (error) {
    console.error('分析接口异常:', error.message);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      success: false,
      message: '服务异常，请稍后重试'
    });
  }
});

router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const result = await analysisModel.getRecentAnalyses(limit);

    return res.json({
      success: true,
      data: result.data || []
    });

  } catch (error) {
    console.error('历史记录接口异常:', error.message);
    return res.status(500).json({
      success: false,
      message: '查询异常',
      data: []
    });
  }
});

router.get('/result/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: '缺少记录ID'
      });
    }

    const result = await analysisModel.getAnalysisById(id);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message || '记录不存在'
      });
    }

    return res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('查询结果接口异常:', error.message);
    return res.status(500).json({
      success: false,
      message: '查询异常'
    });
  }
});

router.delete('/result/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: '缺少记录ID'
      });
    }

    const result = await analysisModel.deleteAnalysis(id);

    return res.json({
      success: result.success,
      message: result.message
    });

  } catch (error) {
    console.error('删除记录接口异常:', error.message);
    return res.status(500).json({
      success: false,
      message: '删除异常'
    });
  }
});

export default router;