require('dotenv').config();

// 猜测工具名称和查询服务文档
const guessToolsNames = async () => {
  console.log('🔍 开始猜测工具名称和查询服务...');
  
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
          
          // 猜测常见的工具名称
          await guessCommonToolNames(sessionFromResponse);
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

    // 猜测常见的工具名称
    const guessCommonToolNames = (sessionId) => {
      return new Promise((resolveGuess) => {
        console.log('2️⃣ 猜测常见工具名称...');
        
        // 常见的星座/运势相关工具名称
        const toolNames = [
          'get_daily_horoscope',
          'daily_horoscope',
          'get_horoscope',
          'horoscope',
          'zodiac_forecast',
          'daily_zodiac',
          'astrology',
          'star_prediction',
          'constellation',
          'get_constellation',
          'daily_constellation',
          'zodiac_reading',
          'daily_reading',
          'fortune_telling',
          'daily_fortune',
          'get_daily_reading',
          'daily_prediction',
          'star_horoscope',
          'zodiac_daily',
          'get_zodiac_daily',
          'daily_zodiac_forecast',
          'zodiac_prediction',
          'daily_star_reading',
          'get_daily_star_reading',
          'daily_constellation_reading',
          'constellation_daily',
          'daily_astrology',
          'get_daily_astrology',
          'daily_star_prediction',
          'star_daily_prediction',
          'daily_zodiac_reading',
          'zodiac_daily_reading',
          'daily_horoscope_reading',
          'get_daily_horoscope_reading',
          'daily_star_horoscope',
          'star_daily_horoscope',
          'daily_constellation_horoscope',
          'constellation_daily_horoscope',
          'daily_astrology_reading',
          'astrology_daily_reading',
          'daily_fortune_telling',
          'fortune_telling_daily',
          'daily_prediction_reading',
          'prediction_daily_reading'
        ];

        // 简单参数格式
        const simpleArguments = [
          '狮子座',
          'Leo',
          { zodiac: '狮子座' },
          { zodiac: 'Leo' },
          { sign: '狮子座' },
          { sign: 'Leo' }
        ];

        let currentIndex = 0;
        let foundWorkingTool = false;
        
        const tryNextTool = () => {
          if (currentIndex >= toolNames.length || foundWorkingTool) {
            console.log('🏁 工具名称猜测完毕');
            resolveGuess();
            resolve();
            return;
          }

          const toolName = toolNames[currentIndex];
          console.log(`\n🧪 测试工具名称 ${currentIndex + 1}: ${toolName}`);
          
          // 尝试所有参数格式
          let paramIndex = 0;
          
          const tryNextParam = () => {
            if (paramIndex >= simpleArguments.length || foundWorkingTool) {
              currentIndex++;
              setTimeout(tryNextTool, 200); // 间隔0.2秒
              return;
            }

            const args = simpleArguments[paramIndex];
            console.log(`   尝试参数格式 ${paramIndex + 1}:`, args);
            
            const toolsRequestData = JSON.stringify({
              jsonrpc: '2.0',
              id: Date.now() + currentIndex * 100 + paramIndex,
              method: 'tools/call',
              params: {
                name: toolName,
                arguments: args
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

            const toolsReq = https.request(toolsOptions, (toolsRes) => {
              let toolsResponse = '';

              toolsRes.on('data', (chunk) => {
                toolsResponse += chunk.toString();
              });

              toolsRes.on('end', () => {
                const responseTime = new Date().getTime();
                
                try {
                  const result = JSON.parse(toolsResponse);
                  if (result.error) {
                    // 参数错误，继续尝试
                    paramIndex++;
                    setTimeout(tryNextParam, 50); // 间隔0.05秒
                  } else {
                    // 找到可用的工具！
                    console.log(`🎉 找到可用工具: ${toolName}`);
                    console.log(`📊 成功响应:`, JSON.stringify(result, null, 2));
                    foundWorkingTool = true;
                    
                    // 分析返回的数据结构
                    if (result.result) {
                      console.log(`\n📋 工具 ${toolName} 返回数据结构:`);
                      console.log(`类型: ${typeof result.result}`);
                      if (typeof result.result === 'object') {
                        console.log(`属性:`, Object.keys(result.result));
                        if (result.result.content) {
                          console.log(`内容:`, JSON.stringify(result.result.content).substring(0, 200) + '...');
                        }
                      }
                    }
                    
                    resolveGuess();
                    resolve();
                  }
                } catch (e) {
                  // 解析失败，继续尝试
                  paramIndex++;
                  setTimeout(tryNextParam, 50);
                }
              });
            });

            toolsReq.on('error', (error) => {
              // 请求错误，继续尝试
              paramIndex++;
              setTimeout(tryNextParam, 50);
            });

            toolsReq.write(toolsRequestData);
            toolsReq.end();
          };

          tryNextParam();
        };

        tryNextTool();
      });
    };
  });
};

guessToolsNames().catch(console.error);