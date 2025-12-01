/**
 * 🤖 AI增强解析服务
 * 集成OpenRouter的Qwen模型，实现智能问题解析和意图识别
 * 
 * 功能:
 * - 自然语言理解
 * - 意图识别
 * - 参数提取
 * - 上下文管理
 * - 动态工具映射
 * 
 * @author: GitHub Copilot
 * @version: 1.0.0
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class AIEnhancedParser {
  constructor() {
    this.openrouterApiKey = process.env.OPENROUTER_API_KEY || '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';
    this.openrouterModel = process.env.OPENROUTER_MODEL || 'qwen/qwen3-235b-a22b-2507';
    this.timeout = parseInt(process.env.AI_TIMEOUT) || 15000;
    
    // MCP工具列表
    this.availableTools = [
      'get_daily_horoscope',
      'get_weekly_horoscope', 
      'get_monthly_horoscope',
      'get_yearly_horoscope',
      'get_compatibility',
      'get_zodiac_by_date',
      'ask_zodiac'
    ];
    
    // 上下文管理
    this.contexts = new Map();
    
    console.log('🤖 AI增强解析服务初始化完成');
  }

  /**
   * 解析用户问题并生成MCP参数
   */
  async parseQuestion(question, sessionId = null) {
    try {
      console.log('🧠 AI解析问题:', question.substring(0, 100) + '...');
      console.log('🔍 会话ID:', sessionId);
      
      // 获取或创建上下文
      const context = this.getContext(sessionId);
      
      // 检查上下文中是否有用户星座信息
      const userZodiac = this.getUserZodiac(sessionId);
      if (userZodiac) {
        console.log(`🌟 发现用户已保存的星座: ${userZodiac}`);
      }
      
      // 构建AI提示词
      const prompt = this.buildPrompt(question, context, userZodiac);
      
      // 调用AI模型
      const aiResponse = await this.callAI(prompt);
      
      // 解析AI响应
      let parsedResult = this.parseAIResponse(aiResponse, question);
      
      // 检查星座信息，如果缺失则生成询问消息
      console.log('🔍 检查星座信息:', {
        tool: parsedResult.tool,
        zodiac: parsedResult.arguments.zodiac,
        isMissing: this.isZodiacMissing(parsedResult)
      });
      
      if (this.isZodiacMissing(parsedResult)) {
        console.log('🔍 检测到星座信息缺失，生成询问消息');
        parsedResult = this.generateZodiacQuestion(parsedResult, question, sessionId);
      }
      
      // 更新上下文
      this.updateContext(sessionId, question, parsedResult);
      
      console.log('✅ AI解析完成:', {
        tool: parsedResult.tool,
        confidence: parsedResult.confidence,
        context: parsedResult.context,
        userZodiac: userZodiac
      });
      
      return parsedResult;
      
    } catch (error) {
      console.error('❌ AI解析失败:', error.message);
      throw new Error(`AI解析失败: ${error.message}`);
    }
  }

  /**
   * 构建AI提示词
   */
  buildPrompt(question, context, userZodiac = null) {
    const toolsDescription = this.getToolsDescription();
    
    // 构建上下文信息，包括用户星座
    let contextInfo = '';
    if (userZodiac) {
      contextInfo = `⭐ 用户已知星座: ${userZodiac} (这是从之前的对话中推断出的用户星座)\n`;
      console.log(`🌟 在AI提示词中包含用户星座: ${userZodiac}`);
    }
    
    if (context) {
      contextInfo += `对话历史: ${context}\n`;
    }
    
    let prompt = `你是一个专业的星座运势AI助手，需要解析用户的问题并调用相应的工具。

重要规则：
1. 如果用户问题中没有明确提到星座名称，但已知用户星座信息，请使用已知的用户星座
2. 只有在明确识别出星座名称时，才调用具体的运势工具
3. 对于日期查询（如"1996.02.10是什么星座？"），才调用get_zodiac_by_date工具
4. 置信度低于0.8时，应询问用户确认信息
5. 当用户说"我的星座是X"时，默认调用get_daily_horoscope工具，category为general

用户意图识别指南：
- "我的星座是X" → 默认查询X星座的每日综合运势
- "我是X座" → 默认查询X星座的每日综合运势  
- "X座今天运势" → 调用get_daily_horoscope，zodiac=X，category=general
- "X座本周运势" → 调用get_weekly_horoscope，zodiac=X，category=general
- "X座本月运势" → 调用get_monthly_horoscope，zodiac=X，category=general
- "X座今年运势" → 调用get_yearly_horoscope，zodiac=X，category=general
- "X和Y配对" → 调用get_compatibility，zodiac1=X，zodiac2=Y
- "1996.02.10是什么星座" → 调用get_zodiac_by_date，month=2，day=10

${contextInfo}

可用工具:
${toolsDescription}

用户问题: "${question}"

请分析用户问题的意图，并返回JSON格式的调用参数:
{
  "tool": "工具名称",
  "arguments": {
    // 工具参数
  },
  "confidence": 0.95,
  "reasoning": "解析理由",
  "context": "上下文信息"
}

星座识别规则：
- 明确星座名称：白羊座、金牛座、双子座、巨蟹座、狮子座、处女座、天秤座、天蝎座、射手座、摩羯座、水瓶座、双鱼座
- 如果问题中没有星座名称，但有已知的用户星座信息，请使用用户星座
- 如果问题中没有这些星座名称，且没有提供出生日期，请返回ask_zodiac工具
- 日期格式：YYYY-MM-DD、YYYY.MM.DD、YYYY年MM月DD日等格式可以调用get_zodiac_by_date
- 运势查询必须明确星座名称才能调用相应工具

要求:
1. 准确识别用户意图
2. 提取所有必要参数
3. 处理日期、星座名称等实体
4. 考虑对话上下文和用户已知信息
5. 置信度0-1之间
6. 只返回JSON，不要其他文字`;

    return prompt;
  }

  /**
   * 获取工具描述
   */
  getToolsDescription() {
    return this.availableTools.map(tool => {
      switch (tool) {
        case 'get_daily_horoscope':
          return '- get_daily_horoscope: 获取指定星座的每日运势，参数: zodiac(星座), category(类别: general/love/career/wealth/health), timeRange(daily)';
        case 'get_weekly_horoscope':
          return '- get_weekly_horoscope: 获取指定星座的每周运势，参数: zodiac(星座), category(类别), timeRange(weekly)';
        case 'get_monthly_horoscope':
          return '- get_monthly_horoscope: 获取指定星座的每月运势，参数: zodiac(星座), category(类别), timeRange(monthly)';
        case 'get_yearly_horoscope':
          return '- get_yearly_horoscope: 获取指定星座的年度运势，参数: zodiac(星座), category(类别), timeRange(yearly)';
        case 'get_compatibility':
          return '- get_compatibility: 分析两个星座的配对，参数: zodiac1(第一个星座), zodiac2(第二个星座)';
        case 'get_zodiac_by_date':
          return '- get_zodiac_by_date: 根据日期确定星座，参数: month(月份), day(日期)';
        case 'ask_zodiac':
          return '- ask_zodiac: 询问用户星座信息，参数: question(询问问题), followUpQuestions(可选问题列表), sessionId(会话ID)';
        default:
          return `- ${tool}: 未知工具`;
      }
    }).join('\n');
  }

  /**
   * 调用AI模型
   */
  async callAI(prompt) {
    const url = 'https://openrouter.ai/api/v1/chat/completions';
    
    const payload = {
      model: this.openrouterModel,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的星座运势AI助手，擅长解析用户意图并提取参数。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    };

    const headers = {
      'Authorization': `Bearer ${this.openrouterApiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://ai-xingzuo-website.com'
    };

    const response = await axios.post(url, payload, {
      headers,
      timeout: this.timeout
    });

    return response.data.choices[0].message.content;
  }

  /**
   * 解析AI响应
   */
  parseAIResponse(aiResponse, originalQuestion) {
    try {
      const parsed = JSON.parse(aiResponse);
      
      // 验证必需字段
      if (!parsed.tool || !this.availableTools.includes(parsed.tool)) {
        throw new Error(`无效工具: ${parsed.tool}`);
      }

      // 构建标准化的参数
      const standardizedArgs = this.standardizeArguments(parsed.arguments, parsed.tool);
      
      // 如果是get_zodiac_by_date工具调用成功，提取星座信息
      let extractedZodiac = null;
      if (parsed.tool === 'get_zodiac_by_date' && parsed.result && parsed.result.content) {
        const content = parsed.result.content[0].text;
        const zodiacMatch = content.match(/(?:星座是|属于|属于)(.+?)(?:[，。！？]|$)/);
        if (zodiacMatch) {
          extractedZodiac = zodiacMatch[1].trim();
          console.log(`🔍 从AI响应中提取星座: ${extractedZodiac}`);
        }
      }
      
      // 如果是get_zodiac_by_date工具调用成功，直接从参数中提取星座信息
      if (parsed.tool === 'get_zodiac_by_date' && standardizedArgs.month && standardizedArgs.day) {
        const zodiac = this.getZodiacByDate(standardizedArgs.month, standardizedArgs.day);
        if (zodiac) {
          extractedZodiac = zodiac;
          console.log(`🔍 从日期参数中提取星座: ${extractedZodiac}`);
        }
      }
      
      return {
        tool: parsed.tool,
        arguments: standardizedArgs,
        confidence: parsed.confidence || 0.8,
        reasoning: parsed.reasoning || 'AI解析',
        context: parsed.context || '',
        originalQuestion,
        extractedZodiac, // 添加提取的星座信息
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ AI响应解析失败:', error.message);
      throw new Error('AI响应格式错误');
    }
  }

  /**
   * 标准化参数
   */
  standardizeArguments(args, tool) {
    const standardized = { ...args };
    
    // 确保context字段存在
    if (!standardized.context) {
      standardized.context = [];
    }
    
    // 根据工具类型处理参数
    switch (tool) {
      case 'get_daily_horoscope':
      case 'get_weekly_horoscope':
      case 'get_monthly_horoscope':
      case 'get_yearly_horoscope':
        if (!standardized.zodiac || standardized.zodiac === 'unknown' || !standardized.zodiac.trim()) {
          standardized.zodiac = 'unknown'; // 标记为未知，触发询问
        }
        if (!standardized.category) {
          standardized.category = 'general';
        }
        if (!standardized.timeRange) {
          standardized.timeRange = tool.split('_')[1]; // daily, weekly, monthly, yearly
        }
        standardized.source = 'ai_enhanced';
        break;
        
      case 'get_compatibility':
        if (!standardized.zodiac1 || standardized.zodiac1 === 'unknown' || !standardized.zodiac1.trim() ||
            !standardized.zodiac2 || standardized.zodiac2 === 'unknown' || !standardized.zodiac2.trim()) {
          standardized.zodiac1 = 'unknown';
          standardized.zodiac2 = 'unknown';
        }
        break;
        
      case 'get_zodiac_by_date':
        if (!standardized.month || !standardized.day) {
          throw new Error('日期查询需要月份和日期参数');
        }
        break;
    }
    
    return standardized;
  }

  /**
   * 获取上下文
   */
  getContext(sessionId) {
    if (!sessionId) return null;
    
    const context = this.contexts.get(sessionId);
    return context ? context.conversation : null;
  }

  /**
   * 更新上下文
   */
  updateContext(sessionId, question, result) {
    if (!sessionId) {
      console.log('⚠️ 没有提供sessionId，跳过上下文更新');
      return;
    }
    
    const context = this.contexts.get(sessionId) || {
      id: sessionId,
      conversation: [],
      tools: [],
      lastUsed: Date.now(),
      userZodiac: null,
      userZodiacDate: null
    };
    
    // 如果结果中有提取的星座信息，保存到上下文
    if (result.extractedZodiac) {
      context.userZodiac = result.extractedZodiac;
      console.log(`🌟 保存提取的星座信息到上下文: ${result.extractedZodiac} (会话: ${sessionId})`);
    }
    
    // 添加到对话历史
    context.conversation.push({
      question,
      result,
      timestamp: new Date().toISOString()
    });
    
    // 记录使用的工具
    if (!context.tools.includes(result.tool)) {
      context.tools.push(result.tool);
    }
    
    // 更新最后使用时间
    context.lastUsed = Date.now();
    
    // 保持上下文大小
    if (context.conversation.length > 10) {
      context.conversation = context.conversation.slice(-10);
    }
    
    this.contexts.set(sessionId, context);
    console.log(`📝 上下文已更新，当前会话: ${sessionId}, 星座: ${context.userZodiac}`);
  }

  /**
   * 清理过期上下文
   */
  cleanupContexts() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24小时
    
    for (const [sessionId, context] of this.contexts.entries()) {
      if (now - context.lastUsed > maxAge) {
        this.contexts.delete(sessionId);
        console.log(`🧹 清理过期上下文: ${sessionId}`);
      }
    }
  }

  /**
   * 获取服务状态
   */
  getStatus() {
    return {
      aiEnabled: !!this.openrouterApiKey,
      model: this.openrouterModel,
      availableTools: this.availableTools.length,
      activeContexts: this.contexts.size,
      timeout: this.timeout,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 检查星座信息是否缺失
   */
  isZodiacMissing(parsedResult) {
    const { tool, arguments: args } = parsedResult;
    
    console.log('🔍 isZodiacMissing 检查:', {
      tool,
      args,
      zodiac: args.zodiac,
      zodiac1: args.zodiac1,
      zodiac2: args.zodiac2
    });
    
    // 对于需要星座的工具，检查星座信息
    if (['get_daily_horoscope', 'get_weekly_horoscope', 'get_monthly_horoscope', 'get_yearly_horoscope'].includes(tool)) {
      const isMissing = !args.zodiac || args.zodiac === 'unknown' || !args.zodiac || !args.zodiac.trim();
      console.log('🔍 单个星座检查:', { isMissing, zodiac: args.zodiac });
      return isMissing;
    }
    
    // 对于配对分析，检查两个星座
    if (tool === 'get_compatibility') {
      const isMissing = (!args.zodiac1 || args.zodiac1 === 'unknown' || !args.zodiac1.trim() ||
                        !args.zodiac2 || args.zodiac2 === 'unknown' || !args.zodiac2.trim());
      console.log('🔍 配对星座检查:', { isMissing, zodiac1: args.zodiac1, zodiac2: args.zodiac2 });
      return isMissing;
    }
    
    console.log('🔍 不需要检查星座');
    return false;
  }

  /**
   * 生成星座询问消息
   */
  generateZodiacQuestion(parsedResult, originalQuestion, sessionId) {
    const { tool, arguments: args } = parsedResult;
    
    let question = '';
    let followUpQuestions = [];
    
    if (tool === 'get_daily_horoscope' || 
        tool === 'get_weekly_horoscope' || 
        tool === 'get_monthly_horoscope' || 
        tool === 'get_yearly_horoscope') {
      
      // 检查用户是否表示不知道星座
      if (originalQuestion.includes('不知道') || originalQuestion.includes('不清楚') || originalQuestion.includes('不确定')) {
        question = '没关系！您可以告诉我您的出生日期，我来帮您查询对应的星座。';
        followUpQuestions = [
          '例如：1995年5月15日',
          '或者：1995-05-15',
          '也可以只告诉我月份和日期，比如：5月15日'
        ];
      } else {
        question = '请问您的星座是什么？';
        
        // 如果用户提供了日期，可以尝试推断星座
        const dateInfo = this.extractDateAndZodiac(originalQuestion);
        if (dateInfo) {
          question = `根据您提到的日期，您的星座可能是${dateInfo.zodiac}，对吗？如果不对，请告诉我您的实际星座。`;
        }
        
        followUpQuestions = [
          '白羊座 (3月21日-4月19日)',
          '金牛座 (4月20日-5月20日)', 
          '双子座 (5月21日-6月21日)',
          '巨蟹座 (6月22日-7月22日)',
          '狮子座 (7月23日-8月22日)',
          '处女座 (8月23日-9月22日)',
          '天秤座 (9月23日-10月23日)',
          '天蝎座 (10月24日-11月22日)',
          '射手座 (11月23日-12月21日)',
          '摩羯座 (12月22日-1月19日)',
          '水瓶座 (1月20日-2月18日)',
          '双鱼座 (2月19日-3月20日)'
        ];
      }
      
    } else if (tool === 'get_compatibility') {
      question = '请告诉我您和对方的星座，我可以为您分析配对情况。';
      followUpQuestions = [
        '例如：狮子座和白羊座',
        '或者：金牛座+处女座',
        '也可以告诉我出生日期，我来帮您判断星座'
      ];
    }
    
    return {
      ...parsedResult,
      tool: 'ask_zodiac',
      arguments: {
        originalQuestion,
        question,
        followUpQuestions,
        context: args.context || [],
        source: 'ai_enhanced',
        sessionId,
        dateInfo: this.extractDateAndZodiac(originalQuestion) // 添加日期信息
      },
      confidence: 0.95,
      reasoning: '需要星座信息才能继续分析',
      context: `询问用户星座信息: ${question}`,
      isZodiacQuestion: true
    };
  }

  /**
   * 根据日期获取星座
   */
  getZodiacByDate(month, day) {
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return '白羊座';
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return '金牛座';
    if ((month === 5 && day >= 21) || (month === 6 && day <= 21)) return '双子座';
    if ((month === 6 && day >= 22) || (month === 7 && day <= 22)) return '巨蟹座';
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return '狮子座';
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return '处女座';
    if ((month === 9 && day >= 23) || (month === 10 && day <= 23)) return '天秤座';
    if ((month === 10 && day >= 24) || (month === 11 && day <= 22)) return '天蝎座';
    if ((month === 11 && day >= 23) || (month === 12 && day <= 21)) return '射手座';
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return '摩羯座';
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return '水瓶座';
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return '双鱼座';
    return null;
  }

  /**
   * 从用户输入中提取日期并推断星座
   */
  extractDateAndZodiac(question) {
    // 匹配各种日期格式
    const datePatterns = [
      /(\d{4})[年\-./](\d{1,2})[月\-./](\d{1,2})/, // 1995年5月15日、1995-05-15、1995.5.15
      /(\d{1,2})[月\-./](\d{1,2})[日]?/, // 5月15日、5-15、5.15
      /(\d{1,2})\/(\d{1,2})/, // 5/15
      /(\d{1,2})-(\d{1,2})/ // 5-15
    ];

    for (const pattern of datePatterns) {
      const match = question.match(pattern);
      if (match) {
        let year, month, day;
        
        if (match.length === 4) { // 完整日期格式
          year = parseInt(match[1]);
          month = parseInt(match[2]);
          day = parseInt(match[3]);
        } else if (match.length === 3) { // 月日格式
          month = parseInt(match[1]);
          day = parseInt(match[2]);
          year = new Date().getFullYear(); // 默认使用当前年份
        }

        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          const zodiac = this.getZodiacByDate(month, day);
          if (zodiac) {
            return {
              zodiac,
              date: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
              confidence: 0.9
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * 更新用户星座信息到上下文
   */
  updateUserZodiac(sessionId, zodiac, date = null) {
    if (!sessionId) return;
    
    const context = this.contexts.get(sessionId) || {
      id: sessionId,
      conversation: [],
      tools: [],
      lastUsed: Date.now(),
      userZodiac: null,
      userZodiacDate: null
    };
    
    context.userZodiac = zodiac;
    context.userZodiacDate = date;
    context.lastUsed = Date.now();
    
    this.contexts.set(sessionId, context);
    console.log(`🌟 已保存用户星座信息: ${zodiac} (会话: ${sessionId})`);
  }

  /**
   * 从上下文获取用户星座信息
   */
  getUserZodiac(sessionId) {
    if (!sessionId) {
      console.log('⚠️ 没有提供sessionId，无法获取用户星座');
      return null;
    }
    
    const context = this.contexts.get(sessionId);
    const zodiac = context ? context.userZodiac : null;
    console.log(`🔍 获取用户星座: ${zodiac} (会话: ${sessionId})`);
    return zodiac;
  }
}

// 创建单例实例
const aiParser = new AIEnhancedParser();

// 定期清理上下文
setInterval(() => {
  aiParser.cleanupContexts();
}, 60 * 60 * 1000); // 每小时清理一次

module.exports = aiParser;