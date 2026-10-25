/** The checkers' lighting, shared by all thirty: a lamp above and to the right. */
export function CheckerDefs() {
  return (
    <defs>
      <radialGradient id="ck-ivory" cx="0.38" cy="0.32" r="0.75">
        <stop offset="0" className="stop-ivory-lit" />
        <stop offset="0.6" className="stop-ivory" />
        <stop offset="1" className="stop-ivory-shade" />
      </radialGradient>
      <radialGradient id="ck-ebony" cx="0.38" cy="0.32" r="0.75">
        <stop offset="0" className="stop-ebony-lit" />
        <stop offset="1" className="stop-ebony" />
      </radialGradient>
      <linearGradient id="ck-ivory-edge" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" className="stop-ivory-shade" />
        <stop offset="0.5" className="stop-ivory-lit" />
        <stop offset="1" className="stop-ivory-shade" />
      </linearGradient>
      <linearGradient id="ck-ebony-edge" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" className="stop-ebony" />
        <stop offset="0.5" className="stop-ebony-lit" />
        <stop offset="1" className="stop-ebony" />
      </linearGradient>
    </defs>
  )
}
