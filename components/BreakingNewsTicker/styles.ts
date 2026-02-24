/** Injected CSS for the ticker — extracted as a constant for zero re-computation */
export const TICKER_STYLES = `
  .bnt-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}
  .bnt-scroll::-webkit-scrollbar{display:none}
  .bnt-row{display:flex;gap:12px;width:max-content}
  .bnt-card{flex-shrink:0;width:320px;display:flex;gap:10px;padding:10px;height:130px;
    border-radius:8px;border:1px solid #27272a;background:#18181b;
    text-decoration:none;color:inherit}
  .bnt-card:hover{background:#27272a}
  .bnt-img{flex-shrink:0;width:80px;border-radius:6px;overflow:hidden;
    position:relative;background:#27272a}
  .bnt-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .bnt-ico{flex-shrink:0;width:44px;display:flex;flex-direction:column;
    align-items:center;justify-content:center;gap:2px;background:#27272a;border-radius:6px}
  .bnt-search{background:#09090b;border:1px solid #27272a;color:#fff;font-size:12px;
    padding:3px 10px;border-radius:6px;outline:none;width:0;
    transition:width .3s ease,opacity .3s ease,padding .3s ease;opacity:0}
  .bnt-search.open{width:200px;opacity:1;padding:3px 10px}
  .bnt-search:focus{border-color:#dc2626;box-shadow:0 0 0 1px rgba(220,38,38,.3)}
  .bnt-search::placeholder{color:#52525b}
`;
