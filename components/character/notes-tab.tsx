// components/character/notes-tab.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { FileText } from "lucide-react";
import { toast } from "sonner";

import { CharacterTabProps } from "./types";
import { NotesHeader } from "./notes/notes-header";
import { NotesList } from "./notes/notes-list";
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
  const updateCharacter = updateCharacterMutation.mutateAsync;

  // Leitura da coluna `notes` (pura: sem setState nem efeitos durante o render)
  const parsed = useMemo(() => parseNotes(character.notes), [character.notes]);
  const allNotes = parsed.notes;
  const canWrite = canWriteNotes(parsed);

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

      toast.success("Posição da anotação atualizada!");
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

  return (
    <div className="space-y-4 sm:space-y-6">
      <NotesHeader
        isEditMode={isEditMode}
        canWrite={canWrite}
        isCorrupted={parsed.status === "corrupted"}
        isSaving={updateCharacterMutation.isPending}
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
      {!canWrite ? (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-4 h-4 text-muted-foreground" />
            {parsed.status === "legacy"
              ? "Anotações em formato antigo"
              : "Não foi possível ler as anotações"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {parsed.status === "legacy"
              ? "Este conteúdo será convertido em uma anotação ao entrar no modo de edição."
              : "O conteúdo salvo foi preservado e nenhuma alteração será salva até que ele seja corrigido."}
          </p>
          <pre className="whitespace-pre-wrap break-words font-mono text-xs bg-muted rounded p-3 max-h-64 overflow-auto">
            {parsed.status === "legacy"
              ? parsed.legacyText
              : parsed.status === "corrupted"
                ? parsed.raw
                : ""}
          </pre>
        </CardContent>
      </Card>
      ) : (
        <NotesList
          notes={notes}
          allNotes={allNotes}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          isEditMode={isEditMode}
          isSaving={updateCharacterMutation.isPending}
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
