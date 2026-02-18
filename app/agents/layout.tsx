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
        {children}
      </main>
    </div>
  );
}
