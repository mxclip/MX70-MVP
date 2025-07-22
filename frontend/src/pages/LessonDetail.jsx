import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { CheckCircleIcon, XCircleIcon } from 'lucide-react'

function LessonDetail() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState(null)
  const [showQuiz, setShowQuiz] = useState(false)
  const [answers, setAnswers] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLesson()
  }, [lessonId])

  const fetchLesson = async () => {
    try {
      const lesson = await api.getLesson(lessonId)
      setLesson(lesson)
      setAnswers(new Array(lesson.quiz.questions.length).fill(null))
    } catch (error) {
      console.error('Error fetching lesson:', error)
    } finally {
      setLoading(false)
    }
  }

  const submitQuiz = async () => {
    try {
      const result = await api.completeQuiz(parseInt(lessonId), answers)
      setResult(result)
    } catch (error) {
      console.error('Error submitting quiz:', error)
    }
  }

  const handleAnswerChange = (questionIndex, answerIndex) => {
    const newAnswers = [...answers]
    newAnswers[questionIndex] = answerIndex
    setAnswers(newAnswers)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Lesson not found</h3>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <button
          onClick={() => navigate('/lessons')}
          className="text-primary-600 hover:text-primary-500 mb-4"
        >
          ← Back to Lessons
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
      </div>

      {!showQuiz ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="prose max-w-none mb-8">
            <div className="whitespace-pre-line text-gray-700">
              {lesson.content}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setShowQuiz(true)}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Take Quiz
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          {result ? (
            <div className="text-center">
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                result.passed ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {result.passed ? (
                  <CheckCircleIcon className="w-8 h-8 text-green-600" />
                ) : (
                  <XCircleIcon className="w-8 h-8 text-red-600" />
                )}
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {result.passed ? 'Congratulations!' : 'Try Again'}
              </h2>
              
              <p className="text-gray-600 mb-4">
                You scored {result.score.toFixed(1)}% ({result.correct_answers}/{result.total_questions} correct)
              </p>
              
              {result.passed ? (
                <p className="text-green-600 mb-6">
                  {result.certification_earned 
                    ? 'You earned a certification!' 
                    : 'You passed the quiz!'
                  }
                </p>
              ) : (
                <p className="text-red-600 mb-6">
                  You need 70% to pass. Review the lesson and try again.
                </p>
              )}
              
              <div className="space-x-4">
                <button
                  onClick={() => navigate('/lessons')}
                  className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Back to Lessons
                </button>
                {!result.passed && (
                  <button
                    onClick={() => {
                      setResult(null)
                      setAnswers(new Array(lesson.quiz.questions.length).fill(null))
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Retake Quiz
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Quiz</h2>
              
              <div className="space-y-6">
                {lesson.quiz.questions.map((question, questionIndex) => (
                  <div key={questionIndex} className="border-b border-gray-200 pb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {questionIndex + 1}. {question.question}
                    </h3>
                    
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <label key={optionIndex} className="flex items-center">
                          <input
                            type="radio"
                            name={`question-${questionIndex}`}
                            value={optionIndex}
                            checked={answers[questionIndex] === optionIndex}
                            onChange={() => handleAnswerChange(questionIndex, optionIndex)}
                            className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          />
                          <span className="text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end mt-8">
                <button
                  onClick={submitQuiz}
                  disabled={answers.some(answer => answer === null)}
                  className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Quiz
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default LessonDetail 