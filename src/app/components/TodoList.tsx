"use client";
import { useState, useRef, useEffect } from 'react';
import { ChevronUpIcon, PlusIcon, MinusIcon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/solid';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface Todo {
  id: string;
  content: string;
  completed: boolean;
  order: number;
}

export default function TodoList() {
  const [isOpen, setIsOpen] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTodos();
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await fetch('/api/todos');
      if (!response.ok) {
        throw new Error('Failed to fetch todos');
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setTodos(data);
      } else {
        console.error('Unexpected data format:', data);
      }
    } catch (error) {
      console.error('Failed to fetch todos:', error);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  const addTodo = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTodo.trim()) {
      try {
        const response = await fetch('/api/todos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: newTodo.trim() }),
        });
        
        if (!response.ok) throw new Error('Failed to add todo');
        
        const todo = await response.json();
        setTodos(prevTodos => [...prevTodos, todo]);
        setNewTodo('');
        setIsAdding(false);
      } catch (error) {
        console.error('Failed to add todo:', error);
      }
    }
  };

  const toggleComplete = async (id: string, completed: boolean) => {
    console.log('Toggling todo:', id, 'to', completed);
    try {
      const response = await fetch('/api/todos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, completed }),
      });
      
      if (!response.ok) {
        console.error('Server response not ok:', await response.text());
        throw new Error('Failed to update todo');
      }
      
      const updatedTodo = await response.json();
      console.log('Server response:', updatedTodo);
      
      setTodos(prevTodos => 
        prevTodos.map(todo => 
          todo.id === id ? { ...todo, completed } : todo
        )
      );
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const deleteTodo = async (id: string) => {
    console.log('Deleting todo:', id);
    try {
      const response = await fetch(`/api/todos?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        console.error('Server response not ok:', await response.text());
        throw new Error('Failed to delete todo');
      }
      
      console.log('Delete successful');
      setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  // Add this new sensors setup
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Add this new drag end handler
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setTodos((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update order in database
        fetch('/api/todos', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: active.id,
            order: newIndex,
          }),
        }).catch(console.error);
        
        return newItems;
      });
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1" /> {/* Empty div for spacing */}
          <div>To do</div>
          <div className="flex-1 flex justify-end">
            {isOpen ? (
              <ChevronUpIcon className="h-4 w-4" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" />
            )}
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 -mt-1 bg-white rounded-lg border shadow-lg z-10">
          <div className="p-4" style={{ 
            maxHeight: 'calc(100vh - 300px)', 
            overflowY: 'auto'
          }}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={todos} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {todos.map((todo) => (
                    <SortableItem
                      key={todo.id}
                      todo={todo}
                      onToggle={toggleComplete}
                      onDelete={deleteTodo}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {isAdding ? (
              <input
                ref={inputRef}
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyDown={addTodo}
                className="mt-4 w-full p-2 border rounded text-gray-600 focus:outline-none"
                placeholder="Add new todo..."
                autoFocus
              />
            ) : (
              <button
                onClick={() => setIsAdding(true)}
                className="mt-4 w-full flex justify-center items-center p-2 text-gray-400 hover:text-gray-600"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SortableItem({ todo, onToggle, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: todo.id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
    >
      {/* Drag handle - changed from ⋮ to = */}
      <div {...attributes} {...listeners} className="cursor-move px-2 text-gray-400 hover:text-gray-600">
        =
      </div>

      <span className={`flex-1 text-gray-600 pl-4 ${todo.completed ? 'line-through text-gray-400' : ''}`}>
        {todo.content}
      </span>

      <div className="flex space-x-2">
        <button
          onClick={() => onToggle(todo.id, !todo.completed)}
          className="text-gray-400 hover:text-gray-600"
        >
          <MinusIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(todo.id)}
          className="text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}