'use client'
import { useState, useEffect, useRef } from 'react'
import FundHubLogo from '@/components/FundHubLogo'

export default function ScanPage() {
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState('')
  const [scanning, setScanning] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [result, setResult] = useState(null) // { success, delegate, error }
  const [recentScans, setRecentScans] = useState([])
  const videoRef = useRef()
  const scannerRef = useRef()
  const manualRef = useRef()

  useEffect(() => {
    fetch('/api/events').then(r => r.json()).then(d => {
      const evs = d.events || []
      setEvents(evs)
      if (evs.length === 1) setSelectedEvent(evs[0].id)
    })
  }, [])

  async function startScanner() {
    if (!selectedEvent) return alert('Please select an event first.')
    try {
      const { BrowserBarcodeReader } = await import('@zxing/browser')
      const reader = new BrowserBarcodeReader()
      scannerRef.current = reader
      setScanning(true)
      reader.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
        if (result) {
          handleBarcode(result.getText())
        }
      })
    } catch (e) {
      alert('Camera access denied or not available. Use manual entry below.')
    }
  }

  function stopScanner() {
    if (scannerRef.current) {
      scannerRef.current.reset()
      scannerRef.current = null
    }
    setScanning(false)
  }

  async function handleBarcode(code) {
    if (!code || !selectedEvent) return
    // Brief pause to avoid double-scans
    stopScanner()
    setResult({ loading: true })
    const res = await fetch('/api/delegates/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barcode: code.trim(), eventId: selectedEvent }),
    })
    const data = await res.json()
    setResult(data)
    if (data.delegate) {
      setRecentScans(prev => [
        { code, name: data.delegate.name, time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), success: true },
        ...prev.slice(0, 9)
      ])
    }
  }

  async function handleManualSubmit(e) {
    e.preventDefault()
    if (!manualCode.trim()) return
    await handleBarcode(manualCode.trim())
    setManualCode('')
  }

  function resetForNextScan() {
    setResult(null)
    setManualCode('')
    if (selectedEvent) startScanner()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="rating-gradient px-4 py-5">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <FundHubLogo className="h-9 w-auto" variant="light" />
          <p className="text-white/60 text-sm font-medium">Registration Desk</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Event selector */}
        <div className="card">
          <label className="label">Event</label>
          <select
            className="input"
            value={selectedEvent}
            onChange={e => { setSelectedEvent(e.target.value); stopScanner(); setResult(null) }}
          >
            <option value="">— Select event —</option>
            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
        </div>

        {/* Result display */}
        {result && (
          <div className={`card border-2 text-center ${
            result.loading ? 'border-gray-200' :
            result.delegate ? 'border-green-300 bg-green-50' : 'border-pink-brand/30 bg-pink-brand/5'
          }`}>
            {result.loading ? (
              <p className="text-gray-400 py-4 animate-pulse">Looking up delegate…</p>
            ) : result.delegate ? (
              <>
                <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center text-2xl mx-auto mb-3">✓</div>
                <p className="font-bold text-green-800 text-lg">{result.delegate.name}</p>
                <p className="text-green-600 text-sm mt-1">{result.delegate.session_count} sessions booked</p>
                {result.whatsappSent ? (
                  <p className="text-xs text-green-500 mt-2">✓ WhatsApp welcome message sent to {result.delegate.phone}</p>
                ) : result.alreadyCheckedIn ? (
                  <p className="text-xs text-orange-500 mt-2">⚠ Already checked in — WhatsApp not resent</p>
                ) : (
                  <p className="text-xs text-gray-400 mt-2">WhatsApp sending…</p>
                )}
                <button onClick={resetForNextScan} className="btn-primary mt-4 text-sm w-full">
                  Scan Next Delegate
                </button>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-pink-brand flex items-center justify-center text-2xl mx-auto mb-3 text-white">!</div>
                <p className="font-bold text-pink-brand">Delegate Not Found</p>
                <p className="text-sm text-gray-500 mt-1">{result.error || 'Barcode not recognised for this event.'}</p>
                <button onClick={resetForNextScan} className="btn-secondary mt-4 text-sm w-full">
                  Try Again
                </button>
              </>
            )}
          </div>
        )}

        {/* Camera scanner */}
        {!result && (
          <div className="card">
            <h2 className="font-semibold text-navy-DEFAULT mb-3">Scan Badge Barcode</h2>
            {scanning ? (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                  <video ref={videoRef} className="w-full h-full object-cover" />
                  {/* Scan line overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-3/4 h-0.5 bg-cyan-brand/80 shadow-lg shadow-cyan-brand/50" />
                  </div>
                </div>
                <button onClick={stopScanner} className="btn-secondary w-full text-sm">Stop Camera</button>
              </div>
            ) : (
              <button
                onClick={startScanner}
                disabled={!selectedEvent}
                className="btn-primary w-full"
              >
                📷 Start Camera Scanner
              </button>
            )}
          </div>
        )}

        {/* Manual entry fallback */}
        {!result && (
          <div className="card">
            <h2 className="font-semibold text-navy-DEFAULT mb-3">Or Enter Barcode Manually</h2>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                ref={manualRef}
                type="text"
                className="input flex-1"
                placeholder="Type or paste barcode…"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                autoComplete="off"
              />
              <button type="submit" disabled={!selectedEvent || !manualCode} className="btn-primary whitespace-nowrap">
                Check In
              </button>
            </form>
          </div>
        )}

        {/* Recent scans log */}
        {recentScans.length > 0 && (
          <div className="card">
            <h3 className="text-sm font-semibold text-navy-DEFAULT mb-3">Recent Check-ins</h3>
            <div className="space-y-2">
              {recentScans.map((scan, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{scan.name}</span>
                  <span className="text-gray-400 text-xs">{scan.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
