import React, { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps): React.JSX.Element {
  return (
    <div className="h-screen w-screen bg-transparent font-sans flex flex-col overflow-hidden rounded-lg border border-default/50">
      <div
        className="flex-1 flex flex-col bg-primary overflow-hidden"
        style={{
          transform: 'scale(var(--ui-scale))',
          transformOrigin: 'top left',
          width: 'calc(100% / var(--ui-scale))',
          height: 'calc(100% / var(--ui-scale))'
        }}
      >
        {children}
      </div>
    </div>
  )
}
