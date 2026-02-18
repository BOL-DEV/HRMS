

function ChangePassword() {

    return (
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Change Password</h2>
            <p className="text-sm text-gray-600">
              Update your account password
            </p>
          </div>
          <button className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-800 hover:bg-gray-50">
            Update Password
          </button>
        </div>

        <p className="mt-4 text-sm text-gray-700">
          Keep your account secure by changing your password regularly
        </p>
      </section>
    );
}

export default ChangePassword
