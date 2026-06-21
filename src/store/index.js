import { createPinia } from 'pinia';
import useUserStore from './modules/user';
import useProductStore from './modules/product';
import useOrderStore from './modules/order';
import useAppStore from './modules/app';
import useExpeditionStore from './modules/expedition';

const pinia = createPinia();

export {
  useUserStore,
  useProductStore,
  useOrderStore,
  useAppStore,
  useExpeditionStore
};

export default pinia;