<template>
  <div class="container">
    <div class="spinner is-flex is-touch">
      <div class="bar-1 bar"></div>
      <div class="bar-2 bar"></div>
      <div class="bar-3 bar"></div>
    </div>
  </div>
</template>

<script>
    export default {
        name: 'spinner',
    };
</script>

<style scoped lang="scss">

    .container {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
    }

    .spinner {
      width: 90px;
      height: 150px;
    }

    .spinner > .bar {
        width: 17px;
        height: 60px;
        margin: auto auto;
        border-radius: 4px;
      margin-left: 5px;
    }

    .bar-1 {
        animation: square-anim 1200ms cubic-bezier(0.445, 0.05, 0.55, 0.95) 0s infinite;
    }

    .bar-2 {
        animation: square-anim 1200ms cubic-bezier(0.445, 0.05, 0.55, 0.95) 200ms infinite;
    }

    .bar-3 {
        animation: square-anim 1200ms cubic-bezier(0.445, 0.05, 0.55, 0.95) 400ms infinite;
    }

    $black: #020203;
    $gray: #D6D7DC;
    @keyframes square-anim {
        0% {
            height: 60px;
            background-color: $black;
        }
        20% {
            height: 60px;
        }
        40% {
            height: 150px;
            background-color: $gray;
        }
        80% {
            height: 60px;
        }
        100% {
            height: 60px;
            background-color: $black;
        }
    }
</style>
