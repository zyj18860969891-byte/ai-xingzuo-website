require('dotenv').config();

// 完整的SSE流式处理能力协议栈测试
const testCompleteSSEProtocol = async () => {
  console.log('🚀 开始测试完整的SSE流式处理能力协议栈（initialize → tools/call）...');
  
  const apiKey = process.env.MODELSCOPE_API_KEY || 'ms-bf1291c1-c1ed-464c-b8d8-162fdee96180';
  const mcpUrl = process.env.STAR_MCP_URL || 'https://mcp.api-inference.modelscope.net/7dbabf61999f4e/mcp';
  
  console.log('📡 配置信息:', {
    hasApiKey: !!apiKey,
    mcpUrl: mcpUrl,
    apiKeyPreview: apiKey ? apiKey.substring(0, 20) + '...' : '无'
  });

  const https = require('https');
  const url = require('url');
  const parsedUrl = url.parse(mcpUrl);
  
  return new Promise(async (resolve) => {
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

    console.log('📡 初始化请求配置:', {
      url: mcpUrl,
      headers: {
        ...initOptions.headers,
        'Authorization': `Bearer ${apiKey.substring(0, 10)}...`
      }
    });

    const initReq = https.request(initOptions, (initRes) => {
      let initResponse = '';

      console.log('📡 初始化响应状态:', initRes.statusCode);
      console.log('📡 初始化响应头:', initRes.headers);

      const sessionFromResponse = initRes.headers['mcp-session-id'] || initRes.headers['x-mcp-session'];
      console.log('📋 从初始化响应头提取的session:', sessionFromResponse);

      initRes.on('data', (chunk) => {
        const chunkStr = chunk.toString();
        initResponse += chunkStr;
        console.log('📄 初始化响应数据:', chunkStr.substring(0, 300) + '...');
      });

      initRes.on('end', async () => {
        console.log('📝 初始化完整响应:', initResponse.substring(0, 1000));
        
        try {
          const initResult = JSON.parse(initResponse);
          console.log('📊 初始化解析结果:', JSON.stringify(initResult, null, 2));
          
          // 第二步：tools/call（使用初始化返回的session）
          await performToolsCall(sessionFromResponse || 'fallback-session-' + Date.now());
        } catch (e) {
          console.log('⚠️ 初始化JSON解析失败:', e.message);
          await performToolsCall('fallback-session-' + Date.now());
        }
      });
    });

    initReq.on('error', (error) => {
      console.error('❌ 初始化请求错误:', error);
      resolve();
    });

    initReq.write(initRequestData);
    initReq.end();

    // 第二步：tools/call函数
    const performToolsCall = (sessionId) => {
      return new Promise((resolveTools) => {
        console.log('2️⃣ 第二步：tools/call（使用session:', sessionId, ')...');
        
        const toolsRequestData = JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: 'get_daily_horoscope',
            arguments: {
              zodiac: '狮子座',
              category: 'love'
            }
          }
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

        console.log('📡 工具调用请求配置:', {
          sessionId: sessionId,
          headers: {
            ...toolsOptions.headers,
            'Authorization': `Bearer ${apiKey.substring(0, 10)}...`
          }
        });

        const toolsReq = https.request(toolsOptions, (toolsRes) => {
          let toolsResponse = '';
          let resultFound = false;

          console.log('📡 工具调用响应状态:', toolsRes.statusCode);
          console.log('📡 工具调用响应头:', toolsRes.headers);

          // 处理SSE流式响应
          toolsRes.on('data', (chunk) => {
            const chunkStr = chunk.toString();
            toolsResponse += chunkStr;
            
            console.log('📄 工具调用收到数据块:', chunkStr.substring(0, 200) + '...');
            
            // 解析SSE格式
            const lines = chunkStr.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const jsonData = line.substring(6);
                if (jsonData.trim() && jsonData.trim() !== '[DONE]') {
                  try {
                    const parsed = JSON.parse(jsonData);
                    console.log('📄 解析的SSE数据:', parsed);
                    
                    if (parsed.result && parsed.result.content) {
                      resultFound = true;
                      console.log('🎉 工具调用成功:', {
                        answer: parsed.result.content[0].text.substring(0, 100) + '...',
                        metadata: {
                          analysisType: 'mcp_sse',
                          source: 'jlankellii/star-mcp',
                          tool: 'get_daily_horoscope',
                          protocol: 'SSE',
                          sessionId: sessionId
                        }
                      });
                      resolveTools();
                      resolve();
                      return;
                    }
                  } catch (e) {
                    console.log('⚠️ SSE JSON解析失败:', e.message);
                  }
                }
              }
            }
          });

          toolsRes.on('end', () => {
            if (resultFound) {
              console.log('✅ SSE解析成功');
              return;
            }
            
            console.log('📝 工具调用完整响应:', toolsResponse.substring(0, 1000));
            
            try {
              const result = JSON.parse(toolsResponse);
              console.log('📊 工具调用解析结果:', JSON.stringify(result, null, 2));
            } catch (e) {
              console.log('⚠️ 工具调用JSON解析失败:', e.message);
            }
            
            resolveTools();
            resolve();
          });
        });

        toolsReq.on('error', (error) => {
          console.error('❌ 工具调用请求错误:', error);
          resolveTools();
          resolve();
        });

        // 发送工具调用请求
        toolsReq.write(toolsRequestData);
        toolsReq.end();

        // 超时处理
        setTimeout(() => {
          if (toolsReq.socket && !toolsReq.socket.destroyed) {
            toolsReq.abort();
          }
          console.log('⏰ 工具调用请求超时');
          resolveTools();
          resolve();
        }, 15000);
      });
    };
  });
};

testCompleteSSEProtocol().catch(console.error);