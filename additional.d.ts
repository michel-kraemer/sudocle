// unsure why we need this declaration, but without it, webpack does not find
// the module
declare module "pixi-filters/drop-shadow"

declare module "deep-rename-keys" {
  export default function rename(o: any, renamer: (key: string) => string)
}
