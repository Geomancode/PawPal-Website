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
