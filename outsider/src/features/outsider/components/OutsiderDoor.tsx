import { CategoryPicker } from './CategoryPicker'
import { CustomCategories } from './CustomCategories'
import { HowToPlay } from './HowToPlay'

/**
 * برا السالفة's front door, under the keys into a room: the categories and
 * the group's own words, picked ahead on this phone. They are what this phone
 * deals from when it hosts (the room's setup shows them again).
 */
export function OutsiderDoor() {
  return (
    <>
      <h2 className="mt-2 font-display text-16 font-bold text-ink-soft">جهّز السوالف قبل لا تسوّي الغرفة</h2>
      <CategoryPicker />
      <CustomCategories />
      <HowToPlay />
    </>
  )
}
