export interface Note {
    id: number
    content: string
    column: number
    tags: string[]
    relationships: { id: number; type: string }[]
}

interface Relationship {
    id: number
    type: string
    from: Note
    to: Note
}

export interface Column {
    id: number
    name: string
    width: number
}

export interface Notebook {
    id: string
    name: string
    notes: Note[]
    columns: Column[]
    relationships: Relationship[]
    allTags: string[]
}