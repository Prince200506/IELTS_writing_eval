import Tesseract from 'tesseract.js';
import fs from 'fs';
import path from 'path';

class OCRService {
  constructor() {
    this.supportedFormats = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  }

  async extractTextFromImage(imagePath) {
    try {
      if (!fs.existsSync(imagePath)) {
        throw new Error('图片文件不存在');
      }

      const result = await Tesseract.recognize(
        imagePath,
        'eng',
        {
          logger: info => {
            if (info.status === 'recognizing text') {
              console.log(`OCR进度: ${Math.round(info.progress * 100)}%`);
            }
          }
        }
      );

      const extractedText = result.data.text.trim();
      
      if (!extractedText) {
        return {
          success: false,
          text: '',
          message: '未能从图片中提取到文本内容'
        };
      }

      return {
        success: true,
        text: extractedText,
        confidence: result.data.confidence
      };

    } catch (error) {
      console.error('OCR提取失败:', error.message);
      return {
        success: false,
        text: '',
        message: `OCR处理失败: ${error.message}`
      };
    }
  }

  async extractTextFromBuffer(buffer, mimetype) {
    try {
      if (!this.supportedFormats.includes(mimetype)) {
        throw new Error('不支持的图片格式');
      }

      const result = await Tesseract.recognize(
        buffer,
        'eng'
      );

      const extractedText = result.data.text.trim();

      if (!extractedText) {
        return {
          success: false,
          text: '',
          message: '未能从图片中提取到文本内容'
        };
      }

      return {
        success: true,
        text: extractedText,
        confidence: result.data.confidence
      };

    } catch (error) {
      console.error('OCR提取失败:', error.message);
      return {
        success: false,
        text: '',
        message: `OCR处理失败: ${error.message}`
      };
    }
  }

  validateImageFile(file) {
    if (!file) {
      return { valid: false, message: '未提供图片文件' };
    }

    if (!this.supportedFormats.includes(file.mimetype)) {
      return { 
        valid: false, 
        message: `不支持的图片格式，仅支持: ${this.supportedFormats.join(', ')}` 
      };
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { 
        valid: false, 
        message: '图片大小超过10MB限制' 
      };
    }

    return { valid: true };
  }
}

export default new OCRService();