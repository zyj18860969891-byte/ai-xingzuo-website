require('dotenv').config();

// 分析参数匹配问题并寻找解决方案
const analyzeParameterMatching = async () => {
  console.log('🔍 分析参数匹配问题并寻找解决方案...');
  
  const apiKey = process.env.MODELSCOPE_API_KEY || 'ms-bf1291c1-c1ed-464c-b8d8-162fdee96180';
  const mcpUrl = process.env.STAR_MCP_URL || 'https://mcp.api-inference.modelscope.net/7dbabf61999f4e/mcp';
  
  const https = require('https');
  const url = require('url');
  const parsedUrl = url.parse(mcpUrl);
  
  return new Promise((resolve) => {
    console.log('📋 参数匹配问题分析:');
    console.log('问题: 所有工具调用都返回 "Invalid request parameters"');
    console.log('可能原因:');
    console.log('1. 工具名称不正确');
    console.log('2. 参数格式不符合服务期望');
    console.log('3. 参数结构不匹配');
    console.log('4. 服务版本差异');
    
    // 第一步：MCP initialize
    console.log('\n1️⃣ MCP initialize...');
    
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
          
          // 分析可能的解决方案
          await analyzePossibleSolutions(sessionFromResponse);
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

    // 分析可能的解决方案
    const analyzePossibleSolutions = (sessionId) => {
      return new Promise((resolveAnalyze) => {
        console.log('\n2️⃣ 分析可能的解决方案...');
        
        const solutions = [
          // 方案1：尝试完全不同的工具名称
          {
            name: '尝试完全不同的工具调用',
            testCases: [
              {
                toolName: 'getDailyHoroscope',
                args: { zodiac: '狮子座' }
              },
              {
                toolName: 'dailyHoroscope',
                args: '狮子座'
              },
              {
                toolName: 'horoscopeDaily',
                args: { sign: '狮子座', type: 'daily' }
              }
            ]
          },
          // 方案2：尝试最简单的调用方式
          {
            name: '最简单的调用方式',
            testCases: [
              {
                toolName: 'get_daily_horoscope',
                args: ''
              },
              {
                toolName: 'get_daily_horoscope',
                args: null
              },
              {
                toolName: 'get_daily_horoscope',
                args: []
              }
            ]
          },
          // 方案3：尝试服务特定的格式
          {
            name: '服务特定格式',
            testCases: [
              {
                toolName: 'get_daily_horoscope',
                args: { zodiac_sign: '狮子座', prediction_type: 'daily' }
              },
              {
                toolName: 'get_daily_horoscope',
                args: { astrological_sign: '狮子座' }
              },
              {
                toolName: 'get_daily_horoscope',
                args: { constellation: '狮子座', category: 'love' }
              }
            ]
          },
          // 方案4：尝试数字ID格式
          {
            name: '数字ID格式',
            testCases: [
              {
                toolName: 'get_daily_horoscope',
                args: { zodiac: 5 } // 狮子座是第5个星座
              },
              {
                toolName: 'get_daily_horoscope',
                args: { sign_id: 5 }
              },
              {
                toolName: 'get_daily_horoscope',
                args: 5
              }
            ]
          },
          // 方案5：尝试英文参数
          {
            name: '英文参数格式',
            testCases: [
              {
                toolName: 'get_daily_horoscope',
                args: { zodiac: 'Leo', category: 'love' }
              },
              {
                toolName: 'get_daily_horoscope',
                args: { sign: 'Leo' }
              },
              {
                toolName: 'get_daily_horoscope',
                args: 'Leo'
              }
            ]
          }
        ];

        let currentSolutionIndex = 0;
        let foundWorkingSolution = false;
        
        const tryNextSolution = () => {
          if (currentSolutionIndex >= solutions.length || foundWorkingSolution) {
            console.log('\n🏁 所有解决方案尝试完毕');
            resolveAnalyze();
            resolve();
            return;
          }

          const solution = solutions[currentSolutionIndex];
          console.log(`\n🧪 测试方案 ${currentSolutionIndex + 1}: ${solution.name}`);
          
          let currentTestCaseIndex = 0;
          
          const tryNextTestCase = () => {
            if (currentTestCaseIndex >= solution.testCases.length || foundWorkingSolution) {
              currentSolutionIndex++;
              setTimeout(tryNextSolution, 300);
              return;
            }

            const testCase = solution.testCases[currentTestCaseIndex];
            console.log(`   测试用例 ${currentTestCaseIndex + 1}:`, {
              toolName: testCase.toolName,
              args: testCase.args
            });
            
            const toolsRequestData = JSON.stringify({
              jsonrpc: '2.0',
              id: Date.now() + currentSolutionIndex * 100 + currentTestCaseIndex,
              method: 'tools/call',
              params: {
                name: testCase.toolName,
                arguments: testCase.args
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
                try {
                  const result = JSON.parse(toolsResponse);
                  if (result.error) {
                    console.log(`   ❌ 错误: ${result.error.message}`);
                    
                    // 分析错误信息，寻找线索
                    if (result.error.message.includes('Invalid request parameters')) {
                      console.log(`   💡 参数格式仍不匹配，继续尝试...`);
                    }
                  } else {
                    // 找到可行的解决方案！
                    console.log(`   🎉 找到可行方案!`);
                    console.log(`   📊 成功响应:`, JSON.stringify(result, null, 2));
                    foundWorkingSolution = true;
                    
                    // 分析返回的数据结构
                    if (result.result) {
                      console.log(`\n📋 工具返回数据结构:`);
                      console.log(`类型: ${typeof result.result}`);
                      if (typeof result.result === 'object') {
                        console.log(`属性:`, Object.keys(result.result));
                        if (result.result.content) {
                          console.log(`内容预览:`, JSON.stringify(result.result.content).substring(0, 200) + '...');
                        }
                      }
                    }
                    
                    resolveAnalyze();
                    resolve();
                  }
                } catch (e) {
                  console.log(`   ⚠️ 响应解析失败:`, e.message);
                }
                
                currentTestCaseIndex++;
                setTimeout(tryNextTestCase, 100);
              });
            });

            toolsReq.on('error', (error) => {
              console.log(`   ❌ 请求错误:`, error.message);
              currentTestCaseIndex++;
              setTimeout(tryNextTestCase, 100);
            });

            toolsReq.write(toolsRequestData);
            toolsReq.end();
          };

          tryNextTestCase();
        };

        tryNextSolution();
      });
    };
  });
};

analyzeParameterMatching().catch(console.error);