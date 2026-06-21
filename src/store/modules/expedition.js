import { defineStore } from 'pinia';

const RISK_BRANCHES = [
  {
    id: 'wild_beasts',
    name: '野兽袭击',
    description: '遭遇凶猛野兽，可能损失物资或人员受伤',
    probability: 0.25,
    severity: 'high',
    icon: '🐺',
    effects: { food: -15, water: -10 }
  },
  {
    id: 'storm',
    name: '暴风雨',
    description: '遭遇恶劣天气，行程延误并消耗额外物资',
    probability: 0.2,
    severity: 'medium',
    icon: '🌧️',
    effects: { food: -10, water: -5, wood: -10 }
  },
  {
    id: 'treasure',
    name: '发现宝藏',
    description: '意外发现废弃营地，获得大量物资',
    probability: 0.15,
    severity: 'low',
    icon: '💎',
    effects: { food: 30, water: 20, stone: 15 }
  },
  {
    id: 'lost',
    name: '迷失方向',
    description: '在丛林中迷路，消耗额外时间和物资',
    probability: 0.2,
    severity: 'medium',
    icon: '🧭',
    effects: { food: -12, water: -12 }
  },
  {
    id: 'favorable_terrain',
    name: '有利地形',
    description: '发现易于采集的区域，资源获取加成',
    probability: 0.2,
    severity: 'low',
    icon: '⛰️',
    effects: { wood: 20, stone: 15 }
  }
];

const TERRAIN_EXPEDITION_DATA = {
  forest: {
    name: '森林',
    icon: '🌳',
    baseDuration: 15000,
    baseCost: { food: 10, water: 8 },
    baseRewards: { food: [15, 30], wood: [20, 40] },
    risks: ['wild_beasts', 'treasure', 'favorable_terrain']
  },
  mountain: {
    name: '山地',
    icon: '🏔️',
    baseDuration: 20000,
    baseCost: { food: 15, water: 12 },
    baseRewards: { stone: [20, 40], wood: [10, 20] },
    risks: ['storm', 'lost', 'treasure']
  },
  ocean: {
    name: '海洋',
    icon: '🌊',
    baseDuration: 25000,
    baseCost: { food: 12, water: 15 },
    baseRewards: { food: [25, 45], water: [15, 25] },
    risks: ['storm', 'treasure', 'favorable_terrain']
  }
};

export default defineStore('expedition', {
  state: () => ({
    currentExpedition: null,
    targetCellIndex: null,
    selectedResources: {
      food: 0,
      water: 0,
      wood: 0,
      stone: 0
    },
    estimatedRisks: [],
    expeditionHistory: [],
    isPreparing: false,
    isInProgress: false,
    lastResult: null
  }),

  getters: {
    getRiskBranches: () => RISK_BRANCHES,
    getTerrainData: () => TERRAIN_EXPEDITION_DATA,
    totalCarriedWeight: (state) => {
      return Object.values(state.selectedResources).reduce((sum, val) => sum + val, 0);
    },
    estimatedSuccessRate: (state) => {
      if (!state.currentExpedition) return 0;
      const baseRate = 0.7;
      const resourceBonus = Math.min(state.selectedResources.food * 0.005 + state.selectedResources.water * 0.005, 0.2);
      const riskPenalty = state.estimatedRisks.reduce((penalty, risk) => {
        if (risk.severity === 'high') return penalty + risk.probability * 0.15;
        if (risk.severity === 'medium') return penalty + risk.probability * 0.1;
        return penalty;
      }, 0);
      return Math.min(Math.max(baseRate + resourceBonus - riskPenalty, 0.3), 0.95);
    },
    estimatedDuration: (state) => {
      if (!state.currentExpedition) return 0;
      const terrain = TERRAIN_EXPEDITION_DATA[state.currentExpedition.type];
      const weightModifier = 1 + (state.totalCarriedWeight * 0.002);
      return Math.floor(terrain.baseDuration * weightModifier);
    }
  },

  actions: {
    startPreparation(cellIndex, cellData) {
      this.targetCellIndex = cellIndex;
      this.currentExpedition = { ...cellData };
      this.isPreparing = true;
      this.selectedResources = { food: 0, water: 0, wood: 0, stone: 0 };
      this.lastResult = null;
      
      const terrain = TERRAIN_EXPEDITION_DATA[cellData.type];
      this.estimatedRisks = RISK_BRANCHES.filter(r => terrain.risks.includes(r.id));
    },

    cancelPreparation() {
      this.currentExpedition = null;
      this.targetCellIndex = null;
      this.isPreparing = false;
      this.selectedResources = { food: 0, water: 0, wood: 0, stone: 0 };
      this.estimatedRisks = [];
    },

    setResource(type, amount) {
      if (this.selectedResources.hasOwnProperty(type)) {
        this.selectedResources[type] = Math.max(0, amount);
      }
    },

    async startExpedition(currentResources) {
      const terrain = TERRAIN_EXPEDITION_DATA[this.currentExpedition.type];
      
      for (const [resource, amount] of Object.entries(terrain.baseCost)) {
        if (currentResources[resource] < amount + this.selectedResources[resource]) {
          throw new Error(`资源不足，${resource}不够`);
        }
      }

      this.isPreparing = false;
      this.isInProgress = true;

      const duration = this.estimatedDuration;
      
      return new Promise((resolve) => {
        setTimeout(() => {
          const result = this.calculateExpeditionResult(currentResources);
          this.isInProgress = false;
          this.lastResult = result;
          
          this.expeditionHistory.unshift({
            ...result,
            timestamp: Date.now(),
            terrain: this.currentExpedition.type
          });
          
          resolve(result);
        }, duration);
      });
    },

    calculateExpeditionResult(currentResources) {
      const terrain = TERRAIN_EXPEDITION_DATA[this.currentExpedition.type];
      const result = {
        success: true,
        cellExplored: true,
        cellIndex: this.targetCellIndex,
        resourceChanges: {},
        occurredRisks: [],
        gainedRewards: {},
        message: ''
      };

      for (const [resource, amount] of Object.entries(terrain.baseCost)) {
        result.resourceChanges[resource] = (result.resourceChanges[resource] || 0) - amount;
      }

      for (const [resource, amount] of Object.entries(this.selectedResources)) {
        result.resourceChanges[resource] = (result.resourceChanges[resource] || 0) - amount;
      }

      const bonusMultiplier = 1 + (this.selectedResources.wood * 0.01) + (this.selectedResources.stone * 0.01);

      for (const risk of this.estimatedRisks) {
        if (Math.random() < risk.probability) {
          result.occurredRisks.push(risk);
          for (const [resource, amount] of Object.entries(risk.effects)) {
            if (amount < 0) {
              const protectionBonus = this.selectedResources.wood * 0.02 + this.selectedResources.stone * 0.02;
              const actualEffect = Math.floor(amount * (1 - Math.min(protectionBonus, 0.5)));
              result.resourceChanges[resource] = (result.resourceChanges[resource] || 0) + actualEffect;
            } else {
              result.resourceChanges[resource] = (result.resourceChanges[resource] || 0) + amount;
            }
          }
        }
      }

      for (const [resource, [min, max]] of Object.entries(terrain.baseRewards)) {
        const baseGain = Math.floor(Math.random() * (max - min + 1)) + min;
        const actualGain = Math.floor(baseGain * bonusMultiplier);
        result.gainedRewards[resource] = actualGain;
        result.resourceChanges[resource] = (result.resourceChanges[resource] || 0) + actualGain;
      }

      const foodLeft = currentResources.food + (result.resourceChanges.food || 0);
      const waterLeft = currentResources.water + (result.resourceChanges.water || 0);
      
      if (foodLeft <= 0 || waterLeft <= 0) {
        result.success = false;
        result.cellExplored = false;
        result.message = '远征失败！物资耗尽，被迫返回。';
      } else if (result.occurredRisks.some(r => r.severity === 'high' && Math.random() < 0.3)) {
        result.success = false;
        result.cellExplored = false;
        result.message = '远征失败！遭遇严重危险，被迫撤退。';
      } else {
        result.success = true;
        result.cellExplored = true;
        result.message = `远征成功！探索了${terrain.name}区域。`;
      }

      return result;
    },

    clearLastResult() {
      this.lastResult = null;
      this.currentExpedition = null;
      this.targetCellIndex = null;
      this.selectedResources = { food: 0, water: 0, wood: 0, stone: 0 };
      this.estimatedRisks = [];
    }
  }
});
