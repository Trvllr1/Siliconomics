import { FIRST_TEARDOWN } from './first-teardown';
import { ADAS_TEARDOWN } from './adas-teardown';
import { IOT_TEARDOWN } from './iot-teardown';
import type { InsightArticle } from './types';

export { FIRST_TEARDOWN } from './first-teardown';
export { ADAS_TEARDOWN } from './adas-teardown';
export { IOT_TEARDOWN } from './iot-teardown';
export type { InsightArticle, InsightBlock } from './types';

export const INSIGHTS_INDEX: InsightArticle[] = [
  FIRST_TEARDOWN,
  ADAS_TEARDOWN,
  IOT_TEARDOWN,
];
