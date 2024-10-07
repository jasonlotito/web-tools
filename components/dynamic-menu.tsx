"use client"

import { useState } from 'react'
import WordSearch from "@/components/word-search";
import {WordleCloneComponent} from "@/components/wordle-clone";
import {TextToJsonConverter} from "@/components/text-to-json-converter";

const navItems = [
  { name: 'Word Search', component: WordSearch },
  { name: 'Wordle Run', component: WordleCloneComponent },
  { name: 'Text2JSON', component: TextToJsonConverter }
]

export function DynamicMenuComponent() {
  const [activeComponentIndex, setActiveComponentIndex] = useState(0)

  const ActiveComponent = navItems[activeComponentIndex].component

  return (
    <div className="flex flex-col min-h-screen">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-gray-800">wkfa</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map((item, index) => (
                  <button
                    key={item.name}
                    onClick={() => setActiveComponentIndex(index)}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      activeComponentIndex === index
                        ? 'border-primary text-primary-background'
                        : 'border-transparent text-muted-foreground hover:border-muted hover:text-foreground'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="-mr-2 flex items-center sm:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                aria-controls="mobile-menu"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="sm:hidden" id="mobile-menu">
          <div className="pt-2 pb-3 space-y-1">
            {navItems.map((item, index) => (
              <button
                key={item.name}
                onClick={() => setActiveComponentIndex(index)}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left ${
                  activeComponentIndex === index
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:bg-accent hover:border-muted hover:text-foreground'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="flex-grow bg-background">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <ActiveComponent />
        </div>
      </main>
    </div>
  )
}
