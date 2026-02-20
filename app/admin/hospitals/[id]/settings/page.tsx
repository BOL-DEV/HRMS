"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getHospitalById } from "@/libs/hospital";

export default function HospitalSettingsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const hospital = id ? getHospitalById(id) : undefined;

  const initial = useMemo(
    () => ({
      name: hospital?.name ?? "",
      hospitalId: hospital?.hospitalId ?? "",
      email: hospital?.email ?? "",
      phone: hospital?.phone ?? "",
      address: hospital?.address ?? "",
    }),
    [hospital],
  );

  const [name, setName] = useState(initial.name);
  const [hospitalId, setHospitalId] = useState(initial.hospitalId);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone);
  const [address, setAddress] = useState(initial.address);

  useEffect(() => {
    setName(initial.name);
    setHospitalId(initial.hospitalId);
    setEmail(initial.email);
    setPhone(initial.phone);
    setAddress(initial.address);
  }, [initial]);

  const onCancel = () => {
    setName(initial.name);
    setHospitalId(initial.hospitalId);
    setEmail(initial.email);
    setPhone(initial.phone);
    setAddress(initial.address);
  };

  if (!hospital) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-xl font-bold">Hospital not found</h2>
        <p className="text-sm text-gray-600">Check the hospital id in the URL.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-xl font-bold">Hospital Information</h2>
          <p className="text-sm text-gray-600">Update hospital profile details</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-800">Hospital Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800">Hospital ID</label>
              <input
                value={hospitalId}
                onChange={(e) => setHospitalId(e.target.value)}
                className="mt-2 w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800">Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-2 w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-800">Address</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-2 w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-2 text-sm font-medium">
              Save Changes
            </button>
            <button
              onClick={onCancel}
              className="bg-white border border-gray-200 rounded-lg px-5 py-2 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
