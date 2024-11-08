'use client'

import { useState, useEffect } from 'react'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/solid';
import TodoList from './components/TodoList';
import { format, subDays } from 'date-fns';

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
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

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

  const handleAISummary = async (timeframe: 'yesterday' | 'lastWeek') => {
    setIsLoadingAI(true);
    setAiSummary(null);
    
    try {
      const today = new Date();
      const startDate = timeframe === 'yesterday' 
        ? subDays(today, 1)
        : subDays(today, 7);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];
      
      console.log('Today:', todayStr);
      console.log('Start date:', startDateStr);
      
      const relevantEntries = entries.filter(entry => {
        const entryDateStr = new Date(entry.date).toISOString().split('T')[0];
        const isRelevant = entryDateStr >= startDateStr && entryDateStr < todayStr;
        console.log('Checking entry:', {
          date: entry.date,
          entryDateStr,
          isRelevant,
          content: entry.content  // Add this to debug
        });
        return isRelevant;
      });

      console.log('Found relevant entries:', relevantEntries);

      if (!relevantEntries || relevantEntries.length === 0) {
        setAiSummary('No entries found for this timeframe.');
        setIsLoadingAI(false);
        return;
      }

      // Continue with API call only if we have entries
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entries: relevantEntries,
          timeframe: timeframe === 'yesterday' ? 'yesterday' : 'the last week'
        }),
      });

      if (!response.ok) throw new Error('Failed to get AI summary');
      
      const data = await response.json();
      setAiSummary(data.summary);
    } catch (error) {
      console.error('Failed to get AI summary:', error);
      setAiSummary('Failed to generate summary. Please try again.');
    } finally {
      setIsLoadingAI(false);
    }
};

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
    <main className="container mx-auto px-4 pt-4 pb-2 max-w-5xl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">Journal Entry</h1>
            <div className="flex gap-2">
              <button 
                onClick={() => handleAISummary('yesterday')}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                disabled={isLoadingAI}
              >
                Yesterday
              </button>
              <button 
                onClick={() => handleAISummary('lastWeek')}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                disabled={isLoadingAI}
              >
                Last Week
              </button>
            </div>
          </div>
          <input 
            type="date" 
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            className="p-2 rounded border focus:outline-none" 
          />
        </div>

        {/* AI Summary display */}
        {(isLoadingAI || aiSummary) && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            {isLoadingAI ? (
              <div className="text-gray-500">Generating summary...</div>
            ) : (
              <div className="text-gray-600">{aiSummary}</div>
            )}
          </div>
        )}

        {/* Collapsible textarea section */}
        <div className={`transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-[400px] p-4 border rounded-lg resize-none focus:outline-none"
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
      <div>{format(new Date(entry.date), 'dd/MM/yy')}</div>  {/* Changed format */}
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