/** Resolve bundled public assets for both root and blog-subpath deployments. */
export function assetUrl(path:string):string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//,'')}`;
}
