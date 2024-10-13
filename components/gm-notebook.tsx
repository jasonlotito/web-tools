"use client"

import {useCallback, useEffect, useRef, useState} from "react"
import {
  Bold,
  Check,
  Edit2,
  GripVertical,
  Italic,
  Link,
  List,
  ListOrdered,
  Pencil,
  Plus,
  Search,
  Tag as TagIcon,
  Trash2,
  Underline,
  X
} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Textarea} from "@/components/ui/textarea"
import {Input} from "@/components/ui/input"
import {Badge} from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import {Label} from "@/components/ui/label"
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import ReactMarkdown from 'react-markdown'
import {EditableTextComponent} from "@/components/editable-text";
import {Column, Note, Notebook} from "./data";

const ResizableColumn: React.FC<{
  column: Column
  children: React.ReactNode
  onResize: (id: number, newWidth: number) => void
  onAddNote: (columnId: number) => void
}> = ({ column, children, onResize, onAddNote }) => {
  const [isResizing, setIsResizing] = useState(false)
  const columnRef = useRef<HTMLDivElement>(null)

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  const stopResizing = useCallback(() => {
    setIsResizing(false)
  }, [])

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing && columnRef.current) {
      const newWidth = e.clientX - columnRef.current.getBoundingClientRect().left
      if (newWidth >= 150 && newWidth <= 500) {
        onResize(column.id, newWidth)
      }
    }
  }, [isResizing, column.id, onResize])

  useEffect(() => {
    document.addEventListener('mousemove', resize)
    document.addEventListener('mouseup', stopResizing)
    return () => {
      document.removeEventListener('mousemove', resize)
      document.removeEventListener('mouseup', stopResizing)
    }
  }, [resize, stopResizing])

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div ref={columnRef} className="flex-shrink-0 relative h-full" style={{ width: `${column.width}px` }}>
          <div className="space-y-2 pr-2 h-full">
            {children}
          </div>
          <div
            className="absolute top-0 right-0 bottom-0 w-1 cursor-col-resize bg-gray-300 hover:bg-gray-400"
            onMouseDown={startResizing}
          />
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={() => onAddNote(column.id)}>
          Add Note
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

function addRelationship(notes: Note[], relationshipSourceNote: Note, relationshipTargetNote: Note, relationshipType: string) {
  const updatedNotes = notes.map(note => {
    if (note.id === relationshipSourceNote.id) {
      return {
        ...note,
        relationships: [...note.relationships, {
          id: relationshipTargetNote.id,
          type: relationshipType
        }]
      }
    }
    if (note.id === relationshipTargetNote.id) {
      return {
        ...note,
        relationships: [...note.relationships, {
          id: relationshipSourceNote.id,
          type: relationshipType
        }]
      }
    }
    return note
  })
  return updatedNotes;
}

export function GmNotebook() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [currentNotebook, setCurrentNotebook] = useState<Notebook | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [columns, setColumns] = useState<Column[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [nextId, setNextId] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [newTag, setNewTag] = useState("")
  const [draggedNote, setDraggedNote] = useState<Note | null>(null)
  const [editingColumn, setEditingColumn] = useState<Column | null>(null)
  const [newColumnName, setNewColumnName] = useState("")
  const [allTags, setAllTags] = useState<string[]>([])
  const [isNewNotebookDialogOpen, setIsNewNotebookDialogOpen] = useState(false)
  const [newNotebookName, setNewNotebookName] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteConfirmPhrase, setDeleteConfirmPhrase] = useState("")
  const [notesColumnWidth, setNotesColumnWidth] = useState(400)
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null)
  const [isEditingNotebookName, setIsEditingNotebookName] = useState(false)
  const [isCreatingRelationship, setIsCreatingRelationship] = useState(false)
  const [relationshipSourceNote, setRelationshipSourceNote] = useState<Note | null>(null)
  const [relationshipTargetNote, setRelationshipTargetNote] = useState<Note | null>(null)
  const [relationshipType, setRelationshipType] = useState("")
  const [isRelationshipDialogOpen, setIsRelationshipDialogOpen] = useState(false)
  const [editRelationship, setEditRelationship] = useState(0)

  const notesColumnRef = useRef<HTMLDivElement>(null)
  const relationshipInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isNotesResizing, setIsNotesResizing] = useState(false)

  useEffect(() => {
    const savedNotebooks = localStorage.getItem("notebooks")
    if (savedNotebooks) {
      const parsedNotebooks = JSON.parse(savedNotebooks)
      setNotebooks(parsedNotebooks)
      if (parsedNotebooks.length > 0) {
        setCurrentNotebook(parsedNotebooks[0])
        setNotes(parsedNotebooks[0].notes)
        setColumns(parsedNotebooks[0].columns)
        setAllTags(parsedNotebooks[0].allTags)
        setNextId(Math.max(...parsedNotebooks[0].notes.map((note: Note) => note.id)) + 1)
      } else {
        setIsNewNotebookDialogOpen(true)
      }
    } else {
      setIsNewNotebookDialogOpen(true)
    }
  }, [])

  useEffect(() => {
    if (currentNotebook) {
      const updatedNotebooks = notebooks.map(notebook =>
        notebook.id === currentNotebook.id ? { ...currentNotebook, notes, columns, allTags } : notebook
      )
      setNotebooks(updatedNotebooks)
      localStorage.setItem("notebooks", JSON.stringify(updatedNotebooks))
    }
  }, [currentNotebook, notes, columns, allTags])

  const createNewNotebook = () => {
    if (newNotebookName.trim()) {
      const newNotebook: Notebook = {
        id: Date.now().toString(),
        name: newNotebookName.trim(),
        notes: [],
        columns: [
          { id: 1, name: "Column 1", width: 250 },
          { id: 2, name: "Column 2", width: 250 },
          { id: 3, name: "Column 3", width: 250 },
        ],
        allTags: [],
      }
      setNotebooks([...notebooks, newNotebook])
      setCurrentNotebook(newNotebook)
      setNotes(newNotebook.notes)
      setColumns(newNotebook.columns)
      setAllTags(newNotebook.allTags)
      setNextId(1)
      setNewNotebookName("")
    }
    setIsNewNotebookDialogOpen(false)
  }

  const loadNotebook = (notebookId: string) => {
    const notebook = notebooks.find(nb => nb.id === notebookId)
    if (notebook) {
      setCurrentNotebook(notebook)
      setNotes(notebook.notes)
      setColumns(notebook.columns)
      setAllTags(notebook.allTags)
      setNextId(Math.max(...notebook.notes.map(note => note.id), 0) + 1)
      setIsEditingNotebookName(false)
    }
  }

  const deleteNotebook = () => {
    if (currentNotebook && deleteConfirmPhrase === `delete ${currentNotebook.name}`) {
      const updatedNotebooks = notebooks.filter(nb => nb.id !== currentNotebook.id)
      setNotebooks(updatedNotebooks)
      localStorage.setItem("notebooks", JSON.stringify(updatedNotebooks))
      
      if (updatedNotebooks.length > 0) {
        setCurrentNotebook(updatedNotebooks[0])
        setNotes(updatedNotebooks[0].notes)
        setColumns(updatedNotebooks[0].columns)
        setAllTags(updatedNotebooks[0].allTags)
        setNextId(Math.max(...updatedNotebooks[0].notes.map(note => note.id), 0) + 1)
      } else {
        setCurrentNotebook(null)
        setNotes([])
        setColumns([])
        setAllTags([])
        setNextId(1)
        setIsNewNotebookDialogOpen(true)
      }
    }
    setIsDeleteDialogOpen(false)
    setDeleteConfirmPhrase("")
  }

  const addNote = (column: number) => {
    const newNote: Note = {
      id: nextId,
      content: "New Note\n\nEnter your content here...",
      column,
      tags: [],
      relationships: [],
    }
    setNotes([...notes, newNote])
    setSelectedNote(newNote)
    setIsEditing(true)
    setNextId(nextId + 1)
  }

  const deleteNote = (noteId: number) => {
    setNotes(notes.filter(note => note.id !== noteId))
    if (selectedNote && selectedNote.id === noteId) {
      setSelectedNote(null)
      setIsEditing(false)
    }
    setNoteToDelete(null)
  }

  const updateNote = useCallback((updatedNote: Note) => {
    setNotes(notes.map((note) => (note.id === updatedNote.id ? updatedNote : note)))
  }, [notes])

  useEffect(() => {
    if (selectedNote && isEditing) {
      const timeoutId = setTimeout(() => {
        updateNote(selectedNote)
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [selectedNote, updateNote, isEditing])

  const getTitle = (content: string) => {
    const firstLine = content.split('\n')[0].trim()
    return firstLine || 'Untitled'
  }

  const addTag = (noteId: number, tag: string) => {
    const updatedNotes = notes.map((note) => {
      if (note.id === noteId && !note.tags.includes(tag)) {
        return { ...note, tags: [...note.tags, tag] }
      }
      return note
    })
    setNotes(updatedNotes)
    if (selectedNote && selectedNote.id === noteId) {
      setSelectedNote({ ...selectedNote, tags: [...selectedNote.tags, tag] })
    }
    if (!allTags.includes(tag)) {
      setAllTags([...allTags, tag])
    }
    setNewTag("")
  }

  const removeTag = (noteId: number, tagToRemove: string) => {
    const updatedNotes = notes.map((note) => {
      if (note.id === noteId) {
        return { ...note, tags: note.tags.filter((tag) => tag !== tagToRemove) }
      }
      return note
    })
    setNotes(updatedNotes)
    if (selectedNote && selectedNote.id === noteId) {
      setSelectedNote({ ...selectedNote, tags: selectedNote.tags.filter((tag) => tag !== tagToRemove) })
    }
  }

  const handleDragStart = (e: React.DragEvent, note: Note) => {
    setDraggedNote(note)
    e.dataTransfer.setData('text/plain', note.id.toString())
    e.currentTarget.style.opacity = '0.5'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetNote: Note) => {
    e.preventDefault()
    if (!draggedNote || draggedNote.column !== targetNote.column) return

    const updatedNotes = notes.filter((note) => note.id !== draggedNote.id)
    const targetIndex = updatedNotes.findIndex((note) => note.id === targetNote.id)
    updatedNotes.splice(targetIndex, 0, draggedNote)

    setNotes(updatedNotes)
    setDraggedNote(null)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.style.opacity = '1'
    setDraggedNote(null)
  }

  const addColumn = () => {
    const newColumnId = Math.max(...columns.map((col) => col.id)) + 1
    setColumns([...columns, { id: newColumnId, name: `Column ${newColumnId}`, width: 250 }])
  }

  const renameColumn = () => {
    if (editingColumn && newColumnName.trim()) {
      setColumns(columns.map((col) => 
        col.id === editingColumn.id ? { ...col, name: newColumnName.trim() } : col
      ))
      setEditingColumn(null)
      setNewColumnName("")
    }
  }

  const handleColumnResize = useCallback((columnId: number, newWidth: number) => {
    setColumns(prevColumns => 
      prevColumns.map(col => 
        col.id === columnId ? { ...col, width: newWidth } : col
      )
    )
  }, [])

  const startNotesResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsNotesResizing(true)
  }, [])

  const stopNotesResizing = useCallback(() => {
    setIsNotesResizing(false)
  }, [])

  const resizeNotes = useCallback((e: MouseEvent) => {
    if  (isNotesResizing && notesColumnRef.current) {
      const newWidth = window.innerWidth - e.clientX
      if (newWidth >= 300 && newWidth <= 800) {
        setNotesColumnWidth(newWidth)
      }
    }
  }, [isNotesResizing])

  useEffect(() => {
    document.addEventListener('mousemove', resizeNotes)
    document.addEventListener('mouseup', stopNotesResizing)
    return () => {
      document.removeEventListener('mousemove', resizeNotes)
      document.removeEventListener('mouseup', stopNotesResizing)
    }
  }, [resizeNotes, stopNotesResizing])

  const filteredNotes = notes.filter((note) =>
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const insertText = (before: string, after: string = "") => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart
      const end = textareaRef.current.selectionEnd
      const text = selectedNote?.content || ""
      const newText = text.substring(0, start) + before + text.substring(start, end) + after + text.substring(end)
      setSelectedNote(prev => prev ? {...prev, content: newText} : null)
      setTimeout(() => {
        textareaRef.current?.setSelectionRange(start + before.length, end + before.length)
        textareaRef.current?.focus()
      }, 0)
    }
  }

  const startCreatingRelationship = (sourceNote: Note) => {
    setRelationshipSourceNote(sourceNote)
    setIsCreatingRelationship(true)
  }

  const selectTargetNote = (targetNote: Note) => {
    if (relationshipSourceNote && relationshipSourceNote.id !== targetNote.id) {
      setRelationshipTargetNote(targetNote)
      setIsRelationshipDialogOpen(true)
    }
  }

  const createRelationship = () => {
    if (relationshipSourceNote && relationshipTargetNote && relationshipType) {
      const updatedNotes = addRelationship(notes, relationshipSourceNote, relationshipTargetNote, relationshipType);
      setNotes(updatedNotes)
      setSelectedNote(updatedNotes.find(note => note.id === selectedNote?.id) || null)
      setIsCreatingRelationship(false)
      setRelationshipSourceNote(null)
      setRelationshipTargetNote(null)
      setRelationshipType("")
      setIsRelationshipDialogOpen(false)
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="p-4 bg-primary text-primary-foreground">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">GM Notebook</h1>
          <div className="flex items-center space-x-4">
            {currentNotebook && (
              isEditingNotebookName ? (
                <Input
                  value={currentNotebook.name}
                  onChange={(e) => setCurrentNotebook({ ...currentNotebook, name: e.target.value })}
                  onBlur={() => setIsEditingNotebookName(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setIsEditingNotebookName(false)
                    }
                  }}
                  className="w-48 h-8 text-sm text-black"
                  autoFocus
                />
              ) : (
                <span
                  className="font-semibold cursor-pointer"
                  onClick={() => setIsEditingNotebookName(true)}
                >
                  {currentNotebook.name}
                </span>
              )
            )}
            <Dialog open={isNewNotebookDialogOpen} onOpenChange={setIsNewNotebookDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  New Notebook
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Notebook</DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); createNewNotebook(); }}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="name"
                        value={newNotebookName}
                        onChange={(e) => setNewNotebookName(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <Button type="submit">Create</Button>
                </form>
              </DialogContent>
            </Dialog>
            <Select onValueChange={loadNotebook}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a notebook" />
              </SelectTrigger>
              <SelectContent>
                {notebooks.map((notebook) => (
                  <SelectItem key={notebook.id} value={notebook.id}>
                    {notebook.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentNotebook && (
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Notebook
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the
                      notebook "{currentNotebook.name}" and all its notes.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="confirm-delete" className="text-right">
                        Type "delete {currentNotebook.name}" to confirm:
                      </Label>
                      <Input
                        id="confirm-delete"
                        value={deleteConfirmPhrase}
                        onChange={(e) => setDeleteConfirmPhrase(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteNotebook} disabled={deleteConfirmPhrase !== `delete ${currentNotebook.name}`}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </header>
      <div className="p-2 border-b flex justify-between items-center">
        <Input
          type="text"
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm h-8"
          icon={<Search className="h-4 w-4 text-gray-500" />}
        />
        <Button size="sm" onClick={addColumn}>Add Column</Button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 p-2 overflow-auto">
          <div className="flex h-full">
            {columns.map((column) => (
              <ResizableColumn key={column.id} column={column} onResize={handleColumnResize} onAddNote={addNote}>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-bold">{column.name}</h2>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditingColumn(column)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Rename Column</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-2">
                        <div className="grid grid-cols-4 items-center gap-2">
                          <Label htmlFor="name" className="text-right">
                            Name
                          </Label>
                          <Input
                            id="name"
                            value={newColumnName}
                            onChange={(e) => setNewColumnName(e.target.value)}
                            className="col-span-3"
                          />
                        </div>
                      </div>
                      <Button onClick={renameColumn}>Save</Button>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="space-y-2">
                  {filteredNotes
                    .filter((note) => note.column === column.id)
                    .map((note) => (
                      <ContextMenu key={note.id}>
                        <ContextMenuTrigger>
                          <Card
                            className={`${selectedNote?.id === note.id ? "border-primary" : ""} rounded-sm ${isCreatingRelationship ? "cursor-pointer hover:bg-secondary" : ""}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, note)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, note)}
                            onDragEnd={handleDragEnd}
                            onClick={() => {
                              if (isCreatingRelationship) {
                                selectTargetNote(note)
                              } else {
                                setSelectedNote(note)
                                setIsEditing(false)
                              }
                            }}
                          >
                            <CardHeader className="flex flex-row items-center p-1">
                              <div
                                className="cursor-move p-1"
                                onMouseDown={(e) => e.stopPropagation()}
                              >
                                <GripVertical className="h-4 w-4" />
                              </div>
                              <div className="flex-grow cursor-pointer truncate">
                                <CardTitle className="select-none text-sm">{getTitle(note.content)}</CardTitle>
                              </div>
                            </CardHeader>
                            {note.tags.length > 0 && (
                              <CardContent className="p-1">
                                <div className="flex flex-wrap gap-1">
                                  {note.tags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="select-none text-xs px-1 py-0 h-5">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </CardContent>
                            )}
                          </Card>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem onSelect={() => setNoteToDelete(note)}>
                            Delete Note
                          </ContextMenuItem>
                          <ContextMenuItem onSelect={() => startCreatingRelationship(note)}>
                            Create Relationship
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    ))}
                </div>
                <Button size="sm" onClick={() => addNote(column.id)} className="w-full h-8 mt-2">
                  <Plus className="mr-1 h-3 w-3" /> Add Note
                </Button>
              </ResizableColumn>
            ))}
          </div>
        </div>
        <div
          ref={notesColumnRef}
          className="relative"
          style={{ width: `${notesColumnWidth}px` }}
        >
          <div
            className="absolute top-0 left-0 bottom-0 w-1 cursor-col-resize bg-gray-300 hover:bg-gray-400"
            onMouseDown={startNotesResizing}
          />
          <div className="w-full h-full p-2 border-l overflow-auto">
            {selectedNote ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-bold">{getTitle(selectedNote.content)}</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                  </Button>
                </div>
                {isEditing ? (
                  <>
                    <div className="flex space-x-2 mb-2">
                      <Button size="sm" onClick={() => insertText("**", "**")}><Bold className="h-4 w-4" /></Button>
                      <Button size="sm" onClick={() => insertText("*", "*")}><Italic className="h-4 w-4" /></Button>
                      <Button size="sm" onClick={() => insertText("__", "__")}><Underline className="h-4 w-4" /></Button>
                      <Button size="sm" onClick={() => insertText("\n- ")}><List className="h-4 w-4" /></Button>
                      <Button size="sm" onClick={() => insertText("\n1. ")}><ListOrdered className="h-4 w-4" /></Button>
                    </div>
                    <Textarea
                      ref={textareaRef}
                      value={selectedNote.content}
                      onChange={(e) => setSelectedNote({ ...selectedNote, content: e.target.value })}
                      className="min-h-[150px] font-mono text-sm"
                      placeholder="Enter your note here. The first line will be used as the title."
                    />
                  </>
                ) : (
                  <div className="prose max-w-full">
                    <ReactMarkdown>{selectedNote.content}</ReactMarkdown>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <TagIcon className="h-4 w-4 mr-1" />
                        Add Tag
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Input
                            type="text"
                            placeholder="New tag"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            className="flex-grow h-8"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => addTag(selectedNote.id, newTag)}
                            disabled={!newTag.trim()}
                          >
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {allTags.filter(tag => !selectedNote.tags.includes(tag)).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="cursor-pointer text-xs px-1 py-0 h-5"
                              onClick={() => addTag(selectedNote.id, tag)}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedNote.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1 text-xs px-1 py-0 h-5">
                      {tag}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeTag(selectedNote.id, tag)}
                      />
                    </Badge>
                  ))}
                </div>
                {selectedNote.relationships.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold mb-2">Related Notes:</h3>
                    <ul className="space-y-1">
                      {selectedNote.relationships.map((rel) => {
                        const relatedNote = notes.find(note => note.id === rel.id)
                        return (
                          <li key={rel.id} className="flex items-center space-x-2">
                            <Link className="h-4 w-4" />
                            <EditableTextComponent initialText={rel.type} onChange={() => {

                            }} onClose={() => {

                            }} />
                            <Button
                              variant="link"
                              className="p-0 h-auto text-sm"
                              onClick={() => setSelectedNote(relatedNote || null)}
                            >
                              {relatedNote ? getTitle(relatedNote.content) : 'Unknown Note'}
                            </Button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Select a note to view or edit</p>
            )}
          </div>
        </div>
      </div>
      <AlertDialog open={!!noteToDelete} onOpenChange={() => setNoteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this note?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the note.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => noteToDelete && deleteNote(noteToDelete.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {isCreatingRelationship && false && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg">
            <h2 className="text-lg font-bold mb-2">Create Relationship</h2>
            <p className="mb-4">Select a note to create a relationship with {getTitle(relationshipSourceNote?.content || '')}</p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => {
                setIsCreatingRelationship(false)
                setRelationshipSourceNote(null)
                setRelationshipTargetNote(null)
              }}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      <Dialog open={isRelationshipDialogOpen} onOpenChange={setIsRelationshipDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Relationship</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 py-6">
            <div className="grid grid-cols-6 items-center gap-2">
              <p className="col-span-2 text-right">{getTitle(relationshipSourceNote?.content || '')}</p>
              <Input
                  id="relationship-type"
                  ref={relationshipInputRef}
                  value={relationshipType}
                  onChange={(e) => setRelationshipType(e.target.value)}
                  className="col-span-2 border-2 border-gray-800"
                  placeholder="e.g., 'is related to', 'depends on', etc."
              />
              <p className="col-span-2">{getTitle(relationshipTargetNote?.content || '')}</p>
            </div>
          </div>
          <Button onClick={createRelationship} disabled={!relationshipType.trim()}>
            Create Relationship
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}