import { ContainerModule, decorate, inject, injectable, multiInject } from 'inversify';

// 加一个{ _serviceBrand?: 'ServiceIdentifier' }是为了屏蔽掉ServiceIdentifier展开的类型，而是在移入指定装饰器的时候将类型显示成ServiceIdentifier<IXXService>
// 加上{ _serviceBrand?: 'ServiceIdentifier' }并不会影响显示的具体类型，只是为了让类型显示成ServiceIdentifier<IXXService>
export type ServiceIdentifier<T = unknown> = ReturnType<typeof inject<T>> & { _serviceBrand?: undefined };;

export function createServiceIdentifier<T = unknown>(serviceId: symbol, multi?: boolean): ServiceIdentifier<T> {
  if (multi) {
    return multiInject(serviceId)
  }

  return inject(serviceId)
}

export function createService(serviceImpl: new (...args: any[]) => any) {
  decorate(injectable(), serviceImpl)

  return serviceImpl
}

export interface IServiceModule {
  id: symbol
  service: new (...args: any[]) => any
}

export interface IServiceExtension {
  /**
   * 服务初始化：当服务初始化时，可以在这里进行一些初始化操作
   */
  onInitialize?: () => void
  /**
   * 暴露服务API：当服务需要暴露一些API代理到Gepick身上时，可以在这里进行暴露，暴露后的服务API可以通过gepick实例直接进行调用
   */
  exposeApi?: () => void
}

export enum ServiceImplementationType {
  ConstantValue,
  Class
}

export type INewable = new (...args: any[]) => any;
type ImplementationType<T extends ServiceImplementationType> =
  T extends ServiceImplementationType.Class ? INewable : any;

export interface IBindedService<T extends ServiceImplementationType> {
  type: T;
  id: symbol | INewable;
  implementation: ImplementationType<T>;
  tag?: symbol;
}

export type IService = IBindedService<ServiceImplementationType.Class> | IBindedService<ServiceImplementationType.ConstantValue>;

export function defineContainerModule(services: IService[]) {
  return new ContainerModule((bind) => {
    services.forEach((service) => {
      switch (service.type) {
        case ServiceImplementationType.Class: {
          bind(service.id).to(createService(service.implementation)).inSingletonScope();
          break;
        }
        case ServiceImplementationType.ConstantValue: {
          bind(service.id).toConstantValue(service.implementation);
          break;
        }
      }

      if (service.tag) {
        bind(service.tag).toService(service.id);
      }
    })
  })
}

export { optional, postConstruct, Container, ContainerModule } from 'inversify'
