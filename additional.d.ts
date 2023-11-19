declare module "*.css"
declare module "*.oscss"
declare module "*.oscss?type=global"
declare module "*.oscss?type=resolve"

declare module "deep-rename-keys" {
  export default function rename(o: any, renamer: (key: string) => string)
}
