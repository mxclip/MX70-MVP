import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { BookOpenIcon, PlayIcon, CheckCircleIcon } from 'lucide-react'

function Lessons() {
  const [lessons, setLessons] = useState([])
  const [certifications, setCertifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [lessonsResponse, certificationsResponse] = await Promise.all([
        axios.get('/lessons/'),
        axios.get('/lessons/certifications/my')
      ])
      
      setLessons(lessonsResponse.data)
      setCertifications(certificationsResponse.data)
    } catch (error) {
      console.error('Error fetching lessons:', error)
    } finally {
      setLoading(false)
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
        <h1 className="text-2xl font-bold text-gray-900">Learning Center</h1>
        <p className="text-gray-600">Complete lessons to get certified and claim gigs</p>
      </div>

      {/* Certification Status */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Certifications</h2>
        {certifications.length > 0 ? (
          <div className="flex items-center text-green-600">
            <CheckCircleIcon className="w-5 h-5 mr-2" />
            <span>You have {certifications.length} certification(s). You can claim gigs!</span>
          </div>
        ) : (
          <div className="text-gray-500">
            Complete lessons and pass quizzes to earn certifications.
          </div>
        )}
      </div>

      {/* Lessons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {lessons.map((lesson) => (
          <div key={lesson.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <BookOpenIcon className="w-8 h-8 text-primary-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">{lesson.title}</h3>
              </div>
              
              <div className="text-sm text-gray-600 mb-4 line-clamp-3">
                {lesson.content.split('\n').slice(0, 3).join(' ')}...
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {lesson.quiz.questions.length} quiz questions
                </div>
                <Link
                  to={`/lessons/${lesson.id}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <PlayIcon className="w-4 h-4 mr-2" />
                  Start Lesson
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {lessons.length === 0 && (
        <div className="text-center py-12">
          <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No lessons available</h3>
          <p className="mt-1 text-sm text-gray-500">
            Lessons will be available soon.
          </p>
        </div>
      )}
    </div>
  )
}

export default Lessons 