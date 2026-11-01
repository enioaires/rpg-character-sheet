// components/character/notes/note-form.tsx

import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { INLINE_FIELD_LABEL_CLASS } from "@/components/ui/inline-field-state";
import { cn } from "@/lib/utils";
import { Info, LoaderCircle } from "lucide-react";

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
  const titleId = useId();
  const contentId = useId();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={titleId}
          className={cn(INLINE_FIELD_LABEL_CLASS, "block")}
        >
          Título
        </label>
        <Input
          id={titleId}
          placeholder="Digite o título da anotação"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="h-11 w-full text-base"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={contentId}
          className={cn(INLINE_FIELD_LABEL_CLASS, "block")}
        >
          Conteúdo
        </label>
        <details className="rounded-md border border-border bg-muted/50 text-xs text-muted-foreground">
          <summary className="flex min-h-11 cursor-pointer items-center gap-2 px-3 font-medium">
            <Info aria-hidden="true" className="size-4" />
            Dicas de formatação
          </summary>
          <div className="grid grid-cols-1 gap-1 px-3 pb-3 sm:grid-cols-2">
            <div>
              **negrito** → <strong>negrito</strong>
            </div>
            <div>
              *itálico* → <em>itálico</em>
            </div>
            <div>
              `código` →{" "}
              <code className="bg-muted px-1 rounded text-xs">código</code>
            </div>
            <div>
              # Título → <strong>Título</strong>
            </div>
            <div>- Lista → • Lista</div>
            <div>Linha dupla → Parágrafo</div>
          </div>
        </details>
        <Textarea
          id={contentId}
          placeholder="Digite o conteúdo da anotação..."
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          rows={8}
          className="w-full resize-y font-mono text-base"
        />
      </div>
      <div className="grid grid-cols-2 gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="h-12 font-semibold"
        >
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isSaving}
          className="h-12 font-semibold"
        >
          {isSaving ? (
            <>
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-ficha-spin"
              />
              Salvando...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </div>
  );
}
