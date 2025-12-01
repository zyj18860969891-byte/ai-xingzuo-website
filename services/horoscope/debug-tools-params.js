require('dotenv').config();

// 调试不同的工具参数格式
const debugToolsParams = async () => {
  console.log('🔧 开始调试工具参数格式...');
  
  const apiKey = process.env.MODELSCOPE_API_KEY || 'ms-bf1291c1-c1ed-464c-b8d8-162fdee96180';
  const mcpUrl = process.env.STAR_MCP_URL || 'https://mcp.api-inference.modelscope.net/7dbabf61999f4e/mcp';
  
  const https = require('https');
  const url = require('url');
  const parsedUrl = url.parse(mcpUrl);
  
  return new Promise((resolve) => {
    // 第一步：MCP initialize
    console.log('1️⃣ MCP initialize...');
    
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

      initRes.on('data', (chunk) => {
        initResponse += chunk.toString();
      });

      initRes.on('end', async () => {
        try {
          const initResult = JSON.parse(initResponse);
          console.log('✅ 初始化成功，session:', sessionFromResponse);
          
          // 测试多种参数格式
          await testDifferentParamFormats(sessionFromResponse);
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

    // 测试不同的参数格式
    const testDifferentParamFormats = async (sessionId) => {
      const paramFormats = [
        // 格式1：对象参数
        {
          name: 'get_daily_horoscope',
          arguments: {
            zodiac: '狮子座',
            category: 'love'
          }
        },
        // 格式2：字符串参数
        {
          name: 'get_daily_horoscope',
          arguments: '狮子座 love'
        },
        // 格式3：数组参数
        {
          name: 'get_daily_horoscope',
          arguments: ['狮子座', 'love']
        },
        // 格式4：简单字符串
        {
          name: 'get_daily_horoscope',
          arguments: '狮子座'
        },
        // 格式5：无参数
        {
          name: 'get_daily_horoscope',
          arguments: {}
        },
        // 格式6：只有zodiac
        {
          name: 'get_daily_horoscope',
          arguments: {
            zodiac: '狮子座'
          }
        }
      ];

      for (let i = 0; i < paramFormats.length; i++) {
        console.log(`\n🧪 测试参数格式 ${i + 1}:`, JSON.stringify(paramFormats[i], null, 2));
        
        await new Promise(resolveTest => setTimeout(resolveTest, 1000)); // 间隔1秒
        
        const toolsRequestData = JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now() + i,
          method: 'tools/call',
          params: paramFormats[i]
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

        const toolsReq = https.request(toolsOptions, (toolsRes) => {
          let toolsResponse = '';

          console.log(`📡 格式${i + 1}响应状态:`, toolsRes.statusCode);

          toolsRes.on('data', (chunk) => {
            toolsResponse += chunk.toString();
          });

          toolsRes.on('end', () => {
            console.log(`📝 格式${i + 1}完整响应:`, toolsResponse.substring(0, 500));
            
            try {
              const result = JSON.parse(toolsResponse);
              if (result.error) {
                console.log(`❌ 格式${i + 1}错误:`, result.error.message);
              } else {
                console.log(`✅ 格式${i + 1}成功:`, {
                  result: result.result ? JSON.stringify(result.result).substring(0, 200) + '...' : '无结果'
                });
              }
            } catch (e) {
              console.log(`⚠️ 格式${i + 1}解析失败:`, e.message);
            }
            
            // 如果是最后一个测试，结束
            if (i === paramFormats.length - 1) {
              resolve();
            }
          });
        });

        toolsReq.on('error', (error) => {
          console.error(`❌ 格式${i + 1}请求错误:`, error);
          if (i === paramFormats.length - 1) {
            resolve();
          }
        });

        toolsReq.write(toolsRequestData);
        toolsReq.end();
      }
    };
  });
};

debugToolsParams().catch(console.error);