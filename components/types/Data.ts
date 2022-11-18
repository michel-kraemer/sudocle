export interface DataCell {
  value?: number | string,
  cornermarks?: (number | string)[],
  centremarks?: (number | string)[],
  pencilMarks?: (number | string)[] | number | string
}

export interface Cage {
  cells: [number, number][],
  value?: number | string,
  borderColor?: string
}

export interface Line {
  wayPoints: [number, number][],
  color: string,
  thickness: number
}

export interface ExtraRegion {
  cells: [number, number][],
  backgroundColor: string
}

export interface Arrow {
  wayPoints: [number, number][],
  color: string,
  thickness: number,
  headLength: number
}

export interface Overlay {
  center: [number, number],
  width: number,
  height: number,
  borderColor?: string,
  backgroundColor?: string,
  rounded?: boolean,
  fontSize?: number,
  fontColor?: string,
  text?: string | number,
  rotation?: number
}

export interface FogLight {
  center: [number, number],
  size: 1 | 3
}

export interface Data {
  cellSize: number,
  cells: DataCell[][],
  regions: [number, number][][],
  cages: Cage[],
  lines: Line[],
  extraRegions?: ExtraRegion[],
  arrows: Arrow[],
  underlays: Overlay[],
  overlays: Overlay[],
  solution?: (number | undefined)[][],
  fogLights?: FogLight[],
  title?: string,
  author?: string,
  rules?: string,
  solved: boolean
}
