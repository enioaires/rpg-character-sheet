// components/character/notes/notes-list.tsx

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Note } from "@/lib/notes";
import { Plus, FileText, Search } from "lucide-react";

import { NoteCard } from "./note-card";

interface NotesListProps {
  notes: Note[];
  allNotes: Note[];
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  isEditMode: boolean;
  isSaving: boolean;
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
  onOpenAddDialog,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}: NotesListProps) {
  return allNotes.length === 0 ? (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">Nenhuma anotação ainda</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-md">
          Comece criando sua primeira anotação para organizar informações
          importantes do seu personagem.
        </p>
        {isEditMode && (
          <Button onClick={onOpenAddDialog} size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Criar primeira anotação
          </Button>
        )}
      </CardContent>
    </Card>
  ) : notes.length === 0 && searchTerm ? (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <Search className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">
          Nenhuma anotação encontrada
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Não encontramos anotações que correspondam à sua busca por &quot;
          {searchTerm}&quot;.
        </p>
        <Button variant="outline" onClick={() => onSearchTermChange("")}>
          Limpar busca
        </Button>
      </CardContent>
    </Card>
  ) : (
    <div className="space-y-4">
      {/* Barra de busca e contador */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar anotações..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {notes.length} de {allNotes.length}{" "}
            {allNotes.length === 1 ? "anotação" : "anotações"}
          </Badge>
        </div>
      </div>

      {/* Grid de anotações */}
      <div className="grid gap-4">
        {notes.map((note) => {
          const noteIndex = allNotes.findIndex((n) => n.id === note.id);
          const canMoveUp = noteIndex > 0;
          const canMoveDown = noteIndex < allNotes.length - 1;
          const showReorderButtons = isEditMode && searchTerm === ""; // Só mostra quando não há filtro

          return (
            <NoteCard
              key={note.id}
              note={note}
              isEditMode={isEditMode}
              isSaving={isSaving}
              canMoveUp={canMoveUp}
              canMoveDown={canMoveDown}
              showReorderButtons={showReorderButtons}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          );
        })}
      </div>
    </div>
  );
}
