import { FiEdit } from "react-icons/fi"

function ProfileInfo() {

    return (
      <section className="bg-white border border-gray-200 rounded-xl p-6 flex items-start justify-between">
        <div className="flex gap-4">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-2xl">
            <span role="img" aria-label="avatar">
              🙂
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold">Profile Information</h2>
            <p className="text-sm text-gray-600">
              View and edit your profile details
            </p>
            <div className="mt-4 space-y-1 text-sm text-gray-800">
              <p className="font-semibold">John Doe</p>
              <p>Finance Agent</p>
              <p>ID: AG-001</p>
              <p>john.doe@hospital.com</p>
            </div>
          </div>
        </div>

       
      </section>
    );
}

export default ProfileInfo
