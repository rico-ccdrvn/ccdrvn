import { useState } from "react";

const C = {
  bg:"#0D0F12", card:"#1A1D24", border:"#2A2D35",
  amber:"#F5A623", amberDim:"#7A4F0A", white:"#F0F2F5",
  muted:"#8A8F9A", green:"#3DD68C", red:"#F05C5C", blue:"#5BA8F5",
  road:"#252830", roadDark:"#1A1D22", kerb:"#8A8F9A", lane:"#3A3D48",
};

// ── Three-point turn diagram (top-down) ─────────────────────────────────────
// A narrow two-way road running horizontally. You start at the far RIGHT edge
// (bottom curb), facing right. The turn reverses you to face LEFT.
//   top curb    y = 40
//   road        y = 40 .. 150
//   bottom curb y = 150   (you start here, at the bottom/right curb)
//   centre line y = 95
// Movements:
//   1) forward, wheel hard LEFT, arc up to the top-left curb → face up-left
//   2) reverse, wheel hard RIGHT, back down to the bottom-right curb → face down
//   3) forward, straighten, drive off to the LEFT
// -- Three-point turn diagram: matches MTO Diagram 2-44 --------------------
// VERTICAL road, traffic travels UP the page. The turn starts from the far
// RIGHT (bottom-right), swings forward-left to the far curb, reverses across
// to the right, then drives forward UP the road in the new direction.
//
//   left curb   x = 70      right curb  x = 270
//   road        x = 70..270           centre line x = 170
//   Base car orientation: rot 0 = nose points UP (north).
function TurnDiagram(p) {
  const W = 340, H = 300;
  const leftCurb = 78, rightCurb = 262, ctrX = (leftCurb + rightCurb) / 2;
  const carW = 34, carH = 62;   // car is tall (points up)

  // Stage positions. rot 0 = nose UP. Negative = nose tilts LEFT, positive = RIGHT.
  const stages = {
    start:    { cx: 214, cy: 232, rot: 0 },     // bottom-right, nose UP (pulled over right)
    forward:  { cx: 118, cy: 92,  rot: -52 },   // crossed to top-LEFT, nose up-left at far curb
    reverse:  { cx: 226, cy: 84,  rot: 40 },    // reversed to top-RIGHT, nose up-right
    complete: { cx: 124, cy: 150, rot: 0 },     // in the LEFT lane (up-travel), nose UP, driving away
  };
  const st = stages[p.stage] || stages.start;

  const carAt = (s, faded) => (
    <g transform={`translate(${s.cx} ${s.cy}) rotate(${s.rot})`} opacity={faded ? 0.28 : 1}>
      <rect x={-carW/2} y={-carH/2} width={carW} height={carH} rx={8} fill={faded ? C.muted : C.blue} />
      {/* windscreen toward front (UP end at rot 0) */}
      <rect x={-carW/2 + 5} y={-carH/2 + 6} width={carW - 10} height={12} rx={3} fill="#0D0F12" opacity={0.5} />
      {/* nose triangle at the front (top) */}
      <polygon points={`0,${-carH/2 - 3} -7,${-carH/2 + 6} 7,${-carH/2 + 6}`} fill={faded ? C.muted : C.white} opacity={0.9} />
      {!faded && <text x={0} y={carH/2 - 8} fontSize={8} fill="#0D0F12" fontWeight="800" textAnchor="middle" fontFamily="system-ui" transform={`rotate(${-s.rot})`}>YOU</text>}
    </g>
  );

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height:"100%" }}>
      <defs>
        <marker id="tG" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8Z" fill={C.green}/></marker>
        <marker id="tA" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8Z" fill={C.amber}/></marker>
        <marker id="tB" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7Z" fill={C.blue}/></marker>
      </defs>

      {/* Road surface */}
      <rect x={leftCurb} y={0} width={rightCurb - leftCurb} height={H} fill={C.road} />
      {/* Sidewalks */}
      <rect x={0} y={0} width={leftCurb} height={H} fill={C.roadDark} />
      <rect x={rightCurb} y={0} width={W - rightCurb} height={H} fill={C.roadDark} />
      {/* Curbs */}
      <line x1={leftCurb} y1={0} x2={leftCurb} y2={H} stroke={C.kerb} strokeWidth={2} />
      <line x1={rightCurb} y1={0} x2={rightCurb} y2={H} stroke={C.kerb} strokeWidth={2} />
      {/* Centre line */}
      <line x1={ctrX} y1={0} x2={ctrX} y2={H} stroke="#C9A227" strokeWidth={1.4} strokeDasharray="14,10" opacity={0.55} />
      <text x={ctrX} y={14} fontSize={7.5} fill={C.muted} textAnchor="middle" fontFamily="system-ui" fontWeight="700">narrow two-way road</text>

      {/* Movement arcs (each step shows only its own move) */}
      {p.showArc1 && (
        <path d={`M${stages.start.cx} ${stages.start.cy - 30} Q${stages.start.cx - 30} ${stages.forward.cy + 70} ${stages.forward.cx + 20} ${stages.forward.cy + 34}`}
          stroke={C.green} strokeWidth={3} fill="none" markerEnd="url(#tG)" opacity={0.9} />
      )}
      {p.showArc2 && (
        <path d={`M${stages.forward.cx + 20} ${stages.forward.cy + 20} Q${ctrX} ${stages.reverse.cy - 24} ${stages.reverse.cx - 18} ${stages.reverse.cy + 24}`}
          stroke={C.amber} strokeWidth={3} fill="none" markerEnd="url(#tA)" opacity={0.9} />
      )}
      {p.showArc3 && (
        <path d={`M${stages.reverse.cx - 10} ${stages.reverse.cy + 40} Q${ctrX + 10} ${H/2} ${stages.complete.cx} ${stages.complete.cy - 40}`}
          stroke={C.green} strokeWidth={3} fill="none" markerEnd="url(#tG)" opacity={0.9} />
      )}

      {/* Ghost of previous position for context (single-car slides) */}
      {p.ghostStart && carAt(stages.start, true)}
      {p.ghostForward && carAt(stages.forward, true)}
      {p.ghostReverse && carAt(stages.reverse, true)}

      {/* Wheel-direction label */}
      {p.wheelDir && (
        <text x={st.cx} y={st.cy - carH/2 - 12} fontSize={8.5} fill={C.amber} textAnchor="middle" fontFamily="system-ui" fontWeight="700">{p.wheelDir}</text>
      )}

      {/* Observation (both ways = up/down the road) */}
      {p.observe && (
        <g>
          <line x1={st.cx} y1={st.cy - 6} x2={st.cx} y2={st.cy - 26} stroke={C.blue} strokeWidth={1.6} strokeDasharray="3,3" markerEnd="url(#tB)" />
          <line x1={st.cx} y1={st.cy + 6} x2={st.cx} y2={st.cy + 26} stroke={C.blue} strokeWidth={1.6} strokeDasharray="3,3" markerEnd="url(#tB)" />
          <text x={st.cx + carW/2 + 6} y={st.cy + 3} fontSize={7.5} fill={C.blue} fontFamily="system-ui" fontWeight="700">check both ways</text>
        </g>
      )}

      {/* Signal label */}
      {p.signal && (
        <text x={st.cx} y={st.cy + carH/2 + 18} fontSize={8} fill={C.amber} textAnchor="middle" fontFamily="system-ui" fontWeight="700">{p.signal}</text>
      )}

      {/* Stop marker */}
      {p.stop && (
        <text x={st.cx - carW/2 - 8} y={st.cy - carH/2 + 4} fontSize={8} fill={C.red} textAnchor="end" fontFamily="system-ui" fontWeight="700">stop</text>
      )}

      {/* Clearance note (reverse) */}
      {p.clearance && (
        <text x={st.cx + carW/2 + 6} y={st.cy + carH/2} fontSize={7} fill={C.red} fontFamily="system-ui" fontWeight="700">leave clearance</text>
      )}

      {/* Hood-to-lane-centre (final) */}
      {p.hoodCentre && (
        <text x={st.cx + carW/2 + 8} y={st.cy - 6} fontSize={7} fill={C.green} fontFamily="system-ui" fontWeight="700">hood centred in lane</text>
      )}

      {/* Point number badge */}
      {p.point && (
        <g>
          <circle cx={22} cy={H - 20} r={13} fill={C.amber} />
          <text x={22} y={H - 15} fontSize={14} fill="#0D0F12" textAnchor="middle" fontFamily="system-ui" fontWeight="800">{p.point}</text>
        </g>
      )}

      {/* Active car */}
      {carAt(st, false)}
    </svg>
  );
}
const SLIDES = [
  {
    step: "Overview",
    heading: "The 3-point turn",
    diag: { stage:"start", showArc1:true, showArc2:true, showArc3:true },
    body: "The turn-of-choice when a road is too narrow for a U-turn. You turn the wheel and move the car three times to reverse direction. Turn the wheel all the way for each step \u2014 or three steps won't be enough \u2014 and keep looking for traffic throughout.",
    boldWords: ["too narrow for a U-turn", "all the way for each step"],
    tip: "Zutobi / MTO: start from the far right side to get maximum use of the road. Only do it when you have plenty of room both ways and won't disrupt traffic.",
  },
  {
    step: "Step 1",
    heading: "Pull over to the right, wait for clear",
    diag: { stage:"start", signal:"signal right", shoulderCheck:true, scRight:true },
    body: "Signal and pull over to the far right side of the road. Stay there until traffic is clear and you have plenty of room in both directions. Starting from the far right gives you the most road to work with.",
    boldWords: ["signal", "far right side", "clear"],
    tip: "Zutobi: start from the far right side of the road to get as much use of the road as possible as you maneuver.",
  },
  {
    step: "Step 2",
    heading: "Wheel all the way left, cross the road",
    diag: { stage:"forward", point:"1", showArc1:true, ghostStart:true, signal:"signal left", wheelDir:"wheel ALL THE WAY left", stop:true, observe:true, shoulderCheck:true },
    body: "After waiting for a safe gap, signal left and turn the steering wheel all the way to the left. Turning it fully gives you the maximum change in direction. Drive left across the road all the way to the curb on the opposite side.",
    boldWords: ["signal left", "all the way to the left", "opposite side"],
    tip: "Zutobi: turning the wheel all the way enables you to get the maximum change of direction from the turn.",
  },
  {
    step: "Step 3",
    heading: "Wheel all the way right, reverse",
    diag: { stage:"reverse", point:"2", showArc2:true, ghostForward:true, signal:"signal right", wheelDir:"wheel ALL THE WAY right", observe:true, clearance:true, shoulderCheck:true },
    body: "Signal right, shift to reverse, and do a full 360\u00b0 check \u2014 physically look over your right shoulder. Turn the steering wheel all the way to the right and reverse slowly until you reach the curb behind you.",
    boldWords: ["signal right", "over your right shoulder", "all the way to the right"],
    tip: "Zutobi: once the wheel is all the way to the right, reverse until you reach the curb. Keep checking traffic \u2014 the maneuver takes several seconds.",
  },
  {
    step: "Step 4",
    heading: "Wheel left, straighten into your lane",
    diag: { stage:"complete", point:"3", showArc3:true, ghostReverse:true, signal:"signal left", wheelDir:"wheel left \u2192 straighten", hoodCentre:true },
    body: "You're now facing the wrong side of the road. Signal left, shift to drive, check for traffic, and turn the wheel to the left once more \u2014 straighten up as you pull forward into the correct lane, centring on the lane you're entering.",
    boldWords: ["Signal left", "turn the wheel to the left", "correct lane"],
    tip: "Zutobi: turn the wheel once more to the left and straighten your vehicle by driving forward into the correct lane.",
  },
  {
    step: "Common Mistakes",
    heading: "What loses marks",
    diag: { stage:"forward", showArc1:true },
    body: "The five common errors: not signalling, not checking your surroundings, starting off-centre instead of the far right, rushing, and misjudging distances. Slow control, full steering, and constant observation fix all five.",
    boldWords: ["not signalling", "not checking your surroundings", "rushing"],
    tip: "Zutobi: turn the wheels all the way for each step, take your time, and continuously look for traffic in your mirrors.",
  },
  {
    step: "Summary",
    heading: "3-point turn \u2014 done right",
    summary: true,
  },
];

const SUMMARY = [
  { icon:"\u27a1\ufe0f", color:C.blue,  label:"Step 1", text:"Signal right \u00b7 pull to far right \u00b7 wait for clear" },
  { icon:"\u2196\ufe0f", color:C.green, label:"Step 2", text:"Signal left \u00b7 wheel all the way left \u00b7 cross to far curb" },
  { icon:"\u21a9\ufe0f", color:C.amber, label:"Step 3", text:"Signal right \u00b7 wheel all the way right \u00b7 reverse to curb" },
  { icon:"\u2b05\ufe0f", color:C.green, label:"Step 4", text:"Signal left \u00b7 wheel left \u00b7 straighten into your lane" },
  { icon:"\ud83d\udc41\ufe0f", color:C.blue, label:"Throughout", text:"Wheel all the way each step \u00b7 keep checking traffic" },
];

function Body({ text, boldWords = [] }) {
  if (!boldWords.length) return <div style={{ fontSize:14, lineHeight:1.5, color:C.white }}>{text}</div>;
  const pattern = new RegExp(`(${boldWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const parts = text.split(pattern);
  return (
    <div style={{ fontSize:14, lineHeight:1.5, color:C.white }}>
      {parts.map((p, i) =>
        boldWords.some(w => w.toLowerCase() === p.toLowerCase())
          ? <strong key={i} style={{ color:C.amber }}>{p}</strong> : p
      )}
    </div>
  );
}

export default function App() {
  const [cur, setCur] = useState(0);
  const total = SLIDES.length;
  const s = SLIDES[cur];
  const go = (n) => setCur(n < 0 ? 0 : n >= total ? 0 : n);

  return (
    <div style={{ height:"100vh", background:C.bg, color:C.white, display:"flex", flexDirection:"column", fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif", overflow:"hidden" }}>
      <div style={{ flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px 10px", borderBottom:`1px solid ${C.border}` }}>
        <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:C.amber }}>CC Driving</span>
        <span style={{ fontSize:13, fontWeight:600 }}>Three-Point Turn</span>
        <span style={{ fontSize:11, fontWeight:600, color:C.muted }}>{cur + 1} / {total}</span>
      </div>
      <div style={{ flexShrink:0, height:3, background:C.border }}>
        <div style={{ height:"100%", background:C.amber, width:`${(cur + 1) / total * 100}%`, transition:"width 0.35s ease" }} />
      </div>
      <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column", padding:"18px 20px 12px" }}>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:C.amber, marginBottom:4 }}>{s.step}</div>
        <div style={{ fontSize:20, fontWeight:800, lineHeight:1.15, marginBottom:12 }}>{s.heading}</div>
        {s.summary ? (
          <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:8, marginBottom:12 }}>
            {SUMMARY.map((row, i) => (
              <div key={i} style={{ display:"flex", gap:10, alignItems:"center", padding:"9px 12px", background:"rgba(255,255,255,0.04)", borderRadius:10, border:"1px solid rgba(255,255,255,0.07)" }}>
                <span style={{ fontSize:18, flexShrink:0 }}>{row.icon}</span>
                <div>
                  <div style={{ fontSize:10, fontWeight:700, color:row.color, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:1 }}>{row.label}</div>
                  <div style={{ fontSize:13, fontWeight:600 }}>{row.text}</div>
                </div>
              </div>
            ))}
            <div style={{ textAlign:"center", fontSize:11, color:C.muted, paddingTop:4 }}>CC Driving Instruction · ccdrvn.com · rico@ccdrvn.com</div>
          </div>
        ) : (
          <>
            <div style={{ flex:1, background:C.card, borderRadius:16, border:`1px solid ${C.border}`, marginBottom:12, overflow:"hidden", minHeight:0, position:"relative", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <TurnDiagram {...s.diag} />
            </div>
            <div style={{ marginBottom:7 }}><Body text={s.body} boldWords={s.boldWords} /></div>
            {s.tip && <div style={{ fontSize:12, color:C.muted, borderLeft:`2px solid ${C.amberDim}`, paddingLeft:10, lineHeight:1.4 }}>{s.tip}</div>}
          </>
        )}
      </div>
      <div style={{ display:"flex", justifyContent:"center", gap:5, paddingBottom:6, flexShrink:0 }}>
        {SLIDES.map((_, i) => (
          <div key={i} onClick={() => go(i)} style={{ width:i === cur ? 7 : 5, height:i === cur ? 7 : 5, borderRadius:"50%", background:i === cur ? C.amber : C.border, cursor:"pointer", transition:"all 0.25s" }} />
        ))}
      </div>
      <div style={{ flexShrink:0, display:"flex", gap:12, padding:"8px 20px 18px" }}>
        <button onClick={() => go(cur - 1)} disabled={cur === 0} style={{ flex:1, height:50, border:`1px solid ${C.border}`, borderRadius:12, fontSize:15, fontWeight:700, cursor:cur === 0 ? "default" : "pointer", background:C.card, color:C.muted, opacity:cur === 0 ? 0.3 : 1 }}>← Back</button>
        <button onClick={() => go(cur === total - 1 ? 0 : cur + 1)} style={{ flex:1, height:50, border:"none", borderRadius:12, fontSize:15, fontWeight:700, cursor:"pointer", background:cur === total - 1 ? C.green : C.amber, color:"#0D0F12" }}>
          {cur === total - 1 ? "✓ Done" : "Next →"}
        </button>
      </div>
    </div>
  );
}
