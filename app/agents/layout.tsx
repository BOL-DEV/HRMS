import React from 'react';
import AgentSidebar from '../../components/agent/AgentSidebar';


interface Props {
  children: React.ReactNode;
}



export default function AgentLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-canvas text-slate-900 dark:text-slate-100">
      <main className="flex">
        <AgentSidebar />
        <div className="flex-1 min-w-0">{children}</div>
      </main>
    </div>
  );
}
