// components/character/notes-tab.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useUpdateCharacter } from "@/lib/api/queries";
import {
  canWriteNotes,
  claimLegacyMigration,
  createNote,
  migrateLegacyNotes,
  moveNote,
  parseNotes,
  serializeNotes,
  type Note,
} from "@/lib/notes";
import { copyTextToClipboard } from "@/lib/clipboard";
import { toast } from "sonner";

import { CharacterTabProps } from "./types";
import { NotesHeader } from "./notes/notes-header";
import { NotesList } from "./notes/notes-list";
import {
  NotesStatusAlert,
  PreservedNotesText,
  type LegacyMigrationStatus,
} from "./notes/notes-status-alert";
import { EditNoteDialog } from "./notes/edit-note-dialog";

type NotesTabProps = CharacterTabProps;

export function NotesTab({
  character,
  characterId,
  isEditMode,
}: NotesTabProps) {
  const updateCharacterMutation = useUpdateCharacter();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isReorderRequested, setIsReorderRequested] = useState(false);
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);
  const updateCharacter = updateCharacterMutation.mutateAsync;

  // Leitura da coluna `notes` (pura: sem setState nem efeitos durante o render)
  const parsed = useMemo(() => parseNotes(character.notes), [character.notes]);
  const allNotes = parsed.notes;
  const canWrite = canWriteNotes(parsed);
  const canReorder = isEditMode && canWrite && allNotes.length > 1;
  const isReordering = isReorderRequested && canReorder;

  // Recusa gravações enquanto o valor salvo é ilegível ou ainda não foi migrado
  const guardWrite = (): boolean => {
    if (canWrite) return true;
    toast.error(
      parsed.status === "legacy"
        ? "Aguarde a conversão das anotações antigas."
        : "As anotações salvas estão corrompidas. Nenhuma alteração será salva para não sobrescrever o conteúdo original.",
    );
    return false;
  };

  // Migra anotações antigas (texto simples) para o novo formato, uma vez por sessão
  useEffect(() => {
    if (!isEditMode || parsed.status !== "legacy") return;
    // Reivindicação em escopo de módulo: cobre Strict Mode e remontagens
    if (!claimLegacyMigration(characterId, parsed.legacyText)) return;

    const migrate = async () => {
      try {
        await updateCharacter({
          id: characterId,
          data: {
            notes: serializeNotes(migrateLegacyNotes(parsed.legacyText)),
          },
        });

        toast.success("Anotações antigas migradas com sucesso!");
      } catch (error) {
        console.error("Erro ao migrar anotações antigas:", error);
        toast.error(
          "Erro ao migrar anotações antigas. Recarregue a página para tentar novamente.",
        );
      }
    };

    void migrate();
  }, [isEditMode, parsed, characterId, updateCharacter]);

  // Filter notes based on search term
  const notes = allNotes.filter(
    (note) =>
      searchTerm === "" ||
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const countLabel = !canWrite
    ? null
    : searchTerm !== "" && !isReordering
      ? `${notes.length} de ${allNotes.length}`
      : String(allNotes.length);

  const handleToggleReorder = () => {
    setIsReorderRequested(!isReordering);
    setOpenNoteId(null);
  };

  const handleToggleNote = (noteId: string) => {
    setOpenNoteId((current) => (current === noteId ? null : noteId));
  };

  const handleAddNote = async () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) {
      toast.error("Título e conteúdo são obrigatórios");
      return;
    }

    if (!guardWrite()) return;

    try {
      const notesJson = serializeNotes([
        ...allNotes,
        createNote({ title: newNoteTitle, content: newNoteContent }),
      ]);

      await updateCharacterMutation.mutateAsync({
        id: characterId,
        data: {
          notes: notesJson,
        },
      });

      setNewNoteTitle("");
      setNewNoteContent("");
      setIsAddDialogOpen(false);
      toast.success("Anotação adicionada com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar anotação:", error);
      toast.error("Erro ao adicionar anotação");
    }
  };

  const handleEditNote = async () => {
    if (!editingNote || !newNoteTitle.trim() || !newNoteContent.trim()) {
      toast.error("Título e conteúdo são obrigatórios");
      return;
    }

    if (!guardWrite()) return;

    try {
      const updatedNotes = allNotes.map((note) =>
        note.id === editingNote.id
          ? {
              ...note,
              title: newNoteTitle.trim(),
              content: newNoteContent.trim(),
              updatedAt: new Date().toISOString(),
            }
          : note,
      );

      const notesJson = serializeNotes(updatedNotes);

      await updateCharacterMutation.mutateAsync({
        id: characterId,
        data: {
          notes: notesJson,
        },
      });

      setEditingNote(null);
      setNewNoteTitle("");
      setNewNoteContent("");
      toast.success("Anotação atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar anotação:", error);
      toast.error("Erro ao atualizar anotação");
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!guardWrite()) return;

    try {
      const updatedNotes = allNotes.filter((note) => note.id !== noteId);
      const notesJson = serializeNotes(updatedNotes);

      await updateCharacterMutation.mutateAsync({
        id: characterId,
        data: {
          notes: notesJson,
        },
      });

      setOpenNoteId((current) => (current === noteId ? null : current));
      toast.success("Anotação removida com sucesso!");
    } catch (error) {
      console.error("Erro ao remover anotação:", error);
      toast.error("Erro ao remover anotação");
    }
  };

  const openEditDialog = (note: Note) => {
    setEditingNote(note);
    setNewNoteTitle(note.title);
    setNewNoteContent(note.content);
  };

  const closeEditDialog = () => {
    setEditingNote(null);
    setNewNoteTitle("");
    setNewNoteContent("");
  };

  // Troca a nota de posição; sem gravação quando o movimento é impossível
  const moveNoteBy = async (noteId: string, direction: "up" | "down") => {
    if (!guardWrite()) return;

    const reordered = moveNote(allNotes, noteId, direction);
    if (!reordered) return; // Já está na ponta ou não encontrada

    try {
      await updateCharacterMutation.mutateAsync({
        id: characterId,
        data: {
          notes: serializeNotes(reordered),
        },
      });

      toast.success("Posição da anotação atualizada!", {
        id: `notes-move-${characterId}`,
      });
    } catch (error) {
      console.error("Erro ao mover anotação:", error);
      toast.error("Erro ao mover anotação");
    }
  };

  const moveNoteUp = (noteId: string) => moveNoteBy(noteId, "up");
  const moveNoteDown = (noteId: string) => moveNoteBy(noteId, "down");

  // Função de emergência para limpar dados corrompidos
  const clearCorruptedNotes = async () => {
    try {
      await updateCharacterMutation.mutateAsync({
        id: characterId,
        data: {
          notes: serializeNotes([]),
        },
      });
      toast.success("Dados de anotações limpos com sucesso!");
    } catch (error) {
      console.error("Erro ao limpar anotações:", error);
      toast.error("Erro ao limpar anotações");
    }
  };

  // Copia o texto original (somente leitura); nunca registra nem exibe o conteúdo
  const handleCopyOriginal = async () => {
    if (parsed.status !== "corrupted") return;
    const result = await copyTextToClipboard(
      parsed.raw,
      typeof navigator === "undefined" ? undefined : navigator.clipboard,
    );
    if (result === "copied") {
      toast.success("Texto original copiado.");
    } else if (result === "unavailable") {
      toast.error(
        "Não foi possível copiar: a área de transferência não está disponível neste navegador. Selecione o texto abaixo e copie manualmente.",
      );
    } else {
      toast.error(
        "Não foi possível copiar o texto original. Selecione o texto abaixo e copie manualmente.",
      );
    }
  };

  // Estado da conversão automática, derivado só durante o render
  const legacyMigrationStatus: LegacyMigrationStatus = !isEditMode
    ? "locked"
    : updateCharacterMutation.isPending
      ? "converting"
      : updateCharacterMutation.isError
        ? "failed"
        : "waiting";

  return (
    <div className="[column-span:all] flex flex-col gap-3">
      {parsed.status === "corrupted" && (
        <NotesStatusAlert
          status="corrupted"
          onCopyOriginal={handleCopyOriginal}
        />
      )}
      {parsed.status === "legacy" && (
        <NotesStatusAlert
          status="legacy"
          migrationStatus={legacyMigrationStatus}
        />
      )}

      <NotesHeader
        countLabel={countLabel}
        isEditMode={isEditMode}
        canWrite={canWrite}
        isCorrupted={parsed.status === "corrupted"}
        isSaving={updateCharacterMutation.isPending}
        canReorder={canReorder}
        isReordering={isReordering}
        onToggleReorder={handleToggleReorder}
        isAddDialogOpen={isAddDialogOpen}
        onAddDialogOpenChange={setIsAddDialogOpen}
        noteTitle={newNoteTitle}
        noteContent={newNoteContent}
        onNoteTitleChange={setNewNoteTitle}
        onNoteContentChange={setNewNoteContent}
        onAddNote={handleAddNote}
        onClearCorrupted={clearCorruptedNotes}
      />

      {/* Lista de anotações */}
      {parsed.status === "corrupted" || parsed.status === "legacy" ? (
        <PreservedNotesText
          text={parsed.status === "corrupted" ? parsed.raw : parsed.legacyText}
        />
      ) : (
        <NotesList
          notes={notes}
          allNotes={allNotes}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          isEditMode={isEditMode}
          isSaving={updateCharacterMutation.isPending}
          isReordering={isReordering}
          openNoteId={openNoteId}
          onToggleNote={handleToggleNote}
          onOpenAddDialog={() => setIsAddDialogOpen(true)}
          onMoveUp={moveNoteUp}
          onMoveDown={moveNoteDown}
          onEdit={openEditDialog}
          onDelete={handleDeleteNote}
        />
      )}

      {/* Dialog de edição */}
      <EditNoteDialog
        isOpen={!!editingNote}
        onClose={closeEditDialog}
        isSaving={updateCharacterMutation.isPending}
        noteTitle={newNoteTitle}
        noteContent={newNoteContent}
        onNoteTitleChange={setNewNoteTitle}
        onNoteContentChange={setNewNoteContent}
        onEditNote={handleEditNote}
      />
    </div>
  );
}
