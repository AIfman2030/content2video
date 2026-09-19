import type { GeneratedContent } from '../../types/video';
import { CW, CH } from './helpers';

export const STICKMAN_INTRO_MS = 2400;
export const STICKMAN_SCENE_MS = 3600;
export const STICKMAN_OUTRO_MS = 1800;
export const stickmanTotalMs = (count: number) => STICKMAN_INTRO_MS + Math.max(1, count) * STICKMAN_SCENE_MS + STICKMAN_OUTRO_MS;

const ease = (n: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, n)), 3);

function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, seed = 0) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.save(); ctx.globalAlpha *= 0.24; ctx.beginPath();
  ctx.moveTo(x1 + Math.sin(seed * 2.1) * 2, y1 + Math.cos(seed) * 2);
  ctx.lineTo(x2 + Math.cos(seed * 1.7) * 2, y2 + Math.sin(seed) * 2); ctx.stroke(); ctx.restore();
}

function person(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1, mood: 'angry'|'worried'|'smug'|'neutral' = 'neutral', arm = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.strokeStyle = '#333'; ctx.fillStyle = '#333'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, -145, 58, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(-20, -152, 5, 0, Math.PI * 2); ctx.arc(20, -152, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath();
  if (mood === 'smug') ctx.arc(0, -136, 24, 0.15, Math.PI - .15);
  else if (mood === 'worried') ctx.arc(0, -112, 22, Math.PI + .2, Math.PI * 2 - .2);
  else { ctx.moveTo(-18, -125); ctx.lineTo(18, -125); }
  ctx.stroke();
  if (mood === 'angry') { line(ctx,-34,-174,-9,-164,1); line(ctx,34,-174,9,-164,2); }
  line(ctx,0,-86,0,85,3); line(ctx,0,-30,-95,-10-arm,4); line(ctx,0,-30,95,-55+arm,5);
  line(ctx,0,85,-62,190,6); line(ctx,0,85,62,190,7); line(ctx,-62,190,-95,190,8); line(ctx,62,190,95,190,9);
  ctx.restore();
}

function clock(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, spin: number) {
  ctx.save(); ctx.strokeStyle='#555'; ctx.lineWidth=7; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.stroke();
  line(ctx,x,y,x+Math.cos(spin)*r*.65,y+Math.sin(spin)*r*.65,1); line(ctx,x,y,x,y-r*.55,2); ctx.restore();
}

function papers(ctx: CanvasRenderingContext2D, x: number, y: number, count = 5) {
  ctx.save(); ctx.strokeStyle='#555'; ctx.lineWidth=5;
  for(let i=0;i<count;i++){ctx.strokeRect(x-i*3,y-i*15,170,110); line(ctx,x+25-i*3,y+28-i*15,x+140-i*3,y+28-i*15,i); line(ctx,x+25-i*3,y+58-i*15,x+115-i*3,y+58-i*15,i+1);}
  ctx.restore();
}

function header(ctx: CanvasRenderingContext2D, title: string) {
  ctx.fillStyle='#fff'; ctx.fillRect(0,0,CW,CH); ctx.strokeStyle='#111'; ctx.lineWidth=4; line(ctx,0,122,CW,122,2);
  const g=ctx.createLinearGradient(45,0,120,0); g.addColorStop(0,'#ffb01f'); g.addColorStop(1,'#ef233c'); ctx.strokeStyle=g; ctx.lineWidth=12; ctx.beginPath(); ctx.arc(78,62,29,-.4,Math.PI*1.45); ctx.stroke();
  ctx.fillStyle='#111'; ctx.font='900 42px "Noto Sans SC","PingFang SC",sans-serif'; ctx.textAlign='left'; ctx.fillText(title || '观点拆解',130,78);
  ctx.fillStyle='#aaa'; ctx.font='500 28px "Noto Sans SC",sans-serif'; ctx.textAlign='right'; ctx.fillText('个人观点，仅供参考',CW-58,75);
  ctx.save(); ctx.globalAlpha=.055; ctx.fillStyle='#42b7cf'; ctx.font='900 118px "Noto Sans SC",sans-serif'; ctx.textAlign='center'; ctx.fillText(title || '观点观察',CW/2,570); ctx.restore();
}

function caption(ctx: CanvasRenderingContext2D, text: string) {
  ctx.fillStyle='#fff'; ctx.fillRect(0,878,CW,202); ctx.strokeStyle='#111'; ctx.lineWidth=5; line(ctx,0,878,CW,878,4);
  ctx.fillStyle='#111'; ctx.font='900 48px "Noto Sans SC","PingFang SC",sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  const shown = text.length > 22 ? text.slice(0,22)+'…' : text; ctx.fillText(shown,CW/2,977);
  ctx.font='34px sans-serif'; ctx.fillText('🏃',120,850);
}

function scene(ctx: CanvasRenderingContext2D, text: string, p: number, index: number) {
  const enter=ease(p/.22); ctx.save(); ctx.globalAlpha=enter; ctx.translate(CW/2,510); ctx.scale(.84+.16*enter,.84+.16*enter); ctx.translate(-CW/2,-510);
  ctx.strokeStyle='#333'; ctx.fillStyle='#333'; ctx.lineWidth=7; ctx.lineCap='round';
  if (/考勤|下班|时间/.test(text)) { person(ctx,650,565,1,'angry',30*Math.sin(p*8)); person(ctx,1260,575,.92,'worried'); clock(ctx,960,360,90,-Math.PI/2+p*2); }
  else if (/卫生/.test(text)) { person(ctx,1190,585,.95,'worried',15); person(ctx,700,575,1,'angry',25); line(ctx,1130,600,1040,790,1); ctx.strokeRect(840,680,310,70); ctx.beginPath();ctx.ellipse(1040,820,70,22,0,0,Math.PI*2);ctx.stroke(); }
  else if (/日报|周报|月报|报表/.test(text)) { person(ctx,960,555,.9,'worried',10*Math.sin(p*10)); ctx.strokeRect(700,690,520,110); papers(ctx,570,590,6); papers(ctx,1180,570,8); }
  else if (/文档|格式|标点/.test(text)) { person(ctx,710,575,1,'angry',20); papers(ctx,1040,600,2); ctx.beginPath();ctx.arc(1130,545,105,0,Math.PI*2);ctx.stroke();line(ctx,1058,620,970,735,2);ctx.fillStyle='#d62f2f';ctx.font='900 100px serif';ctx.fillText('，',1090,590); }
  else if (/口号/.test(text)) { person(ctx,870,575,1,'neutral',30); ctx.beginPath();ctx.moveTo(975,440);ctx.lineTo(1130,375);ctx.lineTo(1130,520);ctx.closePath();ctx.stroke(); for(let i=0;i<3;i++) line(ctx,1165+i*28,400-i*12,1210+i*34,375-i*20,i); }
  else if (/99%|草包|三条/.test(text)) { person(ctx,890,575,1,'smug'); ctx.fillStyle='#d62f2f';ctx.font='900 110px sans-serif';ctx.fillText('99%',1120,440);ctx.font='900 150px sans-serif';ctx.fillText('×',1180,620); }
  else if (/开会|纪律/.test(text)) { person(ctx,610,560,.9,'angry',20); person(ctx,960,590,.78,'worried'); person(ctx,1280,590,.78,'neutral'); ctx.strokeRect(730,690,650,100); clock(ctx,960,340,78,-Math.PI/2+p); }
  else if (/着装/.test(text)) { person(ctx,710,575,1,'angry',25); person(ctx,1190,575,1,'worried'); ctx.fillStyle='#d62f2f';ctx.beginPath();ctx.moveTo(1190,480);ctx.lineTo(1160,535);ctx.lineTo(1190,600);ctx.lineTo(1220,535);ctx.closePath();ctx.fill(); }
  else { person(ctx,720,575,1,'neutral',20); person(ctx,1190,575,1,'worried'); ctx.strokeStyle='#d62f2f';ctx.beginPath();ctx.arc(960,370,92,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#d62f2f';ctx.font='900 105px sans-serif';ctx.textAlign='center';ctx.fillText('?',960,410); }
  ctx.restore();
  ctx.save();ctx.globalAlpha=.35;ctx.fillStyle='#777';ctx.font='24px monospace';ctx.textAlign='right';ctx.fillText(String(index+1).padStart(2,'0'),CW-50,850);ctx.restore();
}

export function drawStickmanScene(ctx: CanvasRenderingContext2D, elapsed: number, content: GeneratedContent) {
  header(ctx, content.title);
  if (elapsed < STICKMAN_INTRO_MS) {
    const p=ease(elapsed/900); ctx.save();ctx.globalAlpha=p;ctx.fillStyle='#c81919';ctx.textAlign='center';ctx.font='900 82px "Noto Sans SC",sans-serif';
    const title=content.title || '判断一个领导水平怎么样'; const cut=Math.min(6,Math.max(3,Math.ceil(title.length/2)));
    ctx.fillText(title.slice(0,cut),CW/2,450);ctx.fillText(title.slice(cut),CW/2,565);ctx.restore();caption(ctx,title);return;
  }
  const index=Math.min(content.points.length-1,Math.max(0,Math.floor((elapsed-STICKMAN_INTRO_MS)/STICKMAN_SCENE_MS)));
  const point=content.points[index] ?? {label:'观点观察',short:'',desc:'',formatted:''};
  const local=((elapsed-STICKMAN_INTRO_MS)%STICKMAN_SCENE_MS)/STICKMAN_SCENE_MS;
  const text=[point.label,point.short,point.desc].filter(Boolean).join(' '); scene(ctx,text,local,index); caption(ctx,point.desc || point.short || point.label);
}
