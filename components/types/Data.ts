type Target = "cell-grids" | "overlay" | "underlay" | "cages"
export type TriggerEffectType = "foglight"
export type TriggerType = "cellvalue"

export interface DataCell {
  value?: number | string
  cornermarks?: (number | string)[]
  centremarks?: (number | string)[]
  pencilMarks?: (number | string)[] | number | string
}

export interface Cage {
  cells?: [number, number][]
  value?: number | string
  borderColor?: string
}

export interface Line {
  wayPoints: [number, number][]
  color: string
  thickness: number
  backgroundColor?: string
  strokeDashArray?: number[]
  strokeDashOffset?: number
  target?: Target
}

export interface ExtraRegion {
  cells: [number, number][]
  backgroundColor: string
}

export interface Arrow {
  wayPoints: [number, number][]
  color: string
  thickness: number
  headLength: number
}

export interface Overlay {
  center: [number, number]
  width: number
  height: number
  borderColor?: string
  backgroundColor?: string
  rounded?: boolean
  fontSize?: number
  fontColor?: string
  text?: string | number
  rotation?: number
  thickness?: number
}

export interface FogLight {
  center: [number, number]
  size: 1 | 3
}

export interface SVGPath {
  cellSize: number
  fill?: string
  fillRule?: string
  d: string
  target?: Target
}

export interface Metadata {
  bgimage?: string
  bgimageopacity?: number
}

export interface Settings {
  nogrid: boolean
}

export interface TriggerEffect {
  effect: { type: TriggerEffectType; cells: [number, number][] }
  trigger: { type: TriggerType; cell: [number, number] }
}

export interface Data {
  readonly cellSize: number
  readonly cells: DataCell[][]
  readonly regions: [number, number][][]
  readonly cages: Cage[]
  readonly lines: Line[]
  readonly extraRegions?: ExtraRegion[]
  readonly arrows: Arrow[]
  readonly underlays: Overlay[]
  readonly overlays: Overlay[]
  readonly solution?: (number | undefined)[][]
  readonly fogLights?: FogLight[]
  readonly svgPaths?: SVGPath[]
  readonly title?: string
  readonly author?: string
  readonly rules?: string
  readonly metadata?: Metadata
  readonly settings?: Settings
  readonly triggerEffects: TriggerEffect[]
  readonly solved: boolean
}
