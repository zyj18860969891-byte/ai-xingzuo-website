require('dotenv').config();
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const https = require('https');

// 真正连接到实际MCP服务的实现
class RealMCPClient {
  constructor() {
    this.requestId = 1;
  }

  // 调用工具
  async callTool(toolName, args) {
    console.log(`📡 调用工具: ${toolName}`);
    
    const request = {
      jsonrpc: '2.0',
      id: this.requestId++,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    };

    return new Promise((resolve, reject) => {
      const options = {
        hostname: process.env.STAR_MCP_HOST || 'localhost',
        port: process.env.STAR_MCP_PORT || 8081,
        path: '/mcp',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'mcp-session-id': process.env.STAR_MCP_SESSION_ID || 'test-session-123'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.error) {
              reject(new Error(`MCP Error: ${result.error.message}`));
            } else {
              console.log('✅ MCP调用成功:', {
                toolName: toolName,
                arguments: arguments
              });
              resolve(result.result || result);
            }
          } catch (error) {
            reject(new Error(`解析响应失败: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`连接失败: ${error.message}`));
      });

      req.write(JSON.stringify(request));
      req.end();

      // 超时处理
      setTimeout(() => {
        req.abort();
        reject(new Error('请求超时'));
      }, 10000);
    });
  }

  // 获取工具列表
  async getToolsList() {
    console.log('📡 获取工具列表...');
    
    const request = {
      jsonrpc: '2.0',
      id: this.requestId++,
      method: 'tools/list'
    };

    return new Promise((resolve, reject) => {
      const options = {
        hostname: process.env.STAR_MCP_HOST || 'localhost',
        port: process.env.STAR_MCP_PORT || 8081,
        path: '/mcp',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'mcp-session-id': process.env.STAR_MCP_SESSION_ID || 'test-session-123'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.error) {
              reject(new Error(`MCP Error: ${result.error.message}`));
            } else {
              console.log('✅ 工具列表获取成功');
              resolve(result.result || result);
            }
          } catch (error) {
            reject(new Error(`解析响应失败: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`连接失败: ${error.message}`));
      });

      req.write(JSON.stringify(request));
      req.end();

      // 超时处理
      setTimeout(() => {
        req.abort();
        reject(new Error('请求超时'));
      }, 10000);
    });
  }

  // 初始化
  async initialize() {
    console.log('📡 执行MCP初始化...');
    
    const request = {
      jsonrpc: '2.0',
      id: this.requestId++,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        clientInfo: { name: 'ai-xingzuo', version: '1.0' }
      }
    };

    return new Promise((resolve, reject) => {
      const options = {
        hostname: process.env.STAR_MCP_HOST || 'localhost',
        port: process.env.STAR_MCP_PORT || 8081,
        path: '/mcp',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.error) {
              reject(new Error(`MCP Error: ${result.error.message}`));
            } else {
              console.log('✅ MCP初始化成功');
              resolve(result.result || result);
            }
          } catch (error) {
            reject(new Error(`解析响应失败: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`连接失败: ${error.message}`));
      });

      req.write(JSON.stringify(request));
      req.end();

      // 超时处理
      setTimeout(() => {
        req.abort();
        reject(new Error('请求超时'));
      }, 10000);
    });
  }
}

module.exports = RealMCPClient;