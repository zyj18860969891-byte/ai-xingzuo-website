const { spawn } = require('child_process');

async function testMCPTools() {
  return new Promise((resolve, reject) => {
    try {
      console.log('🚀 启动MCP stdio服务...');
      
      const mcpProcess = spawn('npx', ['star-mcp'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env },
        shell: true
      });

      let responseData = '';
      let toolsList = null;

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
                  // 请求工具列表
                  const toolsRequest = {
                    jsonrpc: '2.0',
                    id: 2,
                    method: 'tools/list'
                  };
                  
                  console.log('🔧 请求工具列表');
                  mcpProcess.stdin.write(JSON.stringify(toolsRequest) + '\n');
                }, 1000);
                
              } else if (parsed.result && parsed.result.tools) {
                toolsList = parsed.result.tools;
                console.log('🔧 获得工具列表:', JSON.stringify(toolsList, null, 2));
                
                // 测试兼容性分析工具
                setTimeout(() => {
                  const compatibilityRequest = {
                    jsonrpc: '2.0',
                    id: 3,
                    method: 'tools/call',
                    params: {
                      name: 'get_compatibility_analysis',
                      arguments: {
                        zodiac1: '狮子座',
                        zodiac2: '白羊座',
                        category: 'compatibility',
                        timeRange: 'daily',
                        source: 'local',
                        question: '狮子座和白羊座合适吗',
                        context: []
                      }
                    }
                  };
                  
                  console.log('🧠 测试兼容性分析工具');
                  mcpProcess.stdin.write(JSON.stringify(compatibilityRequest) + '\n');
                }, 1000);
                
              } else if (parsed.result && parsed.result.content) {
                console.log('✅ 获得响应:', parsed.result.content[0].text);
                resolve({
                  success: true,
                  answer: parsed.result.content[0].text,
                  tools: toolsList
                });
                mcpProcess.kill();
                return;
              } else if (parsed.error) {
                console.error('❌ MCP错误:', parsed.error);
                resolve({
                  success: false,
                  error: parsed.error.message,
                  tools: toolsList
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
        console.log('❌ MCP进程关闭，退出码:', code);
        resolve({
          success: false,
          error: 'MCP服务关闭',
          details: '进程退出码: ' + code,
          tools: toolsList
        });
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
      
      console.log('🔄 发送初始化请求');
      mcpProcess.stdin.write(JSON.stringify(initRequest) + '\n');

      setTimeout(() => {
        if (!toolsList) {
          mcpProcess.kill();
          resolve({
            success: false,
            error: 'MCP请求超时',
            details: '15秒内未收到有效响应',
            tools: toolsList
          });
        }
      }, 15000);

    } catch (error) {
      console.error('❌ MCP stdio连接失败:', error.message);
      reject(error);
    }
  });
}

testMCPTools().then(result => {
  console.log('最终结果:', result);
}).catch(error => {
  console.error('测试失败:', error);
});