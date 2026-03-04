<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  cards: any[];
  activeCardId: number | null;
}>();

const emit = defineEmits(["update:activeCardId"]);

const activeCard = computed(() => {
  return props.cards.find((c) => c.id === props.activeCardId) || null;
});
</script>

<template>
  <div class="left-column">
    <div class="card-selector">
      <div
        v-for="card in cards"
        :key="card.id"
        class="mini-card glass-card"
        :class="{ active: activeCardId === card.id }"
        @click="emit('update:activeCardId', card.id)"
      >
        <div class="mini-icon" :style="{ color: card.color1Hex }">💳</div>
        <div class="mini-info">
          <h4>{{ card.name }}</h4>
          <p>Vence dia {{ card.dueDay }}</p>
        </div>
      </div>
    </div>

    <div class="virtual-card-wrapper" v-if="activeCard">
      <div
        class="virtual-card"
        :style="{
          background: `linear-gradient(135deg, ${activeCard.color1Hex}, ${activeCard.color2Hex})`,
        }"
      >
        <div class="card-top">
          <div class="chip"></div>
          <div class="network-logo">💳</div>
        </div>
        <div class="card-middle">
          <span class="card-number">•••• •••• •••• ••••</span>
        </div>
        <div class="card-bottom">
          <div class="card-holder">
            <span>BANCO</span>
            <p>{{ activeCard.accountName }}</p>
          </div>
          <div class="card-expires">
            <span>FECHAMENTO</span>
            <p>DIA {{ activeCard.closingDay }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.left-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card-selector {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.card-selector::-webkit-scrollbar {
  height: 4px;
}

.card-selector::-webkit-scrollbar-thumb {
  background: var(--glass-border);
  border-radius: 4px;
}

.mini-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 1rem;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
  min-width: 180px;
}

.mini-card:hover {
  border-color: var(--glass-border);
  background: var(--input-bg);
}

.mini-card.active {
  border-color: #8b5cf6;
  background: rgba(139, 92, 246, 0.05);
}

.mini-icon {
  font-size: 1.5rem;
}

.mini-info h4 {
  font-size: 0.95rem;
  color: var(--text-color);
}

.mini-info p {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.virtual-card-wrapper {
  perspective: 1000px;
  padding: 1rem 0;
}

.virtual-card {
  width: 100%;
  max-width: 400px;
  height: 250px;
  border-radius: 1.5rem;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: white;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2), inset 0 2px 10px rgba(255, 255, 255, 0.2);
  transition: all 0.5s cubic-bezier(0.4, 0.2, 0.2, 1);
  position: relative;
  overflow: hidden;
  margin: 0 auto;
}

.virtual-card::before {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    to bottom right,
    rgba(255, 255, 255, 0.2),
    rgba(255, 255, 255, 0)
  );
  transform: rotate(30deg);
  pointer-events: none;
}

.virtual-card:hover {
  transform: translateY(-10px) rotateX(5deg) rotateY(-5deg);
  box-shadow: 0 30px 50px rgba(0, 0, 0, 0.3);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
}

.chip {
  width: 45px;
  height: 35px;
  background: linear-gradient(135deg, #e0c38c, #cda75d);
  border-radius: 6px;
  position: relative;
  overflow: hidden;
}

.chip::after {
  content: "";
  position: absolute;
  width: 100%;
  height: 1px;
  background: rgba(0, 0, 0, 0.2);
  top: 50%;
  left: 0;
}

.chip::before {
  content: "";
  position: absolute;
  width: 1px;
  height: 100%;
  background: rgba(0, 0, 0, 0.2);
  top: 0;
  left: 50%;
}

.network-logo {
  font-size: 2rem;
}

.card-middle {
  margin-top: 1rem;
  position: relative;
  z-index: 1;
}

.card-number {
  font-size: 1.5rem;
  font-family: monospace;
  letter-spacing: 2px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  opacity: 0.9;
}

.card-bottom {
  display: flex;
  justify-content: space-between;
  position: relative;
  z-index: 1;
}

.card-holder span,
.card-expires span {
  font-size: 0.65rem;
  opacity: 0.8;
  letter-spacing: 1px;
}

.card-holder p,
.card-expires p {
  font-size: 1rem;
  font-weight: 600;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  text-transform: uppercase;
}

@media (max-width: 1024px) {
  .virtual-card {
    margin: 0 auto;
  }
}
</style>
