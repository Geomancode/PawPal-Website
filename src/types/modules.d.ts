declare module "three" {
  export class Color {
    constructor(color: string);
  }

  export class MeshPhongMaterial {
    color: Color;
    emissive: Color;
    emissiveIntensity: number;
    shininess: number;
  }

  export class Vector3 {
    constructor(x?: number, y?: number, z?: number);
    clone(): Vector3;
    normalize(): Vector3;
    dot(vector: Vector3): number;
  }

  export class Camera {
    position: Vector3;
  }
}

declare module "react-globe.gl" {
  import { ComponentType, Ref } from "react";
  type GlobeProps = Record<string, unknown> & { ref?: Ref<unknown> };
  const Globe: ComponentType<GlobeProps>;
  export default Globe;
}

declare module "web-push" {
  export type PushSubscription = {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };

  export type VapidKeys = {
    publicKey: string;
    privateKey: string;
  };

  export type RequestOptions = Record<string, unknown>;

  export class WebPushError extends Error {
    statusCode?: number;
    body?: string;
    endpoint?: string;
  }

  export function setVapidDetails(subject: string, publicKey: string, privateKey: string): void;
  export function generateVAPIDKeys(): VapidKeys;
  export function sendNotification(
    subscription: PushSubscription,
    payload?: string | Buffer,
    options?: RequestOptions,
  ): Promise<unknown>;

  const webpush: {
    setVapidDetails: typeof setVapidDetails;
    generateVAPIDKeys: typeof generateVAPIDKeys;
    sendNotification: typeof sendNotification;
    WebPushError: typeof WebPushError;
  };

  export default webpush;
}
