import React from 'react'

const Home: React.FC = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🌟 AI星座运势网站</h1>
      <h2>欢迎来到专业的星座运势分析平台</h2>
      
      {/* 智能聊天突出显示 */}
      <div style={{ 
        marginTop: '30px', 
        padding: '24px', 
        backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '12px',
        textAlign: 'center',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
      }}>
        <h2>💬 新功能：智能聊天</h2>
        <p style={{ fontSize: '16px', marginBottom: '16px' }}>
          直接对话式星座运势查询，就像和星座专家聊天一样自然！
        </p>
        <a 
          href="/chat"
          style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '20px',
            textDecoration: 'none',
            fontSize: '16px',
            fontWeight: 'bold',
            border: '2px solid rgba(255,255,255,0.3)'
          }}
        >
          🚀 立即体验智能聊天
        </a>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>可用功能：</h3>
        <ul>
          <li>星座运势查询</li>
          <li>每日/每周/每月运势</li>
          <li>星座详情介绍</li>
          <li>AI智能分析</li>
          <li><strong>💬 智能聊天（新功能）</strong></li>
        </ul>
      </div>

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <h3>🚀 快速开始</h3>
        <p>后端服务已启动：</p>
        <ul>
          <li><a href="http://localhost:3001/health" target="_blank">后端网关健康检查</a></li>
          <li><a href="http://localhost:3001/api/v1/horoscope/signs" target="_blank">星座列表API</a></li>
        </ul>
      </div>
    </div>
  )
}

export default Home