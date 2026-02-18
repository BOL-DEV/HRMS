import Header from '@/components/Header';
import React from 'react'


function Page() {

    return (
        <div className="sticky w-full">
          <Header
            title="Agents"
            Subtitle="Manage agents and monitor performance"
            actions={
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium md:block hidden">
                + Add Agent
              </button>
            }
          />
        </div>
    );
}

export default Page
