import { useEffect, useRef, useState } from 'react'
import interviewerAvatar from './assets/ai-interviewer.png'

import {

  discoverCareers,

  startInterview,

  submitInterviewAnswer,

  getInterviewFeedback,

  transcribeInterviewAudio,

} from './lib/api'



const navigation = [

  { name: 'Dashboard', icon: '▦' },

  { name: 'Career Discovery', icon: '◎' },

  { name: 'AI Interview', icon: '◉' },

  { name: 'Resume Analysis', icon: '▤' },

  { name: 'AI Career Assistant', icon: '✧' },

]



// Count common spoken fillers using whole-word / whole-phrase matches.

// These are indicators, not a definitive measure of communication quality.

function analyzeFillerWords(transcripts) {

  const combinedText = transcripts.join(' ').toLowerCase()



  const patterns = [

    { label: 'Um', regex: /\bum+\b/g },

    { label: 'Uh', regex: /\buh+\b/g },

    { label: 'Er', regex: /\ber+\b/g },

    { label: 'Ah', regex: /\bah+\b/g },

    { label: 'Hmm', regex: /\bhmm+\b/g },

    { label: 'You know', regex: /\byou\s+know\b/g },

    { label: 'I mean', regex: /\bi\s+mean\b/g },

    { label: 'Basically', regex: /\bbasically\b/g },

    { label: 'Kind of', regex: /\bkind\s+of\b/g },

    { label: 'Sort of', regex: /\bsort\s+of\b/g },

  ]



  const breakdown = patterns

    .map(({ label, regex }) => ({

      label,

      count: [...combinedText.matchAll(regex)].length,

    }))

    .filter((item) => item.count > 0)



  return {

    total: breakdown.reduce((sum, item) => sum + item.count, 0),

    breakdown,

  }

}



function App() {

  const [activePage, setActivePage] = useState('Dashboard')

  const [theme, setTheme] = useState(

    () => localStorage.getItem('rfh-theme') || 'light'

  )

  const [sidebarOpen, setSidebarOpen] = useState(false)



  // Career Discovery

  const [interests, setInterests] = useState('')

  const [skills, setSkills] = useState('')

  const [recommendations, setRecommendations] = useState([])

  const [careerLoading, setCareerLoading] = useState(false)

  const [careerError, setCareerError] = useState('')



  // Interview

  const [interviewStage, setInterviewStage] = useState('setup')

  const [interviewMode, setInterviewMode] = useState('text')

  const [interviewRole, setInterviewRole] = useState('')

  const [interviewId, setInterviewId] = useState(null)

  const [question, setQuestion] = useState(null)

  const [questionNumber, setQuestionNumber] = useState(1)

  const [answer, setAnswer] = useState('')

  const [interviewLoading, setInterviewLoading] = useState(false)

  const [interviewError, setInterviewError] = useState('')

  const [feedback, setFeedback] = useState(null)

  const [voiceTranscripts, setVoiceTranscripts] = useState([])

  const [voiceRecordingDurations, setVoiceRecordingDurations] = useState([])



  // Voice Interview

  const [voiceEnabled, setVoiceEnabled] = useState(true)

  const [isInterviewerSpeaking, setIsInterviewerSpeaking] = useState(false)

  const [isRecording, setIsRecording] = useState(false)

  const [isTranscribing, setIsTranscribing] = useState(false)

  const [recordingSeconds, setRecordingSeconds] = useState(0)

  const [voiceError, setVoiceError] = useState('')



  const mediaRecorderRef = useRef(null)

  const microphoneStreamRef = useRef(null)

  const recordingChunksRef = useRef([])

  const recordingTimerRef = useRef(null)

  const recordingStartedAtRef = useRef(null)



  // Camera

  const [cameraStream, setCameraStream] = useState(null)

  const [cameraEnabled, setCameraEnabled] = useState(false)

  const [cameraError, setCameraError] = useState('')

  const videoRef = useRef(null)



  const isDark = theme === 'dark'



  useEffect(() => {

    localStorage.setItem('rfh-theme', theme)

  }, [theme])



  useEffect(() => {

    if (videoRef.current && cameraStream) {

      videoRef.current.srcObject = cameraStream

    }

  }, [cameraStream, interviewStage])



  useEffect(() => {

    return () => {

      if (cameraStream) {

        cameraStream.getTracks().forEach((track) => track.stop())

      }

    }

  }, [cameraStream])



  // Speak each new interview question aloud.

  useEffect(() => {

    if (

      interviewStage === 'active' &&

      voiceEnabled &&

      question?.question &&

      'speechSynthesis' in window

    ) {

      window.speechSynthesis.cancel()



      const utterance = new SpeechSynthesisUtterance(question.question)

      utterance.rate = 0.95
      utterance.onstart = () => setIsInterviewerSpeaking(true)
      utterance.onend = () => setIsInterviewerSpeaking(false)
      utterance.onerror = () => setIsInterviewerSpeaking(false)

      window.speechSynthesis.speak(utterance)

    }



    return () => {

      if ('speechSynthesis' in window) {

        window.speechSynthesis.cancel()

      }

    }

  }, [interviewStage, question, voiceEnabled])



  // Clean up microphone and speech when the component is removed.

  useEffect(() => {

    return () => {

      if (recordingTimerRef.current) {

        window.clearInterval(recordingTimerRef.current)

      }



      if (

        mediaRecorderRef.current &&

        mediaRecorderRef.current.state !== 'inactive'

      ) {

        mediaRecorderRef.current.onstop = null

        mediaRecorderRef.current.stop()

      }



      if (microphoneStreamRef.current) {

        microphoneStreamRef.current

          .getTracks()

          .forEach((track) => track.stop())



        microphoneStreamRef.current = null

      }



      if ('speechSynthesis' in window) {

        window.speechSynthesis.cancel()

      }

    }

  }, [])



  async function handleDiscoverCareers(event) {

    event.preventDefault()

    setCareerLoading(true)

    setCareerError('')

    setRecommendations([])



    try {

      const result = await discoverCareers({ interests, skills })

      setRecommendations(result.recommendations || [])

    } catch (error) {

      setCareerError(error.message)

    } finally {

      setCareerLoading(false)

    }

  }



  function stopVoiceRecording() {

    if (recordingTimerRef.current) {

      window.clearInterval(recordingTimerRef.current)

      recordingTimerRef.current = null

    }



    if (

      mediaRecorderRef.current &&

      mediaRecorderRef.current.state !== 'inactive'

    ) {

      mediaRecorderRef.current.stop()

    } else if (microphoneStreamRef.current) {

      microphoneStreamRef.current

        .getTracks()

        .forEach((track) => track.stop())



      microphoneStreamRef.current = null

    }



    setIsRecording(false)

  }





  async function startVoiceRecording() {

    setVoiceError('')

    setInterviewError('')



    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {

      setVoiceError(

        'Voice recording is not supported by this browser. You can type your answer instead.'

      )

      return

    }



    try {

      const stream = await navigator.mediaDevices.getUserMedia({

        audio: true,

      })



      microphoneStreamRef.current = stream



      const preferredTypes = [

        'audio/webm;codecs=opus',

        'audio/webm',

        'audio/mp4',

      ]



      const mimeType = preferredTypes.find((type) =>

        MediaRecorder.isTypeSupported(type)

      )



      const recorder = mimeType

        ? new MediaRecorder(stream, { mimeType })

        : new MediaRecorder(stream)



      recordingChunksRef.current = []



      recorder.ondataavailable = (event) => {

        if (event.data && event.data.size > 0) {

          recordingChunksRef.current.push(event.data)

        }

      }



      recorder.onerror = () => {

        setVoiceError(

          'Recording failed. Please try again or type your answer.'

        )

      }



      recorder.onstop = async () => {

        const recordingDuration = recordingStartedAtRef.current

          ? Math.max(0, (performance.now() - recordingStartedAtRef.current) / 1000)

          : 0

        recordingStartedAtRef.current = null



        const blobType = recorder.mimeType || 'audio/webm'



        const audioBlob = new Blob(recordingChunksRef.current, {

          type: blobType,

        })



        recordingChunksRef.current = []



        if (microphoneStreamRef.current) {

          microphoneStreamRef.current

            .getTracks()

            .forEach((track) => track.stop())



          microphoneStreamRef.current = null

        }



        if (!audioBlob.size) {

          setVoiceError('No audio was recorded. Please try again.')

          return

        }



        setIsTranscribing(true)

        setVoiceError('')



        try {

          const transcription =

            await transcribeInterviewAudio(audioBlob)



          setVoiceTranscripts((current) => [...current, transcription])

          setVoiceRecordingDurations((current) => [

            ...current,

            recordingDuration,

          ])



          setAnswer((current) =>

            current.trim()

              ? `${current.trim()} ${transcription}`

              : transcription

          )

        } catch (error) {

          setVoiceError(error.message)

        } finally {

          setIsTranscribing(false)

        }

      }



      mediaRecorderRef.current = recorder

      recordingStartedAtRef.current = performance.now()

      recorder.start()



      setIsRecording(true)

      setRecordingSeconds(0)



      recordingTimerRef.current = window.setInterval(() => {

        setRecordingSeconds((seconds) => seconds + 1)

      }, 1000)

    } catch {

      setVoiceError(

        'Microphone access was denied or is unavailable. Allow microphone permission, or type your answer.'

      )

    }

  }



  function finishVoiceRecording() {

    if (recordingTimerRef.current) {

      window.clearInterval(recordingTimerRef.current)

      recordingTimerRef.current = null

    }



    if (

      mediaRecorderRef.current &&

      mediaRecorderRef.current.state !== 'inactive'

    ) {

      mediaRecorderRef.current.stop()

    }



    setIsRecording(false)

  }



  function renderVoiceControls(compact = false) {

    return (

      <div className={`${compact ? "mt-2 rounded-lg p-3" : "mt-4 rounded-xl p-4"} border border-slate-700 bg-slate-800/70`}>

        <div className="flex flex-wrap items-center justify-between gap-3">

          <div>

            <p className={`${compact ? "text-xs" : "text-sm"} font-semibold text-white`}>

              Voice answer

            </p>

            <p className={`${compact ? "mt-0.5 text-[11px]" : "mt-1 text-xs"} text-slate-400`}>

              Record your answer, then review the transcript before submitting.

            </p>

          </div>



          <button

            type="button"

            onClick={() =>

              setVoiceEnabled((enabled) => !enabled)

            }

            className={`rounded-lg border border-slate-600 ${compact ? "px-2.5 py-1.5" : "px-3 py-2"} text-xs font-semibold text-slate-200 hover:bg-slate-700`}

          >

            AI voice: {voiceEnabled ? 'On' : 'Off'}

          </button>

        </div>



        <div className={`${compact ? "mt-2" : "mt-3"} flex flex-wrap items-center gap-3`}>

          {!isRecording ? (

            <button

              type="button"

              onClick={startVoiceRecording}

              disabled={isTranscribing || interviewLoading}

              className={`rounded-lg bg-red-600 ${compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"} font-semibold text-white hover:bg-red-700 disabled:opacity-50`}

            >

              {isTranscribing

                ? 'Transcribing...'

                : '● Record answer'}

            </button>

          ) : (

            <button

              type="button"

              onClick={finishVoiceRecording}

              className={`rounded-lg bg-slate-600 ${compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"} font-semibold text-white hover:bg-slate-500`}

            >

              ■ Stop recording

            </button>

          )}



          {isRecording && (

            <span className="text-sm font-semibold text-red-300">

              Recording{' '}

              {Math.floor(recordingSeconds / 60)}:

              {String(recordingSeconds % 60).padStart(2, '0')}

            </span>

          )}

        </div>



        {voiceError && (

          <p className={`${compact ? "mt-2 text-xs" : "mt-3 text-sm"} text-red-400`}>

            {voiceError}

          </p>

        )}

      </div>

    )

  }



  function resetInterview() {

    stopVoiceRecording()



    if ('speechSynthesis' in window) {

      window.speechSynthesis.cancel()

    }



    stopCamera()

    setInterviewStage('setup')

    setInterviewMode('text')

    setInterviewRole('')

    setInterviewId(null)

    setQuestion(null)

    setQuestionNumber(1)

    setAnswer('')

    setInterviewLoading(false)

    setInterviewError('')

    setFeedback(null)

    setVoiceTranscripts([])

    setVoiceRecordingDurations([])

    setVoiceError('')

    setIsTranscribing(false)

    setRecordingSeconds(0)

  }



  async function handleStartInterview(event) {

    event.preventDefault()



    if (!interviewRole.trim()) {

      setInterviewError('Please enter a job role.')

      return

    }



    setInterviewLoading(true)

    setInterviewError('')

    setVoiceTranscripts([])

    setVoiceRecordingDurations([])



    try {

      const result = await startInterview(interviewRole.trim())



      setInterviewId(result.interview_id)

      setQuestion(result.question)

      setQuestionNumber(result.question.question_number || 1)

      setInterviewStage('active')

    } catch (error) {

      setInterviewError(error.message)

    } finally {

      setInterviewLoading(false)

    }

  }



  async function startCamera() {

    setCameraError('')



    if (!navigator.mediaDevices?.getUserMedia) {

      setCameraError('Your browser does not support camera access.')

      return false

    }



    try {

      const stream = await navigator.mediaDevices.getUserMedia({

        video: true,

        audio: false,

      })



      setCameraStream(stream)

      setCameraEnabled(true)

      return true

    } catch {

      setCameraError(

        'Camera access was denied or is unavailable. Please allow camera permission in your browser.'

      )

      return false

    }

  }



  function stopCamera() {

    if (cameraStream) {

      cameraStream.getTracks().forEach((track) => track.stop())

      setCameraStream(null)

    }



    setCameraEnabled(false)



    if (videoRef.current) {

      videoRef.current.srcObject = null

    }

  }



  async function toggleCamera() {

    if (cameraEnabled) {

      stopCamera()

      return

    }



    await startCamera()

  }



  async function handleStartCameraInterview(event) {

    event.preventDefault()

    setInterviewMode('camera')



    const cameraStarted = await startCamera()



    if (!cameraStarted) {

      return

    }



    await handleStartInterview(event)

  }



  async function handleSubmitAnswer(event) {

    event.preventDefault()



    if (isRecording || isTranscribing) {

      setInterviewError(

        'Stop the recording and wait for transcription before submitting.'

      )

      return

    }



    if (!answer.trim()) {

      setInterviewError('Please enter your answer before continuing.')

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

        await loadInterviewFeedback()

      } else {

        setQuestion(result.next_question)

        setQuestionNumber(

          result.next_question?.question_number || questionNumber + 1

        )

      }

    } catch (error) {

      setInterviewError(error.message)

    } finally {

      setInterviewLoading(false)

    }

  }



  async function loadInterviewFeedback() {

    setInterviewLoading(true)

    setInterviewError('')



    try {

      const result = await getInterviewFeedback(interviewId)

      setFeedback(result)

      setInterviewStage('completed')

    } catch (error) {

      setInterviewError(error.message)

    } finally {

      setInterviewLoading(false)

    }

  }



  function exitInterview() {

    resetInterview()

    setActivePage('Dashboard')

  }



  const pageClass = isDark

    ? 'bg-slate-950 text-white'

    : 'bg-slate-50 text-slate-900'



  const cardClass = isDark

    ? 'border-slate-700 bg-slate-900'

    : 'border-slate-200 bg-white'



  const mutedTextClass = isDark

    ? 'text-slate-400'

    : 'text-slate-500'

    function renderInterviewSetup() {

    return (

      <div className="mx-auto max-w-3xl">

        <div className={`rounded-2xl border p-8 shadow-sm ${cardClass}`}>

          <div className="mb-6">

            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">

              AI Interview Practice

            </p>

            <h2 className="mt-2 text-3xl font-bold">

              Prepare for your next interview

            </h2>

            <p className={`mt-3 ${mutedTextClass}`}>

              Practice with an AI interviewer and receive feedback on your

              answers.

            </p>

          </div>



          <div className="mb-6 grid gap-4 sm:grid-cols-2">

            <button

              type="button"

              onClick={() => setInterviewMode('text')}

              className={`rounded-xl border-2 p-5 text-left transition ${

                interviewMode === 'text'

                  ? 'border-blue-600 bg-blue-50'

                  : isDark

                    ? 'border-slate-700'

                    : 'border-slate-200'

              }`}

            >

              <span className="text-2xl">⌨️</span>

              <h3 className="mt-3 font-bold">Text Interview</h3>

              <p className={`mt-1 text-sm ${mutedTextClass}`}>

                Answer questions by typing or using your microphone.

              </p>

            </button>



            <button

              type="button"

              onClick={() => setInterviewMode('camera')}

              className={`rounded-xl border-2 p-5 text-left transition ${

                interviewMode === 'camera'

                  ? 'border-blue-600 bg-blue-50'

                  : isDark

                    ? 'border-slate-700'

                    : 'border-slate-200'

              }`}

            >

              <span className="text-2xl">📹</span>

              <h3 className="mt-3 font-bold">Camera Interview</h3>

              <p className={`mt-1 text-sm ${mutedTextClass}`}>

                Practice with your camera and microphone.

              </p>

            </button>

          </div>



          <form

            onSubmit={

              interviewMode === 'camera'

                ? handleStartCameraInterview

                : handleStartInterview

            }

          >

            <label className="mb-2 block text-sm font-semibold">

              Job role

            </label>



            <input

              type="text"

              value={interviewRole}

              onChange={(event) => setInterviewRole(event.target.value)}

              placeholder="e.g. Software Developer"

              className={`w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500 ${

                isDark

                  ? 'border-slate-700 bg-slate-800 text-white'

                  : 'border-slate-300 bg-white'

              }`}

            />



            {interviewError && (

              <p className="mt-3 text-sm text-red-500">

                {interviewError}

              </p>

            )}



            {cameraError && (

              <p className="mt-3 text-sm text-red-500">

                {cameraError}

              </p>

            )}



            <button

              type="submit"

              disabled={interviewLoading}

              className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"

            >

              {interviewLoading

                ? 'Starting...'

                : interviewMode === 'camera'

                  ? 'Start Camera Interview'

                  : 'Start Text Interview'}

            </button>

          </form>

        </div>

      </div>

    )

  }



  function renderCameraWidget() {

    return (

      <div className="absolute right-4 top-20 z-10 w-28 overflow-hidden rounded-xl border-2 border-white/30 bg-slate-800 shadow-2xl sm:right-6 sm:top-20 sm:w-40">

        <div className="relative aspect-[4/3]">

          {cameraEnabled && cameraStream ? (

            <video

              ref={videoRef}

              autoPlay

              muted

              playsInline

              className="h-full w-full scale-x-[-1] object-cover"

            />

          ) : (

            <div className="flex h-full items-center justify-center bg-slate-700">

              <span className="text-2xl">📷</span>

            </div>

          )}



          <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-[10px] font-semibold text-white">

            You

          </span>

        </div>



        <button

          type="button"

          onClick={toggleCamera}

          className={`w-full py-2 text-[11px] font-semibold text-white ${

            cameraEnabled

              ? 'bg-slate-700 hover:bg-slate-600'

              : 'bg-blue-600 hover:bg-blue-700'

          }`}

        >

          {cameraEnabled ? 'Turn Camera Off' : 'Turn Camera On'}

        </button>

      </div>

    )

  }



  function renderActiveInterview() {

    return (

      <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-slate-950 text-white">
        {interviewMode === 'camera' && (
          <>
            <img
              src={interviewerAvatar}
              alt="ReadyForHiring male AI interviewer"
              className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover object-center"
            />
            <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-slate-950/45 via-slate-950/10 to-slate-950/80" />
          </>
        )}

        <header className="relative z-30 flex items-center justify-between border-b border-white/10 bg-slate-950/35 px-5 py-3 backdrop-blur-md">

          <div>

            <h1 className="text-lg font-bold">ReadyForHiring</h1>

            <p className="text-xs text-slate-400">

              {interviewRole} ·{' '}

              {interviewMode === 'camera'

                ? 'Live Interview'

                : 'Text Interview'}

            </p>

          </div>



          <div className="flex items-center gap-4">

            <span className="rounded-full bg-blue-500/20 px-4 py-2 text-xs font-semibold text-blue-200">

              Question {questionNumber} of 6

            </span>



            <button

              type="button"

              onClick={exitInterview}

              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"

            >

              Exit Interview

            </button>

          </div>

        </header>



        {interviewMode === 'camera' ? (

          <main className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="relative min-h-0 flex-1">
              <div className="absolute left-5 top-5 rounded-full border border-white/20 bg-slate-950/45 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                <span className={`mr-2 inline-block h-2 w-2 rounded-full ${isInterviewerSpeaking ? 'animate-pulse bg-emerald-400' : 'bg-slate-300'}`} />
                {isInterviewerSpeaking ? 'Interviewer speaking' : 'AI interviewer'}
              </div>
              {renderCameraWidget()}
            </div>

            <section className="relative z-20 max-h-[40vh] shrink-0 overflow-y-auto border-t border-white/15 bg-slate-950/85 px-4 py-3 shadow-[0_-16px_50px_rgba(2,6,23,0.35)] backdrop-blur-xl sm:px-6 sm:py-3">

              <div className="mx-auto max-w-4xl">

                <div className="mb-1.5 flex items-center justify-between">

                  <p className="text-xs font-bold uppercase tracking-wider text-blue-300">

                    Interview Question

                  </p>



                  <span className="text-sm text-slate-400">

                    {questionNumber} / 6

                  </span>

                </div>



                <p className="text-sm font-semibold leading-snug sm:text-base">

                  {question?.question}

                </p>



                {renderVoiceControls(true)}



                <form onSubmit={handleSubmitAnswer}>

                  <textarea

                    value={answer}

                    onChange={(event) => setAnswer(event.target.value)}

                    placeholder="Type your answer here or record your voice above..."

                    rows={2}

                    className="mt-2 w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-400 focus:border-blue-500"

                  />



                  {interviewError && (

                    <p className="mt-2 text-sm text-red-400">

                      {interviewError}

                    </p>

                  )}



                  {cameraError && (

                    <p className="mt-2 text-sm text-red-400">

                      {cameraError}

                    </p>

                  )}



                  <div className="mt-2 flex justify-end">

                    <button

                      type="submit"

                      disabled={

                        interviewLoading ||

                        isRecording ||

                        isTranscribing ||

                        !answer.trim()

                      }

                      className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"

                    >

                      {interviewLoading

                        ? 'Submitting...'

                        : 'Submit Answer →'}

                    </button>

                  </div>

                </form>

              </div>

            </section>

          </main>

        ) : (

          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-slate-950 px-5 py-8 text-white">

            <div className="mx-auto w-full max-w-3xl">

              <div className="mb-8 text-center">

                <div className={`mx-auto mb-5 h-28 w-28 overflow-hidden rounded-full border-4 shadow-lg transition-all duration-500 ${
                isInterviewerSpeaking
                  ? 'border-blue-400 shadow-blue-500/30'
                  : 'border-blue-500/30 shadow-black/20'
              }`}>
                <img
                  src={interviewerAvatar}
                  alt="ReadyForHiring male AI interviewer"
                  className={`h-full w-full object-cover object-top transition-transform duration-700 ${
                    isInterviewerSpeaking ? 'scale-110' : 'scale-100'
                  }`}
                />
              </div>



                <h2 className="text-2xl font-bold">

                  AI Interviewer

                </h2>



                <p className="mt-2 text-slate-400">

                  Interview for {interviewRole}

                </p>

              </div>



              <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">

                <div className="mb-4 flex items-center justify-between">

                  <p className="text-xs font-bold uppercase tracking-wider text-blue-300">

                    Interview Question

                  </p>



                  <span className="text-sm text-slate-400">

                    {questionNumber} / 6

                  </span>

                </div>



                <p className="text-lg font-semibold leading-relaxed">

                  {question?.question}

                </p>



                {renderVoiceControls()}



                <form onSubmit={handleSubmitAnswer}>

                  <textarea

                    value={answer}

                    onChange={(event) => setAnswer(event.target.value)}

                    placeholder="Type your answer here or record your voice above..."

                    rows={5}

                    className="mt-6 w-full resize-y rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none placeholder:text-slate-400 focus:border-blue-500"

                  />



                  {interviewError && (

                    <p className="mt-2 text-sm text-red-400">

                      {interviewError}

                    </p>

                  )}



                  <button

                    type="submit"

                    disabled={

                      interviewLoading ||

                      isRecording ||

                      isTranscribing ||

                      !answer.trim()

                    }

                    className="mt-5 w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"

                  >

                    {interviewLoading

                      ? 'Submitting...'

                      : 'Submit Answer →'}

                  </button>

                </form>

              </div>

            </div>

          </main>

        )}

      </div>

    )

  }

    function renderFeedback() {

    const fillerAnalysis = analyzeFillerWords(voiceTranscripts)

    const spokenWordCount = voiceTranscripts.reduce((total, transcript) => {

      const words = transcript.trim().match(/\b[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)?\b/gu)

      return total + (words ? words.length : 0)

    }, 0)

    const totalRecordingSeconds = voiceRecordingDurations.reduce(

      (total, duration) => total + duration,

      0

    )

    const wordsPerMinute = totalRecordingSeconds > 0

      ? Math.round((spokenWordCount / totalRecordingSeconds) * 60)

      : 0

    const speakingPace = wordsPerMinute === 0

      ? 'Not available'

      : wordsPerMinute < 110

        ? 'Slower pace'

        : wordsPerMinute <= 160

          ? 'Conversational pace'

          : 'Faster pace'



    if (interviewLoading) {

      return (

        <div className="flex min-h-screen items-center justify-center bg-slate-50">

          <div className="text-center">

            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

            <p className="mt-4 font-semibold text-slate-700">

              Generating your performance report...

            </p>

          </div>

        </div>

      )

    }



    if (interviewError) {

      return (

        <div className="mx-auto max-w-xl p-8 text-center">

          <p className="text-red-600">{interviewError}</p>

          <button

            type="button"

            onClick={loadInterviewFeedback}

            className="mt-5 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"

          >

            Try Again

          </button>

        </div>

      )

    }



    if (!feedback) return null



    return (

      <div className="min-h-screen bg-slate-50 text-slate-900">

        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">

              R

            </div>

            <span className="font-bold">ReadyForHiring</span>

          </div>



          <button

            type="button"

            onClick={exitInterview}

            className="text-sm font-semibold text-slate-600 hover:text-blue-600"

          >

            Exit Interview

          </button>

        </header>



        <main className="mx-auto max-w-4xl px-5 py-10">

          <div className="mb-9 text-center">

            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">

              ✓

            </div>



            <p className="font-bold uppercase tracking-wider text-green-600">

              Interview Completed

            </p>



            <h1 className="mt-3 text-4xl font-bold">

              Your performance report

            </h1>



            <p className="mt-3 text-slate-500">

              Review your results and identify where you can improve.

            </p>

          </div>



          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

            <div className="bg-gradient-to-r from-blue-700 to-indigo-600 px-8 py-7 text-center text-white">

              <p className="text-sm font-semibold text-blue-100">

                Overall interview score

              </p>



              <p className="mt-2 text-6xl font-bold tracking-tight">

                {feedback.overall_score}

                <span className="text-2xl text-blue-200">/100</span>

              </p>



              <p className="mt-3 text-sm text-blue-100">

                Your performance across six interview questions.

              </p>

            </div>

          </section>



          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

            <div className="flex flex-wrap items-start justify-between gap-4">

              <div>

                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">

                  Speaking analysis

                </p>

                <h2 className="mt-2 text-xl font-bold text-slate-900">

                  Potential filler words

                </h2>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">

                  Based on your recorded and transcribed answers only. Typed

                  answers are not included.

                </p>

              </div>



              {voiceTranscripts.length > 0 && (

                <div className="min-w-24 rounded-xl bg-blue-50 px-5 py-3 text-center">

                  <p className="text-3xl font-bold text-blue-700">

                    {fillerAnalysis.total}

                  </p>

                  <p className="text-xs font-semibold text-blue-600">

                    detected

                  </p>

                </div>

              )}

            </div>



            {voiceTranscripts.length === 0 ? (

              <p className="mt-5 rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-600">

                No voice answers were recorded. Speaking analysis will appear

                here when you complete an interview using the microphone.

              </p>

            ) : fillerAnalysis.breakdown.length === 0 ? (

              <p className="mt-5 rounded-xl bg-emerald-50 px-4 py-4 text-sm font-medium text-emerald-800">

                No common filler words were detected in your recorded answers.

              </p>

            ) : (

              <div className="mt-5 flex flex-wrap gap-2">

                {fillerAnalysis.breakdown.map((item) => (

                  <span

                    key={item.label}

                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"

                  >

                    <span className="font-semibold">{item.label}</span>

                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-blue-700">

                      {item.count}

                    </span>

                  </span>

                ))}

              </div>

            )}



            <p className="mt-4 text-xs leading-5 text-slate-400">

              This is an automated estimate. Some phrases, such as “basically”

              or “I mean”, can be meaningful depending on context. Use the

              count as a practice signal, not as a judgment of your speaking

              ability.

            </p>

          </section>



          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

            <div className="flex flex-wrap items-start justify-between gap-4">

              <div>

                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">

                  Delivery

                </p>

                <h2 className="mt-2 text-xl font-bold text-slate-900">

                  Speaking pace

                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">

                  Estimated from transcribed words and the time spent recording voice answers.

                </p>

              </div>

              {voiceTranscripts.length > 0 && totalRecordingSeconds > 0 && (

                <div className="min-w-28 rounded-xl bg-indigo-50 px-5 py-3 text-center">

                  <p className="text-3xl font-bold text-indigo-700">

                    {wordsPerMinute}

                  </p>

                  <p className="text-xs font-semibold text-indigo-600">words / min</p>

                </div>

              )}

            </div>



            {voiceTranscripts.length === 0 || totalRecordingSeconds <= 0 ? (

              <p className="mt-5 rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-600">

                Speaking pace is unavailable because no completed voice recordings were measured.

              </p>

            ) : (

              <div className="mt-5 grid gap-3 sm:grid-cols-3">

                <div className="rounded-xl bg-slate-50 p-4">

                  <p className="text-xs font-semibold text-slate-500">Spoken words</p>

                  <p className="mt-1 text-2xl font-bold text-slate-900">{spokenWordCount}</p>

                </div>

                <div className="rounded-xl bg-slate-50 p-4">

                  <p className="text-xs font-semibold text-slate-500">Recording time</p>

                  <p className="mt-1 text-2xl font-bold text-slate-900">{Math.round(totalRecordingSeconds)}s</p>

                </div>

                <div className="rounded-xl bg-slate-50 p-4">

                  <p className="text-xs font-semibold text-slate-500">Estimated pace</p>

                  <p className="mt-1 text-lg font-bold text-indigo-700">{speakingPace}</p>

                </div>

              </div>

            )}



            <p className="mt-4 text-xs leading-5 text-slate-400">

              This is an approximate average across your recordings. Pauses and silence during recording are included, so it is not a precise measure of continuous speech speed.

            </p>

          </section>



          <div className="mt-6 grid gap-6 sm:grid-cols-2">

            <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

              <h2 className="text-lg font-bold text-green-600">

                Your strengths

              </h2>



              <ul className="mt-5 space-y-3 text-sm leading-relaxed text-slate-600">

                {(feedback.strengths || []).map((item, index) => (

                  <li key={index}>✓ {item}</li>

                ))}

              </ul>

            </section>



            <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

              <h2 className="text-lg font-bold text-orange-600">

                Areas to improve

              </h2>



              <ul className="mt-5 space-y-3 text-sm leading-relaxed text-slate-600">

                {(feedback.improvements || []).map((item, index) => (

                  <li key={index}>• {item}</li>

                ))}

              </ul>

            </section>

          </div>



          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

            <h2 className="text-lg font-bold">Overall feedback</h2>



            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">

              {feedback.summary}

            </p>

          </section>



          <div className="mt-8 text-center">

            <button

              type="button"

              onClick={exitInterview}

              className="rounded-xl bg-blue-600 px-7 py-3 font-semibold text-white hover:bg-blue-700"

            >

              Back to Dashboard

            </button>

          </div>

        </main>

      </div>

    )

  }



  function renderDashboard() {

    return (

      <div>

        <div className="mb-8">

          <h1 className="text-3xl font-bold">

            Welcome to ReadyForHiring

          </h1>



          <p className={`mt-2 ${mutedTextClass}`}>

            Your personal career development workspace.

          </p>

        </div>



        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

          {[

            {

              title: 'Career Discovery',

              description: 'Discover career paths that match your interests.',

              icon: '◎',

              page: 'Career Discovery',

            },

            {

              title: 'AI Interview',

              description: 'Practice interviews and receive AI feedback.',

              icon: '◉',

              page: 'AI Interview',

            },

            {

              title: 'Resume Analysis',

              description: 'Understand your resume and identify skill gaps.',

              icon: '▤',

              page: 'Resume Analysis',

            },

            {

              title: 'AI Career Assistant',

              description: 'Get help with your career questions.',

              icon: '✧',

              page: 'AI Career Assistant',

            },

          ].map((item) => (

            <button

              type="button"

              key={item.title}

              onClick={() => setActivePage(item.page)}

              className={`rounded-2xl border p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md ${cardClass}`}

            >

              <span className="text-3xl text-blue-600">

                {item.icon}

              </span>



              <h2 className="mt-4 text-lg font-bold">

                {item.title}

              </h2>



              <p className={`mt-2 text-sm ${mutedTextClass}`}>

                {item.description}

              </p>



              <span className="mt-5 inline-block text-sm font-semibold text-blue-600">

                Open feature →

              </span>

            </button>

          ))}

        </div>

      </div>

    )

  }



  function renderCareerDiscovery() {

    return (

      <div className="mx-auto max-w-4xl">

        <div className="mb-7">

          <h1 className="text-3xl font-bold">Career Discovery</h1>



          <p className={`mt-2 ${mutedTextClass}`}>

            Find career paths that match your interests and skills.

          </p>

        </div>



        <form

          onSubmit={handleDiscoverCareers}

          className={`rounded-2xl border p-7 shadow-sm ${cardClass}`}

        >

          <label className="mb-2 block text-sm font-semibold">

            What are your interests?

          </label>



          <textarea

            value={interests}

            onChange={(event) => setInterests(event.target.value)}

            rows={3}

            placeholder="e.g. Technology, design, problem solving..."

            className={`w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500 ${

              isDark

                ? 'border-slate-700 bg-slate-800'

                : 'border-slate-300 bg-white'

            }`}

          />



          <label className="mb-2 mt-5 block text-sm font-semibold">

            What skills do you have?

          </label>



          <textarea

            value={skills}

            onChange={(event) => setSkills(event.target.value)}

            rows={3}

            placeholder="e.g. Python, communication, teamwork..."

            className={`w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500 ${

              isDark

                ? 'border-slate-700 bg-slate-800'

                : 'border-slate-300 bg-white'

            }`}

          />



          {careerError && (

            <p className="mt-3 text-sm text-red-500">

              {careerError}

            </p>

          )}



          <button

            type="submit"

            disabled={careerLoading}

            className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"

          >

            {careerLoading ? 'Discovering...' : 'Discover Careers'}

          </button>

        </form>



        {recommendations.length > 0 && (

          <div className="mt-8">

            <h2 className="mb-5 text-xl font-bold">

              Your recommendations

            </h2>



            <div className="grid gap-4 md:grid-cols-2">

              {recommendations.map((career, index) => (

                <div

                  key={index}

                  className={`rounded-2xl border p-6 ${cardClass}`}

                >

                  <h3 className="text-lg font-bold">

                    {career.title || career.name}

                  </h3>



                  <p className={`mt-2 text-sm ${mutedTextClass}`}>

                    {career.description}

                  </p>



                  {career.match_score !== undefined && (

                    <p className="mt-4 font-semibold text-blue-600">

                      Match score: {career.match_score}%

                    </p>

                  )}

                </div>

              ))}

            </div>

          </div>

        )}

      </div>

    )

  }



  function renderPlaceholder(title, description) {

    return (

      <section className={`rounded-2xl border p-8 shadow-sm ${cardClass}`}>

        <h1 className="text-3xl font-bold">{title}</h1>



        <p className={`mt-4 ${mutedTextClass}`}>

          {description}

        </p>



        <button

          type="button"

          onClick={() => setActivePage('Dashboard')}

          className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"

        >

          Back to Dashboard

        </button>

      </section>

    )

  }



  if (interviewStage === 'active') {

    return renderActiveInterview()

  }



  if (

    interviewStage === 'feedback' ||

    interviewStage === 'completed'

  ) {

    return renderFeedback()

  }



  return (

    <div className={`flex min-h-screen ${pageClass}`}>

      {sidebarOpen && (

        <button

          type="button"

          aria-label="Close navigation"

          onClick={() => setSidebarOpen(false)}

          className="fixed inset-0 z-20 bg-black/40 lg:hidden"

        />

      )}



      <aside

        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r transition-transform lg:static lg:translate-x-0 ${

          isDark

            ? 'border-slate-800 bg-slate-900'

            : 'border-slate-200 bg-white'

        } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}

      >

        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-6">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">

            R

          </div>



          <div>

            <h1 className="text-lg font-bold">ReadyForHiring</h1>



            <p className={`text-xs ${mutedTextClass}`}>

              Your career companion

            </p>

          </div>

        </div>



        <div className="flex-1 px-4 py-6">

          <p className={`mb-4 px-2 text-xs font-bold uppercase tracking-wider ${mutedTextClass}`}>

            Workspace

          </p>



          <nav className="space-y-2">

            {navigation.map((item) => (

              <button

                type="button"

                key={item.name}

                onClick={() => {

                  setActivePage(item.name)

                  setSidebarOpen(false)

                }}

                className={`flex w-full items-center gap-3 rounded-xl px-4 py-4 text-left text-sm font-semibold transition ${

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

        </div>



        <div className="border-t border-slate-200 px-4 py-5">

          <button

            type="button"

            onClick={() => setActivePage('Settings')}

            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${

              activePage === 'Settings'

                ? 'bg-blue-600 text-white'

                : isDark

                  ? 'text-slate-300 hover:bg-slate-800'

                  : 'text-slate-600 hover:bg-slate-100'

            }`}

          >

            <span className="text-lg">⚙️</span>

            Settings

          </button>



          <p className={`mt-5 border-t border-slate-200 pt-5 text-sm font-bold ${mutedTextClass}`}>

            ReadyForHiring

          </p>

        </div>

      </aside>



      <div className="flex min-w-0 flex-1 flex-col">

        <header

          className={`flex items-center justify-between border-b px-5 py-5 ${

            isDark

              ? 'border-slate-800 bg-slate-900'

              : 'border-slate-200 bg-white'

          }`}

        >

          <div className="flex items-center gap-4">

            <button

              type="button"

              onClick={() => setSidebarOpen(true)}

              className="text-2xl lg:hidden"

              aria-label="Open navigation"

            >

              ☰

            </button>



            <div>

              <h2 className="font-bold">

                {activePage === 'Settings'

                  ? 'Settings'

                  : activePage}

              </h2>



              <p className={`text-xs ${mutedTextClass}`}>

                Your personal career workspace

              </p>

            </div>

          </div>



          <div className="flex items-center gap-3">

            <span className={`hidden text-sm sm:block ${mutedTextClass}`}>

              Welcome back!

            </span>



            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">

              U

            </div>

          </div>

        </header>



        <main className="flex-1 p-5 sm:p-8">

          {activePage === 'Dashboard' && renderDashboard()}



          {activePage === 'Career Discovery' &&

            renderCareerDiscovery()}



          {activePage === 'AI Interview' &&

            renderInterviewSetup()}



          {activePage === 'Resume Analysis' &&

            renderPlaceholder(

              'Resume Analysis',

              "This feature has not been implemented yet. We'll build and connect it in a later development step."

            )}



          {activePage === 'AI Career Assistant' &&

            renderPlaceholder(

              'AI Career Assistant',

              "This feature has not been implemented yet. We'll build and connect it in a later development step."

            )}



          {activePage === 'Settings' && (

            <section className={`rounded-2xl border p-8 ${cardClass}`}>

              <h1 className="text-2xl font-bold">Settings</h1>



              <p className={`mt-2 ${mutedTextClass}`}>

                Customize your ReadyForHiring experience.

              </p>



              <div className="mt-7 flex items-center justify-between">

                <div>

                  <h2 className="font-semibold">Dark mode</h2>



                  <p className={`mt-1 text-sm ${mutedTextClass}`}>

                    Change the appearance of the application.

                  </p>

                </div>



                <button

                  type="button"

                  onClick={() =>

                    setTheme((current) =>

                      current === 'dark' ? 'light' : 'dark'

                    )

                  }

                  className={`rounded-xl px-5 py-3 text-sm font-semibold ${

                    isDark

                      ? 'bg-blue-600 text-white'

                      : 'bg-slate-200 text-slate-800'

                  }`}

                >

                  {isDark ? 'Dark' : 'Light'}

                </button>

              </div>

            </section>

          )}

        </main>

      </div>

    </div>

  )

}



export default App