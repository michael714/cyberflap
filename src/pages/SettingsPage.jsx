import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DISPLAY_MODE } from '../content/displayMode'
import { getMessage, setMessage } from '../content/message'
import { getRowTheme } from '../content/rainbow'
import { useAgenda } from '../content/useAgenda'
import { useDisplayMode } from '../content/useDisplayMode'
import { useRainbowMode } from '../content/useRainbowMode'
import { COLS, MAX_ROWS } from '../utils/characters'
import { getPreviewLines } from '../utils/board'
import './SettingsPage.css'

function WrapPreview({ text, rainbowMode }) {
  const previewLines = useMemo(
    () => getPreviewLines(text, { align: 'center' }),
    [text],
  )

  return (
    <div
      className="settings-page__preview-grid"
      style={{ '--preview-cols': COLS }}
    >
      {previewLines.map((line, index) => {
        const theme = getRowTheme(index, {
          rainbowMode,
          rowCount: previewLines.length,
        })
        return (
          <pre
            key={index}
            className="settings-page__preview-line"
            style={
              theme
                ? {
                    background: theme.background,
                    color: theme.foreground,
                  }
                : undefined
            }
          >
            {line}
          </pre>
        )
      })}
    </div>
  )
}

function SettingsPage() {
  const [displayMode, setDisplayMode] = useDisplayMode()
  const isAgenda = displayMode === DISPLAY_MODE.AGENDA
  const agenda = useAgenda(isAgenda)
  const [draft, setDraft] = useState(() => getMessage())
  const [savedFlash, setSavedFlash] = useState(false)
  const [rainbowMode, setRainbowMode] = useRainbowMode()

  const previewLines = useMemo(
    () => getPreviewLines(draft, { align: 'center' }),
    [draft],
  )

  useEffect(() => {
    if (!savedFlash) return undefined
    const id = window.setTimeout(() => setSavedFlash(false), 1600)
    return () => window.clearTimeout(id)
  }, [savedFlash])

  const onSubmit = (event) => {
    event.preventDefault()
    setMessage(draft)
    setSavedFlash(true)
  }

  return (
    <div className="settings-page">
      <header className="settings-page__header">
        <Link to="/" className="settings-page__back">
          ← Back to board
        </Link>
        <h1 className="settings-page__title">Settings</h1>
        <p className="settings-page__lede">
          {isAgenda
            ? `Classroom agenda reads pages from agenda.txt on GitHub. Max ${MAX_ROWS} rows × ${COLS} columns per page.`
            : `Edit the custom message shown in the demo rotation. Max ${MAX_ROWS} rows × ${COLS} columns.`}
        </p>
      </header>

      <fieldset className="settings-page__modes">
        <legend className="settings-page__label">Display mode</legend>
        <label className="settings-page__toggle">
          <input
            type="radio"
            name="display-mode"
            checked={!isAgenda}
            onChange={() => setDisplayMode(DISPLAY_MODE.DEMO)}
          />
          <span>Demo</span>
        </label>
        <label className="settings-page__toggle">
          <input
            type="radio"
            name="display-mode"
            checked={isAgenda}
            onChange={() => setDisplayMode(DISPLAY_MODE.AGENDA)}
          />
          <span>Classroom agenda</span>
        </label>
      </fieldset>

      <label className="settings-page__toggle">
        <input
          type="checkbox"
          checked={rainbowMode}
          onChange={(event) => setRainbowMode(event.target.checked)}
        />
        <span>Rainbow row colors</span>
      </label>

      {isAgenda ? (
        <section className="settings-page__preview" aria-label="Published agenda preview">
          <h2 className="settings-page__preview-title">Published agenda</h2>
          <p className="settings-page__preview-hint">
            {(agenda.status === 'loading' || agenda.status === 'idle') &&
            agenda.pages.length === 0
              ? 'Loading agenda.txt…'
              : agenda.status === 'unavailable'
                ? 'No pages found. On github.com, edit or upload agenda.txt at the repo root, then refresh.'
                : `How each page will wrap on the ${COLS}-column board. Replace agenda.txt on GitHub to update. Display mode and rainbow apply immediately.`}
          </p>
          {agenda.pages.map((page, pageIndex) => (
            <article key={`${page.label}-${pageIndex}`} className="settings-page__agenda-page">
              <h3 className="settings-page__agenda-label">
                {pageIndex + 1} / {agenda.pages.length}
                {page.label ? ` · ${page.label}` : ''}
              </h3>
              <WrapPreview text={page.text} rainbowMode={rainbowMode} />
            </article>
          ))}
        </section>
      ) : (
        <>
          <form className="settings-page__form" onSubmit={onSubmit}>
            <label className="settings-page__label" htmlFor="custom-message">
              Custom message
            </label>
            <textarea
              id="custom-message"
              className="settings-page__textarea"
              rows={8}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              spellCheck="false"
              autoComplete="off"
            />

            <div className="settings-page__actions">
              <button type="submit" className="settings-page__save">
                Save message
              </button>
              <p
                className={`settings-page__status${savedFlash ? ' is-visible' : ''}`}
                aria-live="polite"
              >
                {savedFlash ? 'Saved!' : '\u00a0'}
              </p>
            </div>
          </form>

          <section className="settings-page__preview" aria-label="Board wrap preview">
            <h2 className="settings-page__preview-title">Preview</h2>
            <p className="settings-page__preview-hint">
              How this will wrap on the {COLS}-column board
              {previewLines.length >= MAX_ROWS ? ' (truncated at 6 rows)' : ''}.
              {rainbowMode && previewLines.length >= 2
                ? ' Rainbow colors show on multi-row messages.'
                : ''}{' '}
              Display mode and rainbow apply immediately; Save message stores the custom text.
            </p>
            <WrapPreview text={draft} rainbowMode={rainbowMode} />
          </section>
        </>
      )}

      <div className="settings-page__footer">
        <Link to="/" className="settings-page__back">
          Back to board
        </Link>
      </div>
    </div>
  )
}

export default SettingsPage
