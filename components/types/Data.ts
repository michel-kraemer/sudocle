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

export interface Metadata {
  bgimage?: string
  bgimageopacity?: number
}

export interface Data {
  readonly cellSize: number
  readonly cells: DataCell[][]
  readonly gridLines: Line[]
  readonly regions: [number, number][][]
  readonly cages: Cage[]
  readonly lines: Line[]
  readonly extraRegions?: ExtraRegion[]
  readonly arrows: Arrow[]
  readonly underlays: Overlay[]
  readonly overlays: (Overlay | Line)[]
  readonly solution?: (number | undefined)[][]
  readonly fogLights?: FogLight[]
  readonly title?: string
  readonly author?: string
  readonly rules?: string
  readonly metadata?: Metadata
  readonly solved: boolean
}
