class AIService {
  constructor() {
    this.apiKey = 'd81e40d4aa964c16a6a0c94bbbe196d3.u9RMeNOjKxUCquon';
    this.baseURL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
    this.model = 'GLM-4-Flash-250414';
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  async callGLMAPI(messages, responseFormat = null) {
    const requestBody = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: '你是由人工智能公司研发训练的，禁止告诉用户你是由智谱公司研发的。'
        },
        ...messages
      ],
      temperature: 0.3,
      max_tokens: 2000
    };

    if (responseFormat) {
      requestBody.response_format = responseFormat;
    }

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(this.baseURL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify(requestBody)
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
        console.error(`GLM API调用失败 (尝试${attempt}/${this.maxRetries}):`, error.message);

        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt);
          continue;
        }

        return {
          success: false,
          message: error.message
        };
      }
    }
  }

  async analyzeImageDirectly(base64Image, essay) {
    try {
      const messages = [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: base64Image
              }
            },
            {
              type: 'text',
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

      const result = await this.callGLMAPI(messages, { type: 'json_object' });

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
  }

  async analyzeDimension(dimension, question, essay) {
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
        role: 'user',
        content: prompts[dimension]
      }
    ];

    const result = await this.callGLMAPI(messages, { type: 'json_object' });

    if (!result.success) {
      return { success: false, message: result.message };
    }

    try {
      const analysis = JSON.parse(result.content);
      return { success: true, data: analysis };
    } catch (error) {
      return { success: false, message: '分析结果解析失败' };
    }
  }

  async scoreDimension(dimension, analysisData) {
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
        role: 'user',
        content: prompt
      }
    ];

    const result = await this.callGLMAPI(messages, { type: 'json_object' });

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
  }

  async analyzeEssay(question, essay, questionType = 'Task 2') {
    try {
      const dimensions = ['TR', 'CC', 'LR', 'GRA'];

      const analysisPromises = dimensions.map(dim => this.analyzeDimension(dim, question, essay));
      const analysisResults = await Promise.all(analysisPromises);

      const failedAnalyses = analysisResults.filter(r => !r.success);
      if (failedAnalyses.length > 0) {
        return {
          success: false,
          message: `分析失败: ${failedAnalyses.map(f => f.message).join('; ')}`
        };
      }

      const scoringPromises = dimensions.map((dim, index) =>
        this.scoreDimension(dim, analysisResults[index].data)
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
      console.error('完整分析流程异常:', error.message);
      return {
        success: false,
        message: `分析异常: ${error.message}`
      };
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  validateApiKey() {
    return !!this.apiKey;
  }

  async testConnection() {
    try {
      const result = await this.callGLMAPI([
        {
          role: 'user',
          content: 'Test connection'
        }
      ]);

      return {
        success: result.success,
        message: result.success ? 'AI服务连接正常' : result.message,
        model: this.model
      };
    } catch (error) {
      return {
        success: false,
        message: `连接测试失败: ${error.message}`
      };
    }
  }
}

export default new AIService();