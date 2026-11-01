// components/character/notes/notes-header.tsx

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

import { NoteForm } from "./note-form";

interface NotesHeaderProps {
  isEditMode: boolean;
  canWrite: boolean;
  isCorrupted: boolean;
  isSaving: boolean;
  isAddDialogOpen: boolean;
  onAddDialogOpenChange: (open: boolean) => void;
  noteTitle: string;
  noteContent: string;
  onNoteTitleChange: (value: string) => void;
  onNoteContentChange: (value: string) => void;
  onAddNote: () => void | Promise<void>;
  onClearCorrupted: () => void | Promise<void>;
}

export function NotesHeader({
  isEditMode,
  canWrite,
  isCorrupted,
  isSaving,
  isAddDialogOpen,
  onAddDialogOpenChange,
  noteTitle,
  noteContent,
  onNoteTitleChange,
  onNoteContentChange,
  onAddNote,
  onClearCorrupted,
}: NotesHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold">Anotações</h2>
        <p className="text-sm text-muted-foreground">
          Gerencie suas anotações de personagem
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        {isEditMode && canWrite && (
          <Dialog open={isAddDialogOpen} onOpenChange={onAddDialogOpenChange}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Nova Anotação
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>Nova Anotação</DialogTitle>
              </DialogHeader>
              <NoteForm
                title={noteTitle}
                content={noteContent}
                onTitleChange={onNoteTitleChange}
                onContentChange={onNoteContentChange}
                onSubmit={onAddNote}
                onCancel={() => onAddDialogOpenChange(false)}
                submitLabel="Salvar Anotação"
                isSaving={isSaving}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Botão de debug para dados corrompidos (apenas em desenvolvimento) */}
        {process.env.NODE_ENV === "development" &&
          isCorrupted &&
          isEditMode && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onClearCorrupted}
              className="w-full sm:w-auto"
            >
              🔧 Limpar Dados Corrompidos
            </Button>
          )}
      </div>
    </div>
  );
}
