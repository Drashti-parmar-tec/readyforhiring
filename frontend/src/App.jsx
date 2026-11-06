
import { useEffect, useState } from 'react'
import {
  discoverCareers,
  startInterview,
  submitInterviewAnswer,
  getInterviewFeedback,
} from './lib/api'

const navigation = [
  { name: 'Dashboard', icon: '▦' },
  { name: 'Career Discovery', icon: '◎' },
  { name: 'AI Interview', icon: '◉' },
  { name: 'Resume Analysis', icon: '▤' },
  { name: 'AI Career Assistant', icon: '✧' },
]

function App() {
  const [activePage, setActivePage] = useState('Dashboard')
  const [theme, setTheme] = useState(
    () => localStorage.getItem('rfh-theme') || 'light'
  )
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Career Discovery state
  const [interests, setInterests] = useState('')
  const [skills, setSkills] = useState('')
  const [recommendations, setRecommendations] = useState([])
  const [careerLoading, setCareerLoading] = useState(false)
  const [careerError, setCareerError] = useState('')

  // Interview state
  const [interviewStage, setInterviewStage] = useState('setup')
  const [role, setRole] = useState('')
  const [interviewId, setInterviewId] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [answer, setAnswer] = useState('')
  const [questionNumber, setQuestionNumber] = useState(1)
  const [interviewLoading, setInterviewLoading] = useState(false)
  const [interviewError, setInterviewError] = useState('')
  const [feedback, setFeedback] = useState(null)

  const isDark = theme === 'dark'

  useEffect(() => {
    localStorage.setItem('rfh-theme', theme)
  }, [theme])

  const pageClass = isDark
    ? 'bg-slate-950 text-slate-100'
    : 'bg-slate-50 text-slate-900'

  const cardClass = isDark
    ? 'bg-slate-900 border-slate-800'
    : 'bg-white border-slate-200'

  const mutedText = isDark ? 'text-slate-400' : 'text-slate-500'

  const inputClass = `mt-2 w-full rounded-xl border px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
    isDark
      ? 'border-slate-700 bg-slate-950 text-white placeholder:text-slate-500'
      : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'
  }`

  async function handleCareerDiscovery(event) {
    event.preventDefault()

    const interestList = interests
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    const skillList = skills
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    if (interestList.length === 0 && skillList.length === 0) {
      setCareerError('Please enter at least one interest or skill.')
      return
    }

    setCareerLoading(true)
    setCareerError('')
    setRecommendations([])

    try {
      const result = await discoverCareers({
        interests: interestList,
        skills: skillList,
      })

      setRecommendations(result.recommendations || [])
    } catch (err) {
      setCareerError(err.message || 'Career discovery failed. Please try again.')
    } finally {
      setCareerLoading(false)
    }
  }

  function resetInterview() {
    setInterviewStage('setup')
    setInterviewId(null)
    setCurrentQuestion(null)
    setAnswer('')
    setQuestionNumber(1)
    setInterviewError('')
    setFeedback(null)
    setInterviewLoading(false)
  }

  async function handleStartInterview(event) {
    event.preventDefault()

    if (!role.trim()) {
      setInterviewError('Please enter the job role you want to practise for.')
      return
    }

    setInterviewLoading(true)
    setInterviewError('')

    try {
      const result = await startInterview(role.trim())

      setInterviewId(result.interview_id)
      setCurrentQuestion(result.question)
      setQuestionNumber(result.question.question_number || 1)
      setAnswer('')
      setInterviewStage('active')
    } catch (err) {
      setInterviewError(err.message || 'Could not start the interview.')
    } finally {
      setInterviewLoading(false)
    }
  }

  async function handleSubmitAnswer(event) {
    event.preventDefault()

    if (!answer.trim()) {
      setInterviewError('Please enter your answer before continuing.')
      return
    }

    if (!interviewId) {
      setInterviewError('Interview session not found. Please start again.')
      return
    }

    setInterviewLoading(true)
    setInterviewError('')

    try {
      const result = await submitInterviewAnswer({
        interviewId,
        answer: answer.trim(),
      })

      setAnswer('')

      if (result.is_completed) {
        setInterviewStage('feedback')
        const feedbackResult = await getInterviewFeedback(interviewId)
        setFeedback(feedbackResult)
        setInterviewStage('completed')
      } else {
        setCurrentQuestion(result.next_question)
        setQuestionNumber(result.next_question.question_number)
      }
    } catch (err) {
      setInterviewError(
        err.message || 'Could not submit your answer. Please try again.'
      )
    } finally {
      setInterviewLoading(false)
    }
  }

  // Full-screen interview experience
  if (activePage === 'AI Interview') {
    return (
      <div className={`min-h-screen ${pageClass}`}>
        <header className={`flex h-16 items-center justify-between border-b px-5 sm:px-8 ${
          isDark
            ? 'border-slate-800 bg-slate-900'
            : 'border-slate-200 bg-white'
        }`}>
          <button
            onClick={() => {
              resetInterview()
              setActivePage('Dashboard')
            }}
            className="flex items-center gap-3"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">
              R
            </span>
            <span className="font-bold">ReadyForHiring</span>
          </button>

          <button
            onClick={() => {
              resetInterview()
              setActivePage('Dashboard')
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              isDark
                ? 'text-slate-300 hover:bg-slate-800'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            ✕ Exit Interview
          </button>
        </header>

        <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8">

          {/* Interview setup */}
          {interviewStage === 'setup' && (
            <section className={`mx-auto max-w-2xl rounded-3xl border p-7 shadow-sm sm:p-10 ${cardClass}`}>
              <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-2xl text-blue-700">
                ◉
              </div>

              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                AI Interview Studio
              </p>

              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Practice like it's the real thing.
              </h1>

              <p className={`mt-4 leading-7 ${mutedText}`}>
                Prepare for your next opportunity with an AI-powered mock
                interview. Answer six questions and receive personalized
                feedback on your performance.
              </p>

              <div className="my-8 grid grid-cols-3 gap-3">
                {[
                  { value: '06', label: 'Questions' },
                  { value: 'AI', label: 'Interviewer' },
                  { value: '01', label: 'Feedback report' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-xl p-4 text-center ${
                      isDark ? 'bg-slate-800' : 'bg-slate-50'
                    }`}
                  >
                    <p className="text-xl font-bold">{item.value}</p>
                    <p className={`mt-1 text-xs ${mutedText}`}>
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleStartInterview}>
                <label htmlFor="interview-role" className="text-sm font-semibold">
                  Which job role are you preparing for?
                </label>

                <input
                  id="interview-role"
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  placeholder="Example: Software Developer"
                  maxLength={100}
                  className={inputClass}
                />

                <p className={`mt-2 text-xs ${mutedText}`}>
                  Your questions will be tailored to this role.
                </p>

                {interviewError && (
                  <div
                    role="alert"
                    className="mt-5 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700"
                  >
                    {interviewError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={interviewLoading}
                  className="mt-7 w-full rounded-xl bg-blue-600 px-6 py-4 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {interviewLoading
                    ? 'Preparing your interview...'
                    : 'Start Text Interview →'}
                </button>
              </form>

              <p className={`mt-5 text-center text-xs ${mutedText}`}>
                Text interview mode · Camera and voice mode coming later
              </p>
            </section>
          )}

          {/* Active interview */}
          {interviewStage === 'active' && currentQuestion && (
            <section>
              <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className={`text-sm ${mutedText}`}>MOCK INTERVIEW</p>
                  <h1 className="mt-1 text-2xl font-bold">
                    {role}
                  </h1>
                </div>

                <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                  Question {questionNumber} of 6
                </span>
              </div>

              <div className="mb-8 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{ width: `${(questionNumber / 6) * 100}%` }}
                />
              </div>

              <div className={`rounded-3xl border p-6 shadow-sm sm:p-9 ${cardClass}`}>
                <div className="mb-8 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-2xl text-blue-700">
                    ◉
                  </div>

                  <div>
                    <p className="font-semibold">Your AI Interviewer</p>
                    <p className={`mt-1 text-xs ${mutedText}`}>
                      Interview question · {currentQuestion.question_type}
                    </p>
                  </div>
                </div>

                <p className={`mb-3 text-xs font-semibold uppercase tracking-wider ${mutedText}`}>
                  Your question
                </p>

                <h2 className="text-xl font-semibold leading-relaxed sm:text-2xl">
                  {currentQuestion.question}
                </h2>

                <form onSubmit={handleSubmitAnswer} className="mt-9">
                  <label htmlFor="interview-answer" className="text-sm font-semibold">
                    Your answer
                  </label>

                  <textarea
                    id="interview-answer"
                    rows={8}
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    placeholder="Take your time. Explain your thoughts clearly and give examples where possible..."
                    className={inputClass}
                    disabled={interviewLoading}
                  />

                  <div className="mt-5 flex flex-col-reverse justify-between gap-3 sm:flex-row sm:items-center">
                    <p className={`text-xs ${mutedText}`}>
                      Your answer will be saved when submitted.
                    </p>

                    <button
                      type="submit"
                      disabled={interviewLoading || !answer.trim()}
                      className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {interviewLoading
                        ? 'Processing...'
                        : questionNumber === 6
                          ? 'Finish Interview →'
                          : 'Submit Answer →'}
                    </button>
                  </div>

                  {interviewError && (
                    <div
                      role="alert"
                      className="mt-5 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700"
                    >
                      {interviewError}
                    </div>
                  )}
                </form>
              </div>

              <p className={`mt-6 text-center text-xs ${mutedText}`}>
                Question {questionNumber} of 6 · Your progress is saved after
                each successful submission.
              </p>
            </section>
          )}

          {/* Feedback loading */}
          {interviewStage === 'feedback' && (
            <section className={`rounded-3xl border p-10 text-center ${cardClass}`}>
              <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
              <h1 className="text-2xl font-bold">
                Analyzing your interview
              </h1>
              <p className={`mt-3 ${mutedText}`}>
                Your AI interviewer is preparing your performance report.
              </p>
            </section>
          )}

          {/* Completed interview feedback */}
          {interviewStage === 'completed' && feedback && (
            <section>
              <div className="mb-8 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">
                  ✓
                </div>

                <p className="text-sm font-semibold uppercase tracking-wider text-green-600">
                  Interview completed
                </p>

                <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
                  Your performance report
                </h1>

                <p className={`mt-3 ${mutedText}`}>
                  Review your results and identify where you can improve.
                </p>
              </div>

              <div className={`mb-6 rounded-3xl border p-8 text-center shadow-sm ${cardClass}`}>
                <p className={`text-sm font-medium ${mutedText}`}>
                  Overall interview score
                </p>

                <p className="mt-3 text-6xl font-bold text-blue-600">
                  {feedback.overall_score}
                  <span className="text-2xl text-slate-400">/100</span>
                </p>

                <p className={`mt-3 text-sm ${mutedText}`}>
                  Your performance across six interview questions.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className={`rounded-2xl border p-6 ${cardClass}`}>
                  <h2 className="mb-5 font-bold text-green-600">
                    Your strengths
                  </h2>

                  <ul className="space-y-3">
                    {feedback.strengths?.map((item, index) => (
                      <li key={index} className={`text-sm leading-6 ${mutedText}`}>
                        ✓ {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={`rounded-2xl border p-6 ${cardClass}`}>
                  <h2 className="mb-5 font-bold text-orange-500">
                    Areas to improve
                  </h2>

                  <ul className="space-y-3">
                    {feedback.improvements?.map((item, index) => (
                      <li key={index} className={`text-sm leading-6 ${mutedText}`}>
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className={`mt-6 rounded-2xl border p-6 ${cardClass}`}>
                <h2 className="mb-3 font-bold">AI Interview Summary</h2>
                <p className={`text-sm leading-7 ${mutedText}`}>
                  {feedback.summary}
                </p>
              </div>

              <button
                onClick={resetInterview}
                className="mt-8 w-full rounded-xl bg-blue-600 px-6 py-4 font-semibold text-white hover:bg-blue-700"
              >
                Start Another Interview →
              </button>
            </section>
          )}

          {/* Unexpected missing data */}
          {interviewStage === 'active' && !currentQuestion && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-5 text-sm text-red-700">
              Interview question could not be loaded. Please exit and start again.
            </div>
          )}
        </main>
      </div>
    )
  }

  // Main application
  return (
    <div className={`min-h-screen ${pageClass}`}>
      <div className="flex min-h-screen">
        {sidebarOpen && (
          <button
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r p-5 transition-transform lg:static lg:translate-x-0 ${
            isDark
              ? 'border-slate-800 bg-slate-900'
              : 'border-slate-200 bg-white'
          } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
              R
            </div>

            <div>
              <h1 className="text-lg font-bold">ReadyForHiring</h1>
              <p className={`text-xs ${mutedText}`}>Your career companion</p>
            </div>
          </div>

          <p className={`mb-3 text-xs font-semibold uppercase tracking-wider ${mutedText}`}>
            Workspace
          </p>

          <nav className="flex-1 space-y-2">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  setActivePage(item.name)
                  setSidebarOpen(false)
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                  activePage === item.name
                    ? 'bg-blue-600 text-white'
                    : isDark
                      ? 'text-slate-300 hover:bg-slate-800'
                      : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.name}
              </button>
            ))}
          </nav>

          <button
            onClick={() => {
              setActivePage('Settings')
              setSidebarOpen(false)
            }}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
              activePage === 'Settings'
                ? 'bg-blue-600 text-white'
                : isDark
                  ? 'text-slate-300 hover:bg-slate-800'
                  : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="text-lg">⚙</span>
            Settings
          </button>

          <div className={`mt-5 border-t pt-5 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <p className="text-sm font-semibold">ReadyForHiring</p>
            <p className={`mt-1 text-xs ${mutedText}`}>
              Career growth starts here.
            </p>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className={`flex h-20 items-center justify-between border-b px-5 sm:px-8 ${
            isDark
              ? 'border-slate-800 bg-slate-900'
              : 'border-slate-200 bg-white'
          }`}>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-lg p-2 text-xl lg:hidden"
                aria-label="Open navigation"
              >
                ☰
              </button>

              <div>
                <h2 className="font-semibold">{activePage}</h2>
                <p className={`hidden text-xs sm:block ${mutedText}`}>
                  Your personal career workspace
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`hidden text-sm sm:block ${mutedText}`}>
                Welcome back!
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                U
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-7xl p-5 sm:p-8">

            {/* Dashboard */}
            {activePage === 'Dashboard' && (
              <>
                <section className="mb-8">
                  <p className={`mb-2 text-sm font-medium ${mutedText}`}>
                    YOUR CAREER JOURNEY
                  </p>

                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    Welcome to ReadyForHiring
                  </h1>

                  <p className={`mt-3 max-w-2xl ${mutedText}`}>
                    Discover career opportunities, practice interviews,
                    improve your resume, and build your career with AI.
                  </p>
                </section>

                <section className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: 'Career Matches', value: '—', icon: '◎' },
                    { label: 'Interviews Completed', value: '—', icon: '◉' },
                    { label: 'Resume Score', value: '—', icon: '▤' },
                    { label: 'Career Progress', value: '—', icon: '↗' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`rounded-2xl border p-6 shadow-sm ${cardClass}`}
                    >
                      <div className="mb-5 flex items-center justify-between">
                        <p className={`text-sm ${mutedText}`}>{item.label}</p>
                        <span className="text-xl text-blue-600">{item.icon}</span>
                      </div>
                      <p className="text-3xl font-bold">{item.value}</p>
                      <p className={`mt-2 text-xs ${mutedText}`}>No data yet</p>
                    </div>
                  ))}
                </section>

                <section className="grid gap-6 lg:grid-cols-2">
                  <div className={`rounded-2xl border p-6 shadow-sm ${cardClass}`}>
                    <h3 className="text-lg font-semibold">Start exploring</h3>
                    <p className={`mt-2 text-sm ${mutedText}`}>
                      Find career paths that match your interests and skills.
                    </p>
                    <button
                      onClick={() => setActivePage('Career Discovery')}
                      className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Discover Careers →
                    </button>
                  </div>

                  <div className={`rounded-2xl border p-6 shadow-sm ${cardClass}`}>
                    <h3 className="text-lg font-semibold">
                      Prepare for interviews
                    </h3>
                    <p className={`mt-2 text-sm ${mutedText}`}>
                      Practice answering interview questions with AI.
                    </p>
                    <button
                      onClick={() => {
                        resetInterview()
                        setActivePage('AI Interview')
                      }}
                      className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Start Practicing →
                    </button>
                  </div>
                </section>
              </>
            )}

            {/* Career Discovery */}
            {activePage === 'Career Discovery' && (
              <>
                <section className="mb-8">
                  <p className={`mb-2 text-sm font-medium ${mutedText}`}>
                    FIND YOUR DIRECTION
                  </p>

                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    Discover Your Career Path
                  </h1>

                  <p className={`mt-3 max-w-2xl ${mutedText}`}>
                    Tell us about your interests and skills. Our AI will
                    recommend career paths that may suit you.
                  </p>
                </section>

                <section className={`max-w-3xl rounded-2xl border p-6 shadow-sm sm:p-8 ${cardClass}`}>
                  <form onSubmit={handleCareerDiscovery}>
                    <div className="mb-6">
                      <label htmlFor="interests" className="block text-sm font-semibold">
                        Your interests
                      </label>
                      <p className={`mt-1 text-xs ${mutedText}`}>
                        Separate multiple interests with commas.
                      </p>
                      <textarea
                        id="interests"
                        rows={3}
                        value={interests}
                        onChange={(event) => setInterests(event.target.value)}
                        placeholder="Example: technology, problem solving, design"
                        className={inputClass}
                      />
                    </div>

                    <div className="mb-6">
                      <label htmlFor="skills" className="block text-sm font-semibold">
                        Your skills
                      </label>
                      <p className={`mt-1 text-xs ${mutedText}`}>
                        Include technical and non-technical skills.
                      </p>
                      <textarea
                        id="skills"
                        rows={3}
                        value={skills}
                        onChange={(event) => setSkills(event.target.value)}
                        placeholder="Example: Python, communication, Excel"
                        className={inputClass}
                      />
                    </div>

                    {careerError && (
                      <div role="alert" className="mb-5 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
                        {careerError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={careerLoading}
                      className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60 sm:w-auto"
                    >
                      {careerLoading ? 'Finding your career matches...' : 'Discover Careers →'}
                    </button>
                  </form>
                </section>

                {careerLoading && (
                  <div className={`mt-8 rounded-2xl border p-8 text-center ${cardClass}`}>
                    <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
                    <p className="font-semibold">Analyzing your profile</p>
                    <p className={`mt-2 text-sm ${mutedText}`}>
                      Our AI is finding career paths based on your input.
                    </p>
                  </div>
                )}

                {!careerLoading && recommendations.length > 0 && (
                  <section className="mt-10">
                    <h2 className="mb-6 text-2xl font-bold">
                      Your Career Recommendations
                    </h2>

                    <div className="space-y-6">
                      {recommendations.map((career, index) => (
                        <article key={`${career.career_id}-${index}`} className={`rounded-2xl border p-6 shadow-sm ${cardClass}`}>
                          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <p className={`text-xs font-semibold uppercase tracking-wider ${mutedText}`}>
                                Career match {index + 1}
                              </p>
                              <h3 className="mt-2 text-xl font-bold">
                                {career.career_id
                                  .split('_')
                                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                  .join(' ')}
                              </h3>
                            </div>

                            <div className="rounded-xl bg-blue-50 px-4 py-3 text-center text-blue-700">
                              <p className="text-2xl font-bold">{career.match_score}%</p>
                              <p className="text-xs font-medium">Match score</p>
                            </div>
                          </div>

                          <p className={`mb-6 text-sm leading-6 ${mutedText}`}>
                            {career.reason}
                          </p>

                          <div className="grid gap-6 md:grid-cols-2">
                            <div>
                              <h4 className="mb-3 text-sm font-semibold text-green-600">
                                Matching skills
                              </h4>
                              <ul className="space-y-2">
                                {(career.matching_skills || []).map((skill, i) => (
                                  <li key={i} className={`text-sm ${mutedText}`}>✓ {skill}</li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <h4 className="mb-3 text-sm font-semibold text-orange-500">
                                Skills to develop
                              </h4>
                              <ul className="space-y-2">
                                {(career.skill_gaps || []).map((skill, i) => (
                                  <li key={i} className={`text-sm ${mutedText}`}>• {skill}</li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <div className={`mt-6 border-t pt-5 ${
                            isDark ? 'border-slate-800' : 'border-slate-200'
                          }`}>
                            <h4 className="mb-3 text-sm font-semibold">
                              Recommended next steps
                            </h4>
                            <ol className="space-y-2">
                              {(career.next_steps || []).map((step, i) => (
                                <li key={i} className={`text-sm ${mutedText}`}>
                                  {i + 1}. {step}
                                </li>
                              ))}
                            </ol>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}

            {/* Settings */}
            {activePage === 'Settings' && (
              <section className={`max-w-2xl rounded-2xl border p-6 shadow-sm ${cardClass}`}>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className={`mt-2 text-sm ${mutedText}`}>
                  Customize your ReadyForHiring experience.
                </p>

                <div className={`mt-8 border-t pt-6 ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
                }`}>
                  <h2 className="font-semibold">Appearance</h2>
                  <p className={`mt-1 text-sm ${mutedText}`}>
                    Choose your preferred application theme.
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <button
                      onClick={() => setTheme('light')}
                      className={`rounded-xl border p-4 text-left ${
                        !isDark
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-700'
                      }`}
                    >
                      <span className="block text-lg">☀</span>
                      <span className="mt-2 block font-semibold">Light</span>
                      <span className="mt-1 block text-xs">Default appearance</span>
                    </button>

                    <button
                      onClick={() => setTheme('dark')}
                      className={`rounded-xl border p-4 text-left ${
                        isDark
                          ? 'border-blue-500 bg-blue-950 text-blue-200'
                          : 'border-slate-200'
                      }`}
                    >
                      <span className="block text-lg">☾</span>
                      <span className="mt-2 block font-semibold">Dark</span>
                      <span className="mt-1 block text-xs">Low-light appearance</span>
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* Other feature placeholders */}
            {activePage !== 'Dashboard' &&
              activePage !== 'Settings' &&
              activePage !== 'Career Discovery' &&
              activePage !== 'AI Interview' && (
                <section className={`rounded-2xl border p-8 ${cardClass}`}>
                  <h1 className="text-2xl font-bold">{activePage}</h1>
                  <p className={`mt-3 ${mutedText}`}>
                    This feature has not been implemented yet. We'll build
                    and connect it in a later development step.
                  </p>
                  <button
                    onClick={() => setActivePage('Dashboard')}
                    className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Back to Dashboard
                  </button>
                </section>
              )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
