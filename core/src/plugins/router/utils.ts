/**
 * router/utils
 */
import { Component } from 'vue';
import { RouteConfig, Route } from 'vue-router';
import kebabCase from 'lodash.kebabcase';
import { trailingSlash } from '@/utils/path';

// Types
import { Locale } from 'types/functions/site';

/**
 * layouts
 */
export function layout(path: string, name: string, children: RouteConfig[]) {
  const folder = kebabCase(name);

  return {
    path,
    component: () =>
      import(
        /* webpackChunkName: "layout-[request]" */
        `@/layouts/${folder}/index`
      ),
    props: true,
    children,
  };
}

/**
 * pages
 */
export function route(path: string, name: string, file: string) {
  const folder = (file || `${kebabCase(name)}`).toLowerCase();

  return {
    component: () => import(`@/views/${folder}/index.vue`),
    name,
    path,
  };
}

/**
 * 子模块路由处理方式一
 * 判断前缀
 */
export function root(routes: RouteConfig[]) {
  // Add start slash
  return routes.map((route) => {
    !route.path.startsWith('/') && (route.path = '/' + route.path);
    return route;
  });
}
/**
 * 子模块路由处理方式一
 * 添加多语言到 params
 */
export function genLocaleConfig(locale: Locale) {
  // Matches allowed languages
  const languagePattern = locale.supportLanguages.map((lang: LangConfig) => lang.alternate || lang.locale).join('|');
  const languageRegexp = new RegExp('^(' + languagePattern + ')$');
  // Matches any language identifier
  const genericLanguageRegexp = /[a-z]{2,3}|[a-z]{2,3}-[a-zA-Z]{4}|[a-z]{2,3}-[A-Z]{2,3}/;

  const preferredLanguage =
    typeof document === 'undefined'
      ? locale.default
      : navigator.languages.find((l: string) => l.match(languageRegexp)) || locale.default;

  return {
    languagePattern,
    languageRegexp,
    genericLanguageRegexp,
    preferredLanguage,
  };
}

export function localeRoot(children: RouteConfig[], locale: Locale) {
  const { languagePattern, genericLanguageRegexp, preferredLanguage } = genLocaleConfig(locale);

  // Reomve start slash
  (function removeStartSlash(items: RouteConfig[]) {
    items.forEach((item) => {
      item.path.startsWith('/') && (item.path = item.path.substr(1));
    });
  })(children);

  return [
    layout(`/:lang(${languagePattern})`, 'Root', children),
    {
      path: `/:lang(${genericLanguageRegexp.source})/*`,
      redirect: (to: Route) => trailingSlash(`/${preferredLanguage}/${to.params.pathMatch || ''}`),
    },
    {
      // The previous one doesn't match if there's no slash after the language code
      path: `/:lang(${genericLanguageRegexp.source})`,
      redirect: () => `/${preferredLanguage}/`,
    },
    redirect((to: Route) => trailingSlash(`/${preferredLanguage}${to.path}`)),
  ];
}

export function redirect(redirect: (to: Route) => string) {
  return { path: '*', redirect };
}

/**
 * vue-router 不支持异步组件 loading
 * https://github.com/chrisvfritz/vue-enterprise-boilerplate/blob/master/src/router/routes.js#L93-L131
 */
export function lazyLoadView(
  asyncView: any,
  {
    loadingComponent,
    errorComponent,
    delay = 200,
    timeout = 10000,
  }: {
    loadingComponent?: Component;
    errorComponent?: Component;
    delay?: number;
    timeout?: number;
  } = {},
) {
  const AsyncHandler = () => ({
    component: asyncView,
    // A component to use while the component is loading.
    loading: loadingComponent || {
      render: (h: any) => h('h1', {}, 'Loading...'),
    },
    // Delay before showing the loading component.
    // Default: 200 (milliseconds).
    delay,
    // A fallback component in case the timeout is exceeded
    // when loading the component.
    error: errorComponent || {
      render: (h: any) => h('h1', {}, 'Load component error.'),
    },
    // Time before giving up trying to load the component.
    // Default: Infinity (milliseconds).
    timeout,
  });

  return Promise.resolve({
    functional: true,
    render(h: any, { data, children }: any) {
      // Transparently pass any props or children
      // to the view component.
      return h(AsyncHandler, data, children);
    },
  });
}