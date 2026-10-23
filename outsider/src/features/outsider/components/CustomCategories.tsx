import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast-store'
import { secretsOf } from '@shared/outsider-words'
import { customStore, deleteCustom, saveCustom, useCustom } from '../outsider-store'
import { CustomCategorySheet } from './CustomCategorySheet'

/** The group's own categories: listed with edit / delete, plus «سالفة جديدة». */
export function CustomCategories() {
  const custom = useCustom()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<{ name: string; lines: string[] } | undefined>()

  const edit = (name?: string) => {
    setEditing(name ? { name, lines: custom[name] ?? [] } : undefined)
    setOpen(true)
  }

  const remove = (name: string) => {
    const lines = customStore.get()[name] ?? []
    deleteCustom(name)
    toast.info(`انحذفت «${name}»`, {
      action: {
        label: 'تراجع',
        onClick: () => {
          saveCustom(name, lines)
        },
      },
    })
  }

  return (
    <section className="flex flex-col gap-3 rounded-card border-2 border-hairline bg-card p-4 shadow-pixel">
      <h2 className="font-display text-16 font-bold">سوالف خاصة بيكم</h2>
      {Object.keys(custom).length > 0 && (
        <ul className="flex flex-col">
          {Object.entries(custom).map(([name, lines]) => (
            <li key={name} className="flex items-center gap-1 border-b border-divider py-1 last:border-b-0">
              <span className="flex-1 truncate font-display text-15 font-semibold">{name}</span>
              <span className="text-12 text-ink-faint">{secretsOf(lines).length} كلمات</span>
              <Button variant="ghost" size="icon" aria-label={`تعديل ${name}`} onClick={() => { edit(name) }}>
                <Pencil className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" aria-label={`حذف ${name}`} className="text-plasma" onClick={() => { remove(name) }}>
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <Button variant="dashed" onClick={() => { edit() }}>
        <Plus />
        سالفة جديدة
      </Button>
      <CustomCategorySheet open={open} onOpenChange={setOpen} editing={editing} />
    </section>
  )
}
