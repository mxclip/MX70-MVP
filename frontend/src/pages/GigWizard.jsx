import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { CheckIcon, UploadIcon } from 'lucide-react'

const GOAL_OPTIONS = [
  '1k views',
  '100 likes', 
  '10 check-ins',
  '10% sales lift'
]

const STORY_TYPES = [
  'morning rush',
  'lunch specials',
  'closing',
  'unboxing',
  'try-on',
  'demo'
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
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setError('Please select a valid video file')
      return
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB')
      return
    }

    setUploading(true)
    setError('')

    try {
      const response = await api.uploadFile(file, 'raw-footage')

      setFormData({
        ...formData,
        raw_footage_url: response.url
      })
    } catch (error) {
      setError(error.message || 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await api.createGig({
        ...formData,
        budget: parseFloat(formData.budget)
      })
      
      navigate('/dashboard')
    } catch (error) {
      setError(error.message || 'Failed to post gig')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Post a New Gig</h1>
        <p className="text-gray-600">Create a video project for content creators • Earn $5 credit per gig</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Goals Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Goals & Success Metrics
          </label>
          <div className="grid grid-cols-2 gap-3">
            {GOAL_OPTIONS.map((goal) => (
              <button
                key={goal}
                type="button"
                onClick={() => setFormData({...formData, goals: goal})}
                className={`relative p-3 text-sm border rounded-lg transition-all ${
                  formData.goals === goal
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {formData.goals === goal && (
                  <CheckIcon className="absolute top-1 right-1 w-4 h-4 text-primary-600" />
                )}
                {goal}
              </button>
            ))}
          </div>
        </div>

        {/* Story Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Story Type
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {STORY_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData({...formData, story_type: type})}
                className={`relative p-3 text-sm border rounded-lg transition-all capitalize ${
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

        {/* Raw Footage Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Raw Footage (Optional)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            {formData.raw_footage_url ? (
              <div className="text-center">
                <CheckIcon className="mx-auto h-8 w-8 text-green-600 mb-2" />
                <p className="text-sm text-green-600">File uploaded successfully!</p>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, raw_footage_url: ''})}
                  className="mt-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  Upload different file
                </button>
              </div>
            ) : (
              <div className="text-center">
                <UploadIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="raw-footage" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                    <span>Upload raw footage</span>
                    <input
                      id="raw-footage"
                      name="raw-footage"
                      type="file"
                      accept="video/*"
                      className="sr-only"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">MP4, MOV up to 50MB</p>
              </div>
            )}
          </div>
          {uploading && (
            <div className="mt-2 text-sm text-blue-600">
              Uploading... Please wait.
            </div>
          )}
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
            disabled={loading || uploading || !formData.goals || !formData.story_type}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {loading ? 'Posting...' : 'Post Gig (+$5 Credit)'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default GigWizard 