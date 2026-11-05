
import { useEffect, useState } from 'react'

const navigation = [
  { name: 'Dashboard', icon: '▦' },
  { name: 'Career Discovery', icon: '◎' },
  { name: 'AI Interview', icon: '◉' },
  { name: 'Resume Analysis', icon: '▤' },
  { name: 'Finance Planner', icon: '◇' },
]

function App() {
  const [activePage, setActivePage] = useState('Dashboard')
  const [theme, setTheme] = useState(
    () => localStorage.getItem('rfh-theme') || 'light'
  )
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  return (
    <div className={`min-h-screen ${pageClass}`}>
      <div className="flex min-h-screen">

        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <button
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          />
        )}

        {/* Sidebar */}
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

          <div className={`mt-5 border-t pt-5 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <p className="text-sm font-semibold">ReadyForHiring</p>
            <p className={`mt-1 text-xs ${mutedText}`}>Career growth starts here.</p>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">
          {/* Header */}
          <header className={`flex h-20 items-center justify-between border-b px-5 sm:px-8 ${
            isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
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

          {/* Page content */}
          <div className="mx-auto max-w-7xl p-5 sm:p-8">

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
                    improve your resume, and plan your financial future.
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
                      <p className={`mt-2 text-xs ${mutedText}`}>
                        No data yet
                      </p>
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
                      className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      Discover Careers →
                    </button>
                  </div>

                  <div className={`rounded-2xl border p-6 shadow-sm ${cardClass}`}>
                    <h3 className="text-lg font-semibold">Prepare for interviews</h3>
                    <p className={`mt-2 text-sm ${mutedText}`}>
                      Practice answering interview questions with AI.
                    </p>
                    <button
                      onClick={() => setActivePage('AI Interview')}
                      className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      Start Practicing →
                    </button>
                  </div>
                </section>
              </>
            )}

            {activePage === 'Settings' && (
              <section className={`max-w-2xl rounded-2xl border p-6 shadow-sm ${cardClass}`}>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className={`mt-2 text-sm ${mutedText}`}>
                  Customize your ReadyForHiring experience.
                </p>

                <div className={`mt-8 border-t pt-6 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
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

            {activePage !== 'Dashboard' && activePage !== 'Settings' && (
              <section className={`rounded-2xl border p-8 ${cardClass}`}>
                <h1 className="text-2xl font-bold">{activePage}</h1>
                <p className={`mt-3 ${mutedText}`}>
                  This feature has not been implemented yet. We'll build and
                  connect it in a later development step.
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
