<script setup>
import { computed, reactive, ref } from 'vue'
import { apiPost } from '../services/api.js'
import { focusFirstInvalid } from '../utils/a11y.js'

// BR (F.1) Innovation — Bulk Email: compose one message and send it to the
// users selected in the dashboard table, via /api/bulk-email (BR E.1).
const props = defineProps({
  recipients: { type: Array, required: true }
})
const emit = defineEmits(['sent'])

const MAX_RECIPIENTS = 40

const form = reactive({ subject: '', message: '' })
const errors = reactive({ subject: '', message: '' })
const sending = ref(false)
const status = ref({ type: '', text: '' })

const recipientSummary = computed(() => {
  const names = props.recipients.map((u) => u.displayName || u.email)
  if (names.length <= 3) return names.join(', ')
  return `${names.slice(0, 3).join(', ')} and ${names.length - 3} more`
})

function validate() {
  errors.subject = form.subject.trim() ? '' : 'Please enter a subject.'
  errors.message =
    form.message.trim().length >= 10 ? '' : 'Message must be at least 10 characters long.'
  return !errors.subject && !errors.message
}

async function send(event) {
  status.value = { type: '', text: '' }
  if (!props.recipients.length) {
    status.value = { type: 'danger', text: 'Select at least one user in the table first.' }
    return
  }
  if (props.recipients.length > MAX_RECIPIENTS) {
    status.value = { type: 'danger', text: `You can email at most ${MAX_RECIPIENTS} users at a time.` }
    return
  }
  if (!validate()) {
    focusFirstInvalid(event.target)
    return
  }

  sending.value = true
  try {
    const result = await apiPost('/api/bulk-email', {
      recipientIds: props.recipients.map((u) => u.id),
      subject: form.subject.trim(),
      message: form.message.trim()
    })
    const extra = result.failed ? ` ${result.failed} could not be delivered.` : ''
    status.value = {
      type: result.failed ? 'warning' : 'success',
      text: `Email sent to ${result.sent} user${result.sent === 1 ? '' : 's'}.${extra}`
    }
    form.subject = ''
    form.message = ''
    emit('sent')
  } catch (err) {
    status.value = { type: 'danger', text: err.message }
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="card border-0 shadow-sm">
    <div class="card-body">
      <h2 class="h6">Bulk email</h2>
      <p class="small mb-3" aria-live="polite">
        <template v-if="recipients.length">
          <strong>{{ recipients.length }}</strong> selected: {{ recipientSummary }}
        </template>
        <span v-else class="text-muted">Tick users in the table to choose recipients.</span>
      </p>

      <form novalidate @submit.prevent="send">
        <div class="mb-2">
          <label for="bulk-subject" class="form-label small mb-1">Subject</label>
          <input
            id="bulk-subject"
            v-model="form.subject"
            type="text"
            maxlength="150"
            class="form-control form-control-sm"
            :class="{ 'is-invalid': errors.subject }"
            aria-required="true"
            :aria-invalid="!!errors.subject"
            aria-describedby="bulk-subject-error"
          />
          <div id="bulk-subject-error" class="invalid-feedback" v-if="errors.subject">
            {{ errors.subject }}
          </div>
        </div>
        <div class="mb-2">
          <label for="bulk-message" class="form-label small mb-1">Message</label>
          <textarea
            id="bulk-message"
            v-model="form.message"
            rows="5"
            maxlength="5000"
            class="form-control form-control-sm"
            :class="{ 'is-invalid': errors.message }"
            aria-required="true"
            :aria-invalid="!!errors.message"
            aria-describedby="bulk-message-hint bulk-message-error"
          ></textarea>
          <div id="bulk-message-hint" class="form-text">
            Each person gets their own copy starting with "Hi &lt;their name&gt;".
          </div>
          <div id="bulk-message-error" class="invalid-feedback" v-if="errors.message">
            {{ errors.message }}
          </div>
        </div>
        <button type="submit" class="btn btn-sm btn-gm-primary" :disabled="sending">
          {{ sending ? 'Sending…' : `Send to ${recipients.length} user${recipients.length === 1 ? '' : 's'}` }}
        </button>
      </form>

      <div
        class="small mt-2"
        :class="status.type ? `text-${status.type === 'warning' ? 'body' : status.type}` : ''"
        role="status"
        aria-live="polite"
      >
        {{ status.text }}
      </div>
    </div>
  </div>
</template>
