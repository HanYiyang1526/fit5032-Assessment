<script setup>
import { reactive, ref } from 'vue'

const form = reactive({
  name: '',
  email: '',
  message: ''
})

const errors = reactive({
  name: '',
  email: '',
  message: ''
})

const submitted = ref(false)

// BR (B.1) Validations: at least two different validation types are
// implemented below — (1) required-field validation for name/email/message,
// and (2) email format validation using a regular expression.
function validate() {
  errors.name = ''
  errors.email = ''
  errors.message = ''
  let isValid = true

  if (!form.name.trim()) {
    errors.name = 'Please enter your name.'
    isValid = false
  }

  if (!form.email.trim()) {
    errors.email = 'Please enter your email address.'
    isValid = false
  } else {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(form.email)) {
      errors.email = 'Please enter a valid email address.'
      isValid = false
    }
  }

  if (!form.message.trim()) {
    errors.message = 'Please enter a message.'
    isValid = false
  } else if (form.message.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters long.'
    isValid = false
  }

  return isValid
}

function handleSubmit() {
  submitted.value = false
  if (validate()) {
    submitted.value = true
    form.name = ''
    form.email = ''
    form.message = ''
  }
}
</script>

<template>
  <section class="container my-5" style="max-width: 640px;">
    <h2 class="mb-3">Contact Us / Newsletter Sign-up</h2>
    <p class="text-muted">
      Have a question, or want to stay updated on upcoming workshops? Send
      us a message below.
    </p>

    <div v-if="submitted" class="alert alert-success" role="alert">
      Thanks for reaching out — we'll be in touch soon.
    </div>

    <form novalidate @submit.prevent="handleSubmit">
      <div class="mb-3">
        <label for="name" class="form-label">Full name</label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          class="form-control"
          :class="{ 'is-invalid': errors.name }"
        />
        <div class="invalid-feedback" v-if="errors.name">{{ errors.name }}</div>
      </div>

      <div class="mb-3">
        <label for="email" class="form-label">Email address</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          class="form-control"
          :class="{ 'is-invalid': errors.email }"
        />
        <div class="invalid-feedback" v-if="errors.email">{{ errors.email }}</div>
      </div>

      <div class="mb-3">
        <label for="message" class="form-label">Message</label>
        <textarea
          id="message"
          v-model="form.message"
          class="form-control"
          rows="4"
          :class="{ 'is-invalid': errors.message }"
        ></textarea>
        <div class="invalid-feedback" v-if="errors.message">
          {{ errors.message }}
        </div>
      </div>

      <button type="submit" class="btn btn-gm-primary">Send message</button>
    </form>
  </section>
</template>
