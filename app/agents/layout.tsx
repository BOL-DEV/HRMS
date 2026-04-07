import React from 'react';
import AgentSidebar from '../../components/AgentSidebar';


interface Props {
  children: React.ReactNode;
}



export default function AgentLayout({ children }: Props) {



  return (
    <div>
      <main className="flex">
        <AgentSidebar />
        <div className="flex-1 min-w-0">{children}</div>
      </main>
    </div>
  );
}
