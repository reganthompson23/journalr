'use client'

import { useState, useEffect } from 'react'

interface JournalEntry {
  id: string;
  content: string;
  date: string;
}

export default function JournalPage() {
  const [content, setContent] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Fetch entries when page loads
  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    try {
      const response = await fetch('/api/journal')
      if (!response.ok) throw new Error('Failed to fetch entries')
      const data = await response.json()
      setEntries(data)
      
      // If no entry is selected, select today's entry if it exists
      if (!selectedId) {
        const today = new Date().toISOString().split('T')[0]
        const todayEntry = data.find(entry => 
          new Date(entry.date).toISOString().split('T')[0] === today
        )
        if (todayEntry) {
          setContent(todayEntry.content)
          setDate(today)
          setSelectedId(todayEntry.id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch entries:', error)
    }
  }

  const handleEntryClick = (entry: JournalEntry) => {
    setContent(entry.content)
    setDate(new Date(entry.date).toISOString().split('T')[0])
    setSelectedId(entry.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDateChange = async (newDate: string) => {
    console.log('Date changing to:', newDate)
    
    // Immediately update UI
    setDate(newDate)
    setContent('')
    setSelectedId(null)
    
    // Find if there's an existing entry for this date
    const existingEntry = entries.find(entry => {
      const entryDate = new Date(entry.date).toISOString().split('T')[0]
      console.log('Comparing:', entryDate, newDate)
      return entryDate === newDate
    })
    
    if (existingEntry) {
      console.log('Found existing entry:', existingEntry)
      setContent(existingEntry.content)
      setSelectedId(existingEntry.id)
    }
  }

  const handleSave = async () => {
    try {
      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          date,
        }),
      })

      if (!response.ok) throw new Error('Failed to save')
      
      // Instead of fetching all entries, just update the current one in state
      const savedEntry = await response.json()
      setEntries(prevEntries => {
        const index = prevEntries.findIndex(e => 
          new Date(e.date).toISOString().split('T')[0] === date
        )
        
        if (index >= 0) {
          // Update existing entry
          const newEntries = [...prevEntries]
          newEntries[index] = savedEntry
          return newEntries
        } else {
          // Add new entry
          return [...prevEntries, savedEntry].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          )
        }
      })
    } catch (error) {
      console.error('Failed to save entry:', error)
    }
  }

  // Auto-save when content changes
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      if (content !== '') {  // Only save if there's actual content
        handleSave()
      }
    }, 1000)

    return () => clearTimeout(saveTimeout)
  }, [content])  // Only watch for content changes, not date

  return (
    <main className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Journal Entry</h1>
          <input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            className="border rounded p-2 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700"
          />
        </div>
        
        <textarea
          className="w-full h-64 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700"
          placeholder="Write your thoughts for today..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {entries.map((entry) => (
          <div 
            key={entry.id} 
            className={`bg-white rounded-lg shadow-lg p-3 relative cursor-pointer 
              hover:shadow-xl transition-shadow h-12
              ${selectedId === entry.id ? 'ring-2 ring-gray-700' : ''}`}
            onClick={() => handleEntryClick(entry)}
          >
            <div className="flex items-center">
              <div className="text-sm text-gray-500 w-24">
                {new Date(entry.date).toLocaleDateString('en-GB')}
              </div>
              <div className="whitespace-pre-wrap overflow-hidden text-ellipsis line-clamp-1 text-gray-500">
                {entry.content}
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
} 