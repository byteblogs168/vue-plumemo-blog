import Vue from 'vue';
import Axios from 'axios';
import { error as globalError, hasOwn } from '@vue-async/utils';
import { http, categoryApi, tagApi, postApi, siteApi, globalSettings, setSiteSettings, setUserInfo } from '@/includes';

// components
import PluginHolder from '@/components/plugin-holder';

// 添加到 Vue.protytype 上的属性和方法
import * as prototypeArgs from '@/includes/prototype';

// Types
import { Plugin } from '@nuxt/types';
import { SiteSettings } from 'types/functions/settings';
import { setThemes } from '@/includes/theme';

// 注入 http 到 Vue
Vue.axios = Axios;
Vue.$http = http;

const plugin: Plugin = async (cxt) => {
  const { app } = cxt;
  /**
   * 加载网站配置文件
   */
  const metaKeys = ['description', 'keywords'];
  const metas: Array<{ name: string; content: any }> = []; // 提升给后面使用
  try {
    const configs = await siteApi.getConfigs();
    const settings: Partial<SiteSettings> = {};

    Object.keys(configs).forEach((key) => {
      if (hasOwn(globalSettings, key)) {
        settings[key as keyof SiteSettings] = configs[key];
      } else if (metaKeys.some((metaKey) => metaKey === key)) {
        metas.push({
          name: key,
          content: configs[key],
        });
      }
    });

    setSiteSettings(settings);
  } catch (err) {
    globalError(process.env.NODE_ENV === 'production', `[core] 站点配置加载失败, 错误：${err.message}`);
    // error({ statusCode: 500, message: '站点配置加载失败' });
  }

  /**
   * SEO配置
   */
  try {
    metas.forEach((meta) => {
      (app.head! as any).meta.push(meta);
    });
  } catch (err) {
    globalError(process.env.NODE_ENV === 'production', `[core] SEO配置加载失败, 错误：${err.message}`);
    // ignore error
  }

  /**
   * 加载用户配置
   */
  try {
    const configs = await siteApi.getUserInfo();
    setUserInfo(configs);
  } catch (err) {
    globalError(process.env.NODE_ENV === 'production', `[core] 用户配置加载失败, 错误：${err.message}`);
    // error({ statusCode: 500, message: '用户配置加载失败' });
  }

  /**
   * 加载 Theme 配置
   */
  try {
    const configs = await siteApi.getTheme();
    setThemes(configs.dark, configs.themes);
  } catch (err) {
    globalError(process.env.NODE_ENV === 'production', `[core] Theme配置加载失败, 错误：${err.message}`);
    // error({ statusCode: 500, message: 'Theme配置加载失败' });
  }

  /**
   * 加载 Widgets 配置
   */
  try {
    // todo
  } catch (err) {
    globalError(process.env.NODE_ENV === 'production', `[core] Widget配置加载失败, 错误：${err.message}`);
    // error({ statusCode: 500, message: 'Widget配置加载失败' });
  }

  /**
   * 注册全局组件
   */
  Vue.component(PluginHolder.name, PluginHolder);

  /**
   *  注册全局方法
   * (global mixin 必须在 created 之后才可以被调用, 所以这里使用 defineProperties)
   * prototypeAres 已包含 api 部分
   */
  ((methods: Dictionary<any> = {}) => {
    Object.defineProperties(
      Vue.prototype,
      Object.keys(methods).reduce((prev, name) => {
        !hasOwn(prev, name) &&
          (prev[name] = {
            get() {
              return methods[name];
            },
          });
        return prev;
      }, {} as PropertyDescriptorMap),
    );
  })({ ...prototypeArgs, axios: Axios, $http: http });

  /**
   * 添加 http and apis 到 Context
   */
  cxt.axios = Axios;
  cxt.$http = http;

  /**
   * for asyncData
   */
  cxt.categoryApi = categoryApi;
  cxt.tagApi = tagApi;
  cxt.postApi = postApi;
  cxt.siteApi = siteApi;
};

export default plugin;
