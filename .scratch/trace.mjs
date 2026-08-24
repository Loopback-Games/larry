import { createGame } from '../src/game/index.ts';
import { RoomId } from '../src/game/ids.ts';
import { HOTLINE, SCRATCHED, DELIVERY } from '../src/game/phone.ts';

const g = createGame();
let seed = 12345;
g.random = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const drain = () => { const out = []; let m; while ((m = g.pendingMessage)) { out.push(m.join(' ')); g.dismissMessage(); } return out; };
drain();

function type(line) {
  const before = g.score;
  drain();
  g.submit(line);
  const msgs = drain();
  const delta = g.score - before;
  const flag = delta > 0 ? `+${delta}` : '  ';
  console.log(`${flag}  [${g.roomId}] "${line}" -> ${msgs[0]?.slice(0, 80) ?? '(no reply)'}`);
}
function walk(room) { g.goTo(room); drain(); }

const plan = [
  [RoomId.InsideBar, ['buy whiskey']],
  [RoomId.BarHallway, ['get rose','give whiskey to drunk','get remote']],
  [RoomId.BarToilet, ['sit down','read the wall','open the cistern']],
  [RoomId.BarBackroom, ['use remote','use remote']],
  [RoomId.Taxi, ['store']],
  [RoomId.InsideStore, ['buy magazine','read magazine','buy wine','buy condom']],
  [RoomId.OutsideStore, ['give wine to man','look at the phone',`call ${HOTLINE}`,`call ${SCRATCHED}`]],
];
for (const [room, cmds] of plan) { walk(room); for (const c of cmds) type(c); }
for (let i = 0; i < 20 && !g.flag('phoneRinging'); i++) g.tick();
type('answer the phone'); type(`call ${DELIVERY}`);
const plan2 = [
  [RoomId.HookerRoom, ['wear condom','go to bed','remove condom','get candy']],
  [RoomId.Alley, ['look in dumpster','break the boards','get the pills']],
  [RoomId.InsideCasino, ['get card']],
  [RoomId.Lounge, ['sit down']],
  [RoomId.OutsideCasino, ['buy apple']],
  [RoomId.OutsideDisco, ['show pass']],
  [RoomId.InsideDisco, ['sit down','look at girl','look at girl','talk to girl','dance','give rose to girl','give candy to girl','give ring to girl','give money to girl']],
  [RoomId.OutsideChapel, ['talk to man']],
  [RoomId.InsideChapel, ['marry']],
];
for (const [room, cmds] of plan2) { walk(room); for (const c of cmds) type(c); }
drain();
for (const c of ['turn on radio','cut the rope with the knife','get the rope']) type(c);
const plan3 = [
  [RoomId.ReceptionDesk, ['give pills to faith','push the red button']],
  [RoomId.PenthouseBedroom, ['get doll','inflate doll']],
  [RoomId.PenthouseLounge, ['tie rope to balcony']],
  [RoomId.PenthouseHotTub, ['use doll','give apple to eve']],
];
for (const [room, cmds] of plan3) { walk(room); for (const c of cmds) type(c); }
console.log('FINAL SCORE', g.score, 'ending', g.ending);
