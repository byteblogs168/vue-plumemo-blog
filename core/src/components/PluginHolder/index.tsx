import { Vue, Component, Prop } from 'vue-property-decorator';
import { Component as VueComponent } from 'vue';
import { AsyncComponentFactory } from 'vue/types/options';
import classes from './styles/index.module.scss';

export type ComponentConfig = Record<string, string | { entry: string; args: Record<string, any> }>;

@Component({
  name: 'plugin-holder',
})
export default class PluginHolder extends Vue {
  @Prop({ type: Object, required: true, default: () => ({}) }) supportParams!: Record<string, string>; // 插件支持的参数
  @Prop({ type: Object, required: true, default: () => ({}) }) componentConfigs!: ComponentConfig; // 动态插件配置

  get dynamicComponents() {
    return Object.keys(this.componentConfigs).map(componentName => {
      const config = this.componentConfigs[componentName];
      let component: Promise<VueComponent>;
      let props: { [key: string]: any } = {};
      if (typeof config === 'string') {
        component = this.$componentLoader(componentName, config);
      } else {
        component = this.$componentLoader(componentName, config.entry);
        Object.keys(config.args).map(key => {
          const value = config.args[key];
          // 动态参数，来自 supportParams
          if (typeof value === 'string' && value.startsWith('$')) {
            props[key] = this.supportParams[value.substr(1)];
          } else {
            props[key] = value;
          }
        });
      }
      const asyncComponentFactory: AsyncComponentFactory = () => ({
        component: component as any, // https://github.com/vuejs/vue/issues/10252
        loading: {
          render: (h: any) => h('h1', {}, 'Loading...'),
        },
        error: {
          render: (h: any) => h('h1', {}, 'Load plugin error.'),
        },
        delay: 200,
        timeout: 5000,
      });
      return {
        asyncComponentFactory,
        props,
      };
    });
  }

  beforeCreate() {
    Vue.component('aa', () => ({
      component: (resolve: any, reject: any) => {
        setTimeout(() => {
          resolve({
            render(h: any) {
              return h('div', '456');
            },
          });
        }, 1000);
      },
      error: {
        render(h: any) {
          return h('div', 'error');
        },
      },
      timeout: 5000,
    }));
  }

  render() {
    return (
      <div class={['plugin-holder', classes.container]}>
        <aa />
        {this.dynamicComponents.map(({ asyncComponentFactory, ...data }) =>
          this.$createElement(asyncComponentFactory, data),
        )}
      </div>
    );
  }
}
