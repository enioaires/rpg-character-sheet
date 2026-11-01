// components/character/notes/note-card.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatNoteHtml } from "@/lib/notes-format";
import type { Note } from "@/lib/notes";
import { Edit, Trash2, Calendar, ChevronUp, ChevronDown } from "lucide-react";

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const renderFormattedText = (text: string) => (
  <div
    className="formatted-content"
    dangerouslySetInnerHTML={{ __html: formatNoteHtml(text) }}
  />
);

interface NoteCardProps {
  note: Note;
  isEditMode: boolean;
  isSaving: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  showReorderButtons: boolean;
  onMoveUp: (noteId: string) => void;
  onMoveDown: (noteId: string) => void;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void | Promise<void>;
}

export function NoteCard({
  note,
  isEditMode,
  isSaving,
  canMoveUp,
  canMoveDown,
  showReorderButtons,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}: NoteCardProps) {
  return (
    <Card
      className="overflow-hidden hover:shadow-md transition-shadow"
    >
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg break-words line-clamp-2">
              {note.title}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Criado: {formatDate(note.createdAt)}</span>
              </div>
              {note.updatedAt !== note.createdAt && (
                <div className="flex items-center gap-1">
                  <Separator
                    orientation="vertical"
                    className="h-3"
                  />
                  <span>Editado: {formatDate(note.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {isEditMode && (
            <div className="flex gap-1 shrink-0">
              {/* Botões de reordenação - só aparecem quando não há filtro */}
              {showReorderButtons && (
                <div className="flex flex-col gap-0.5 mr-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMoveUp(note.id)}
                    disabled={
                      !canMoveUp ||
                      isSaving
                    }
                    className="h-4 w-6 p-0 hover:bg-primary/10 disabled:opacity-30"
                    title="Mover para cima"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMoveDown(note.id)}
                    disabled={
                      !canMoveDown ||
                      isSaving
                    }
                    className="h-4 w-6 p-0 hover:bg-primary/10 disabled:opacity-30"
                    title="Mover para baixo"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(note)}
                className="h-8 w-8 p-0 hover:bg-primary/10"
                title="Editar anotação"
              >
                <Edit className="w-3 h-3" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    title="Excluir anotação"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="w-[95vw] max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Confirmar exclusão
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir a anotação &quot;
                      {note.title}&quot;? Esta ação não pode ser
                      desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <AlertDialogCancel className="w-full sm:w-auto">
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(note.id)}
                      className="w-full sm:w-auto bg-destructive hover:bg-destructive/90"
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-32 sm:max-h-80 overflow-auto">
          <div className="text-sm leading-relaxed break-words pr-3">
            {renderFormattedText(note.content)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
