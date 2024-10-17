import { createServiceIdentifier } from '@gpk/core/common/instantiation';
/**
 * 定义frontendApplication的contribution point
 * 用于扩展frontendApplication
 * 
 * 如何使用：
 * - 定义一个类，实现IFrontendApplicationContribution接口
 * - 在相关类所在的ContainerModule中，将该类绑定到IFrontendApplicationContribution
 * - 在FrontendApplication中，通过multiInject获取所有的contribution
 */

export const FRONTEND_APPLICATION_CONTRIBUTION = Symbol.for("FrontendApplicationContribution");
export const IFrontendApplicationContribution = createServiceIdentifier<IFrontendApplicationContribution>(FRONTEND_APPLICATION_CONTRIBUTION, true);
export interface IFrontendApplicationContribution {
  onStart?(): void;
  onStop?(): void;
}
