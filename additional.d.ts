declare module "*.css"
declare module "*.scss"
declare module "*.scss?type=global"
declare module "*.scss?type=resolve"

declare module "deep-rename-keys" {
  export default function rename(o: any, renamer: (key: string) => string)
}
