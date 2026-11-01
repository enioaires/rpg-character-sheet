// components/character/notes/edit-note-dialog.tsx

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { NoteForm } from "./note-form";

interface EditNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isSaving: boolean;
  noteTitle: string;
  noteContent: string;
  onNoteTitleChange: (value: string) => void;
  onNoteContentChange: (value: string) => void;
  onEditNote: () => void | Promise<void>;
}

export function EditNoteDialog({
  isOpen,
  onClose,
  isSaving,
  noteTitle,
  noteContent,
  onNoteTitleChange,
  onNoteContentChange,
  onEditNote,
}: EditNoteDialogProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Editar Anotação</DialogTitle>
        </DialogHeader>
        <NoteForm
            title={noteTitle}
            content={noteContent}
            onTitleChange={onNoteTitleChange}
            onContentChange={onNoteContentChange}
            onSubmit={onEditNote}
            onCancel={onClose}
            submitLabel="Salvar Alterações"
            isSaving={isSaving}
          />
      </DialogContent>
    </Dialog>
  );
}
