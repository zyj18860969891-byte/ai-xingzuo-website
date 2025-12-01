require('dotenv').config();

// 获取真实工具信息，尝试多种方法
const getRealToolsInfo = async () => {
  console.log('🔍 开始获取真实工具信息...');
  
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
          
          // 尝试多种方法获取工具信息
          await tryMultipleMethodsToGetTools(sessionFromResponse);
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

    // 尝试多种方法获取工具信息
    const tryMultipleMethodsToGetTools = (sessionId) => {
      return new Promise((resolveMethods) => {
        console.log('2️⃣ 尝试多种方法获取工具信息...');
        
        const methods = [
          // 方法1：标准 tools/list
          {
            name: '标准 tools/list',
            data: JSON.stringify({
              jsonrpc: '2.0',
              id: Date.now(),
              method: 'tools/list'
            })
          },
          // 方法2：带参数的 tools/list
          {
            name: '带参数的 tools/list',
            data: JSON.stringify({
              jsonrpc: '2.0',
              id: Date.now(),
              method: 'tools/list',
              params: {}
            })
          },
          // 方法3：listTools (可能的别名)
          {
            name: 'listTools 方法',
            data: JSON.stringify({
              jsonrpc: '2.0',
              id: Date.now(),
              method: 'listTools'
            })
          },
          // 方法4：直接询问可用工具
          {
            name: '询问可用工具',
            data: JSON.stringify({
              jsonrpc: '2.0',
              id: Date.now(),
              method: 'tools/call',
              params: {
                name: 'list_tools',
                arguments: {}
              }
            })
          },
          // 方法5：尝试常见的工具名称
          {
            name: '尝试 common_tools',
            data: JSON.stringify({
              jsonrpc: '2.0',
              id: Date.now(),
              method: 'tools/call',
              params: {
                name: 'common_tools',
                arguments: {}
              }
            })
          }
        ];

        let currentIndex = 0;
        
        const tryNextMethod = () => {
          if (currentIndex >= methods.length) {
            console.log('🏁 所有方法尝试完毕');
            resolveMethods();
            resolve();
            return;
          }

          const method = methods[currentIndex];
          console.log(`\n🧪 尝试方法 ${currentIndex + 1}: ${method.name}`);
          console.log(`📝 请求数据:`, JSON.parse(method.data));
          
          const toolsOptions = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.path,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'text/event-stream,application/json',
              'Authorization': `Bearer ${apiKey}`,
              'mcp-session-id': sessionId,
              'Content-Length': Buffer.byteLength(method.data),
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive'
            }
          };

          const toolsReq = https.request(toolsOptions, (toolsRes) => {
            let toolsResponse = '';

            toolsRes.on('data', (chunk) => {
              toolsResponse += chunk.toString();
            });

            toolsRes.on('end', () => {
              console.log(`📡 方法${currentIndex + 1}响应状态:`, toolsRes.statusCode);
              console.log(`📝 方法${currentIndex + 1}响应:`, toolsResponse.substring(0, 500));
              
              try {
                const result = JSON.parse(toolsResponse);
                if (result.error) {
                  console.log(`❌ 方法${currentIndex + 1}错误:`, result.error.message);
                  
                  // 如果是参数错误，尝试解析是否有更多信息
                  if (result.error.message.includes('Invalid request parameters')) {
                    console.log(`💡 方法${currentIndex + 1}提示: 可能参数格式不正确`);
                  }
                } else {
                  console.log(`✅ 方法${currentIndex + 1}成功:`);
                  console.log(`📊 结果:`, JSON.stringify(result, null, 2));
                  
                  // 如果成功获取工具列表，提取有用信息
                  if (result.result && result.result.tools) {
                    console.log(`\n🎉 成功获取工具列表:`);
                    result.result.tools.forEach((tool, index) => {
                      console.log(`  ${index + 1}. ${tool.name}`);
                      console.log(`     描述: ${tool.description}`);
                      if (tool.inputSchema) {
                        console.log(`     参数:`, JSON.stringify(tool.inputSchema, null, 4));
                      }
                    });
                  }
                }
              } catch (e) {
                console.log(`⚠️ 方法${currentIndex + 1}解析失败:`, e.message);
                console.log(`原始响应:`, toolsResponse);
              }
              
              currentIndex++;
              setTimeout(tryNextMethod, 500); // 间隔0.5秒
            });
          });

          toolsReq.on('error', (error) => {
            console.error(`❌ 方法${currentIndex + 1}请求错误:`, error);
            currentIndex++;
            setTimeout(tryNextMethod, 500);
          });

          toolsReq.write(method.data);
          toolsReq.end();
        };

        tryNextMethod();
      });
    };
  });
};

getRealToolsInfo().catch(console.error);