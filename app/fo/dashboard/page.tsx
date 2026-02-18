import Header from "@/components/Header"


function Page() {

    return (
      <div className="sticky w-full">
        <Header
          title="Financial Office Dashboard"
          Subtitle="Monitor hospital revenue, agent performance, and transactions"
          actions={
            <select className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium md:block hidden">
              <option>Today</option>
              <option>Yesterday</option>
              <option>This Week</option>
            </select>
          }
        />
      </div>
    );
}

export default Page
