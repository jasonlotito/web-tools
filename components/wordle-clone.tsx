'use client'

import { useState, useEffect, KeyboardEvent } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {Words} from "@/components/data/words";

const WORD_LENGTH = 5
const MAX_GUESSES = 6
const TOTAL_WORDS = 5
const SEED_WORDS = Words

type LetterStatus = 'unused' | 'wrong' | 'misplaced' | 'correct'

export function WordleCloneComponent() {
  const [secretWords, setSecretWords] = useState<string[]>([])
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [guesses, setGuesses] = useState<string[]>([])
  const [currentGuess, setCurrentGuess] = useState('')
  const [gameOver, setGameOver] = useState(false)
  const [letterStatuses, setLetterStatuses] = useState<Record<string, LetterStatus>>({})
  const [timer, setTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [wordTimes, setWordTimes] = useState<number[]>([])
  const [wordGuesses, setWordGuesses] = useState<number[]>([])
  const [seed, setSeed] = useState('')
  const [notification, setNotification] = useState<string | null>(null)
  const [unguessedWords, setUnguessedWords] = useState<number[]>([])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isTimerRunning && !gameOver) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1)
      }, 1000)
    } else if ((!isTimerRunning || gameOver) && timer !== 0) {
      clearInterval(interval!)
    }
    return () => clearInterval(interval!)
  }, [isTimerRunning, gameOver, timer])

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const getDefaultSeed = () => {
    const today = new Date()
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
  }

  const resetGame = (newSeed?: string) => {
    const seedToUse = newSeed || getDefaultSeed()
    setSeed(seedToUse)
    const seededRandom = (seed: string) => {
      let hash = 0
      for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32bit integer
      }
      return () => {
        hash = (hash * 16807) % 2147483647
        return (hash - 1) / 2147483646
      }
    }
    const random = seededRandom(seedToUse)
    const shuffled = [...SEED_WORDS].sort(() => random() - 0.5)
    setSecretWords(shuffled.slice(0, TOTAL_WORDS))
    setCurrentWordIndex(0)
    setGuesses([])
    setCurrentGuess('')
    setGameOver(false)
    setLetterStatuses({})
    setTimer(0)
    setIsTimerRunning(false)
    setWordTimes([])
    setWordGuesses([])
  }

  useEffect(() => {
    resetGame()
  }, [])

  const handleGuess = () => {
    if (currentGuess.length !== WORD_LENGTH) return
    if (!SEED_WORDS.includes(currentGuess.toUpperCase())) {
      setNotification("Not a valid word!")
      return
    }

    if (!isTimerRunning) {
      setIsTimerRunning(true)
    }

    const newGuesses = [...guesses, currentGuess.toUpperCase()]
    setGuesses(newGuesses)
    updateLetterStatuses(currentGuess.toUpperCase())
    setCurrentGuess('')

    if (currentGuess.toUpperCase() === secretWords[currentWordIndex].toUpperCase()) {
      const newWordTimes = [...wordTimes, timer]
      setWordTimes(newWordTimes)
      const newWordGuesses = [...wordGuesses, newGuesses.length]
      setWordGuesses(newWordGuesses)

      if (currentWordIndex === TOTAL_WORDS - 1) {
        setGameOver(true)
        setIsTimerRunning(false)
      } else {
        setCurrentWordIndex(currentWordIndex + 1)
        setGuesses([])
        setLetterStatuses({})
      }
    } else if (newGuesses.length >= MAX_GUESSES) {
      const newWordTimes = [...wordTimes, timer]
      setWordTimes(newWordTimes)
      const newWordGuesses = [...wordGuesses, MAX_GUESSES]
      setWordGuesses(newWordGuesses)
      const newUnguessedWords = [...unguessedWords, currentWordIndex]
      setUnguessedWords(newUnguessedWords)

      if (currentWordIndex === TOTAL_WORDS - 1) {
        setGameOver(true)
        setIsTimerRunning(false)
      } else {
        setCurrentWordIndex(currentWordIndex + 1)
        setGuesses([])
        setLetterStatuses({})
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentGuess.length === WORD_LENGTH) {
      e.preventDefault()
      handleGuess()
    }
  }

  const updateLetterStatuses = (guess: string) => {
    const newStatuses = { ...letterStatuses }
    const currentWord = secretWords[currentWordIndex]

    guess.split('').forEach((letter, index) => {
      if (currentWord[index] === letter) {
        newStatuses[letter] = 'correct'
      } else if (currentWord.includes(letter)) {
        if (newStatuses[letter] !== 'correct') {
          newStatuses[letter] = 'misplaced'
        }
      } else {
        if (!newStatuses[letter]) {
          newStatuses[letter] = 'wrong'
        }
      }
    })

    setLetterStatuses(newStatuses)
  }

  const renderGuess = (guess: string) => {
    const currentWord = secretWords[currentWordIndex]
    return guess.split('').map((letter, i) => {
      let backgroundColor = 'bg-gray-500'
      if (currentWord[i] === letter) {
        backgroundColor = 'bg-green-500'
      } else if (currentWord.includes(letter)) {
        backgroundColor = 'bg-yellow-500'
      }
      return (
        <div key={i} className={`w-12 h-12 ${backgroundColor} text-white font-bold text-2xl flex items-center justify-center`}>
          {letter}
        </div>
      )
    })
  }

  const renderKeyboard = () => {
    const keyboardRows = [
      'QWERTYUIOP'.split(''),
      'ASDFGHJKL'.split(''),
      'ZXCVBNM'.split('')
    ]

    return (
      <div className="mt-4">
        {keyboardRows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center mb-2">
            {row.map((letter) => {
              let bgColor = 'bg-gray-300'
              let textColor = 'text-black'
              switch (letterStatuses[letter]) {
                case 'correct':
                  bgColor = 'bg-green-500'
                  textColor = 'text-white'
                  break
                case 'misplaced':
                  bgColor = 'bg-yellow-500'
                  textColor = 'text-white'
                  break
                case 'wrong':
                  bgColor = 'bg-gray-500'
                  textColor = 'text-white'
                  break
              }
              return (
                <div
                  key={letter}
                  className={`w-8 h-10 ${bgColor} ${textColor} font-bold text-sm flex items-center justify-center m-0.5 rounded`}
                >
                  {letter}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getTextResults = () => {
    let results = `Wordle Speed Run Results (Seed: ${seed})\n\n`
    wordGuesses.forEach((guesses, index) => {
      const time = wordTimes[index] - (index > 0 ? wordTimes[index - 1] : 0)
      const status = unguessedWords.includes(index) ? "Not guessed" : "Guessed"
      results += `Word ${index + 1}: Time: ${formatTime(time)} - Guesses: ${guesses} - Status: ${status}\n`
    })
    results += `\nTotal Time: ${formatTime(timer)}`
    results += `\nWords not guessed: ${unguessedWords.length}`
    return results
  }

  const copyResults = () => {
    const textResults = getTextResults()
    navigator.clipboard.writeText(textResults).then(() => {
      setNotification("Results copied to clipboard!")
    }, (err) => {
      console.error('Could not copy text: ', err)
      setNotification("Failed to copy results. Please try again.")
    })
  }

  const getRandomSeed = () => {
    return Math.random().toString(36).substring(2, 15)
  }

  return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <h1 className="text-4xl font-bold mb-4">Wordle Speed Run</h1>
        <div className="flex justify-between w-full max-w-md mb-4">
          <div className="text-xl font-bold">Timer: {formatTime(timer)}</div>
          <div className="text-xl font-bold">Word: {currentWordIndex + 1}/{TOTAL_WORDS}</div>
        </div>
        <div className="grid gap-2 mb-4">
          {guesses.map((guess, i) => (
              <div key={i} className="flex gap-2">
                {renderGuess(guess)}
              </div>
          ))}
          {[...Array(MAX_GUESSES - guesses.length)].map((_, i) => (
              <div key={i} className="flex gap-2">
                {[...Array(WORD_LENGTH)].map((_, j) => (
                    <div key={j} className="w-12 h-12 bg-gray-300 border border-gray-400"></div>
                ))}
              </div>
          ))}
        </div>
        {!gameOver && (
            <div className="flex gap-2 mb-4">
              <Input
                  type="text"
                  value={currentGuess}
                  onChange={(e) => setCurrentGuess(e.target.value.toUpperCase())}
                  onKeyDown={handleKeyDown}
                  maxLength={WORD_LENGTH}
                  className="text-center text-2xl font-bold uppercase"
              />
              <Button onClick={handleGuess}>Guess</Button>
            </div>
        )}
        {gameOver && (
            <div className="text-2xl font-bold mt-4 mb-4">
              Game Over! Final Time: {formatTime(timer)}
            </div>
        )}
        {renderKeyboard()}
        <div className="mt-4">
          <h2 className="text-2xl font-bold mb-2">Results:</h2>
          {wordTimes.map((time, index) => (
              <div key={index} className="mb-2">
                Word {index + 1}:
                Time: {formatTime(time - (index > 0 ? wordTimes[index - 1] : 0))} -
                Guesses: {wordGuesses[index]} -
                Status: {unguessedWords.includes(index) ? "Not guessed" : "Guessed"}
              </div>
          ))}
          <div className="mt-2 font-bold">
            Words not guessed: {unguessedWords.length}
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => resetGame()}>New Game</Button>
          <Input
              type="text"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="Enter seed"
              className="w-40"
          />
          <Button onClick={() => resetGame(seed)}>Use Seed</Button>
        </div>
        {gameOver && (
            <div className="mt-4 flex gap-2">
              <Button onClick={copyResults}>Copy Results</Button>
              <Button onClick={() => resetGame(getRandomSeed())}>Try Random Seed</Button>
            </div>
        )}
        {notification && (
            <div className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded shadow-lg">
              {notification}
            </div>
        )}
      </div>
  )
}
