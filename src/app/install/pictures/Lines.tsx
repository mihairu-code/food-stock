/** Серые полоски вместо пунктов, которые для шага не важны. */
export function Lines({ widths }: { widths: number[] }) {
  return (
    <>
      {widths.map((width, index) => (
        <span key={index} className="mock-row">
          <i className="mock-dot" />
          <i className="mock-line" style={{ width: `${width}%` }} />
        </span>
      ))}
    </>
  )
}
