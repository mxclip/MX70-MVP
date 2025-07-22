import React, { useState } from 'react'
import api from '../services/api'
import { DollarSignIcon, ExternalLinkIcon, AlertCircleIcon, CheckCircleIcon } from 'lucide-react'

function SelfPromoForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    post_link: '',
    views: '',
    likes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear previous results when user starts typing
    if (result || error) {
      setResult(null)
      setError('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setResult(null)

    try {
      // Validate URL format
      try {
        new URL(formData.post_link)
      } catch {
        throw new Error('Please enter a valid URL')
      }

      // Validate numbers
      const views = parseInt(formData.views)
      const likes = parseInt(formData.likes)
      
      if (isNaN(views) || views < 0) {
        throw new Error('Views must be a valid number')
      }
      
      if (isNaN(likes) || likes < 0) {
        throw new Error('Likes must be a valid number')
      }

      const response = await api.submitSelfPromo({
        post_link: formData.post_link,
        views: views,
        likes: likes
      })

      setResult(response)
      
      if (response.credit_earned > 0) {
        setFormData({ post_link: '', views: '', likes: '' })
        if (onSuccess) onSuccess(response)
      }
      
    } catch (err) {
      setError(err.message || 'Failed to submit self-promo post')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-4">
        <DollarSignIcon className="h-5 w-5 text-green-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Submit Self-Promo Post</h3>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <AlertCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Earn $10 credit for qualifying posts!</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Minimum 300 views and 30 likes required</li>
              <li>Must include #MadeWithMX70 hashtag</li>
              <li>$15 monthly cap from self-promotion</li>
              <li>Credits expire after 6 months</li>
            </ul>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="post_link" className="block text-sm font-medium text-gray-700 mb-1">
            Post URL *
          </label>
          <div className="relative">
            <input
              type="url"
              id="post_link"
              name="post_link"
              value={formData.post_link}
              onChange={handleChange}
              placeholder="https://instagram.com/p/your-post or https://tiktok.com/@user/video/..."
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <ExternalLinkIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="views" className="block text-sm font-medium text-gray-700 mb-1">
              Views *
            </label>
            <input
              type="number"
              id="views"
              name="views"
              value={formData.views}
              onChange={handleChange}
              placeholder="e.g. 1500"
              min="0"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="likes" className="block text-sm font-medium text-gray-700 mb-1">
              Likes *
            </label>
            <input
              type="number"
              id="likes"
              name="likes"
              value={formData.likes}
              onChange={handleChange}
              placeholder="e.g. 45"
              min="0"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center">
              <AlertCircleIcon className="h-4 w-4 text-red-600 mr-2" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className={`border rounded-lg p-3 ${
            result.credit_earned > 0 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center">
              {result.credit_earned > 0 ? (
                <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
              ) : (
                <AlertCircleIcon className="h-4 w-4 text-yellow-600 mr-2" />
              )}
              <p className={`text-sm font-medium ${
                result.credit_earned > 0 ? 'text-green-800' : 'text-yellow-800'
              }`}>
                {result.credit_earned > 0 
                  ? `🎉 Success! You earned $${result.credit_earned} credit!`
                  : result.message
                }
              </p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Submitting...' : 'Submit for Credit'}
        </button>
      </form>
    </div>
  )
}

export default SelfPromoForm 