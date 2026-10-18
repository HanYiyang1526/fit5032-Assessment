import { nextTick } from 'vue'

// BR (E.3) After a failed form submit, move focus to the first invalid
// field so keyboard and screen-reader users land on the error.
export async function focusFirstInvalid(form) {
  await nextTick()
  form?.querySelector('[aria-invalid="true"]')?.focus()
}
