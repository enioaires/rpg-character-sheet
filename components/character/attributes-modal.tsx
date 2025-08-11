// components/character/attributes-modal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ATTRIBUTES, ATTRIBUTE_LABELS, calculateAttributeBonus } from '@/lib/constants/character'

interface AttributesModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  character: any
}

export function AttributesModal({ isOpen, onOpenChange, character }: AttributesModalProps) {
  const { attributes = {} } = character

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Todos os Atributos</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-0.5 text-sm">
            {ATTRIBUTES.map((attributeKey, index) => {
              const attr = attributes[attributeKey] || { race: 0, class: 0, bonus: 0 }
              const attributeValue = (attr.race || 0) + (attr.class || 0) + (attr.bonus || 0)
              const bonus = calculateAttributeBonus(attributeValue)

              return (
                <div
                  key={attributeKey}
                  className={`flex items-center py-1.5 px-2 rounded-sm transition-colors hover:bg-muted/50 ${
                    index % 2 === 0 ? 'bg-muted/20' : 'bg-transparent'
                  }`}
                >
                  {/* Nome do Atributo */}
                  <span className="flex-1 text-left">
                    {ATTRIBUTE_LABELS[attributeKey]}
                  </span>

                  {/* Linha Pontilhada */}
                  <div className="flex-1 mx-3 border-b border-dotted border-muted-foreground/30"></div>

                  {/* Valor Total */}
                  <span className="w-8 text-right font-mono text-sm font-medium">
                    {attributeValue}
                  </span>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}