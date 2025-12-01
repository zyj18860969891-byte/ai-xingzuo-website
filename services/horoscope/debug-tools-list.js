require('dotenv').config();

// 详细查询工具列表，获取正确的参数格式
const debugToolsList = async () => {
  console.log('🔍 开始详细查询工具列表...');
  
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
          
          // 第二步：详细查询工具列表
          await queryDetailedToolsList(sessionFromResponse);
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

    // 第二步：详细查询工具列表
    const queryDetailedToolsList = (sessionId) => {
      return new Promise((resolveQuery) => {
        console.log('2️⃣ 详细查询工具列表...');
        
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

        const toolsReq = https.request(toolsOptions, (toolsRes) => {
          let toolsResponse = '';

          console.log('📡 工具列表响应状态:', toolsRes.statusCode);

          toolsRes.on('data', (chunk) => {
            toolsResponse += chunk.toString();
          });

          toolsRes.on('end', () => {
            console.log('📝 工具列表完整响应:', toolsResponse);
            
            try {
              const result = JSON.parse(toolsResponse);
              console.log('📊 工具列表详细结果:', JSON.stringify(result, null, 2));
              
              if (result.result && result.result.tools) {
                console.log('\n🛠️ 可用工具详细信息:');
                result.result.tools.forEach((tool, index) => {
                  console.log(`\n${index + 1}. ${tool.name}:`);
                  console.log(`   描述: ${tool.description}`);
                  console.log(`   参数格式:`, JSON.stringify(tool.inputSchema, null, 4));
                  
                  // 如果是get_daily_horoscope，特别标记
                  if (tool.name === 'get_daily_horoscope') {
                    console.log('   🎯 这是我们要找的工具！');
                    console.log('   📝 正确的参数格式应该是:', JSON.stringify(tool.inputSchema, null, 4));
                  }
                });
              } else if (result.error) {
                console.log('❌ 工具列表查询错误:', result.error.message);
              } else {
                console.log('⚠️ 未知响应格式:', result);
              }
            } catch (e) {
              console.log('⚠️ 工具列表JSON解析失败:', e.message);
              console.log('原始响应:', toolsResponse);
            }
            
            resolveQuery();
            resolve();
          });
        });

        toolsReq.on('error', (error) => {
          console.error('❌ 工具列表请求错误:', error);
          resolveQuery();
          resolve();
        });

        toolsReq.write(toolsRequestData);
        toolsReq.end();
      });
    };
  });
};

debugToolsList().catch(console.error);