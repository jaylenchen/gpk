import { createServiceIdentifier } from '@gpk/core/common/instantiation';
/**
 * 定义frontendApplication的contribution point
 * 用于扩展frontendApplication
 * 
 * 如何使用：
 * 1、定义一个类，实现IFrontendApplicationContribution接口
 * 2、在相关类所在的ContainerModule中，将该类绑定到IFrontendApplicationContribution
 * 3、在FrontendApplication中，通过multiInject获取所有的contribution
 */

export const _IFrontendApplicationContribution = Symbol.for("IFrontendApplicationContribution");
export const IFrontendApplicationContribution = createServiceIdentifier<IFrontendApplicationContribution>(_IFrontendApplicationContribution, true);
export interface IFrontendApplicationContribution {
  onStart?(): void;
  onStop?(): void;
}
