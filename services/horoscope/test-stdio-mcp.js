const { spawn } = require('child_process');

async function testFixedMCP() {
  return new Promise((resolve, reject) => {
    try {
      console.log('🚀 启动MCP stdio服务...');
      
      const mcpProcess = spawn('npx', ['star-mcp'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env },
        shell: true
      });

      let responseData = '';
      let resultFound = false;

      mcpProcess.stdout.on('data', (data) => {
        const output = data.toString();
        responseData += output;
        
        const lines = output.split('\n');
        for (const line of lines) {
          if (line.trim()) {
            try {
              const parsed = JSON.parse(line);
              console.log('📄 stdio解析:', parsed);
              
              if (parsed.result && parsed.result.capabilities) {
                console.log('✅ MCP会话初始化成功');
                
                setTimeout(() => {
                  const toolRequest = {
                    jsonrpc: '2.0',
                    id: 2,
                    method: 'tools/call',
                    params: {
                      name: 'get_daily_horoscope',
                      arguments: {
                        zodiac: '白羊座',
                        category: 'general',
                        timeRange: 'daily',
                        source: 'local',
                        question: '帮我看看白羊座',
                        context: [],
                        date: new Date().toISOString().split('T')[0]
                      }
                    }
                  };
                  
                  console.log('🧠 发送工具调用请求:', JSON.stringify(toolRequest, null, 2));
                  mcpProcess.stdin.write(JSON.stringify(toolRequest) + '\n');
                }, 1000);
                
              } else if (parsed.result && parsed.result.content) {
                resultFound = true;
                console.log('✅ 获得AI响应:', parsed.result.content[0].text);
                resolve({
                  success: true,
                  answer: parsed.result.content[0].text
                });
                mcpProcess.kill();
                return;
              } else if (parsed.error) {
                console.error('❌ MCP错误:', parsed.error);
                resolve({
                  success: false,
                  error: parsed.error.message
                });
                mcpProcess.kill();
                return;
              }
            } catch (e) {
              console.log('⚠️ stdio JSON解析失败:', e.message);
            }
          }
        }
      });

      mcpProcess.stderr.on('data', (data) => {
        console.error('❌ MCP stderr:', data.toString());
      });

      mcpProcess.on('close', (code) => {
        if (!resultFound) {
          console.log('❌ MCP进程关闭，退出码:', code);
          resolve({
            success: false,
            error: 'MCP服务关闭',
            details: '进程退出码: ' + code
          });
        }
      });

      mcpProcess.on('error', (error) => {
        reject(error);
      });

      const initRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          clientInfo: { name: 'ai-xingzuo', version: '1.0' }
        }
      };
      
      console.log('🔄 发送初始化请求:', JSON.stringify(initRequest, null, 2));
      mcpProcess.stdin.write(JSON.stringify(initRequest) + '\n');

      setTimeout(() => {
        if (!resultFound) {
          mcpProcess.kill();
          resolve({
            success: false,
            error: 'MCP请求超时',
            details: '15秒内未收到有效响应'
          });
        }
      }, 15000);

    } catch (error) {
      console.error('❌ MCP stdio连接失败:', error.message);
      reject(error);
    }
  });
}

testFixedMCP().then(result => {
  console.log('最终结果:', result);
}).catch(error => {
  console.error('测试失败:', error);
});