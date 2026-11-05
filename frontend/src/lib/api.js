
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
