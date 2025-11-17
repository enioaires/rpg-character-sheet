// components/character/notes-tab.tsx
"use client";

import { useState } from "react";
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

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

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
  const [hasMigratedOldNotes, setHasMigratedOldNotes] = useState(false);
  const [hasCorruptedData, setHasCorruptedData] = useState(false);

  // Função para migrar anotações antigas (texto simples) para o novo formato
  const migrateOldNotes = async (oldNotesText: string) => {
    if (hasMigratedOldNotes || !oldNotesText.trim()) return;

    try {
      const migratedNote: Note = {
        id: Date.now().toString(),
        title: "Anotações Antigas",
        content: oldNotesText.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const notesJson = JSON.stringify([migratedNote]);

      await updateCharacterMutation.mutateAsync({
        id: characterId,
        data: {
          notes: notesJson,
        },
      });

      setHasMigratedOldNotes(true);
      toast.success("Anotações antigas migradas com sucesso!");
    } catch (error) {
      console.error("Erro ao migrar anotações antigas:", error);
    }
  };

  // Parse notes from character data
  const allNotes: Note[] = (() => {
    try {
      // Se não há dados ou é null/undefined
      if (!character.notes) {
        return [];
      }

      // Se já é um array (caso improvável mas possível)
      if (Array.isArray(character.notes)) {
        return character.notes;
      }

      // Se é uma string, tentar fazer parse
      if (typeof character.notes === "string") {
        const trimmedNotes = character.notes.trim();

        // Se é string vazia
        if (trimmedNotes === "") {
          return [];
        }

        // Verificar se começa com [ ou { (indicando JSON)
        if (trimmedNotes.startsWith("[") || trimmedNotes.startsWith("{")) {
          try {
            const parsed = JSON.parse(trimmedNotes);

            // Verificar se o resultado é um array válido
            if (Array.isArray(parsed)) {
              return parsed;
            }

            // Se é um objeto, tentar converter
            if (typeof parsed === "object" && parsed !== null) {
              return [];
            }
          } catch (parseError) {
            console.error("Erro ao fazer parse do JSON:", parseError);
            // Se falhou o parse mas parece JSON, retornar vazio
            return [];
          }
        }

        // Se chegou aqui, provavelmente são anotações antigas em texto simples
        // Migrar automaticamente se estiver em modo de edição
        if (isEditMode && !hasMigratedOldNotes) {
          migrateOldNotes(trimmedNotes);
        }

        return [];
      }

      // Para qualquer outro tipo, retornar array vazio
      return [];
    } catch (error) {
      console.error("Erro ao parsear anotações:", error);
      console.log("Dados recebidos:", character.notes);
      console.log("Tipo dos dados:", typeof character.notes);
      console.log("Comprimento dos dados:", character.notes?.length);

      // Se estiver em modo de desenvolvimento, mostrar mais detalhes
      if (process.env.NODE_ENV === "development") {
        console.log(
          "Primeiros 100 caracteres:",
          character.notes?.substring(0, 100),
        );
        setHasCorruptedData(true);
      }

      return [];
    }
  })();

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

    try {
      const newNote: Note = {
        id: Date.now().toString(),
        title: newNoteTitle.trim(),
        content: newNoteContent.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedNotes = [...allNotes, newNote];
      const notesJson = JSON.stringify(updatedNotes);

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

      const notesJson = JSON.stringify(updatedNotes);

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
    try {
      const updatedNotes = allNotes.filter((note) => note.id !== noteId);
      const notesJson = JSON.stringify(updatedNotes);

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

  // Função para mover nota para cima
  const moveNoteUp = async (noteId: string) => {
    const currentIndex = allNotes.findIndex((note) => note.id === noteId);
    if (currentIndex <= 0) return; // Já está no topo ou não encontrada

    try {
      const newNotesArray = [...allNotes];
      // Trocar posições
      const temp = newNotesArray[currentIndex - 1];
      newNotesArray[currentIndex - 1] = newNotesArray[currentIndex];
      newNotesArray[currentIndex] = temp;

      const notesJson = JSON.stringify(newNotesArray);

      await updateCharacterMutation.mutateAsync({
        id: characterId,
        data: {
          notes: notesJson,
        },
      });

      toast.success("Posição da anotação atualizada!");
    } catch (error) {
      console.error("Erro ao mover anotação:", error);
      toast.error("Erro ao mover anotação");
    }
  };

  // Função para mover nota para baixo
  const moveNoteDown = async (noteId: string) => {
    const currentIndex = allNotes.findIndex((note) => note.id === noteId);
    if (currentIndex >= allNotes.length - 1 || currentIndex === -1) return; // Já está no final ou não encontrada

    try {
      const newNotesArray = [...allNotes];
      // Trocar posições
      const temp = newNotesArray[currentIndex];
      newNotesArray[currentIndex] = newNotesArray[currentIndex + 1];
      newNotesArray[currentIndex + 1] = temp;

      const notesJson = JSON.stringify(newNotesArray);

      await updateCharacterMutation.mutateAsync({
        id: characterId,
        data: {
          notes: notesJson,
        },
      });

      toast.success("Posição da anotação atualizada!");
    } catch (error) {
      console.error("Erro ao mover anotação:", error);
      toast.error("Erro ao mover anotação");
    }
  };

  // Função de emergência para limpar dados corrompidos
  const clearCorruptedNotes = async () => {
    try {
      await updateCharacterMutation.mutateAsync({
        id: characterId,
        data: {
          notes: JSON.stringify([]),
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

  const renderFormattedText = (text: string) => {
    // Simples formatação markdown-like
    let formatted = text
      // Negrito: **texto** -> <strong>texto</strong>
      .replace(
        /\*\*(.*?)\*\*/g,
        '<strong class="font-semibold text-foreground">$1</strong>',
      )
      // Itálico: *texto* -> <em>texto</em>
      .replace(/\*(.*?)\*/g, '<em class="italic text-muted-foreground">$1</em>')
      // Código: `texto` -> <code>texto</code>
      .replace(
        /`(.*?)`/g,
        '<code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono border">$1</code>',
      )
      // Títulos: ### Título -> <h3>Título</h3>
      .replace(
        /^### (.*$)/gm,
        '<h3 class="text-base font-semibold mt-3 mb-1 text-foreground">$1</h3>',
      )
      .replace(
        /^## (.*$)/gm,
        '<h2 class="text-lg font-semibold mt-4 mb-2 text-foreground">$1</h2>',
      )
      .replace(
        /^# (.*$)/gm,
        '<h1 class="text-xl font-bold mt-4 mb-2 text-foreground">$1</h1>',
      )
      // Lista simples: - item -> <li>item</li>
      .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc list-inside">$1</li>')
      // Quebras de linha duplas para parágrafos
      .replace(/\n\n/g, '</p><p class="mb-2">')
      // Quebras de linha simples
      .replace(/\n/g, "<br />");

    // Envolver em parágrafo se não começar com tag HTML
    if (!formatted.startsWith("<")) {
      formatted = `<p class="mb-2">${formatted}</p>`;
    }

    return (
      <div
        className="formatted-content"
        dangerouslySetInnerHTML={{ __html: formatted }}
      />
    );
  };

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
          {isEditMode && (
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
            hasCorruptedData &&
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
      {allNotes.length === 0 ? (
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
                    <ScrollArea className="h-32 sm:h-80">
                      <div className="text-sm leading-relaxed break-words pr-4">
                        {renderFormattedText(note.content)}
                      </div>
                    </ScrollArea>
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
