import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  Search, 
  Plus, 
  FileText, 
  Download, 
  Trash2, 
  Edit, 
  Save,
  X,
  Clock,
  BookOpen
} from 'lucide-react';
import { StudentNote } from './types';

// Mock data
const mockNotes: StudentNote[] = [
  { id: '1', sessionId: 'sess-1', className: 'CS101 - Introduction to Programming', content: 'Binary search divides the array in half each time. Time complexity is O(log n).', slideNumber: 15, createdAt: '2024-02-18T09:30:00', updatedAt: '2024-02-18T09:30:00' },
  { id: '2', sessionId: 'sess-1', className: 'CS101 - Introduction to Programming', content: 'Important: Binary search requires a sorted array.', slideNumber: 16, createdAt: '2024-02-18T09:35:00', updatedAt: '2024-02-18T09:35:00' },
  { id: '3', sessionId: 'sess-2', className: 'CS201 - Data Structures', content: 'Recursion: A function that calls itself. Base case stops the recursion.', slideNumber: 8, createdAt: '2024-02-16T10:15:00', updatedAt: '2024-02-16T10:15:00' },
];

export const StudentNotesPage = () => {
  const [notes, setNotes] = useState<StudentNote[]>(mockNotes);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const filteredNotes = notes.filter(note => 
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.className.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startEditing = (note: StudentNote) => {
    setEditingNote(note.id);
    setEditContent(note.content);
  };

  const saveEdit = (noteId: string) => {
    setNotes(notes.map(note => 
      note.id === noteId 
        ? { ...note, content: editContent, updatedAt: new Date().toISOString() }
        : note
    ));
    setEditingNote(null);
    setEditContent('');
  };

  const cancelEdit = () => {
    setEditingNote(null);
    setEditContent('');
  };

  const deleteNote = (noteId: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      setNotes(notes.filter(note => note.id !== noteId));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Notes</h1>
          <p className="text-gray-500 mt-1">Manage your session notes</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export All
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Notes List */}
      <div className="space-y-4">
        {filteredNotes.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No notes found</p>
          </Card>
        ) : (
          filteredNotes.map((note) => (
            <Card key={note.id} className="p-5">
              {editingNote === note.id ? (
                <div className="space-y-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-3 border rounded-lg resize-none"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={cancelEdit}>
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={() => saveEdit(note.id)}>
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{note.className}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          Slide {note.slideNumber}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(note.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => startEditing(note)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteNote(note.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                </>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentNotesPage;
