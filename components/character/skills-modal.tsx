// components/character/skills-modal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SKILLS, SKILL_LABELS, calculateSkillBonus } from '@/lib/constants/character'

interface SkillsModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  character: any
}

export function SkillsModal({ isOpen, onOpenChange, character }: SkillsModalProps) {
  const { level, skills = {} } = character

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Todas as Perícias</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-0.5 text-sm">
            {SKILLS.map((skillKey, index) => {
              const skill = skills[skillKey] || { distributed: 0, bonus: 0 }
              const levelBonus = calculateSkillBonus(level || 0)
              const total = 1 + (skill.distributed || 0) + (skill.bonus || 0) + levelBonus

              return (
                <div
                  key={skillKey}
                  className={`flex items-center py-1.5 px-2 rounded-sm transition-colors hover:bg-muted/50 ${
                    index % 2 === 0 ? 'bg-muted/20' : 'bg-transparent'
                  }`}
                >
                  {/* Nome da Perícia */}
                  <span className="flex-1 text-left">
                    {SKILL_LABELS[skillKey]}
                  </span>

                  {/* Linha Pontilhada */}
                  <div className="flex-1 mx-3 border-b border-dotted border-muted-foreground/30"></div>

                  {/* Valor Total */}
                  <span className="w-8 text-right font-mono text-sm font-medium">
                    {total}
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