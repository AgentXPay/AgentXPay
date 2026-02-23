import { FacilitatorConfig, RoutePrice } from "./types";

export class Facilitator {
  private routes: Map<string, RoutePrice>;
  private defaultConfig: FacilitatorConfig;

  constructor(defaultConfig: FacilitatorConfig) {
    this.routes = new Map();
    this.defaultConfig = defaultConfig;
  }

  registerRoute(route: RoutePrice): void {
    const key = `${route.method.toUpperCase()}:${route.path}`;
    this.routes.set(key, route);
  }

  getRouteConfig(method: string, path: string): RoutePrice | null {
    const key = `${method.toUpperCase()}:${path}`;

    const exact = this.routes.get(key);
    if (exact) return exact;

    for (const [routeKey, config] of this.routes) {
      const [routeMethod, routePath] = routeKey.split(":");
      if (routeMethod === method.toUpperCase() && this._matchPath(routePath, path)) {
        return config;
      }
    }

    return null;
  }

  getDefaultConfig(): FacilitatorConfig {
    return this.defaultConfig;
  }

  private _matchPath(pattern: string, path: string): boolean {
    if (pattern === path) return true;
    if (pattern.endsWith("*")) {
      return path.startsWith(pattern.slice(0, -1));
    }
    return false;
  }
}
