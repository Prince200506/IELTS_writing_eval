import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import winston from 'winston';
import dotenv from 'dotenv';
import analyzeRouter from './routes/analyze.js';
import { initDatabase } from './database/sqlite.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
    })
  ),
  transports: [
    new winston.transports.Console()
  ]
});

process.on('uncaughtException', (err) => {
  logger.error('未捕获的异常:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝:', reason);
});

app.use(helmet({
  contentSecurityPolicy: false,
  frameguard: false
}));

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const publicDir = path.resolve(__dirname, '../frontend/public');
const distDir = path.resolve(__dirname, '../frontend/dist');
const publicPath = fs.existsSync(publicDir) ? publicDir : distDir;

if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
  logger.info(`静态资源目录: ${publicPath}`);
} else {
  logger.warn('静态资源目录不存在');
}

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  logger.info('创建uploads目录成功');
}

initDatabase()
  .then(() => {
    logger.info('数据库初始化完成');
  })
  .catch((err) => {
    logger.error('数据库初始化失败，继续运行(使用内存缓存):', err.message);
  });

app.use('/api', analyzeRouter);

app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'IELTS Writing Assistant API 运行正常',
    timestamp: new Date().toISOString()
  });
});

app.get('*', (req, res) => {
  const filePath = path.join(publicPath, req.path);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.sendFile(filePath);
  } else {
    const indexPath = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({
        success: false,
        message: '资源不存在'
      });
    }
  }
});

app.use((err, req, res, next) => {
  logger.error('全局错误处理:', err);
  
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: `文件上传错误: ${err.message}`
    });
  }
  
  res.status(500).json({
    success: false,
    message: '服务器内部错误，请稍后重试'
  });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  logger.info(`===========================================`);
  logger.info(`IELTS Writing Assistant 服务已启动`);
  logger.info(`端口: ${PORT}`);
  logger.info(`环境: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
  logger.info(`===========================================`);
});

process.on('SIGTERM', () => {
  logger.info('收到SIGTERM信号，开始优雅关闭...');
  server.close(() => {
    logger.info('服务器已关闭');
  });
});

export default app;