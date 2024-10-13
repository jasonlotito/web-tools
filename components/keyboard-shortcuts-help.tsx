'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.shiftKey && event.key === '?') {
        setIsOpen(prev => !prev)
      } else if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const shortcuts = [
    {
      section: 'Navigation',
      items: [
        { keys: ['g', 'h'], description: 'Go to Home' },
        { keys: ['g', 'n'], description: 'Go to Notifications' },
      ]
    },
    {
      section: 'Actions',
      items: [
        { keys: ['n'], description: 'New post' },
        { keys: ['l'], description: 'Like post' },
      ]
    },
    {
      section: 'Other',
      items: [
        { keys: ['?'], description: 'Open this help dialog' },
        { keys: ['Esc'], description: 'Close this dialog' },
      ]
    }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[850px]">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {shortcuts.map((section, index) => (
              <div key={index} className="space-y-3">
                <h3 className="text-lg font-semibold">{section.section}</h3>
                <ul className="space-y-2">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center justify-between">
                      <span>{item.description}</span>
                      <div className="flex space-x-1">
                        {item.keys.map((key, keyIndex) => (
                          <kbd key={keyIndex} className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}