require('dotenv').config();
const { callStarMCPSSE } = require('./routes/horoscope');

// 测试SSE流式处理能力协议栈（无session版本）
const testFunction = async () => {
  console.log('🚀 开始测试完整的SSE流式处理能力协议栈（无session）...');
  
  const apiKey = process.env.MODELSCOPE_API_KEY || 'ms-bf1291c1-c1ed-464c-b8d8-162fdee96180';
  const mcpUrl = process.env.STAR_MCP_URL || 'https://mcp.api-inference.modelscope.net/7dbabf61999f4e/mcp';
  
  console.log('📡 配置信息:', {
    hasApiKey: !!apiKey,
    mcpUrl: mcpUrl,
    apiKeyPreview: apiKey ? apiKey.substring(0, 20) + '...' : '无'
  });
  
  // 无session版本测试
  const https = require('https');
  const url = require('url');
  const parsedUrl = url.parse(mcpUrl);
  
  // 工具调用请求数据
  const postData = JSON.stringify({
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

  const options = {
    hostname: parsedUrl.hostname,
    path: parsedUrl.path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream,application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Content-Length': Buffer.byteLength(postData),
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  };

  console.log('📡 无session SSE协议栈初始化:', {
    url: mcpUrl,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${apiKey.substring(0, 10)}...`
    }
  });

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let fullResponse = '';

      console.log('📡 无session SSE响应状态:', res.statusCode);
      console.log('📡 无session SSE响应头:', res.headers);

      res.on('data', (chunk) => {
        const chunkStr = chunk.toString();
        fullResponse += chunkStr;
        console.log('📄 无session收到数据:', chunkStr.substring(0, 300) + '...');
      });

      res.on('end', () => {
        console.log('📝 无session完整响应:', fullResponse.substring(0, 1000));
        
        try {
          const result = JSON.parse(fullResponse);
          console.log('📊 无session解析结果:', JSON.stringify(result, null, 2));
        } catch (e) {
          console.log('⚠️ 无session JSON解析失败:', e.message);
        }
        
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('❌ 无session SSE请求错误:', error);
      resolve();
    });

    // 发送请求
    req.write(postData);
    req.end();

    // 超时处理
    setTimeout(() => {
      if (req.socket && !req.socket.destroyed) {
        req.abort();
      }
      console.log('⏰ 无session SSE请求超时');
      resolve();
    }, 15000);
  });
};

testFunction().catch(console.error);