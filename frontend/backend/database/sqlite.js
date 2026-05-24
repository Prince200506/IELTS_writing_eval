import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../ielts_analysis.db');

class Database {
  constructor() {
    this.db = null;
    this.memoryCache = [];
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('数据库连接失败:', err.message);
          reject(err);
        } else {
          console.log('SQLite数据库连接成功');
          resolve();
        }
      });
    });
  }

  initTables() {
    return new Promise((resolve, reject) => {
      const createAnalysisTable = `
        CREATE TABLE IF NOT EXISTS analysis_records (
          id TEXT PRIMARY KEY,
          question TEXT NOT NULL,
          question_type TEXT,
          essay TEXT NOT NULL,
          tr_score REAL,
          tr_analysis TEXT,
          cc_score REAL,
          cc_analysis TEXT,
          lr_score REAL,
          lr_analysis TEXT,
          gra_score REAL,
          gra_analysis TEXT,
          overall_score REAL,
          created_at TEXT DEFAULT (datetime('now', '+8 hours'))
        )
      `;

      this.db.run(createAnalysisTable, (err) => {
        if (err) {
          console.error('创建表失败:', err.message);
          reject(err);
        } else {
          console.log('数据库表初始化完成');
          resolve();
        }
      });
    });
  }

  saveAnalysis(data) {
    return new Promise((resolve, reject) => {
      const insertSQL = `
        INSERT INTO analysis_records (
          id, question, question_type, essay, 
          tr_score, tr_analysis, cc_score, cc_analysis,
          lr_score, lr_analysis, gra_score, gra_analysis,
          overall_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        data.id,
        data.question,
        data.questionType || 'Task 2',
        data.essay,
        data.analysis.TR?.score || 0,
        JSON.stringify(data.analysis.TR || {}),
        data.analysis.CC?.score || 0,
        JSON.stringify(data.analysis.CC || {}),
        data.analysis.LR?.score || 0,
        JSON.stringify(data.analysis.LR || {}),
        data.analysis.GRA?.score || 0,
        JSON.stringify(data.analysis.GRA || {}),
        data.overallScore || 0
      ];

      this.db.run(insertSQL, values, function(err) {
        if (err) {
          console.error('保存分析记录失败，使用内存缓存:', err.message);
          this.memoryCache.push(data);
          resolve({ success: false, message: '数据库异常，记录已缓存', id: data.id });
        } else {
          resolve({ success: true, id: data.id, rowId: this.lastID });
        }
      }.bind(this));
    });
  }

  getAnalysisById(id) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM analysis_records WHERE id = ?';
      
      this.db.get(query, [id], (err, row) => {
        if (err) {
          console.error('查询记录失败:', err.message);
          const cached = this.memoryCache.find(item => item.id === id);
          resolve(cached || null);
        } else {
          if (row) {
            row.analysis = {
              TR: JSON.parse(row.tr_analysis),
              CC: JSON.parse(row.cc_analysis),
              LR: JSON.parse(row.lr_analysis),
              GRA: JSON.parse(row.gra_analysis)
            };
          }
          resolve(row);
        }
      });
    });
  }

  getRecentAnalyses(limit = 10) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT id, question, overall_score, created_at 
        FROM analysis_records 
        ORDER BY created_at DESC 
        LIMIT ?
      `;
      
      this.db.all(query, [limit], (err, rows) => {
        if (err) {
          console.error('查询历史记录失败:', err.message);
          resolve(this.memoryCache.slice(-limit).reverse());
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  deleteAnalysis(id) {
    return new Promise((resolve, reject) => {
      const deleteSQL = 'DELETE FROM analysis_records WHERE id = ?';
      
      this.db.run(deleteSQL, [id], function(err) {
        if (err) {
          console.error('删除记录失败:', err.message);
          resolve({ success: false, message: '数据库异常' });
        } else {
          resolve({ success: true, changes: this.changes });
        }
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('关闭数据库失败:', err.message);
            reject(err);
          } else {
            console.log('数据库连接已关闭');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

const dbInstance = new Database();

export const initDatabase = async () => {
  try {
    await dbInstance.connect();
    await dbInstance.initTables();
    return true;
  } catch (error) {
    console.error('数据库初始化失败:', error.message);
    return false;
  }
};

export default dbInstance;