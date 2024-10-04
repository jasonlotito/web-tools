'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X, Printer, RefreshCw, Save, Trash, ChevronDown, ChevronUp, Minimize, Eye, EyeOff, Download } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Switch } from "@/components/ui/switch"

type Direction = 'horizontal' | 'vertical' | 'diagonal'
type WordPosition = { word: string; startX: number; startY: number; direction: Direction }
type SavedPuzzle = { name: string; words: string[]; grid: string[][]; wordPositions: WordPosition[]; gridSize: number }

const MAX_GRID_SIZE = 30
const HIGHLIGHT_DURATION = 2000 // 2 seconds
const MAX_PLACEMENT_ATTEMPTS = 1000

const WordSearch: React.FC = () => {
  const [words, setWords] = useState<string[]>([])
  const [newWords, setNewWords] = useState('')
  const [grid, setGrid] = useState<string[][]>([])
  const [wordPositions, setWordPositions] = useState<WordPosition[]>([])
  const [highlightedWord, setHighlightedWord] = useState<string | null>(null)
  const [gridSize, setGridSize] = useState(0)
  const [puzzleName, setPuzzleName] = useState('')
  const [savedPuzzles, setSavedPuzzles] = useState<string[]>([])
  const [selectedPuzzle, setSelectedPuzzle] = useState<string | null>(null)
  const [pageTitle, setPageTitle] = useState('Word Search Generator')
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSolutions, setShowSolutions] = useState(false)
  const [currentSelectedPuzzle, setCurrentSelectedPuzzle] = useState<string | null>(null)
  const [allowDiagonal, setAllowDiagonal] = useState(true)
  const [limitLetters, setLimitLetters] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    document.title = pageTitle
  }, [pageTitle])

  useEffect(() => {
    if (words.length > 0) {
      generateWordSearch()
    } else {
      setGrid([])
      setWordPositions([])
      setGridSize(0)
    }
  }, [words, allowDiagonal, limitLetters])

  useEffect(() => {
    inputRef.current?.focus()
    loadSavedPuzzles()
  }, [])

  const loadSavedPuzzles = () => {
    const puzzles = Object.keys(localStorage).filter(key => key.startsWith('wordSearch_'))
    setSavedPuzzles(puzzles.map(key => key.replace('wordSearch_', '')))
  }

  const addWords = () => {
    if (newWords) {
      const wordsArray = newWords
        .split(/[\n,]+/)
        .map(word => word.trim().toUpperCase())
        .filter(word => word && !words.includes(word))

      setWords([...words, ...wordsArray])
      setNewWords('')
      inputRef.current?.focus()
    }
  }

  const removeWord = (wordToRemove: string) => {
    setWords(words.filter(word => word !== wordToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      addWords()
    }
  }

  const generateWordSearch = () => {
    let currentGridSize = Math.max(...words.map(word => word.length), 10)
    let success = false

    while (!success && currentGridSize <= MAX_GRID_SIZE) {
      let newGrid = Array(currentGridSize).fill(null).map(() => Array(currentGridSize).fill(''))
      let newWordPositions: WordPosition[] = []
      success = true

      for (const word of words) {
        let placed = false
        let attempts = 0

        while (!placed && attempts < MAX_PLACEMENT_ATTEMPTS) {
          const directions: Direction[] = allowDiagonal ? ['horizontal', 'vertical', 'diagonal'] : ['horizontal', 'vertical']
          const direction = directions[Math.floor(Math.random() * directions.length)]
          const [startX, startY] = [
            Math.floor(Math.random() * currentGridSize),
            Math.floor(Math.random() * currentGridSize)
          ]

          if (canPlaceWord(newGrid, word, startX, startY, direction)) {
            placeWord(newGrid, word, startX, startY, direction)
            newWordPositions.push({ word, startX, startY, direction })
            placed = true
          }

          attempts++
        }

        if (!placed) {
          success = false
          break
        }
      }

      if (success) {
        const usedLetters = limitLetters ? Array.from(new Set(words.join(''))) : []
        for (let i = 0; i < currentGridSize; i++) {
          for (let j = 0; j < currentGridSize; j++) {
            if (newGrid[i][j] === '') {
              if (limitLetters && usedLetters.length > 0) {
                newGrid[i][j] = usedLetters[Math.floor(Math.random() * usedLetters.length)]
              } else {
                newGrid[i][j] = String.fromCharCode(65 + Math.floor(Math.random() * 26))
              }
            }
          }
        }

        setGrid(newGrid)
        setWordPositions(newWordPositions)
        setGridSize(currentGridSize)
      } else {
        currentGridSize++
      }
    }

    if (!success) {
      console.error("Failed to generate word search with the given words.")
    }
  }

  const findLowestGridSize = async () => {
    setIsProcessing(true)
    let lowestSize = MAX_GRID_SIZE
    let bestGrid: string[][] = []
    let bestWordPositions: WordPosition[] = []

    for (let i = 0; i < 100; i++) {
      let currentGridSize = Math.max(...words.map(word => word.length), 10)
      let success = false

      while (!success && currentGridSize <= MAX_GRID_SIZE) {
        let newGrid = Array(currentGridSize).fill(null).map(() => Array(currentGridSize).fill(''))
        let newWordPositions: WordPosition[] = []
        success = true

        for (const word of words) {
          let placed = false
          let attempts = 0

          while (!placed && attempts < MAX_PLACEMENT_ATTEMPTS) {
            const directions: Direction[] = allowDiagonal ? ['horizontal', 'vertical', 'diagonal'] : ['horizontal', 'vertical']
            const direction = directions[Math.floor(Math.random() * directions.length)]
            const [startX, startY] = [
              Math.floor(Math.random() * currentGridSize),
              Math.floor(Math.random() * currentGridSize)
            ]

            if (canPlaceWord(newGrid, word, startX, startY, direction)) {
              placeWord(newGrid, word, startX, startY, direction)
              newWordPositions.push({ word, startX, startY, direction })
              placed = true
            }

            attempts++
          }

          if (!placed) {
            success = false
            break
          }
        }

        if (success) {
          const usedLetters = limitLetters ? Array.from(new Set(words.join(''))) : []
          for (let i = 0; i < currentGridSize; i++) {
            for (let j = 0; j < currentGridSize; j++) {
              if (newGrid[i][j] === '') {
                if (limitLetters && usedLetters.length > 0) {
                  newGrid[i][j] = usedLetters[Math.floor(Math.random() * usedLetters.length)]
                } else {
                  newGrid[i][j] = String.fromCharCode(65 + Math.floor(Math.random() * 26))
                }
              }
            }
          }

          if (currentGridSize < lowestSize) {
            lowestSize = currentGridSize
            bestGrid = newGrid
            bestWordPositions = newWordPositions
          }
          break
        } else {
          currentGridSize++
        }
      }

      // Allow UI to update
      await new Promise(resolve => setTimeout(resolve, 0))
    }

    setGrid(bestGrid)
    setWordPositions(bestWordPositions)
    setGridSize(lowestSize)
    setIsProcessing(false)
  }

  const canPlaceWord = (grid: string[][], word: string, startX: number, startY: number, direction: Direction): boolean => {
    const dx = direction === 'horizontal' ? 1 : direction === 'diagonal' ? 1 : 0
    const dy = direction === 'vertical' ? 1 : direction === 'diagonal' ? 1 : 0

    if (startX + word.length * dx > grid.length || startY + word.length * dy > grid.length) {
      return false
    }

    for (let i = 0; i < word.length; i++) {
      const x = startX + i * dx
      const y = startY + i * dy
      if (grid[y][x] !== '' && grid[y][x] !== word[i]) {
        return false
      }
    }

    return true
  }

  const placeWord = (grid: string[][], word: string, startX: number, startY: number, direction: Direction) => {
    const dx = direction === 'horizontal' ? 1 : direction === 'diagonal' ? 1 : 0
    const dy = direction === 'vertical' ? 1 : direction === 'diagonal' ? 1 : 0

    for (let i = 0; i < word.length; i++) {
      const x = startX + i * dx
      const y = startY + i * dy
      grid[y][x] = word[i]
    }
  }

  const highlightWord = (word: string) => {
    setHighlightedWord(word)
    setTimeout(() => setHighlightedWord(null), HIGHLIGHT_DURATION)
  }

  const isLetterHighlighted = (rowIndex: number, colIndex: number): boolean => {
    if (!highlightedWord) return false

    const wordPosition = wordPositions.find(pos => pos.word === highlightedWord)
    if (!wordPosition) return false

    const { startX, startY, direction } = wordPosition
    const dx = direction === 'horizontal' ? 1 : direction === 'diagonal' ? 1 : 0
    const dy = direction === 'vertical' ? 1 : direction === 'diagonal' ? 1 : 0

    for (let i = 0; i < highlightedWord.length; i++) {
      if (startX + i * dx === colIndex && startY + i * dy === rowIndex) {
        return true
      }
    }

    return false
  }

  const isLetterSolution = (rowIndex: number, colIndex: number): boolean => {
    return wordPositions.some(({ startX, startY, direction, word }) => {
      const dx = direction === 'horizontal' ? 1 : direction === 'diagonal' ? 1 : 0
      const dy = direction === 'vertical' ? 1 : direction === 'diagonal' ? 1 : 0

      for (let i = 0; i < word.length; i++) {
        if (startX + i * dx === colIndex && startY + i * dy === rowIndex) {
          return true
        }
      }
      return false
    })
  }

  const savePuzzle = () => {
    if (puzzleName && words.length > 0) {
      const puzzle: SavedPuzzle = { name: puzzleName, words, grid, wordPositions, gridSize }
      localStorage.setItem(`wordSearch_${puzzleName}`, JSON.stringify(puzzle))
      loadSavedPuzzles()
      setPuzzleName('')
      setPageTitle(`Word Search: ${puzzleName}`)
    }
  }

  const loadPuzzle = (name: string) => {
    const puzzleString = localStorage.getItem(`wordSearch_${name}`)
    if (puzzleString) {
      const puzzle: SavedPuzzle = JSON.parse(puzzleString)
      setWords(puzzle.words)
      setGrid(puzzle.grid)
      setWordPositions(puzzle.wordPositions)
      setGridSize(puzzle.gridSize)
      setSelectedPuzzle(name)
      setPageTitle(`Word Search: ${name}`)
    }
  }

  const removePuzzle = (name: string) => {
    localStorage.removeItem(`wordSearch_${name}`)
    loadSavedPuzzles()
    if (selectedPuzzle === name) {
      setSelectedPuzzle(null)
      setPageTitle('Word Search Generator')
    }
  }

  const resetPuzzle = () => {
    setWords([])
    setGrid([])
    setWordPositions([])
    setGridSize(0)
    setSelectedPuzzle(null)
    setPuzzleName('')
    setPageTitle('Word Search Generator')
  }

  const regeneratePuzzle = () => {
    generateWordSearch()
  }

  const printPuzzle = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${pageTitle}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                max-width: 800px; 
                margin: 0 auto; 
                padding: 20px;
              }
              h1 { 
                text-align: center; 
                color: #333;
                margin-bottom: 20px;
              }
              .grid-container {
                display: flex;
                justify-content: center;
                margin-bottom: 30px;
              }
              .grid { 
                display: inline-grid; 
                grid-template-columns: repeat(${gridSize}, 1fr); 
                gap: 1px; 
                border: 2px solid #333;
              }
              .cell { 
                width: 30px; 
                height: 30px; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                border: 1px solid #ccc; 
                font-weight: bold;
                font-size: 18px;
              }
              .solution {
                background-color: #ffff00;
              }
              .words { 
                columns: 3;
                column-gap: 20px;
              }
              .word-item {
                break-inside: avoid-column;
                margin-bottom: 5px;
              }
              @media print {
                body { max-width: 100%; }
                .grid { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <h1>${pageTitle}</h1>
            <div class="grid-container">
              <div class="grid">
                ${grid.map((row, rowIndex) => 
                  row.map((cell, colIndex) => 
                    `<div class="cell${showSolutions && isLetterSolution(rowIndex, colIndex) ? ' solution' : ''}">${cell}</div>`
                  ).join('')
                ).join('')}
              </div>
            </div>
            <h2>Words to find:</h2>
            <div class="words">
              ${words.map(word => `<div class="word-item">${word}</div>`).join('')}
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{pageTitle}</h1>

      {/* All controls moved to the top */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              type="text"
              value={puzzleName}
              onChange={(e) => setPuzzleName(e.target.value)}
              placeholder="Enter puzzle name"
              className="flex-grow"
            />
            <Button onClick={savePuzzle} disabled={!puzzleName || words.length === 0}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
          <div className="flex gap-2">
            <Select
              onValueChange={(value) => setCurrentSelectedPuzzle(value)}
              value={currentSelectedPuzzle || undefined}
            >
              <SelectTrigger className="flex-grow">
                <SelectValue placeholder="Select saved puzzle" />
              </SelectTrigger>
              <SelectContent>
                {savedPuzzles.map((name) => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => currentSelectedPuzzle && loadPuzzle(currentSelectedPuzzle)}
              disabled={!currentSelectedPuzzle}
            >
              <Download className="w-4 h-4 mr-2" />
              Load
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={!currentSelectedPuzzle}>
                  <Trash className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the saved puzzle.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => currentSelectedPuzzle && removePuzzle(currentSelectedPuzzle)}>
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">Reset Puzzle</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will remove all words and reset the grid. You will lose any unsaved progress.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={resetPuzzle}>Reset</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={regeneratePuzzle} disabled={words.length === 0}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Regenerate
          </Button>
          <Button onClick={printPuzzle} disabled={grid.length === 0}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Advanced Settings Section */}
      <Collapsible
        open={isAdvancedSettingsOpen}
        onOpenChange={setIsAdvancedSettingsOpen}
        className="mb-4"
      >
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="flex items-center justify-between w-full">
            Advanced Settings
            {isAdvancedSettingsOpen ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-2">
          <Button
            onClick={findLowestGridSize}
            disabled={words.length === 0 || isProcessing}
            className="w-full"
          >
            <Minimize className="w-4 h-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Find Lowest Grid Size'}
          </Button>
          <div className="flex items-center justify-between">
            <Label htmlFor="show-solutions" className="text-sm font-medium">
              Show Solutions
            </Label>
            <Switch
              id="show-solutions"
              checked={showSolutions}
              onCheckedChange={setShowSolutions}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="allow-diagonal" className="text-sm font-medium">
              Allow Diagonal Words
            </Label>
            <Switch
              id="allow-diagonal"
              checked={allowDiagonal}
              onCheckedChange={setAllowDiagonal}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="limit-letters" className="text-sm font-medium">
              Limit Letters to Words
            </Label>
            <Switch
              id="limit-letters"
              checked={limitLetters}
              onCheckedChange={setLimitLetters}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="mb-4 space-y-2">
        <Label htmlFor="new-words">Add words:</Label>
        <Textarea
          id="new-words"
          value={newWords}
          onChange={(e) => setNewWords(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter words (separated by new lines or commas)"
          className="w-full h-24"
          ref={inputRef}
        />
        <Button onClick={addWords} className="w-full">Add Words</Button>
      </div>
      {grid.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Word Search Grid (Size: {gridSize}x{gridSize}):</h2>
          <div
            className="grid gap-1 w-max mx-auto border border-gray-300"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`
            }}
          >
            {grid.map((row, rowIndex) =>
              row.map((letter, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`w-6 h-6 flex items-center justify-center border border-gray-300 font-bold text-xs transition-colors duration-300 ${
                    isLetterHighlighted(rowIndex, colIndex) ? 'bg-primary text-primary-foreground' :
                    showSolutions && isLetterSolution(rowIndex, colIndex) ? 'bg-yellow-200' : ''
                  }`}
                >
                  {letter}
                </div>
              ))
            )}
          </div>
        </div>
      )}
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Words to find:</h2>
        <div className="grid grid-cols-2 gap-4">
          {[0, 1].map(columnIndex => (
            <ul key={columnIndex} className="space-y-2">
              {words.filter((_, index) => index % 2 === columnIndex).map((word) => (
                <li
                  key={word}
                  className="flex items-center justify-between"
                >
                  <span
                    className="cursor-pointer hover:text-primary"
                    onClick={() => highlightWord(word)}
                  >
                    {word}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeWord(word)}
                    className="h-6 w-6"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  )
}

export default WordSearch
