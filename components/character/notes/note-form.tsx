// components/character/notes/note-form.tsx

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface NoteFormProps {
  title: string;
  content: string;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onSubmit: () => void | Promise<void>;
  onCancel: () => void;
  submitLabel: string;
  isSaving: boolean;
}

export function NoteForm({
  title,
  content,
  onTitleChange,
  onContentChange,
  onSubmit,
  onCancel,
  submitLabel,
  isSaving,
}: NoteFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">
          Título
        </label>
        <Input
          placeholder="Digite o título da anotação"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
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
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            rows={8}
            className="w-full resize-none font-mono text-sm"
          />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 pt-4">
        <Button
          onClick={onSubmit}
          disabled={isSaving}
          className="w-full sm:w-auto"
        >
          {isSaving
            ? "Salvando..."
            : submitLabel}
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          className="w-full sm:w-auto"
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}
