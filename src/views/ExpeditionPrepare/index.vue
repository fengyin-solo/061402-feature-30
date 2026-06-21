<template>
  <div class="expedition-container">
    <div class="expedition-header">
      <h1>🧭 远征准备</h1>
      <p>为探索未知区域做好准备</p>
    </div>

    <div v-if="expeditionStore.isInProgress" class="expedition-progress">
      <div class="progress-card">
        <div class="progress-icon">🚶</div>
        <h3>远征进行中...</h3>
        <p>正在探索 {{ terrainData?.icon }} {{ terrainData?.name }}</p>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <p class="progress-text">{{ remainingTimeText }}</p>
      </div>
    </div>

    <div v-else-if="expeditionStore.lastResult" class="expedition-result">
      <div class="result-card" :class="{ success: expeditionStore.lastResult.success, failure: !expeditionStore.lastResult.success }">
        <div class="result-icon">{{ expeditionStore.lastResult.success ? '🎉' : '😢' }}</div>
        <h3>{{ expeditionStore.lastResult.success ? '远征成功！' : '远征失败' }}</h3>
        <p class="result-message">{{ expeditionStore.lastResult.message }}</p>

        <div v-if="expeditionStore.lastResult.occurredRisks.length > 0" class="risks-section">
          <h4>⚡ 遭遇事件</h4>
          <div class="risk-list">
            <div v-for="risk in expeditionStore.lastResult.occurredRisks" :key="risk.id" class="risk-item">
              <span class="risk-icon">{{ risk.icon }}</span>
              <span class="risk-name">{{ risk.name }}</span>
              <span :class="`risk-severity ${risk.severity}`">
                {{ risk.severity === 'high' ? '严重' : risk.severity === 'medium' ? '中等' : '轻微' }}
              </span>
            </div>
          </div>
        </div>

        <div class="rewards-section">
          <h4>🎁 获得奖励</h4>
          <div class="reward-list">
            <div v-for="(amount, resource) in expeditionStore.lastResult.gainedRewards" :key="resource" class="reward-item" :class="{ positive: amount > 0, negative: amount < 0 }">
              <span class="reward-icon">{{ getResourceIcon(resource) }}</span>
              <span class="reward-name">{{ getResourceName(resource) }}</span>
              <span class="reward-amount">{{ amount > 0 ? '+' : '' }}{{ amount }}</span>
            </div>
          </div>
          <div v-if="Object.keys(expeditionStore.lastResult.gainedRewards).length === 0" class="no-rewards">
            本次远征没有获得额外奖励
          </div>
        </div>

        <div class="summary-section">
          <h4>📊 资源变化汇总</h4>
          <div class="summary-grid">
            <div v-for="(amount, resource) in expeditionStore.lastResult.resourceChanges" :key="resource" class="summary-item" :class="{ positive: amount > 0, negative: amount < 0 }">
              <span class="summary-icon">{{ getResourceIcon(resource) }}</span>
              <span class="summary-name">{{ getResourceName(resource) }}</span>
              <span class="summary-amount">{{ amount > 0 ? '+' : '' }}{{ amount }}</span>
            </div>
          </div>
        </div>

        <div v-if="expeditionStore.lastResult.cellExplored" class="map-update-section">
          <h4>🗺️ 地图更新</h4>
          <p>目标区域已标记为已探索！</p>
        </div>

        <el-button type="primary" size="large" @click="handleReturn">返回主界面</el-button>
      </div>
    </div>

    <div v-else class="expedition-prepare">
      <div class="prepare-grid">
        <div class="target-section">
          <h3>🎯 目标区域</h3>
          <div class="target-card">
            <div class="target-icon">{{ expeditionStore.currentExpedition?.icon }}</div>
            <div class="target-info">
              <h4>{{ terrainData?.name }}</h4>
              <p>地形类型: {{ getTerrainTypeName(expeditionStore.currentExpedition?.type) }}</p>
            </div>
          </div>
          
          <div class="base-info">
            <div class="info-item">
              <span class="info-label">⏱️ 基础耗时</span>
              <span class="info-value">{{ formatDuration(terrainData?.baseDuration || 0) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">💰 基础消耗</span>
              <div class="cost-list">
                <span v-for="(amount, resource) in terrainData?.baseCost" :key="resource">
                  {{ getResourceIcon(resource) }} -{{ amount }}
                </span>
              </div>
            </div>
            <div class="info-item">
              <span class="info-label">🎁 预计奖励</span>
              <div class="reward-preview">
                <span v-for="(range, resource) in terrainData?.baseRewards" :key="resource">
                  {{ getResourceIcon(resource) }} {{ range[0] }}-{{ range[1] }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="resources-section">
          <h3>🎒 随行资源</h3>
          <p class="section-desc">选择携带的资源，食物和水可提高成功率，木材和石头可提供防护</p>
          
          <div class="resource-selectors">
            <div class="resource-selector">
              <div class="resource-header">
                <span class="resource-icon">🍖</span>
                <span class="resource-name">食物</span>
                <span class="resource-available">可用: {{ currentResources.food }}</span>
              </div>
              <div class="selector-controls">
                <el-button :disabled="expeditionStore.selectedResources.food <= 0" @click="adjustResource('food', -5)">-5</el-button>
                <el-button :disabled="expeditionStore.selectedResources.food <= 0" @click="adjustResource('food', -1)">-1</el-button>
                <span class="resource-count">{{ expeditionStore.selectedResources.food }}</span>
                <el-button :disabled="expeditionStore.selectedResources.food >= currentResources.food" @click="adjustResource('food', 1)">+1</el-button>
                <el-button :disabled="expeditionStore.selectedResources.food >= currentResources.food" @click="adjustResource('food', 5)">+5</el-button>
              </div>
              <div class="resource-effect">效果: 每单位提高 0.5% 成功率</div>
            </div>

            <div class="resource-selector">
              <div class="resource-header">
                <span class="resource-icon">💧</span>
                <span class="resource-name">淡水</span>
                <span class="resource-available">可用: {{ currentResources.water }}</span>
              </div>
              <div class="selector-controls">
                <el-button :disabled="expeditionStore.selectedResources.water <= 0" @click="adjustResource('water', -5)">-5</el-button>
                <el-button :disabled="expeditionStore.selectedResources.water <= 0" @click="adjustResource('water', -1)">-1</el-button>
                <span class="resource-count">{{ expeditionStore.selectedResources.water }}</span>
                <el-button :disabled="expeditionStore.selectedResources.water >= currentResources.water" @click="adjustResource('water', 1)">+1</el-button>
                <el-button :disabled="expeditionStore.selectedResources.water >= currentResources.water" @click="adjustResource('water', 5)">+5</el-button>
              </div>
              <div class="resource-effect">效果: 每单位提高 0.5% 成功率</div>
            </div>

            <div class="resource-selector">
              <div class="resource-header">
                <span class="resource-icon">🪵</span>
                <span class="resource-name">木材</span>
                <span class="resource-available">可用: {{ currentResources.wood }}</span>
              </div>
              <div class="selector-controls">
                <el-button :disabled="expeditionStore.selectedResources.wood <= 0" @click="adjustResource('wood', -5)">-5</el-button>
                <el-button :disabled="expeditionStore.selectedResources.wood <= 0" @click="adjustResource('wood', -1)">-1</el-button>
                <span class="resource-count">{{ expeditionStore.selectedResources.wood }}</span>
                <el-button :disabled="expeditionStore.selectedResources.wood >= currentResources.wood" @click="adjustResource('wood', 1)">+1</el-button>
                <el-button :disabled="expeditionStore.selectedResources.wood >= currentResources.wood" @click="adjustResource('wood', 5)">+5</el-button>
              </div>
              <div class="resource-effect">效果: 每单位提高 1% 奖励，2% 风险防护</div>
            </div>

            <div class="resource-selector">
              <div class="resource-header">
                <span class="resource-icon">⛏️</span>
                <span class="resource-name">石头</span>
                <span class="resource-available">可用: {{ currentResources.stone }}</span>
              </div>
              <div class="selector-controls">
                <el-button :disabled="expeditionStore.selectedResources.stone <= 0" @click="adjustResource('stone', -5)">-5</el-button>
                <el-button :disabled="expeditionStore.selectedResources.stone <= 0" @click="adjustResource('stone', -1)">-1</el-button>
                <span class="resource-count">{{ expeditionStore.selectedResources.stone }}</span>
                <el-button :disabled="expeditionStore.selectedResources.stone >= currentResources.stone" @click="adjustResource('stone', 1)">+1</el-button>
                <el-button :disabled="expeditionStore.selectedResources.stone >= currentResources.stone" @click="adjustResource('stone', 5)">+5</el-button>
              </div>
              <div class="resource-effect">效果: 每单位提高 1% 奖励，2% 风险防护</div>
            </div>
          </div>

          <div class="carry-info">
            <span>总负重: {{ expeditionStore.totalCarriedWeight }}</span>
            <span class="carry-hint">(负重越高，耗时越长)</span>
          </div>
        </div>

        <div class="risks-section">
          <h3>⚠️ 预估风险</h3>
          <p class="section-desc">该区域可能遭遇以下事件</p>
          
          <div class="risk-list">
            <div v-for="risk in expeditionStore.estimatedRisks" :key="risk.id" class="risk-card" :class="risk.severity">
              <div class="risk-header">
                <span class="risk-icon">{{ risk.icon }}</span>
                <span class="risk-name">{{ risk.name }}</span>
                <span :class="`risk-severity ${risk.severity}`">
                  {{ risk.severity === 'high' ? '高风险' : risk.severity === 'medium' ? '中风险' : '低风险' }}
                </span>
              </div>
              <p class="risk-desc">{{ risk.description }}</p>
              <div class="risk-info">
                <span class="risk-prob">概率: {{ Math.round(risk.probability * 100) }}%</span>
                <div class="risk-effects">
                  <span v-for="(amount, resource) in risk.effects" :key="resource" :class="{ positive: amount > 0, negative: amount < 0 }">
                    {{ getResourceIcon(resource) }} {{ amount > 0 ? '+' : '' }}{{ amount }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="estimation-section">
          <h3>📈 远征预估</h3>
          
          <div class="estimation-card">
            <div class="estimation-item">
              <span class="estimation-label">预计成功率</span>
              <div class="estimation-value">
                <el-progress 
                  :percentage="Math.round(expeditionStore.estimatedSuccessRate * 100)" 
                  :color="getSuccessRateColor(expeditionStore.estimatedSuccessRate)"
                  :stroke-width="12"
                />
              </div>
            </div>
            
            <div class="estimation-item">
              <span class="estimation-label">预计耗时</span>
              <span class="estimation-value duration">{{ formatDuration(expeditionStore.estimatedDuration) }}</span>
            </div>

            <div class="estimation-item">
              <span class="estimation-label">资源消耗总计</span>
              <div class="total-cost">
                <span v-for="(amount, resource) in totalCost" :key="resource">
                  {{ getResourceIcon(resource) }} -{{ amount }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <el-button size="large" @click="handleCancel">取消</el-button>
        <el-button type="primary" size="large" @click="handleStartExpedition" :loading="starting">
          开始远征
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useExpeditionStore } from '../../store';

const router = useRouter();
const route = useRoute();
const expeditionStore = useExpeditionStore();

const starting = ref(false);
const progressPercent = ref(0);
const remainingTime = ref(0);
let progressTimer = null;

const currentResources = computed(() => {
  return route.query?.resources ? JSON.parse(route.query.resources) : {
    food: 100,
    water: 100,
    wood: 100,
    stone: 100
  };
});

const terrainData = computed(() => {
  if (!expeditionStore.currentExpedition) return null;
  return expeditionStore.getTerrainData[expeditionStore.currentExpedition.type];
});

const totalCost = computed(() => {
  const cost = {};
  if (terrainData.value) {
    for (const [resource, amount] of Object.entries(terrainData.value.baseCost)) {
      cost[resource] = amount + (expeditionStore.selectedResources[resource] || 0);
    }
  }
  return cost;
});

const remainingTimeText = computed(() => {
  if (remainingTime.value <= 0) return '即将完成...';
  const seconds = Math.ceil(remainingTime.value / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `剩余 ${mins}分${secs}秒`;
});

const getResourceIcon = (type) => {
  const icons = { food: '🍖', water: '💧', wood: '🪵', stone: '⛏️' };
  return icons[type] || '📦';
};

const getResourceName = (type) => {
  const names = { food: '食物', water: '淡水', wood: '木材', stone: '石头' };
  return names[type] || type;
};

const getTerrainTypeName = (type) => {
  const names = { forest: '森林', mountain: '山地', ocean: '海洋', camp: '营地' };
  return names[type] || type;
};

const formatDuration = (ms) => {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}分${secs}秒`;
};

const getSuccessRateColor = (rate) => {
  if (rate >= 0.8) return '#67c23a';
  if (rate >= 0.6) return '#e6a23c';
  return '#f56c6c';
};

const adjustResource = (type, delta) => {
  const current = expeditionStore.selectedResources[type];
  const newValue = current + delta;
  expeditionStore.setResource(type, newValue);
};

const handleCancel = () => {
  expeditionStore.cancelPreparation();
  router.push('/');
};

const handleStartExpedition = async () => {
  starting.value = true;
  try {
    const totalDuration = expeditionStore.estimatedDuration;
    remainingTime.value = totalDuration;
    progressPercent.value = 0;
    
    progressTimer = setInterval(() => {
      remainingTime.value -= 100;
      progressPercent.value = Math.min(100, ((totalDuration - remainingTime.value) / totalDuration) * 100);
    }, 100);

    const result = await expeditionStore.startExpedition(currentResources.value);
    
    clearInterval(progressTimer);
    progressPercent.value = 100;

    setTimeout(() => {
      if (result.success) {
        ElMessage.success(result.message);
      } else {
        ElMessage.warning(result.message);
      }
    }, 500);
  } catch (error) {
    ElMessage.error(error.message);
  } finally {
    starting.value = false;
  }
};

const handleReturn = () => {
  const result = expeditionStore.lastResult;
  expeditionStore.clearLastResult();
  router.push({
    path: '/',
    query: {
      expeditionResult: JSON.stringify(result)
    }
  });
};

onMounted(() => {
  if (!expeditionStore.isPreparing && !expeditionStore.isInProgress && !expeditionStore.lastResult) {
    const cellIndex = route.query.cellIndex;
    const cellData = route.query.cellData ? JSON.parse(route.query.cellData) : null;
    
    if (cellIndex !== undefined && cellData) {
      expeditionStore.startPreparation(parseInt(cellIndex), cellData);
    } else {
      router.push('/');
    }
  }
});

onUnmounted(() => {
  if (progressTimer) {
    clearInterval(progressTimer);
  }
});
</script>

<style scoped>
.expedition-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.expedition-header {
  text-align: center;
  color: white;
  margin-bottom: 30px;
}

.expedition-header h1 {
  font-size: 36px;
  margin: 0 0 10px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.expedition-header p {
  font-size: 16px;
  margin: 0;
  opacity: 0.9;
}

.expedition-progress {
  max-width: 600px;
  margin: 0 auto;
}

.progress-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.progress-icon {
  font-size: 64px;
  margin-bottom: 20px;
  animation: walking 1s ease-in-out infinite;
}

@keyframes walking {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.progress-card h3 {
  font-size: 24px;
  color: #333;
  margin: 0 0 10px 0;
}

.progress-card p {
  color: #666;
  margin: 0 0 20px 0;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  transition: width 0.1s linear;
}

.progress-text {
  font-size: 14px;
  color: #999;
}

.expedition-result {
  max-width: 800px;
  margin: 0 auto;
}

.result-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.result-card.success {
  border-top: 4px solid #67c23a;
}

.result-card.failure {
  border-top: 4px solid #f56c6c;
}

.result-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.result-card h3 {
  font-size: 28px;
  margin: 0 0 10px 0;
}

.result-card.success h3 {
  color: #67c23a;
}

.result-card.failure h3 {
  color: #f56c6c;
}

.result-message {
  font-size: 16px;
  color: #666;
  margin: 0 0 30px 0;
}

.risks-section,
.rewards-section,
.summary-section,
.map-update-section {
  text-align: left;
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.risks-section h4,
.rewards-section h4,
.summary-section h4,
.map-update-section h4 {
  font-size: 18px;
  color: #333;
  margin: 0 0 15px 0;
}

.risk-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.risk-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  background: white;
  border-radius: 6px;
  border-left: 3px solid #e6a23c;
}

.risk-item.high {
  border-left-color: #f56c6c;
}

.risk-item.low {
  border-left-color: #67c23a;
}

.risk-icon {
  font-size: 24px;
}

.risk-name {
  flex: 1;
  font-weight: 500;
  color: #333;
}

.risk-severity {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.risk-severity.high {
  background: #fef0f0;
  color: #f56c6c;
}

.risk-severity.medium {
  background: #fdf6ec;
  color: #e6a23c;
}

.risk-severity.low {
  background: #f0f9eb;
  color: #67c23a;
}

.reward-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
}

.reward-item,
.summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  background: white;
  border-radius: 6px;
}

.reward-item.positive,
.summary-item.positive {
  color: #67c23a;
}

.reward-item.negative,
.summary-item.negative {
  color: #f56c6c;
}

.reward-icon,
.summary-icon {
  font-size: 20px;
}

.reward-name,
.summary-name {
  flex: 1;
  color: #333;
}

.reward-amount,
.summary-amount {
  font-weight: bold;
}

.no-rewards {
  text-align: center;
  color: #999;
  padding: 20px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}

.map-update-section p {
  color: #67c23a;
  font-weight: 500;
  margin: 0;
}

.expedition-prepare {
  max-width: 1200px;
  margin: 0 auto;
}

.prepare-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.target-section,
.resources-section,
.risks-section,
.estimation-section {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.target-section h3,
.resources-section h3,
.risks-section h3,
.estimation-section h3 {
  font-size: 20px;
  color: #333;
  margin: 0 0 15px 0;
}

.section-desc {
  color: #999;
  font-size: 14px;
  margin: 0 0 20px 0;
}

.target-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border-radius: 8px;
  margin-bottom: 20px;
}

.target-icon {
  font-size: 48px;
}

.target-info h4 {
  font-size: 24px;
  color: #333;
  margin: 0 0 5px 0;
}

.target-info p {
  color: #666;
  margin: 0;
}

.base-info {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: #f8f9fa;
  border-radius: 6px;
}

.info-label {
  font-weight: 500;
  color: #666;
}

.info-value {
  color: #333;
  font-weight: bold;
}

.cost-list,
.reward-preview {
  display: flex;
  gap: 15px;
  font-size: 14px;
}

.cost-list span {
  color: #f56c6c;
}

.reward-preview span {
  color: #67c23a;
}

.resource-selectors {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.resource-selector {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.resource-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.resource-icon {
  font-size: 24px;
}

.resource-name {
  font-weight: 500;
  color: #333;
}

.resource-available {
  margin-left: auto;
  font-size: 12px;
  color: #999;
}

.selector-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 8px;
}

.resource-count {
  min-width: 40px;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.resource-effect {
  font-size: 12px;
  color: #67c23a;
  text-align: center;
}

.carry-info {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
  padding: 10px;
  background: #f0f9eb;
  border-radius: 6px;
  color: #67c23a;
  font-weight: 500;
}

.carry-hint {
  font-size: 12px;
  opacity: 0.8;
}

.risk-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.risk-card {
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #e6a23c;
  background: #fdf6ec;
}

.risk-card.high {
  border-left-color: #f56c6c;
  background: #fef0f0;
}

.risk-card.low {
  border-left-color: #67c23a;
  background: #f0f9eb;
}

.risk-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.risk-icon {
  font-size: 24px;
}

.risk-name {
  font-weight: 500;
  color: #333;
  flex: 1;
}

.risk-severity {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: white;
}

.risk-severity.high {
  color: #f56c6c;
}

.risk-severity.medium {
  color: #e6a23c;
}

.risk-severity.low {
  color: #67c23a;
}

.risk-desc {
  font-size: 13px;
  color: #666;
  margin: 0 0 10px 0;
}

.risk-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.risk-prob {
  color: #999;
}

.risk-effects {
  display: flex;
  gap: 10px;
}

.risk-effects span.positive {
  color: #67c23a;
}

.risk-effects span.negative {
  color: #f56c6c;
}

.estimation-card {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.estimation-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.estimation-label {
  font-weight: 500;
  color: #666;
}

.estimation-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.estimation-value.duration {
  text-align: center;
  color: #667eea;
}

.total-cost {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  font-size: 16px;
}

.total-cost span {
  color: #f56c6c;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.action-buttons .el-button {
  min-width: 150px;
}

@media (max-width: 768px) {
  .prepare-grid {
    grid-template-columns: 1fr;
  }
  
  .expedition-header h1 {
    font-size: 28px;
  }
  
  .result-card,
  .progress-card {
    padding: 25px;
  }
}
</style>
