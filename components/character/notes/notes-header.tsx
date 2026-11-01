// components/character/notes/notes-header.tsx

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DiamondMarker } from "@/components/ui/section-card";
import { cn } from "@/lib/utils";
import { ArrowUpDown, Check, Plus, Wrench } from "lucide-react";

import { NoteForm } from "./note-form";

interface NotesHeaderProps {
  countLabel: string | null;
  isEditMode: boolean;
  canWrite: boolean;
  isCorrupted: boolean;
  isSaving: boolean;
  canReorder: boolean;
  isReordering: boolean;
  onToggleReorder: () => void;
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
  countLabel,
  isEditMode,
  canWrite,
  isCorrupted,
  isSaving,
  canReorder,
  isReordering,
  onToggleReorder,
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
    <div className="flex flex-col gap-2.5">
      <div className="flex max-w-[720px] items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <DiamondMarker />
          <h2 className="m-0 font-serif text-[21px] font-semibold leading-tight">
            Anotações
          </h2>
          {countLabel !== null && (
            <span className="font-numeric text-sm tabular-nums text-muted-foreground">
              {countLabel}
            </span>
          )}
        </div>

        {isEditMode && canWrite && (
          <div className="flex items-center gap-2">
            {canReorder && (
              <Button
                type="button"
                variant="outline"
                aria-pressed={isReordering}
                onClick={onToggleReorder}
                className={cn(
                  "h-11 px-3 font-semibold",
                  isReordering
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border bg-transparent",
                )}
              >
                {isReordering ? (
                  <>
                    <Check className="size-4" />
                    Concluir
                  </>
                ) : (
                  <>
                    <ArrowUpDown className="size-4" />
                    Ordenar
                  </>
                )}
              </Button>
            )}
            <Dialog open={isAddDialogOpen} onOpenChange={onAddDialogOpenChange}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  className="size-11 p-0"
                  aria-label="Nova Anotação"
                  title="Nova Anotação"
                >
                  <Plus className="size-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-2xl max-h-[90dvh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-serif text-[22px] font-semibold">
                    Nova Anotação
                  </DialogTitle>
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
          </div>
        )}
      </div>

      {/* Botão de debug para dados corrompidos (apenas em desenvolvimento) */}
      {process.env.NODE_ENV === "development" && isCorrupted && isEditMode && (
        <div>
          <Button
            type="button"
            variant="destructive"
            onClick={onClearCorrupted}
            className="h-11"
          >
            <Wrench className="size-4" />
            Limpar dados corrompidos
          </Button>
        </div>
      )}
    </div>
  );
}
