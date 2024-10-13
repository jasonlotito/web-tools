'use client'

import { useState, useRef, useEffect } from 'react'

interface EditableTextProps {
  initialText: string
  onChange: (value: string) => void
  onClose: (value: string) => void
}

export function EditableTextComponent({ initialText, onChange, onClose }: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [text, setText] = useState(initialText)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleClick = () => {
    setIsEditing(true)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setText(newValue)
    onChange(newValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditing(false)
      onClose(text)
    }
  }

  const handleBlur = () => {
    setIsEditing(false)
    onClose(text)
  }

  return (
    <div className="inline-block">
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        <span
          onClick={handleClick}
          className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
        >
          {text}
        </span>
      )}
    </div>
  )
}