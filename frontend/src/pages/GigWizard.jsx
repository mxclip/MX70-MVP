import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { CheckIcon } from 'lucide-react'

const STORY_TYPES = [
  'Morning Rush',
  'Lunch Special',
  'Happy Hour',
  'Closing Time',
  'Weekend Special',
  'New Product Launch',
  'Seasonal Promotion',
  'Customer Testimonial'
]

function GigWizard() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    budget: '',
    goals: '',
    story_type: '',
    raw_footage_url: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await axios.post('/gigs/post-gig', {
        ...formData,
        budget: parseFloat(formData.budget)
      })
      
      navigate('/dashboard')
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to post gig')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Post a New Gig</h1>
        <p className="text-gray-600">Create a video project for content creators</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Story Type
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {STORY_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData({...formData, story_type: type})}
                className={`relative p-3 text-sm border rounded-lg transition-all ${
                  formData.story_type === type
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {formData.story_type === type && (
                  <CheckIcon className="absolute top-1 right-1 w-4 h-4 text-primary-600" />
                )}
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
            Budget ($)
          </label>
          <input
            type="number"
            id="budget"
            min="50"
            step="0.01"
            required
            value={formData.budget}
            onChange={(e) => setFormData({...formData, budget: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="200.00"
          />
          <p className="mt-1 text-sm text-gray-500">Minimum $50. Average budget is $200.</p>
        </div>

        <div>
          <label htmlFor="goals" className="block text-sm font-medium text-gray-700">
            Goals & Expectations
          </label>
          <textarea
            id="goals"
            rows={3}
            required
            value={formData.goals}
            onChange={(e) => setFormData({...formData, goals: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="e.g., 1k views, 10% sales lift, target young professionals"
          />
        </div>

        <div>
          <label htmlFor="raw_footage_url" className="block text-sm font-medium text-gray-700">
            Raw Footage URL (Optional)
          </label>
          <input
            type="url"
            id="raw_footage_url"
            value={formData.raw_footage_url}
            onChange={(e) => setFormData({...formData, raw_footage_url: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="https://drive.google.com/..."
          />
          <p className="mt-1 text-sm text-gray-500">Upload to Google Drive, Dropbox, or similar service</p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {loading ? 'Posting...' : 'Post Gig'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default GigWizard 