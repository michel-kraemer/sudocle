declare module "*.css"

declare module "deep-rename-keys" {
  export default function rename(o: any, renamer: (key: string) => string)
}
