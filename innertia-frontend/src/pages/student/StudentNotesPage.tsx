import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  Search, 
  Plus, 
  FileText, 
  Trash2, 
  Edit, 
  Save,
  X,
  Clock,
  BookOpen,
  Check,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { studentApiService, StudentNote } from '../../services/studentApi';

export const StudentNotesPage = () => {
  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get dashboard which includes recent notes
        const dashboardData = await studentApiService.getDashboard();
        setNotes(dashboardData.recent_notes.map(note => ({
          id: note.id,
          session_id: note.session_id,
          content: note.content,
          created_at: note.created_at,
          updated_at: note.updated_at
        })));
      } catch (err: any) {
        console.error('Failed to fetch notes:', err);
        setError(err.response?.data?.detail || 'Failed to load notes');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotes();
  }, []);

  const filteredNotes = notes.filter(note => 
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startEditing = (note: StudentNote) => {
    setEditingNote(note.id);
    setEditContent(note.content);
  };

  const saveEdit = async (noteId: string) => {
    setAutoSaveStatus('saving');
    try {
      // Get session ID from note
      const note = notes.find(n => n.id === noteId);
      if (note) {
        await studentApiService.saveNote(note.session_id, editContent);
        
        setNotes(notes.map(n => 
          n.id === noteId 
            ? { ...n, content: editContent, updated_at: new Date().toISOString() }
            : n
        ));
        setAutoSaveStatus('saved');
        setTimeout(() => {
          setAutoSaveStatus('idle');
          setEditingNote(null);
          setEditContent('');
        }, 1000);
      }
    } catch (err) {
      console.error('Failed to save note:', err);
      setAutoSaveStatus('idle');
    }
  };

  const cancelEdit = () => {
    setEditingNote(null);
    setEditContent('');
  };

  const deleteNote = async (noteId: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      try {
        await studentApiService.deleteNote(noteId);
        setNotes(notes.filter(note => note.id !== noteId));
      } catch (err) {
        console.error('Failed to delete note:', err);
        alert('Failed to delete note');
      }
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0071e3]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header - Apple Style */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-semibold text-[#1d1d1f] tracking-tight">
            Your Notes
          </h1>
          <p className="text-base text-[#86868b] mt-2 max-w-xl">
            Take notes during sessions and review them later.
          </p>
        </div>
        {autoSaveStatus !== 'idle' && (
          <div className="flex items-center gap-2 text-sm text-[#86868b]">
            {autoSaveStatus === 'saving' ? (
              <>
                <div className="w-4 h-4 border-2 border-[#86868b] border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-green-600" />
                <span>Saved</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-xl">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Search - Apple Style */}
      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
        <Input
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-14 pl-14 rounded-2xl bg-[#f5f5f7] border-0 focus:bg-white text-lg"
        />
      </div>

      {/* Notes List - Apple Style */}
      <div className="space-y-5">
        {filteredNotes.length === 0 ? (
          <Card className="p-12 rounded-2xl text-center">
            <FileText className="w-16 h-16 text-[#d2d2d7] mx-auto mb-4" />
            <p className="text-lg text-[#86868b]">
              {searchTerm ? 'No notes match your search.' : 'No notes yet. Start a session to take notes!'}
            </p>
          </Card>
        ) : (
          filteredNotes.map((note) => (
            <Card key={note.id} className="p-6 rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
              {editingNote === note.id ? (
                <div className="space-y-4">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-4 border border-[#d2d2d7] rounded-xl resize-none text-lg"
                    rows={4}
                    autoFocus
                  />
                  <div className="flex justify-end gap-3">
                    <Button variant="ghost" className="h-11 px-5 rounded-xl" onClick={cancelEdit}>
                      <X className="w-5 h-5 mr-2" />
                      Cancel
                    </Button>
                    <Button className="h-11 px-5 rounded-xl" onClick={() => saveEdit(note.id)}>
                      <Save className="w-5 h-5 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-5 h-5 text-[#86868b]" />
                        <span className="text-base font-medium text-[#1d1d1f]">Session Note</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-[#86868b]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDate(note.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        className="h-11 px-4 rounded-xl text-[#86868b] hover:text-[#1d1d1f]"
                        onClick={() => startEditing(note)}
                      >
                        <Edit className="w-5 h-5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="h-11 px-4 rounded-xl text-[#86868b] hover:text-red-600"
                        onClick={() => deleteNote(note.id)}
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-base text-[#1d1d1f] whitespace-pre-wrap leading-relaxed">{note.content}</p>
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
