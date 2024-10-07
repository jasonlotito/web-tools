"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Check, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "../hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

export function TextToJsonConverter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [options, setOptions] = useState({
    uppercase: false,
    lowercase: false,
    sort: false,
    reverseSort: false,
  })

  const convertToJSON = () => {
    let lines = input.split('\n').filter(line => line.trim() !== '')

    if (options.uppercase) {
      lines = lines.map(line => line.toUpperCase())
    } else if (options.lowercase) {
      lines = lines.map(line => line.toLowerCase())
    }

    if (options.sort) {
      lines.sort((a, b) => a.localeCompare(b))
    } else if (options.reverseSort) {
      lines.sort((a, b) => b.localeCompare(a))
    }

    const jsonArray = JSON.stringify(lines, null, 2)
    setOutput(jsonArray)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output)
      setIsCopied(true)
      toast({
        title: "Copied to clipboard",
        description: "The JSON has been copied to your clipboard.",
      })
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
      toast({
        title: "Copy failed",
        description: "Failed to copy the JSON to your clipboard.",
        variant: "destructive",
      })
    }
  }

  const toggleOption = (option: keyof typeof options) => {
    setOptions(prev => {
      const newOptions = { ...prev, [option]: !prev[option] }

      // Make uppercase and lowercase mutually exclusive
      if (option === 'uppercase' && newOptions.uppercase) {
        newOptions.lowercase = false
      } else if (option === 'lowercase' && newOptions.lowercase) {
        newOptions.uppercase = false
      }

      // Make sort and reverseSort mutually exclusive
      if (option === 'sort' && newOptions.sort) {
        newOptions.reverseSort = false
      } else if (option === 'reverseSort' && newOptions.reverseSort) {
        newOptions.sort = false
      }

      return newOptions
    })
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold text-center">Text to JSON Converter</h1>
      <Textarea
        placeholder="Enter your text here, one item per line..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="h-40"
      />
      <Collapsible
        open={isAdvancedOpen}
        onOpenChange={setIsAdvancedOpen}
        className="space-y-2"
      >
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="flex items-center justify-between w-full">
            Advanced Options
            {isAdvancedOpen ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="uppercase"
              checked={options.uppercase}
              onCheckedChange={() => toggleOption('uppercase')}
            />
            <Label htmlFor="uppercase">Uppercase</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="lowercase"
              checked={options.lowercase}
              onCheckedChange={() => toggleOption('lowercase')}
            />
            <Label htmlFor="lowercase">Lowercase</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="sort"
              checked={options.sort}
              onCheckedChange={() => toggleOption('sort')}
            />
            <Label htmlFor="sort">Sort</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="reverseSort"
              checked={options.reverseSort}
              onCheckedChange={() => toggleOption('reverseSort')}
            />
            <Label htmlFor="reverseSort">Reverse Sort</Label>
          </div>
        </CollapsibleContent>
      </Collapsible>
      <Button onClick={convertToJSON} className="w-full">
        Convert to JSON
      </Button>
      {output && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold">JSON Output:</h2>
            <Button
              onClick={copyToClipboard}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {isCopied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy to Clipboard
                </>
              )}
            </Button>
          </div>
          <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
            <code>{output}</code>
          </pre>
        </div>
      )}
    </div>
  )
}
