import { resolveAssetUrl } from '@/utils/assetUrl'

export function useAssetUrl() {
  return (path) => resolveAssetUrl(path)
}
