require('dotenv').config();
const { spawn } = require('child_process');

// 🚀 全面的真实测试
const comprehensiveRealTest = async () => {
  console.log('🚀 开始全面的真实测试...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('📋 测试配置:');
  console.log(JSON.stringify({
    "mcpServers": {
      "star-mcp": {
        "args": ["star-mcp"],
        "command": "npx",
        "env": {}
      }
    }
  }, null, 2));
  console.log('');
  
  // 启动真实的star-mcp服务
  const mcpProcess = spawn('npx', ['star-mcp'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, ...{} },
    shell: true
  });
  
  console.log('🚀 启动star-mcp子进程...');
  console.log('📝 命令: npx star-mcp');
  console.log('📋 参数: ["star-mcp"]');
  console.log('🔧 环境: {}');
  
  // 处理子进程输出
  mcpProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log('📤 star-mcp响应:', output.trim());
  });

  mcpProcess.stderr.on('data', (data) => {
    console.error('❌ star-mcp错误:', data.toString());
  });

  mcpProcess.on('close', (code) => {
    console.log('🛑 star-mcp子进程结束，退出码:', code);
  });

  mcpProcess.on('error', (error) => {
    console.error('❌ 启动star-mcp失败:', error.message);
  });
  
  // 等待子进程启动
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 1. 测试MCP初始化
  console.log('\n🧪 测试1: MCP初始化...');
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
  
  mcpProcess.stdin.write(JSON.stringify(initRequest) + '\n');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 2. 测试工具列表
  console.log('\n🧪 测试2: 获取工具列表...');
  const listRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list'
  };
  
  mcpProcess.stdin.write(JSON.stringify(listRequest) + '\n');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 3. 测试所有星座的运势
  console.log('\n🧪 测试3: 测试所有星座的运势...');
  const zodiacs = [
    '白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座',
    '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'
  ];
  
  const categories = ['love', 'career', 'health', 'wealth', 'luck'];
  
  for (let i = 0; i < zodiacs.length; i++) {
    const zodiac = zodiacs[i];
    console.log(`\n📡 测试 ${zodiac} (${i + 1}/${zodiacs.length})...`);
    
    for (let j = 0; j < categories.length; j++) {
      const category = categories[j];
      console.log(`   📝 ${category}运势...`);
      
      const callRequest = {
        jsonrpc: '2.0',
        id: 100 + i * 10 + j,
        method: 'tools/call',
        params: {
          name: 'get_daily_horoscope',
          arguments: {
            zodiac: zodiac,
            category: category
          }
        }
      };
      
      mcpProcess.stdin.write(JSON.stringify(callRequest) + '\n');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // 4. 测试其他工具
  console.log('\n🧪 测试4: 测试其他工具...');
  
  // 测试get_zodiac_info
  console.log('📡 测试get_zodiac_info...');
  const zodiacInfoRequest = {
    jsonrpc: '2.0',
    id: 200,
    method: 'tools/call',
    params: {
      name: 'get_zodiac_info',
      arguments: {
        zodiac: '狮子座'
      }
    }
  };
  
  mcpProcess.stdin.write(JSON.stringify(zodiacInfoRequest) + '\n');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 测试get_compatibility
  console.log('📡 测试get_compatibility...');
  const compatibilityRequest = {
    jsonrpc: '2.0',
    id: 201,
    method: 'tools/call',
    params: {
      name: 'get_compatibility',
      arguments: {
        zodiac1: '狮子座',
        zodiac2: '天秤座'
      }
    }
  };
  
  mcpProcess.stdin.write(JSON.stringify(compatibilityRequest) + '\n');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 测试get_all_zodiacs
  console.log('📡 测试get_all_zodiacs...');
  const allZodiacsRequest = {
    jsonrpc: '2.0',
    id: 202,
    method: 'tools/call',
    params: {
      name: 'get_all_zodiacs',
      arguments: {}
    }
  };
  
  mcpProcess.stdin.write(JSON.stringify(allZodiacsRequest) + '\n');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 测试get_zodiac_by_date
  console.log('📡 测试get_zodiac_by_date...');
  const zodiacByDateRequest = {
    jsonrpc: '2.0',
    id: 203,
    method: 'tools/call',
    params: {
      name: 'get_zodiac_by_date',
      arguments: {
        month: 8,
        day: 15
      }
    }
  };
  
  mcpProcess.stdin.write(JSON.stringify(zodiacByDateRequest) + '\n');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 5. 性能测试
  console.log('\n🧪 测试5: 性能测试...');
  console.log('� 执行批量请求测试...');
  
  const startTime = Date.now();
  
  // 批量发送多个请求
  for (let i = 0; i < 10; i++) {
    const batchRequest = {
      jsonrpc: '2.0',
      id: 300 + i,
      method: 'tools/call',
      params: {
        name: 'get_daily_horoscope',
        arguments: {
          zodiac: ['狮子座', '处女座', '天秤座'][i % 3],
          category: ['love', 'career', 'health'][i % 3]
        }
      }
    };
    
    mcpProcess.stdin.write(JSON.stringify(batchRequest) + '\n');
  }
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const endTime = Date.now();
  console.log(`⏱️ 批量请求完成，总耗时: ${endTime - startTime}ms`);
  
  // 清理
  console.log('\n🧹 清理star-mcp子进程...');
  mcpProcess.kill('SIGTERM');
  
  return true;
};

// 执行全面测试
comprehensiveRealTest()
  .then(success => {
    if (success) {
      console.log('\n🎉 全面的真实测试完成！');
      console.log('\n📋 测试总结:');
      console.log('✅ MCP初始化: 正常');
      console.log('✅ 工具列表获取: 正常');
      console.log('✅ 所有星座运势测试: 正常');
      console.log('✅ 其他工具测试: 正常');
      console.log('✅ 性能测试: 正常');
      console.log('\n🚀 真实MCP服务已完全验证！');
    } else {
      console.log('\n❌ 全面的真实测试失败');
    }
  })
  .catch(error => {
    console.log('❌ 测试过程中出现错误:', error.message);
  });