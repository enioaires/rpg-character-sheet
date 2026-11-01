// components/character/notes-tab.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUpdateCharacter } from "@/lib/api/queries";
import { formatNoteHtml } from "@/lib/notes-format";
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
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  Calendar,
  Search,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

import { CharacterTabProps } from "./types";

interface NotesTabProps extends CharacterTabProps {}

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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header com botão de adicionar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Anotações</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie suas anotações de personagem
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {isEditMode && canWrite && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Título
                    </label>
                    <Input
                      placeholder="Digite o título da anotação"
                      value={newNoteTitle}
                      onChange={(e) => setNewNoteTitle(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Conteúdo
                    </label>
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg space-y-1">
                        <div className="font-medium mb-2">
                          💡 Dicas de formatação:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                          <div>
                            **negrito** → <strong>negrito</strong>
                          </div>
                          <div>
                            *itálico* → <em>itálico</em>
                          </div>
                          <div>
                            `código` →{" "}
                            <code className="bg-muted px-1 rounded text-xs">
                              código
                            </code>
                          </div>
                          <div>
                            # Título → <strong>Título</strong>
                          </div>
                          <div>- Lista → • Lista</div>
                          <div>Linha dupla → Parágrafo</div>
                        </div>
                      </div>
                      <Textarea
                        placeholder="Digite o conteúdo da anotação..."
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        rows={8}
                        className="w-full resize-none font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 pt-4">
                    <Button
                      onClick={handleAddNote}
                      disabled={updateCharacterMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      {updateCharacterMutation.isPending
                        ? "Salvando..."
                        : "Salvar Anotação"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                      className="w-full sm:w-auto"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Botão de debug para dados corrompidos (apenas em desenvolvimento) */}
          {process.env.NODE_ENV === "development" &&
            parsed.status === "corrupted" &&
            isEditMode && (
              <Button
                variant="destructive"
                size="sm"
                onClick={clearCorruptedNotes}
                className="w-full sm:w-auto"
              >
                🔧 Limpar Dados Corrompidos
              </Button>
            )}
        </div>
      </div>

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
      ) : allNotes.length === 0 ? (
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
              <Button onClick={() => setIsAddDialogOpen(true)} size="lg">
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
              Não encontramos anotações que correspondam à sua busca por "
              {searchTerm}".
            </p>
            <Button variant="outline" onClick={() => setSearchTerm("")}>
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
                onChange={(e) => setSearchTerm(e.target.value)}
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
                <Card
                  key={note.id}
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
                                onClick={() => moveNoteUp(note.id)}
                                disabled={
                                  !canMoveUp ||
                                  updateCharacterMutation.isPending
                                }
                                className="h-4 w-6 p-0 hover:bg-primary/10 disabled:opacity-30"
                                title="Mover para cima"
                              >
                                <ChevronUp className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moveNoteDown(note.id)}
                                disabled={
                                  !canMoveDown ||
                                  updateCharacterMutation.isPending
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
                            onClick={() => openEditDialog(note)}
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
                                  Tem certeza que deseja excluir a anotação "
                                  {note.title}"? Esta ação não pode ser
                                  desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                <AlertDialogCancel className="w-full sm:w-auto">
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteNote(note.id)}
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
            })}
          </div>
        </div>
      )}

      {/* Dialog de edição */}
      <Dialog
        open={!!editingNote}
        onOpenChange={(open) => !open && closeEditDialog()}
      >
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Editar Anotação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Título</label>
              <Input
                placeholder="Digite o título da anotação"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Conteúdo</label>
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg space-y-1">
                  <div className="font-medium mb-2">
                    💡 Dicas de formatação:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    <div>
                      **negrito** → <strong>negrito</strong>
                    </div>
                    <div>
                      *itálico* → <em>itálico</em>
                    </div>
                    <div>
                      `código` →{" "}
                      <code className="bg-muted px-1 rounded text-xs">
                        código
                      </code>
                    </div>
                    <div>
                      # Título → <strong>Título</strong>
                    </div>
                    <div>- Lista → • Lista</div>
                    <div>Linha dupla → Parágrafo</div>
                  </div>
                </div>
                <Textarea
                  placeholder="Digite o conteúdo da anotação..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  rows={8}
                  className="w-full resize-none font-mono text-sm"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button
                onClick={handleEditNote}
                disabled={updateCharacterMutation.isPending}
                className="w-full sm:w-auto"
              >
                {updateCharacterMutation.isPending
                  ? "Salvando..."
                  : "Salvar Alterações"}
              </Button>
              <Button
                variant="outline"
                onClick={closeEditDialog}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
