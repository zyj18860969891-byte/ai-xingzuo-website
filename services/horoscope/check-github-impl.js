require('dotenv').config();

// 检查GitHub仓库中的正确实现
const checkGithubImpl = async () => {
  console.log('🔍 检查GitHub仓库中的正确实现...');
  
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
          
          // 尝试GitHub示例中的调用方式
          await tryGithubExample(sessionFromResponse);
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

    // 尝试GitHub示例中的调用方式
    const tryGithubExample = (sessionId) => {
      return new Promise((resolveExample) => {
        console.log('2️⃣ 尝试GitHub示例调用方式...');
        
        // 根据GitHub示例，尝试不同的调用方式
        const examples = [
          // 示例1：简单的字符串参数
          {
            jsonrpc: '2.0',
            id: Date.now(),
            method: 'tools/call',
            params: {
              name: 'get_daily_horoscope',
              arguments: 'Leo'
            }
          },
          // 示例2：对象参数
          {
            jsonrpc: '2.0',
            id: Date.now() + 1,
            method: 'tools/call',
            params: {
              name: 'get_daily_horoscope',
              arguments: {
                zodiac: 'Leo'
              }
            }
          },
          // 示例3：完整的参数
          {
            jsonrpc: '2.0',
            id: Date.now() + 2,
            method: 'tools/call',
            params: {
              name: 'get_daily_horoscope',
              arguments: {
                zodiac: 'Leo',
                category: 'love'
              }
            }
          },
          // 示例4：中文参数
          {
            jsonrpc: '2.0',
            id: Date.now() + 3,
            method: 'tools/call',
            params: {
              name: 'get_daily_horoscope',
              arguments: {
                zodiac: '狮子座',
                category: 'love'
              }
            }
          }
        ];

        let currentIndex = 0;
        
        const tryNextExample = () => {
          if (currentIndex >= examples.length) {
            console.log('🏁 所有示例尝试完毕');
            resolveExample();
            resolve();
            return;
          }

          const example = examples[currentIndex];
          console.log(`\n🧪 尝试示例 ${currentIndex + 1}:`, JSON.stringify(example, null, 2));
          
          const toolsRequestData = JSON.stringify(example);

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

            toolsRes.on('data', (chunk) => {
              toolsResponse += chunk.toString();
            });

            toolsRes.on('end', () => {
              console.log(`📡 示例${currentIndex + 1}响应状态:`, toolsRes.statusCode);
              console.log(`📝 示例${currentIndex + 1}响应:`, toolsResponse.substring(0, 300));
              
              try {
                const result = JSON.parse(toolsResponse);
                if (result.error) {
                  console.log(`❌ 示例${currentIndex + 1}错误:`, result.error.message);
                } else {
                  console.log(`✅ 示例${currentIndex + 1}成功:`, {
                    result: JSON.stringify(result.result).substring(0, 200) + '...'
                  });
                }
              } catch (e) {
                console.log(`⚠️ 示例${currentIndex + 1}解析失败:`, e.message);
              }
              
              currentIndex++;
              setTimeout(tryNextExample, 500); // 间隔0.5秒
            });
          });

          toolsReq.on('error', (error) => {
            console.error(`❌ 示例${currentIndex + 1}请求错误:`, error);
            currentIndex++;
            setTimeout(tryNextExample, 500);
          });

          toolsReq.write(toolsRequestData);
          toolsReq.end();
        };

        tryNextExample();
      });
    };
  });
};

checkGithubImpl().catch(console.error);