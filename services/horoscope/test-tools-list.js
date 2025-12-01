require('dotenv').config();

// 测试工具列表查询
const testToolsList = async () => {
  console.log('🚀 开始测试工具列表查询...');
  
  const apiKey = process.env.MODELSCOPE_API_KEY || 'ms-bf1291c1-c1ed-464c-b8d8-162fdee96180';
  const mcpUrl = process.env.STAR_MCP_URL || 'https://mcp.api-inference.modelscope.net/7dbabf61999f4e/mcp';
  
  const https = require('https');
  const url = require('url');
  const parsedUrl = url.parse(mcpUrl);
  
  return new Promise((resolve) => {
    // 第一步：MCP initialize（无session）
    console.log('1️⃣ 第一步：MCP initialize（无session）...');
    
    const initRequestData = JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        clientInfo: { name: 'ai-xingzuo', version: '1.0' }
      }
    });

    const initOptions = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream,application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(initRequestData),
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    };

    const initReq = https.request(initOptions, (initRes) => {
      let initResponse = '';

      const sessionFromResponse = initRes.headers['mcp-session-id'] || initRes.headers['x-mcp-session'];
      console.log('📋 从初始化响应头提取的session:', sessionFromResponse);

      initRes.on('data', (chunk) => {
        initResponse += chunk.toString();
      });

      initRes.on('end', async () => {
        try {
          const initResult = JSON.parse(initResponse);
          console.log('✅ 初始化成功，session:', sessionFromResponse);
          
          // 第二步：tools/list
          await performToolsList(sessionFromResponse || 'fallback-session-' + Date.now());
        } catch (e) {
          console.error('❌ 初始化失败:', e.message);
          resolve();
        }
      });
    });

    initReq.on('error', (error) => {
      console.error('❌ 初始化请求错误:', error);
      resolve();
    });

    initReq.write(initRequestData);
    initReq.end();

    // 第二步：tools/list函数
    const performToolsList = (sessionId) => {
      return new Promise((resolveTools) => {
        console.log('2️⃣ 第二步：tools/list（使用session:', sessionId, ')...');
        
        const toolsRequestData = JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/list'
        });

        const toolsOptions = {
          hostname: parsedUrl.hostname,
          path: parsedUrl.path,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream,application/json',
            'Authorization': `Bearer ${apiKey}`,
            'mcp-session-id': sessionId,
            'Content-Length': Buffer.byteLength(toolsRequestData),
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          }
        };

        console.log('📡 工具列表请求配置:', {
          sessionId: sessionId,
          headers: {
            ...toolsOptions.headers,
            'Authorization': `Bearer ${apiKey.substring(0, 10)}...`
          }
        });

        const toolsReq = https.request(toolsOptions, (toolsRes) => {
          let toolsResponse = '';

          console.log('📡 工具列表响应状态:', toolsRes.statusCode);
          console.log('📡 工具列表响应头:', toolsRes.headers);

          toolsRes.on('data', (chunk) => {
            const chunkStr = chunk.toString();
            toolsResponse += chunkStr;
            console.log('📄 工具列表收到数据:', chunkStr.substring(0, 500) + '...');
          });

          toolsRes.on('end', () => {
            console.log('📝 工具列表完整响应:', toolsResponse.substring(0, 2000));
            
            try {
              const result = JSON.parse(toolsResponse);
              console.log('📊 工具列表解析结果:', JSON.stringify(result, null, 2));
              
              if (result.result && result.result.tools) {
                console.log('🛠️ 可用工具列表:');
                result.result.tools.forEach((tool, index) => {
                  console.log(`  ${index + 1}. ${tool.name}: ${tool.description}`);
                  if (tool.inputSchema) {
                    console.log(`     参数:`, JSON.stringify(tool.inputSchema, null, 4));
                  }
                });
              }
            } catch (e) {
              console.log('⚠️ 工具列表JSON解析失败:', e.message);
            }
            
            resolveTools();
            resolve();
          });
        });

        toolsReq.on('error', (error) => {
          console.error('❌ 工具列表请求错误:', error);
          resolveTools();
          resolve();
        });

        // 发送工具列表请求
        toolsReq.write(toolsRequestData);
        toolsReq.end();

        // 超时处理
        setTimeout(() => {
          if (toolsReq.socket && !toolsReq.socket.destroyed) {
            toolsReq.abort();
          }
          console.log('⏰ 工具列表请求超时');
          resolveTools();
          resolve();
        }, 15000);
      });
    };
  });
};

testToolsList().catch(console.error);