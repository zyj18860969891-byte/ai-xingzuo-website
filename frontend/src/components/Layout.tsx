import React from 'react'

interface LayoutProps {
  children?: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh' }}>
      {children}
    </div>
  )
}

export default Layout