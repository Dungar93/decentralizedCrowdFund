import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateCampaign() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    goalAmount: "",
    patientAddress: "",
    hospitalAddress: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    alert("Campaign creation feature coming in Phase 3!");
    // TODO: Implement campaign creation API
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Create Medical Crowdfunding Campaign
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Campaign Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Urgent heart surgery for 12-year-old"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description & Medical Need
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={6}
              placeholder="Detailed story of medical need..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              required
            ></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Patient Ethereum Address
              </label>
              <input
                type="text"
                name="patientAddress"
                value={formData.patientAddress}
                onChange={handleChange}
                placeholder="0x..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Hospital Ethereum Address
              </label>
              <input
                type="text"
                name="hospitalAddress"
                value={formData.hospitalAddress}
                onChange={handleChange}
                placeholder="0x..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Goal Amount (ETH)
            </label>
            <input
              type="text"
              name="goalAmount"
              value={formData.goalAmount}
              onChange={handleChange}
              placeholder="2.5"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              required
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              📄 Document upload and AI verification coming in Phase 3!
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-gradient-to-r from-purple-600 to-purple-900 text-white font-semibold rounded-lg hover:shadow-lg transition"
            >
              Create Campaign
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
