'use client'

import { useState, useEffect } from 'react'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/solid';
import TodoList from './components/TodoList';
import { format } from 'date-fns';

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
  const [isExpanded, setIsExpanded] = useState(true);
  const [showEntries, setShowEntries] = useState(false);

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
    setIsExpanded(true)
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

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <main className="container mx-auto p-4 pb-6 max-w-2xl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Journal Entry</h1>
          <input 
            type="date" 
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            className="p-2 rounded border focus:outline-none" 
          />
        </div>

        {/* Collapsible textarea section */}
        <div className={`transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-64 p-4 border rounded-lg resize-none focus:outline-none"
            placeholder="Today's entry..."
          />
        </div>

        <button 
          onClick={toggleExpand}
          className="w-full flex justify-center mt-2 p-2 hover:bg-gray-50 transition-colors"
        >
          <ChevronUpIcon 
            className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${
              isExpanded ? '' : 'rotate-180'
            }`}
          />
        </button>

        <div className="mt-4">
          <TodoList />
        </div>

        {/* Entry list */}
        <div className="mt-6 space-y-4">
          <button
            onClick={() => setShowEntries(!showEntries)}
            className="w-full p-4 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 mb-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1" /> {/* Empty div for spacing */}
              <div>Entries</div>
              <div className="flex-1 flex justify-end">
                {showEntries ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4" />
                )}
              </div>
            </div>
          </button>

          {showEntries && (
            <div className="space-y-4">
              {entries.slice(0, 10).map((entry) => (
                <div key={entry.id} className="p-4 rounded-lg border">
                  <div className="flex items-center space-x-4 text-gray-500">
                    <div>{format(new Date(entry.date), 'MM/dd/yyyy')}</div>
                    <div>{entry.content}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
} 