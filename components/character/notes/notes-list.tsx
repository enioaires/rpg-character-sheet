// components/character/notes/notes-list.tsx

import { Button } from "@/components/ui/button";
import type { Note } from "@/lib/notes";
import { FileText, Plus, Search } from "lucide-react";

import { NoteCard } from "./note-card";

interface NotesListProps {
  notes: Note[];
  allNotes: Note[];
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  isEditMode: boolean;
  isSaving: boolean;
  isReordering: boolean;
  openNoteId: string | null;
  onToggleNote: (noteId: string) => void;
  onOpenAddDialog: () => void;
  onMoveUp: (noteId: string) => void;
  onMoveDown: (noteId: string) => void;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void | Promise<void>;
}

export function NotesList({
  notes,
  allNotes,
  searchTerm,
  onSearchTermChange,
  isEditMode,
  isSaving,
  isReordering,
  openNoteId,
  onToggleNote,
  onOpenAddDialog,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}: NotesListProps) {
  if (allNotes.length === 0) {
    return (
      <section className="mx-auto flex w-full max-w-[720px] flex-col items-center rounded-md border border-dashed border-border bg-card py-12 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
          <FileText aria-hidden="true" className="size-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 font-serif text-[19px] font-semibold">
          Nenhuma anotação ainda
        </h3>
        <p className="mb-6 max-w-md px-4 text-[15px] text-muted-foreground">
          Comece criando sua primeira anotação para organizar informações
          importantes do seu personagem.
        </p>
        {isEditMode && (
          <Button type="button" onClick={onOpenAddDialog} className="h-12">
            <Plus className="size-4" />
            Criar primeira anotação
          </Button>
        )}
      </section>
    );
  }

  const noMatch = !isReordering && searchTerm !== "" && notes.length === 0;
  const visibleNotes = isReordering ? allNotes : notes;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex max-w-[720px] flex-col gap-2.5">
        {isReordering ? (
          <p className="text-sm text-muted-foreground">
            Use as setas para mudar a ordem. Toque em Concluir quando terminar.
          </p>
        ) : (
          <label className="flex h-[46px] items-center gap-2.5 rounded-md border border-input bg-card px-3">
            <Search
              aria-hidden="true"
              className="size-[18px] shrink-0 text-muted-foreground"
            />
            <input
              type="search"
              aria-label="Buscar anotações"
              placeholder="Buscar em títulos e textos"
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-base outline-none"
            />
          </label>
        )}
      </div>

      {noMatch ? (
        <div className="flex max-w-[720px] flex-col items-center gap-3 py-8 text-center text-muted-foreground">
          <p>Nenhuma anotação com “{searchTerm}”.</p>
          <Button
            type="button"
            variant="outline"
            className="h-11"
            onClick={() => onSearchTermChange("")}
          >
            Limpar busca
          </Button>
        </div>
      ) : (
        <div
          className={
            isReordering
              ? "flex max-w-[720px] flex-col"
              : "columns-[340px] gap-3"
          }
        >
          {visibleNotes.map((note) => {
            const noteIndex = allNotes.findIndex((n) => n.id === note.id);
            return (
              <NoteCard
                key={note.id}
                note={note}
                isOpen={openNoteId === note.id}
                isReordering={isReordering}
                canEdit={isEditMode}
                isSaving={isSaving}
                canMoveUp={noteIndex > 0}
                canMoveDown={noteIndex < allNotes.length - 1}
                onToggle={onToggleNote}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
