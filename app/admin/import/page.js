'use client'
import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import * as XLSX from 'xlsx'

export default function ImportPage() {
  const params = useSearchParams()
  const eventId = params.get('event')
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(eventId || '')
  const [activeTab, setActiveTab] = useState('agenda')
  const agendaRef = useRef()
  const delegatesRef = useRef()

  // Agenda import state
  const [agendaRows, setAgendaRows] = useState([])
  const [agendaPreview, setAgendaPreview] = useState([])
  const [agendaMapping, setAgendaMapping] = useState({ time: '', room: '', speaker: '', company: '', level: '' })
  const [agendaHeaders, setAgendaHeaders] = useState([])
  const [agendaImporting, setAgendaImporting] = useState(false)
  const [agendaResult, setAgendaResult] = useState(null)

  // Delegate import state
  const [delegateRows, setDelegateRows] = useState([])
  const [delegatePreview, setDelegatePreview] = useState([])
  const [delegateMapping, setDelegateMapping] = useState({ barcode: '', name: '', phone: '', email: '', sessions: '' })
  const [delegateHeaders, setDelegateHeaders] = useState([])
  const [delegateImporting, setDelegateImporting] = useState(false)
  const [delegateResult, setDelegateResult] = useState(null)

  useEffect(() => {
    fetch('/api/events').then(r => r.json()).then(d => setEvents(d.events || []))
  }, [])

  // --- Agenda file parsing ---
  function handleAgendaFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: 'binary' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })
      if (rows.length === 0) return
      const headers = Object.keys(rows[0])
      setAgendaHeaders(headers)
      setAgendaRows(rows)
      setAgendaPreview(rows.slice(0, 5))
      // Auto-detect common column names
      const autoMap = { time: '', room: '', speaker: '', company: '', level: '' }
      headers.forEach(h => {
        const l = h.toLowerCase()
        if (l.includes('time') || l.includes('start')) autoMap.time = h
        if (l.includes('room')) autoMap.room = h
        if (l.includes('speaker') || l.includes('presenter') || l.includes('manager')) autoMap.speaker = h
        if (l.includes('company') || l.includes('fund') || l.includes('asset')) autoMap.company = h
        if (l.includes('level')) autoMap.level = h
      })
      setAgendaMapping(autoMap)
    }
    reader.readAsBinaryString(file)
  }

  async function submitAgenda() {
    if (!selectedEvent) return alert('Please select an event first.')
    if (!agendaMapping.time || !agendaMapping.room || !agendaMapping.speaker) {
      return alert('Please map the Time, Room, and Speaker columns.')
    }
    setAgendaImporting(true)
    setAgendaResult(null)
    const res = await fetch('/api/import/agenda', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: selectedEvent, rows: agendaRows, mapping: agendaMapping }),
    })
    const data = await res.json()
    setAgendaResult(data)
    setAgendaImporting(false)
  }

  // --- Delegate file parsing ---
  function handleDelegateFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: 'binary' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })
      if (rows.length === 0) return
      const headers = Object.keys(rows[0])
      setDelegateHeaders(headers)
      setDelegateRows(rows)
      setDelegatePreview(rows.slice(0, 5))
      // Auto-detect
      const autoMap = { barcode: '', name: '', phone: '', email: '', sessions: '' }
      headers.forEach(h => {
        const l = h.toLowerCase()
        if (l.includes('barcode') || l.includes('badge') || l.includes('id')) autoMap.barcode = h
        if (l.includes('name') || l.includes('delegate') || l.includes('attendee')) autoMap.name = h
        if (l.includes('phone') || l.includes('mobile') || l.includes('cell')) autoMap.phone = h
        if (l.includes('email')) autoMap.email = h
        if (l.includes('session') || l.includes('booking') || l.includes('selected')) autoMap.sessions = h
      })
      setDelegateMapping(autoMap)
    }
    reader.readAsBinaryString(file)
  }

  async function submitDelegates() {
    if (!selectedEvent) return alert('Please select an event first.')
    if (!delegateMapping.barcode || !delegateMapping.name || !delegateMapping.phone) {
      return alert('Please map the Barcode, Name, and Phone columns.')
    }
    setDelegateImporting(true)
    setDelegateResult(null)
    const res = await fetch('/api/import/delegates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: selectedEvent, rows: delegateRows, mapping: delegateMapping }),
    })
    const data = await res.json()
    setDelegateResult(data)
    setDelegateImporting(false)
  }

  const MappingSelect = ({ label, value, onChange, required }) => (
    <div>
      <label className="label">{label}{required && <span className="text-pink-brand ml-1">*</span>}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="input">
        <option value="">— Select column —</option>
        {(agendaHeaders.length ? agendaHeaders : delegateHeaders).map(h => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
    </div>
  )

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-DEFAULT">Import Data</h1>
        <p className="text-gray-500 text-sm mt-1">Upload the agenda and delegate spreadsheets from Gel.</p>
      </div>

      {/* Event selector */}
      <div className="card mb-6">
        <label className="label">Select Event</label>
        <select
          className="input"
          value={selectedEvent}
          onChange={e => setSelectedEvent(e.target.value)}
        >
          <option value="">— Choose an event —</option>
          {events.map(ev => (
            <option key={ev.id} value={ev.id}>{ev.name}</option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1 w-fit">
        {['agenda', 'delegates'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white text-navy-DEFAULT shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'agenda' ? '① Agenda' : '② Delegates'}
          </button>
        ))}
      </div>

      {/* Agenda Tab */}
      {activeTab === 'agenda' && (
        <div className="card space-y-5">
          <div>
            <h2 className="font-semibold text-navy-DEFAULT mb-1">Session Agenda</h2>
            <p className="text-sm text-gray-500">Upload a spreadsheet with one row per session. Columns should include time, room, speaker/company. Import the agenda before delegates.</p>
          </div>
          <div>
            <label className="label">Upload Spreadsheet (.xlsx or .csv)</label>
            <input
              ref={agendaRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleAgendaFile}
              className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-medium file:bg-navy-DEFAULT file:text-white hover:file:bg-navy-light cursor-pointer"
            />
          </div>

          {agendaHeaders.length > 0 && (
            <>
              <div className="border-t border-gray-100 pt-5">
                <h3 className="text-sm font-semibold text-navy-DEFAULT mb-3">Map Columns</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Start Time', key: 'time', required: true },
                    { label: 'Room', key: 'room', required: true },
                    { label: 'Speaker / Company Name', key: 'speaker', required: true },
                    { label: 'Company (separate col, optional)', key: 'company', required: false },
                    { label: 'Level (optional)', key: 'level', required: false },
                  ].map(({ label, key, required }) => (
                    <div key={key}>
                      <label className="label">{label}{required && <span className="text-pink-brand ml-1">*</span>}</label>
                      <select
                        value={agendaMapping[key]}
                        onChange={e => setAgendaMapping(m => ({ ...m, [key]: e.target.value }))}
                        className="input"
                      >
                        <option value="">— not mapped —</option>
                        {agendaHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Preview (first 5 rows)</p>
                <div className="overflow-x-auto text-xs">
                  <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>{agendaHeaders.map(h => <th key={h} className="px-3 py-2 text-left text-gray-600 font-medium border-b border-gray-200">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {agendaPreview.map((row, i) => (
                        <tr key={i} className="border-b border-gray-100">
                          {agendaHeaders.map(h => <td key={h} className="px-3 py-2 text-gray-600">{String(row[h])}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-400 mt-1">{agendaRows.length} total rows detected.</p>
              </div>

              {agendaResult && (
                <div className={`rounded-xl p-4 text-sm ${agendaResult.error ? 'bg-pink-brand/10 text-pink-brand' : 'bg-green-50 text-green-800'}`}>
                  {agendaResult.error ? agendaResult.error : `✓ Imported ${agendaResult.imported} sessions successfully. ${agendaResult.skipped || 0} rows skipped.`}
                </div>
              )}

              <button
                onClick={submitAgenda}
                disabled={agendaImporting || !selectedEvent}
                className="btn-primary"
              >
                {agendaImporting ? 'Importing…' : `Import ${agendaRows.length} Sessions`}
              </button>
            </>
          )}
        </div>
      )}

      {/* Delegates Tab */}
      {activeTab === 'delegates' && (
        <div className="card space-y-5">
          <div>
            <h2 className="font-semibold text-navy-DEFAULT mb-1">Delegate List (from Gel)</h2>
            <p className="text-sm text-gray-500">Upload the delegate export from Gel's registration system. Each delegate needs a barcode ID, name, mobile number, and their selected sessions. Import the agenda first.</p>
          </div>
          <div>
            <label className="label">Upload Delegate Spreadsheet (.xlsx or .csv)</label>
            <input
              ref={delegatesRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleDelegateFile}
              className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-medium file:bg-navy-DEFAULT file:text-white hover:file:bg-navy-light cursor-pointer"
            />
          </div>

          {delegateHeaders.length > 0 && (
            <>
              <div className="border-t border-gray-100 pt-5">
                <h3 className="text-sm font-semibold text-navy-DEFAULT mb-3">Map Columns</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Barcode / Badge ID', key: 'barcode', required: true },
                    { label: 'Full Name', key: 'name', required: true },
                    { label: 'Mobile Number', key: 'phone', required: true },
                    { label: 'Email (optional)', key: 'email', required: false },
                    { label: 'Session Selections (optional)', key: 'sessions', required: false },
                  ].map(({ label, key, required }) => (
                    <div key={key}>
                      <label className="label">{label}{required && <span className="text-pink-brand ml-1">*</span>}</label>
                      <select
                        value={delegateMapping[key]}
                        onChange={e => setDelegateMapping(m => ({ ...m, [key]: e.target.value }))}
                        className="input"
                      >
                        <option value="">— not mapped —</option>
                        {delegateHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Preview (first 5 rows)</p>
                <div className="overflow-x-auto text-xs">
                  <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>{delegateHeaders.map(h => <th key={h} className="px-3 py-2 text-left text-gray-600 font-medium border-b border-gray-200">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {delegatePreview.map((row, i) => (
                        <tr key={i} className="border-b border-gray-100">
                          {delegateHeaders.map(h => <td key={h} className="px-3 py-2 text-gray-600">{String(row[h])}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-400 mt-1">{delegateRows.length} delegates detected.</p>
              </div>

              {delegateResult && (
                <div className={`rounded-xl p-4 text-sm ${delegateResult.error ? 'bg-pink-brand/10 text-pink-brand' : 'bg-green-50 text-green-800'}`}>
                  {delegateResult.error
                    ? delegateResult.error
                    : `✓ Imported ${delegateResult.imported} delegates. ${delegateResult.skipped || 0} skipped. Each delegate has a unique rating link ready.`}
                </div>
              )}

              <button
                onClick={submitDelegates}
                disabled={delegateImporting || !selectedEvent}
                className="btn-primary"
              >
                {delegateImporting ? 'Importing…' : `Import ${delegateRows.length} Delegates`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
