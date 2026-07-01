import { useState } from "react";

const C = {
  bg:"#0D0F12", card:"#1A1D24", border:"#2A2D35",
  amber:"#F5A623", amberDim:"#7A4F0A", white:"#F0F2F5",
  muted:"#8A8F9A", green:"#3DD68C", red:"#F05C5C", blue:"#5BA8F5",
  road:"#252830", roadDark:"#1A1D22", kerb:"#8A8F9A", lane:"#3A3D48",
};

// ── Parallel parking diagram (top-down) ─────────────────────────────────────
// North American LHD. The curb runs along the BOTTOM of the road.
// Road occupies the upper area; curb + sidewalk along the bottom edge.
// Two parked cars (front car = left of the bay, rear car = right of the bay).
// The empty bay sits between them, against the curb.
// Ego car (blue) is shown at a stage position depending on props.stage.
//
// Coordinates:
//   road top y=20, curb line y=150, sidewalk y=150..180
//   front (lead) parked car: x≈140-196 at curb
//   rear parked car:         x≈250-306 at curb
//   bay between them:        x≈196-250
function ParkDiagram(p) {
  const W = 340, H = 200;
  const curbY = 150;            // curb line
  const bayLeft = 150, bayRight = 250;
  const parkedY = curbY - 30;   // top of parked cars (they sit against curb)
  const pcarW = 54, pcarH = 30;

  // You drive RIGHT and park behind the LEAD car = the RIGHT-hand car.
  // The empty bay is to the LEAD car's LEFT. You pull up beside the LEAD car,
  // then reverse LEFT (backward) into the bay.
  //   LEAD (right) car spans x = bayRight .. bayRight+pcarW  (250..304)
  //   Its rear bumper (edge toward the bay) is at x = bayRight (250).
  //   The car you end up IN FRONT OF is the LEFT car (x 96..150).
  const leadCarCX = bayRight + pcarW / 2;   // 277 — centre of the lead (right) car
  const leadRearBumperX = bayRight;         // 250 — lead car's rear bumper (bay side)

  // Ego car stage positions (centre x, centre y, rotation deg)
  // "alongside" sits BESIDE the LEAD (right) car, one lane out, close to it.
  const alongsideCY = parkedY - 26;         // ~94: just out from the parked car
  const stages = {
    alongside:      { cx: leadCarCX,        cy: alongsideCY, rot: 0 },  // beside lead car, ~1m
    reverseStraight:{ cx: leadCarCX - 6,    cy: alongsideCY, rot: 0 },  // backing straight (leftward)
    pivot:          { cx: leadRearBumperX - 4, cy: alongsideCY + 8, rot: -22 }, // C-pillar at lead bumper, wheel full right
    midway:         { cx: 214, cy: 108, rot: -45 },   // 45° to curb — rear tucked toward curb
    straighten:     { cx: 208, cy: 118, rot: -16 },   // wheel full left, bringing front in
    parked:         { cx: 200, cy: parkedY + pcarH/2, rot: 0 }, // final, in bay at curb
    leaving:        { cx: 200, cy: parkedY + pcarH/2, rot: 0 },
  };
  const st = stages[p.stage] || stages.alongside;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height:"100%" }}>
      <defs>
        <marker id="mA" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7Z" fill={C.amber}/></marker>
        <marker id="mG" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7Z" fill={C.green}/></marker>
        <marker id="mR" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7Z" fill={C.red} opacity="0.8"/></marker>
      </defs>

      {/* Road surface */}
      <rect x={0} y={0} width={W} height={curbY} fill={C.road} />
      {/* Sidewalk */}
      <rect x={0} y={curbY} width={W} height={H - curbY} fill={C.roadDark} />
      {/* Curb line */}
      <line x1={0} y1={curbY} x2={W} y2={curbY} stroke={C.kerb} strokeWidth={2.5} />
      <text x={8} y={curbY + 18} fontSize={8} fill={C.muted} fontFamily="system-ui" fontWeight="700">CURB / SIDEWALK</text>

      {/* Centre line of road (dashed) */}
      <line x1={0} y1={40} x2={W} y2={40} stroke={C.lane} strokeWidth={1.3} strokeDasharray="13,9" />

      {/* Left car — the one you end up IN FRONT OF once parked */}
      <g>
        <rect x={bayLeft - pcarW} y={parkedY} width={pcarW} height={pcarH} rx={6} fill={C.muted} opacity={0.55} />
        <text x={bayLeft - pcarW/2} y={parkedY + pcarH/2 + 3} fontSize={7} fill="#0D0F12" textAnchor="middle" fontFamily="system-ui" fontWeight="800">CAR</text>
      </g>
      {/* Right car — the LEAD car you park BEHIND (line up beside this one) */}
      <g>
        <rect x={bayRight} y={parkedY} width={pcarW} height={pcarH} rx={6} fill={C.muted} opacity={0.55} />
        <text x={bayRight + pcarW/2} y={parkedY + pcarH/2 - 1} fontSize={7} fill="#0D0F12" textAnchor="middle" fontFamily="system-ui" fontWeight="800">CAR</text>
        <text x={bayRight + pcarW/2} y={parkedY + pcarH/2 + 8} fontSize={6} fill="#0D0F12" textAnchor="middle" fontFamily="system-ui" fontWeight="700">AHEAD</text>
      </g>

      {/* The empty bay highlight */}
      {p.showBay && (
        <rect x={bayLeft + 2} y={parkedY - 2} width={bayRight - bayLeft - 4} height={pcarH + 4}
          fill={C.green} opacity={0.08} stroke={C.green} strokeWidth={1.2} strokeDasharray="5,4" rx={4} />
      )}

      {/* Bay length note */}
      {p.bayNote && (
        <g>
          <line x1={bayLeft} y1={parkedY - 8} x2={bayRight} y2={parkedY - 8} stroke={C.green} strokeWidth={1} markerEnd="url(#mG)" markerStart="url(#mG)" />
          <text x={(bayLeft+bayRight)/2} y={parkedY - 12} fontSize={7.5} fill={C.green} textAnchor="middle" fontFamily="system-ui" fontWeight="700">~1.5× your car</text>
        </g>
      )}

      {/* Gap between ego and front car (alongside stage) */}
      {p.gapNote && (
        <g>
          <line x1={leadCarCX - 20} y1={parkedY - 4} x2={leadCarCX - 20} y2={st.cy + pcarH/2 + 2} stroke={C.amber} strokeWidth={1} strokeDasharray="3,3" />
          <text x={leadCarCX - 16} y={(parkedY + st.cy)/2 + 4} fontSize={7} fill={C.amber} fontFamily="system-ui" fontWeight="700">~1 m</text>
        </g>
      )}

      {/* Reverse path (curved) — from beside the lead car, back-left into the bay */}
      {p.reversePath && (
        <path d={`M${stages.alongside.cx - 10} ${stages.alongside.cy + 14}
                  Q${bayLeft + 40} ${parkedY - 16} ${stages.parked.cx - 6} ${stages.parked.cy - 2}`}
          stroke={C.green} strokeWidth={2} fill="none" strokeDasharray="7,4" markerEnd="url(#mG)" opacity={0.85} />
      )}

      {/* Wheel-turn indicator */}
      {p.wheelToCurb && (
        <text x={st.cx + 30} y={st.cy} fontSize={8} fill={C.amber} fontFamily="system-ui" fontWeight="700">wheel → full right</text>
      )}
      {p.wheelFromCurb && (
        <text x={st.cx + 30} y={st.cy} fontSize={8} fill={C.amber} fontFamily="system-ui" fontWeight="700">wheel → full left</text>
      )}
      {p.wheelStraight && (
        <text x={st.cx + 30} y={st.cy} fontSize={8} fill={C.amber} fontFamily="system-ui" fontWeight="700">wheels straight</text>
      )}
      {p.wheelStraightenCount && (
        <text x={st.cx + 28} y={st.cy} fontSize={8} fill={C.amber} fontFamily="system-ui" fontWeight="700">right 1.5 turns</text>
      )}

      {/* Straight-back arrow (reverse straight — car moves LEFT/backward) */}
      {p.straightBack && (
        <g>
          <line x1={st.cx - pcarW/2 - 4} y1={st.cy} x2={st.cx - pcarW/2 - 30} y2={st.cy}
            stroke={C.green} strokeWidth={2} strokeDasharray="6,4" markerEnd="url(#mG)" />
          <text x={st.cx - pcarW/2 - 34} y={st.cy - 6} fontSize={7.5} fill={C.green} textAnchor="end" fontFamily="system-ui" fontWeight="700">reverse straight</text>
        </g>
      )}

      {/* Pivot-point marker: ego's rear wheel / C-pillar (LEFT/rear end of car)
          lines up with the LEAD car's rear bumper (x = leadRearBumperX). */}
      {p.pivotPoint && (() => {
        const egoRearX = st.cx - pcarW/2 + 8; // rear-wheel area at left/back end of ego
        return (
          <g>
            {/* dashed vertical line from lead car's rear bumper up to ego rear wheel */}
            <line x1={leadRearBumperX} y1={parkedY - 2} x2={leadRearBumperX} y2={st.cy + pcarH/2 + 2}
              stroke={C.amber} strokeWidth={1.3} strokeDasharray="4,3" opacity={0.85} />
            {/* circle on ego rear wheel */}
            <circle cx={egoRearX} cy={st.cy + pcarH/2 - 2} r={4.5} fill="none" stroke={C.amber} strokeWidth={1.8} />
            <text x={egoRearX} y={st.cy - pcarH/2 - 6} fontSize={7} fill={C.amber} textAnchor="middle" fontFamily="system-ui" fontWeight="700">rear wheel /</text>
            <text x={egoRearX} y={st.cy - pcarH/2 + 3} fontSize={7} fill={C.amber} textAnchor="middle" fontFamily="system-ui" fontWeight="700">C-pillar pivot</text>
            <text x={leadRearBumperX - 3} y={parkedY - 6} fontSize={6.5} fill={C.amber} textAnchor="end" fontFamily="system-ui" fontWeight="700">line up here</text>
          </g>
        );
      })()}

      {/* 45-degree angle cue */}
      {p.angle45 && (
        <g>
          <text x={st.cx - 44} y={st.cy - 8} fontSize={9} fill={C.green} fontFamily="system-ui" fontWeight="800">45°</text>
          <path d={`M${st.cx - 30} ${st.cy + 6} a16 16 0 0 1 12 -12`} stroke={C.green} strokeWidth={1.4} fill="none" />
        </g>
      )}

      {/* Passenger-mirror reference cue */}
      {p.mirrorCue && (
        <g>
          <rect x={8} y={64} width={70} height={38} rx={5} fill="#0D0F12" stroke={C.blue} strokeWidth={1.3} />
          <text x={43} y={78} fontSize={7} fill={C.blue} textAnchor="middle" fontFamily="system-ui" fontWeight="700">PASSENGER</text>
          <text x={43} y={88} fontSize={7} fill={C.blue} textAnchor="middle" fontFamily="system-ui" fontWeight="700">MIRROR</text>
          <text x={43} y={98} fontSize={6.5} fill={C.muted} textAnchor="middle" fontFamily="system-ui">{p.mirrorCue}</text>
        </g>
      )}

      {/* Rearview reference cue */}
      {p.rearviewCue && (
        <g>
          <rect x={W-78} y={64} width={70} height={30} rx={5} fill="#0D0F12" stroke={C.amber} strokeWidth={1.3} />
          <text x={W-43} y={78} fontSize={7} fill={C.amber} textAnchor="middle" fontFamily="system-ui" fontWeight="700">REARVIEW</text>
          <text x={W-43} y={89} fontSize={6.5} fill={C.muted} textAnchor="middle" fontFamily="system-ui">check distance behind</text>
        </g>
      )}

      {/* Shoulder check indicator */}
      {p.shoulderCheck && (
        <text x={st.cx - 36} y={st.cy - 2} fontSize={11} fontFamily="system-ui">👁️</text>
      )}

      {/* Signal */}
      {p.signal && (
        <g>
          <rect x={st.cx + 18} y={st.cy - 12} width={4} height={6} rx={1.5} fill={C.amber} />
          <path d={`M${st.cx + 24} ${st.cy - 9} q6 0 9 -4`} stroke={C.amber} strokeWidth={1.6} fill="none" opacity={0.8} />
        </g>
      )}

      {/* Final-position curb distance callout */}
      {p.curbDist && (
        <g>
          <line x1={stages.parked.cx - 30} y1={parkedY + pcarH + 3} x2={stages.parked.cx - 30} y2={curbY - 1} stroke={C.green} strokeWidth={1} />
          <text x={stages.parked.cx - 26} y={parkedY + pcarH + 12} fontSize={7.5} fill={C.green} fontFamily="system-ui" fontWeight="700">≤ 30 cm</text>
        </g>
      )}

      {/* Auto-fail markers (contact) */}
      {p.failContact && (
        <g>
          <text x={bayRight + 4} y={parkedY + pcarH/2 + 4} fontSize={14} fontFamily="system-ui">💥</text>
          <text x={(bayLeft+bayRight)/2} y={curbY - 4} fontSize={9} fill={C.red} textAnchor="middle" fontFamily="system-ui" fontWeight="700">contact = automatic fail</text>
        </g>
      )}

      {/* EGO CAR (blue), rotated for stage */}
      <g transform={`translate(${st.cx} ${st.cy}) rotate(${st.rot})`}>
        <rect x={-pcarW/2} y={-pcarH/2} width={pcarW} height={pcarH} rx={6} fill={C.blue} />
        <rect x={-pcarW/2 + 6} y={-pcarH/2 + 5} width={14} height={9} rx={2} fill="#0D0F12" opacity={0.5} />
        <text x={0} y={pcarH/2 - 4} fontSize={7} fill="#0D0F12" fontWeight="800" textAnchor="middle" fontFamily="system-ui">YOU</text>
      </g>
    </svg>
  );
}

const SLIDES = [
  {
    step: "Overview",
    heading: "Parallel parking",
    diag: { stage:"alongside", showBay:true, bayNote:true, signal:true },
    body: "Park parallel to the curb, signalling to the side you're parking (usually right; left is valid on a one-way). Find a space about 1.5\u00d7 your car's length. Slow, controlled, and within 30 cm of the curb at the end.",
    boldWords: ["1.5\u00d7 your car's length", "30 cm of the curb"],
    tip: 'MTO Handbook: find a space "about one and one-half times longer than your vehicle."',
  },
  {
    step: "Step 1 \u2014 Signal & Check",
    heading: "Signal to the side you'll park",
    diag: { stage:"alongside", showBay:true, signal:true, shoulderCheck:true },
    body: "Signal in advance to the direction you'll park \u2014 generally right, but left is valid on a one-way street. Signalling early tells traffic behind what you're doing. Check your mirror, then your blind spot on that side before moving into position.",
    boldWords: ["Signal in advance", "Signalling early", "blind spot"],
    tip: 'MTO Handbook: "Check the traffic beside and behind and signal your wish to pull over and stop."',
  },
  {
    step: "Step 2 \u2014 Position",
    heading: "Line up beside the front car, ~1 m out",
    diag: { stage:"alongside", showBay:true, gapNote:true },
    body: "Line your vehicle up beside the car you'll park behind, about a metre away, roughly parallel. This spacing sets up the whole maneuver \u2014 too close or too far throws off your angle.",
    boldWords: ["beside the car you'll park behind", "about a metre away"],
    tip: 'MTO Handbook: "Drive alongside... leaving about a metre between the vehicles."',
  },
  {
    step: "Step 3 \u2014 Reverse to Pivot",
    heading: "Reverse straight, then wheel full right",
    diag: { stage:"reverseStraight", showBay:true, shoulderCheck:true, straightBack:true, pivotPoint:true, wheelToCurb:true },
    body: "Shoulder check, then reverse straight back until your rear wheel / C-pillar pivot point is behind the car you're parking behind. At that point, while still moving slowly, turn the steering fully to the right.",
    boldWords: ["reverse straight back", "C-pillar pivot point", "fully to the right"],
    tip: 'MTO Handbook: "Before backing up, look all around the vehicle and check your mirrors and both blind spots... turning the steering wheel toward the curb."',
  },
  {
    step: "Step 4 \u2014 45\u00b0 Reference",
    heading: "At 45\u00b0 \u2014 read the passenger mirror",
    diag: { stage:"midway", showBay:true, reversePath:true, angle45:true, mirrorCue:"rear appears near curb" },
    body: "When you reach about 45\u00b0 to the car and curb, look in your passenger mirror \u2014 the rear of your car will appear close to the curb. That's your reference point to make the next move.",
    boldWords: ["about 45\u00b0", "passenger mirror", "close to the curb"],
    tip: "Reference points beat guessing. The 45\u00b0 angle plus the mirror view tell you exactly when to change your steering.",
  },
  {
    step: "Step 5 \u2014 Bring the Front In",
    heading: "Wheel full left, watch both references",
    diag: { stage:"straighten", showBay:true, wheelFromCurb:true, mirrorCue:"confirm parallel", rearviewCue:true },
    body: "On that reference, while moving slowly, turn the steering all the way to the left. Use your rearview to judge distance to anything behind you, and the passenger mirror to confirm when you're parallel to the curb.",
    boldWords: ["all the way to the left", "rearview", "parallel to the curb"],
    tip: 'MTO Handbook: "Turn your steering wheel fully towards the road and align yourself with the curb."',
  },
  {
    step: "Step 6 \u2014 Straighten Wheels",
    heading: "Right 1.5 turns to straighten",
    diag: { stage:"parked", showBay:true, curbDist:true, wheelStraightenCount:true },
    body: "Once parallel, turn the steering wheel to the right about 1.5 turns to bring your wheels straight. Check you're centred in the bay and within 30 cm of the curb \u2014 small forward/back adjustments are fine.",
    boldWords: ["right about 1.5 turns", "within 30 cm of the curb"],
    tip: 'MTO Handbook: "not more than about 30 centimetres away from it." Finishing beyond 30 cm is a minor error.',
  },
  {
    step: "Step 7 \u2014 Secure",
    heading: "Park and set the brake",
    diag: { stage:"parked", curbDist:true },
    body: "Put the vehicle in Park (or first/reverse for manual) and apply the parking brake. Before opening your door, check mirrors and shoulder check for cyclists and traffic.",
    boldWords: ["Park", "parking brake", "check mirrors and shoulder check"],
    tip: 'MTO Handbook: "set the parking brake and move the gear selector into park... Check traffic before opening your door."',
  },
  {
    step: "What Fails",
    heading: "Automatic fail: any contact",
    diag: { stage:"midway", showBay:true, failContact:true },
    body: "Touching the curb hard, hitting another vehicle, or striking a cone is a critical error. Slow, deliberate steering on your reference points is how you avoid it \u2014 speed is what causes contact.",
    boldWords: ["Touching the curb", "hitting another vehicle", "striking a cone"],
    tip: "Contact with an object or vehicle is an automatic fail on the road test. Keep every movement slow and controlled.",
  },
  {
    step: "Leaving",
    heading: "Pulling out safely",
    diag: { stage:"leaving", signal:true, shoulderCheck:true },
    body: "To leave: release the brake, signal left, and shoulder check for traffic and cyclists before pulling out. Move out only when the way is clear.",
    boldWords: ["signal left", "shoulder check"],
    tip: 'MTO Handbook: when pulling out, "Release the parking brake... turn on your left-turn signal" and check before moving.',
  },
  {
    step: "Summary",
    heading: "Parallel parking \u2014 done right",
    summary: true,
  },
];

const SUMMARY = [
  { icon:"\ud83d\udd14", color:C.blue,  label:"Step 1", text:"Signal to your parking side \u00b7 mirror + blind spot" },
  { icon:"\ud83d\udccf", color:C.amber, label:"Step 2", text:"Beside the front car \u00b7 ~1 m out" },
  { icon:"\u21a9\ufe0f", color:C.green, label:"Step 3", text:"Reverse straight to C-pillar pivot \u00b7 wheel full right" },
  { icon:"\ud83d\udcd0", color:C.amber, label:"Step 4\u20135", text:"At 45\u00b0 read mirror \u00b7 then wheel full left" },
  { icon:"\ud83c\udd7f\ufe0f", color:C.green, label:"Step 6\u20137", text:"Right 1.5 turns \u00b7 \u226430 cm \u00b7 Park + brake" },
  { icon:"\ud83d\udc41\ufe0f", color:C.blue,  label:"Leaving", text:"Signal left \u00b7 shoulder check before pulling out" },
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
        <span style={{ fontSize:13, fontWeight:600 }}>Parallel Parking</span>
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
              <ParkDiagram {...s.diag} />
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
