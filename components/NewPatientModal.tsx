import {useState} from 'react'

interface Props {
    setShowAddPatient: (value: boolean) => void;
}

function NewPatientModal(props: Props) {
    const { setShowAddPatient } = props
    
      const [form, setForm] = useState({
        fullName: "",
        phone: "",
        gender: "Male",
        age: "",
        dob: "",
        email: "",
        address: "",
        emergencyName: "",
        emergencyPhone: "",
      });

      const handleChange = (
        key:
          | "fullName"
          | "phone"
          | "gender"
          | "age"
          | "dob"
          | "email"
          | "address"
          | "emergencyName"
          | "emergencyPhone",
        value: string,
      ) => {
        setForm((prev) => ({ ...prev, [key]: value }));
      };

    return (
       
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">Add Patient</h2>
              </div>
              <button
                onClick={() => setShowAddPatient(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-800">
                  Full Name
                </label>
                <input
                  value={form.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-800">
                  Phone Number
                </label>
                <input
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="555-0101"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-800">
                    Gender
                  </label>
                  <select
                    value={form.gender}
                    onChange={(e) => handleChange("gender", e.target.value)}
                    className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-800">
                    Age
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.age}
                    onChange={(e) => handleChange("age", e.target.value)}
                    className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-800">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) => handleChange("dob", e.target.value)}
                  className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-800">
                  Email Address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-800">
                  Address
                </label>
                <input
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="123 Main St, City, State"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-800">
                  Emergency Contact Name
                </label>
                <input
                  value={form.emergencyName}
                  onChange={(e) =>
                    handleChange("emergencyName", e.target.value)
                  }
                  className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Jane Doe"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-800">
                  Emergency Contact Phone
                </label>
                <input
                  value={form.emergencyPhone}
                  onChange={(e) =>
                    handleChange("emergencyPhone", e.target.value)
                  }
                  className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="555-0102"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowAddPatient(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="px-5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold">
                Save
              </button>
            </div>
          </div>
        </div>
    
    )
}

export default NewPatientModal
