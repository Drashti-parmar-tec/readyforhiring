
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
).replace(/\/+$/, '')

export function getUserId() {
  let userId = localStorage.getItem('rfh-user-id')

  if (!userId) {
    userId = crypto.randomUUID()
    localStorage.setItem('rfh-user-id', userId)
  }

  return userId
}

async function apiRequest(endpoint, options = {}) {
  let response

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
  } catch {
    throw new Error(
      'Unable to connect to the server. Please check your internet connection or try again later.'
    )
  }

  let data

  try {
    data = await response.json()
  } catch {
    throw new Error('The server returned an invalid response.')
  }

  if (!response.ok) {
    const message =
      typeof data.detail === 'string'
        ? data.detail
        : 'Something went wrong. Please try again.'

    throw new Error(message)
  }

  return data
}

// Career Discovery
export function discoverCareers({ interests, skills }) {
  return apiRequest('/api/career/discover', {
    method: 'POST',
    body: JSON.stringify({
      user_id: getUserId(),
      interests,
      skills,
    }),
  })
}

// Start an AI interview
export function startInterview(role) {
  return apiRequest('/api/interview/start', {
    method: 'POST',
    body: JSON.stringify({
      user_id: getUserId(),
      role,
    }),
  })
}

// Submit an interview answer
export function submitInterviewAnswer({ interviewId, answer }) {
  return apiRequest('/api/interview/answer', {
    method: 'POST',
    body: JSON.stringify({
      user_id: getUserId(),
      interview_id: interviewId,
      answer,
    }),
  })
}

// Generate and retrieve interview feedback
export function getInterviewFeedback(interviewId) {
  return apiRequest('/api/interview/feedback', {
    method: 'POST',
    body: JSON.stringify({
      user_id: getUserId(),
      interview_id: interviewId,
    }),
  })
}

// Transcribe an interview audio recording using Groq Whisper
export async function transcribeInterviewAudio(audioBlob) {
  if (!audioBlob || audioBlob.size === 0) {
    throw new Error('Your recording is empty. Please record your answer again.')
  }

  const formData = new FormData()

  const extension = audioBlob.type.includes('mp4') ? 'mp4' : 'webm'

  formData.append(
    'audio',
    audioBlob,
    `interview-recording.${extension}`
  )

  let response

  try {
    response = await fetch(`${API_BASE_URL}/api/interview/transcribe`, {
      method: 'POST',
      body: formData,
    })
  } catch {
    throw new Error(
      'Unable to upload your recording. Please check your internet connection and try again.'
    )
  }

  let data

  try {
    data = await response.json()
  } catch {
    throw new Error('The server returned an invalid transcription response.')
  }

  if (!response.ok) {
    const message =
      typeof data.detail === 'string'
        ? data.detail
        : 'Could not transcribe your recording. Please try again.'

    throw new Error(message)
  }

  if (typeof data.text !== 'string' || !data.text.trim()) {
    throw new Error('No speech was detected. Please try recording again.')
  }

  return data.text
}
