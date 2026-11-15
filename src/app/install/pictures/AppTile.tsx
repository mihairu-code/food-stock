/** Значок приложения в схемах: тот же домик, что на экране «Домой». */
export function AppTile({ size = 26 }: { size?: number }) {
  return (
    <span className="mock-app" style={{ width: size, height: size, fontSize: size * 0.58 }}>
      🏠
    </span>
  )
}
