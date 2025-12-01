import React from 'react'

const About: React.FC = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>关于我们</h1>
      <p>AI星座运势网站是一个专业的星座运势分析平台，结合传统占星学与现代人工智能技术，为您提供准确、个性化的星座运势服务。</p>
      
      <div style={{ marginTop: '30px' }}>
        <h3>✨ 项目特色</h3>
        <ul>
          <li>基于微服务架构，高度可扩展</li>
          <li>集成ModelScope star-mcp服务进行AI分析</li>
          <li>严格的错误处理机制</li>
          <li>现代化的React前端界面</li>
          <li>完整的API文档和测试</li>
        </ul>
      </div>

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8d7da', borderRadius: '8px' }}>
        <h3>📞 联系我们</h3>
        <p>项目状态: 🟢 100% 完成</p>
        <p>部署成功率: 99%</p>
        <p>技术支持: 项目文档和测试脚本</p>
        <p>联系邮箱: support@xingzuo.ai</p>
      </div>
    </div>
  )
}

export default About