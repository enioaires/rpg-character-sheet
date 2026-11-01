// components/character/notes/notes-status-alert.tsx

import { Button } from "@/components/ui/button";
import { Copy, FileWarning, History, LoaderCircle } from "lucide-react";

export type LegacyMigrationStatus =
  | "locked"
  | "converting"
  | "failed"
  | "waiting";

type NotesStatusAlertProps =
  | { status: "corrupted"; onCopyOriginal: () => void }
  | { status: "legacy"; migrationStatus: LegacyMigrationStatus };

const FRAME_CLASS =
  "flex max-w-[720px] gap-3 rounded-md border p-3.5";

function LegacyLine({ status }: { status: LegacyMigrationStatus }) {
  if (status === "converting") {
    return (
      <span className="inline-flex items-center gap-2 text-sm">
        <LoaderCircle
          aria-hidden="true"
          className="size-4 animate-ficha-spin"
        />
        Convertendo…
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="text-sm text-destructive">
        Não foi possível converter as anotações. Recarregue a página para
        tentar de novo.
      </span>
    );
  }
  return (
    <span className="text-sm text-muted-foreground">
      {status === "locked"
        ? "Desbloqueie a ficha para converter as anotações para o novo formato."
        : "A conversão é automática no modo de edição. Se esta mensagem não sumir, recarregue a página."}
    </span>
  );
}

export function NotesStatusAlert(props: NotesStatusAlertProps) {
  if (props.status === "corrupted") {
    return (
      <div
        className={`${FRAME_CLASS} border-destructive bg-[color-mix(in_oklch,var(--destructive)_10%,var(--card))]`}
      >
        <FileWarning
          aria-hidden="true"
          className="size-[22px] shrink-0 text-destructive"
        />
        <div className="flex flex-col gap-2">
          <p className="m-0 text-[15px] font-bold">Anotações corrompidas</p>
          <p className="m-0 text-sm text-muted-foreground">
            Não foi possível ler as anotações desta ficha. Elas estão em
            somente leitura para não perder nada.
          </p>
          <Button
            type="button"
            variant="outline"
            className="h-11 self-start px-3.5"
            onClick={props.onCopyOriginal}
          >
            <Copy className="size-4" />
            Copiar texto original
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${FRAME_CLASS} border-warning bg-[color-mix(in_oklch,var(--warning)_10%,var(--card))]`}
    >
      <History
        aria-hidden="true"
        className="size-[22px] shrink-0 text-warning"
      />
      <div className="flex flex-col gap-2">
        <p className="m-0 text-[15px] font-bold">Anotações em formato antigo</p>
        <p className="m-0 text-sm text-muted-foreground">
          Estas anotações são de uma versão antiga. Elas serão convertidas em
          uma anotação; o conteúdo não muda.
        </p>
        <div role="status" aria-live="polite">
          <LegacyLine status={props.migrationStatus} />
        </div>
      </div>
    </div>
  );
}

export function PreservedNotesText({ text }: { text: string }) {
  return (
    <div className="flex max-w-[720px] flex-col gap-1.5">
      <span className="text-xs uppercase tracking-[0.06em] text-muted-foreground">
        Conteúdo salvo (somente leitura)
      </span>
      <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3 font-mono text-[13px]">
        {text}
      </pre>
    </div>
  );
}
