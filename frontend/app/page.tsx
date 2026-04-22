"use client";

import { useState } from "react";
import {
  withAuthenticator,
  type WithAuthenticatorProps,
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { useVendors } from "@/hooks/useVendors";
import { Vendor } from "@/types/vendor";

function Home({ signOut, user }: Readonly<WithAuthenticatorProps>) {
  const [form, setForm] = useState<Omit<Vendor, "vendorId" | "createdAt">>({
    name: "",
    category: "",
    contactEmail: "",
  });

  const { vendors, error, isLoading, create, remove } = useVendors();

  const onChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const onCreate = async (event: React.ChangeEvent<HTMLElement>) => {
    event.preventDefault();
    await create(form);
    setForm({ name: "", category: "", contactEmail: "" });
  };

  return (
    <main className="p-10 max-w-5xl mx-auto">
      <header className="flex justify-between items-center mb-8 p-4 bg-gray-100 rounded">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Vendor Tracker</h1>
          <p className="text-sm text-gray-500">
            Signed in as: {user?.signInDetails?.loginId}
          </p>
        </div>
        <button
          onClick={signOut}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
        >
          Sign Out
        </button>
      </header>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error?.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* ── Add Vendor Form ── */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Add New Vendor
          </h2>
          <form onSubmit={onCreate} className="space-y-4">
            <input
              name="name"
              className="w-full p-2 border rounded text-black focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Vendor Name"
              value={form.name}
              onChange={onChange}
              required
            />
            <input
              name="category"
              className="w-full p-2 border rounded text-black focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Category (e.g. SaaS, Hardware)"
              value={form.category}
              onChange={onChange}
              required
            />
            <input
              name="contactEmail"
              className="w-full p-2 border rounded text-black focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Contact Email"
              type="email"
              value={form.contactEmail}
              onChange={onChange}
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-500 text-white p-2 rounded hover:bg-orange-600 disabled:bg-gray-400 transition-colors"
            >
              {isLoading ? "Saving..." : "Add Vendor"}
            </button>
          </form>
        </section>

        {/* ── Vendor List ── */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Current Vendors ({vendors.length})
          </h2>
          <div className="space-y-3">
            {vendors.length === 0 ? (
              <p className="text-gray-400 italic">
                No vendors yet. Add one using the form.
              </p>
            ) : (
              vendors.map((v) => (
                <div
                  key={v.vendorId}
                  className="p-4 border rounded shadow-sm bg-white flex justify-between items-start"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{v.name}</p>
                    <p className="text-sm text-gray-500">
                      {v.category} · {v.contactEmail}
                    </p>
                  </div>
                  <button
                    onClick={() => v.vendorId && remove(v.vendorId)}
                    className="ml-4 text-sm text-red-500 hover:text-red-700 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

// Wrapping Home with withAuthenticator means any user who is not logged in
// will see Amplify's built-in login/signup screen instead of this component.
export default withAuthenticator(Home);
