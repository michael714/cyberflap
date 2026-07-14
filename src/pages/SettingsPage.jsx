import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMessage, setMessage } from '../content/message'
import { getRowTheme } from '../content/rainbow'
import { useRainbowMode } from '../content/useRainbowMode'
import { COLS, MAX_ROWS } from '../utils/characters'
import { getPreviewLines } from '../utils/board'
import './SettingsPage.css'

function SettingsPage() {
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
          Edit the custom message shown in the rotation. Max {MAX_ROWS} rows ×{' '}
          {COLS} columns.
        </p>
      </header>

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

        <label className="settings-page__toggle">
          <input
            type="checkbox"
            checked={rainbowMode}
            onChange={(event) => setRainbowMode(event.target.checked)}
          />
          <span>Rainbow row colors</span>
        </label>

        <div className="settings-page__actions">
          <button type="submit" className="settings-page__save">
            Save
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
            : ''}
        </p>
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
      </section>
    </div>
  )
}

export default SettingsPage
