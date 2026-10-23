import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/lib/toast-store'
import { CATEGORIES } from '@shared/data/outsider-categories'
import { MIN_WORDS, splitLines } from '@shared/outsider-words'
import { saveCustom } from '../outsider-store'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The category being edited; absent for a new one. */
  editing?: { name: string; lines: string[] }
}

/** Write a category of your own — one word per line, «= who» optional. */
export function CustomCategorySheet({ open, onOpenChange, editing }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        {/* Keyed so each opening starts from the category it opened on. */}
        <CategoryForm
          key={editing?.name ?? 'new'}
          editing={editing}
          onDone={() => {
            onOpenChange(false)
          }}
        />
      </SheetContent>
    </Sheet>
  )
}

function CategoryForm({ editing, onDone }: { editing: Props['editing']; onDone: () => void }) {
  const [name, setName] = useState(editing?.name ?? '')
  const [text, setText] = useState(editing?.lines.join('\n') ?? '')

  const submit = () => {
    const title = name.trim()
    const lines = splitLines(text)
    if (!title) return toast.warning('اكتب اسم السالفة')
    if (title in CATEGORIES) return toast.warning('هذا الاسم موجود، اختار اسم ثاني')
    if (lines.length < MIN_WORDS) return toast.warning('اكتب كلمتين على الأقل')
    saveCustom(title, lines, editing?.name)
    toast.success(editing ? 'انحفظ التعديل' : 'انضافت السالفة')
    onDone()
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <SheetHeader>
        <SheetTitle>{editing ? 'تعديل السالفة' : 'سالفة خاصة بيكم'}</SheetTitle>
        <SheetDescription>
          ألقاب، مصطلحات، أي شي تعرفه الشلة. كلمة بكل سطر، و«= الشخص» اختياري ويطلع بس للي داخل السالفة.
        </SheetDescription>
      </SheetHeader>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cat-name">اسم السالفة</Label>
        <Input
          id="cat-name"
          value={name}
          maxLength={30}
          placeholder="مثلاً: ألقاب الشلة"
          onChange={(e) => {
            setName(e.target.value)
          }}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cat-words">الكلمات</Label>
        <Textarea
          id="cat-words"
          rows={6}
          value={text}
          placeholder={'اريل = قاسم\nحبار = سجاد\nكرايب'}
          onChange={(e) => {
            setText(e.target.value)
          }}
        />
      </div>
      <Button type="submit" size="lg">
        {editing ? 'حفظ التعديل' : 'إضافة السالفة'}
      </Button>
    </form>
  )
}
