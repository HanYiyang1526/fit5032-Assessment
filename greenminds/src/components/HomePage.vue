<script setup>
defineProps({
  currentUser: {
    type: Object,
    default: null
  }
})
defineEmits(['navigate'])
</script>

<template>
  <section class="hero-section text-center">
    <div class="container">
      <template v-if="currentUser && currentUser.role === 'Teacher'">
        <h1 class="display-5 fw-bold">Welcome back, {{ currentUser.displayName }}</h1>
        <p class="lead mt-3">
          Jump back into curriculum-aligned lesson plans and classroom-ready
          resources picked for teachers.
        </p>
        <a
          href="#"
          class="btn btn-light btn-lg mt-2"
          @click.prevent="$emit('navigate', 'resources')"
        >
          Browse Teacher Resources
        </a>
      </template>
      <template v-else-if="currentUser && currentUser.role === 'Volunteer'">
        <h1 class="display-5 fw-bold">Welcome back, {{ currentUser.displayName }}</h1>
        <p class="lead mt-3">
          Thanks for being part of the GreenMinds community — see what's new
          and rate the resources you've used.
        </p>
        <a
          href="#"
          class="btn btn-light btn-lg mt-2"
          @click.prevent="$emit('navigate', 'resources')"
        >
          View Volunteer Opportunities
        </a>
      </template>
      <template v-else>
        <h1 class="display-5 fw-bold">Climate education for every community</h1>
        <p class="lead mt-3">
          GreenMinds Australia helps teachers, families, and young volunteers
          build climate literacy through accessible resources, workshops, and
          hands-on community action.
        </p>
        <a
          href="#"
          class="btn btn-light btn-lg mt-2"
          @click.prevent="$emit('navigate', 'resources')"
        >
          Browse Resources
        </a>
      </template>
    </div>
  </section>

  <section class="container my-5">
    <div class="row g-4">
      <div class="col-12 col-md-4">
        <div class="card h-100 border-0 shadow-sm">
          <div class="card-body">
            <h5 class="card-title">For Teachers</h5>
            <p class="card-text">
              Curriculum-aligned lesson plans and classroom-ready resources
              you can use with minimal preparation.
            </p>
          </div>
        </div>
      </div>
      <div class="col-12 col-md-4">
        <div class="card h-100 border-0 shadow-sm">
          <div class="card-body">
            <h5 class="card-title">For Families</h5>
            <p class="card-text">
              Practical, family-friendly activities and guides to build
              climate awareness at home and outdoors.
            </p>
          </div>
        </div>
      </div>
      <div class="col-12 col-md-4">
        <div class="card h-100 border-0 shadow-sm">
          <div class="card-body">
            <h5 class="card-title">For Volunteers</h5>
            <p class="card-text">
              Meaningful, well-defined volunteering opportunities to build
              experience and connect with the community.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
