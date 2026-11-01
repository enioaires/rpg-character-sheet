// components/character/notes/note-card.tsx

import { useId } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { formatNoteHtml, getNotePreview } from "@/lib/notes-format";
import type { Note } from "@/lib/notes";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Pencil,
  Trash2,
} from "lucide-react";

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
  isOpen: boolean;
  isReordering: boolean;
  canEdit: boolean;
  isSaving: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onToggle: (noteId: string) => void;
  onMoveUp: (noteId: string) => void;
  onMoveDown: (noteId: string) => void;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void | Promise<void>;
}

export function NoteCard({
  note,
  isOpen,
  isReordering,
  canEdit,
  isSaving,
  canMoveUp,
  canMoveDown,
  onToggle,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}: NoteCardProps) {
  const bodyId = useId();
  const preview = getNotePreview(note.content);

  if (isReordering) {
    return (
      <section className="mb-2 break-inside-avoid rounded-md border border-border bg-card shadow-card">
        <div className="grid min-h-14 grid-cols-[20px_minmax(0,1fr)_44px_44px] items-center gap-1.5 pl-3.5 pr-1.5">
          <GripVertical
            aria-hidden="true"
            className="size-[18px] text-muted-foreground"
          />
          <span className="truncate font-serif text-[17px] font-semibold">
            {note.title}
          </span>
          <Button
            type="button"
            variant="ghost"
            className="size-11 p-0 disabled:opacity-30"
            aria-label={`Subir: ${note.title}`}
            disabled={!canMoveUp || isSaving}
            onClick={() => onMoveUp(note.id)}
          >
            <ArrowUp className="size-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="size-11 p-0 disabled:opacity-30"
            aria-label={`Descer: ${note.title}`}
            disabled={!canMoveDown || isSaving}
            onClick={() => onMoveDown(note.id)}
          >
            <ArrowDown className="size-5" />
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "mb-2 break-inside-avoid rounded-md border bg-card shadow-card",
        isOpen ? "border-input" : "border-border",
      )}
    >
      <button
        type="button"
        onClick={() => onToggle(note.id)}
        aria-expanded={isOpen}
        aria-controls={bodyId}
        className="grid min-h-[60px] w-full grid-cols-[minmax(0,1fr)_20px] items-center gap-2 px-4 py-2.5 text-left"
      >
        <span className="min-w-0">
          <span className="block truncate font-serif text-[17px] font-semibold">
            {note.title}
          </span>
          {!isOpen && preview !== "" && (
            <span className="block truncate text-sm text-muted-foreground">
              {preview}
            </span>
          )}
        </span>
        {isOpen ? (
          <ChevronUp
            aria-hidden="true"
            className="size-[18px] text-muted-foreground"
          />
        ) : (
          <ChevronDown
            aria-hidden="true"
            className="size-[18px] text-muted-foreground"
          />
        )}
      </button>

      {isOpen && (
        <div
          id={bodyId}
          className="flex flex-col gap-2.5 break-words px-4 pb-3.5 text-[15px] leading-[1.55]"
        >
          {renderFormattedText(note.content)}
          <div className="text-xs text-muted-foreground">
            <span>Criado: {formatDate(note.createdAt)}</span>
            {note.updatedAt !== note.createdAt && (
              <span> · Editado: {formatDate(note.updatedAt)}</span>
            )}
          </div>
          {canEdit && (
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                className="h-11 px-3.5"
                onClick={() => onEdit(note)}
              >
                <Pencil className="size-4" />
                Editar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-11 border px-3.5 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="w-[95vw] max-w-[400px]">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-serif text-[22px] font-semibold">
                      Excluir “{note.title}”?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-[15px]">
                      A anotação será apagada. Essa ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="grid grid-cols-2 gap-2 pt-1.5">
                    <AlertDialogCancel className="h-12 font-semibold">
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(note.id)}
                      className={cn(
                        buttonVariants({ variant: "destructive" }),
                        "h-12 font-bold",
                      )}
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
