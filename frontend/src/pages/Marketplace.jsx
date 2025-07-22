import React, { useState, useEffect } from 'react'
import api from '../services/api'
import { DollarSignIcon, EyeIcon, ClockIcon } from 'lucide-react'

function Marketplace() {
  const [gigs, setGigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchGigs()
  }, [])

  const fetchGigs = async () => {
    try {
      const gigs = await api.getAvailableGigs()
      setGigs(gigs)
    } catch (error) {
      setError('Failed to load gigs')
    } finally {
      setLoading(false)
    }
  }

  const claimGig = async (gigId) => {
    try {
      await api.claimGig(gigId)
      setGigs(gigs.filter(gig => gig.id !== gigId))
    } catch (error) {
      alert(error.message || 'Failed to claim gig')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Available Gigs</h1>
        <p className="text-gray-600">Find and claim video editing opportunities</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gigs.map((gig) => (
          <div key={gig.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{gig.story_type}</h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <DollarSignIcon className="w-3 h-3 mr-1" />
                ${gig.budget}
              </span>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Goals:</h4>
              <p className="text-sm text-gray-600">{gig.goals}</p>
            </div>

            {gig.raw_footage_url && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Raw Footage:</h4>
                <a 
                  href={gig.raw_footage_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary-600 hover:text-primary-500"
                >
                  View footage
                </a>
              </div>
            )}

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <div className="flex items-center">
                <ClockIcon className="w-4 h-4 mr-1" />
                Posted {new Date(gig.created_at).toLocaleDateString()}
              </div>
            </div>

            <button
              onClick={() => claimGig(gig.id)}
              className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
            >
              Claim Gig
            </button>
          </div>
        ))}
      </div>

      {gigs.length === 0 && !loading && (
        <div className="text-center py-12">
          <EyeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No gigs available</h3>
          <p className="mt-1 text-sm text-gray-500">
            Check back later for new opportunities.
          </p>
        </div>
      )}
    </div>
  )
}

export default Marketplace 