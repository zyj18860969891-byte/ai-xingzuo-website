/**
 * 测试AI增强解析服务
 * 验证OpenRouter集成和模型调用
 */

const aiParser = require('./services/ai-enhanced-parser');

async function testAIIntegration() {
  console.log('=== AI增强解析服务测试 ===\n');
  
  // 1. 检查服务状态
  console.log('📊 服务状态:');
  const status = aiParser.getStatus();
  console.log(JSON.stringify(status, null, 2));
  console.log('');
  
  // 2. 测试问题解析
  const testQuestions = [
    '狮子座和白羊座合适吗？？？',
    '1996.02.10是什么星座？',
    '帮我看看今天的双子座运势'
  ];
  
  for (const question of testQuestions) {
    console.log(`🧠 测试问题: "${question}"`);
    
    try {
      const result = await aiParser.parseQuestion(question, 'test-session');
      console.log('✅ 解析结果:');
      console.log(JSON.stringify(result, null, 2));
      console.log('');
    } catch (error) {
      console.error('❌ 解析失败:', error.message);
      console.log('');
    }
  }
  
  // 3. 测试降级逻辑
  console.log('🔄 测试降级逻辑:');
  console.log('当前配置中缺少OPENROUTER_API_KEY，应该触发降级逻辑');
  
  try {
    const result = await aiParser.parseQuestion('测试降级', 'test-session');
    console.log('降级结果:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('降级失败:', error.message);
  }
}

testAIIntegration().catch(console.error);