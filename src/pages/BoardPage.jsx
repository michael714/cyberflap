import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Board from '../components/Board'
import { useContentRotation } from '../content/useContentRotation'
import { useFlipSound } from '../utils/useFlipSound'
import './BoardPage.css'

function demoStatus(isOverride, paused, activeModule) {
  if (isOverride) return 'manual override'
  if (paused) return `paused · ${activeModule}`
  return activeModule
}

function agendaStatusLine({ paused, agendaOnly, activeModule, pageCount, pageIndex, pageLabel }) {
  const pagePart =
    pageCount > 0
      ? `${pageIndex + 1} / ${pageCount}${pageLabel ? ` · ${pageLabel}` : ''}`
      : 'no agenda'
  if (agendaOnly) {
    return paused ? `paused · ${pagePart}` : pagePart
  }
  const modulePart = paused ? `paused · ${activeModule}` : activeModule
  return `${modulePart} · ${pagePart}`
}

function BoardPage() {
  const {
    board,
    isAgenda,
    activeModule,
    isOverride,
    paused,
    agendaOnly,
    pageIndex,
    pageCount,
    pageLabel,
    triggerOverride,
    goNext,
    goPrevious,
    togglePause,
    toggleAgendaOnly,
  } = useContentRotation()
  const { muted, toggleMute, unlockAudio } = useFlipSound()

  const withAudioUnlock = (action) => () => {
    unlockAudio()
    action()
  }

  useEffect(() => {
    if (!isAgenda) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'ArrowRight' || event.key === 'PageDown') {
        event.preventDefault()
        unlockAudio()
        goNext()
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault()
        unlockAudio()
        goPrevious()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isAgenda, goNext, goPrevious, unlockAudio])

  const status = isAgenda
    ? agendaStatusLine({
        paused,
        agendaOnly,
        activeModule,
        pageCount,
        pageIndex,
        pageLabel,
      })
    : demoStatus(isOverride, paused, activeModule)

  return (
    <div id="board-root" className="board-page">
      <Link
        to="/settings"
        className="board-page__settings"
        aria-label="Open settings"
        title="Settings"
        onClick={() => unlockAudio()}
      >
        <svg
          className="board-page__gear"
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <path
            fill="currentColor"
            d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.07 7.07 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.58.22-1.13.52-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.77 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.89 14.52a.5.5 0 0 0-.12.64l1.92 3.32c.14.24.43.34.68.24l2.39-.96c.5.42 1.05.76 1.63.98l.36 2.54c.05.24.26.42.5.42h3.84c.24 0 .45-.18.5-.42l.36 2.54c.58-.22 1.13-.56 1.63-.98l2.39.96c.25.1.54 0 .68-.24l1.92-3.32a.5.5 0 0 0-.12-.64l2.03-1.58ZM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 1 0 0 7.2Z"
          />
        </svg>
      </Link>

      <header className="brand">
        <p className="brand__eyebrow">split-flap display</p>
        <h1 className="brand__wordmark">CyberFlap</h1>
      </header>

      <Board board={board} />

      <div className="controls">
        <p className="controls__status" aria-live="polite">
          {status}
        </p>
        {isAgenda ? (
          <button
            type="button"
            className="controls__button"
            onClick={withAudioUnlock(toggleAgendaOnly)}
            aria-pressed={agendaOnly}
          >
            {agendaOnly ? 'Show clock & weather' : 'Agenda only'}
          </button>
        ) : (
          <button
            type="button"
            className="controls__button"
            onClick={withAudioUnlock(triggerOverride)}
          >
            Manual override
          </button>
        )}
      </div>

      <div
        className={`playback${isAgenda ? ' playback--agenda' : ''}`}
        role="group"
        aria-label={isAgenda ? 'Agenda page controls' : 'Playback controls'}
      >
        <button
          type="button"
          className="playback__button"
          onClick={withAudioUnlock(goPrevious)}
        >
          Previous
        </button>
        <button
          type="button"
          className="playback__button"
          onClick={withAudioUnlock(togglePause)}
          aria-pressed={paused}
        >
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button
          type="button"
          className="playback__button"
          onClick={withAudioUnlock(goNext)}
        >
          Next
        </button>
        <button
          type="button"
          className="playback__button"
          onClick={withAudioUnlock(toggleMute)}
          aria-pressed={muted}
          aria-label={muted ? 'Unmute flip sounds' : 'Mute flip sounds'}
          title={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? 'Unmute' : 'Mute'}
        </button>
      </div>
    </div>
  )
}

export default BoardPage
