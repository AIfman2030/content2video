import { COVER_H, COVER_W, type CoverOpts, registerCover } from './registry';

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const lines: string[]=[]; let line='';
  for(const char of text){ if(ctx.measureText(line+char).width>max && line){lines.push(line);line=char;}else line+=char; }
  if(line) lines.push(line); return lines.slice(0,3);
}

function drawStickmanCover(ctx: CanvasRenderingContext2D, opts: CoverOpts) {
  ctx.fillStyle='#fafaf7';ctx.fillRect(0,0,COVER_W,COVER_H);
  ctx.strokeStyle='#171717';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,150);ctx.lineTo(COVER_W,150);ctx.stroke();
  const grad=ctx.createLinearGradient(45,40,130,120);grad.addColorStop(0,'#ffb21d');grad.addColorStop(1,'#ed254e');ctx.strokeStyle=grad;ctx.lineWidth=18;ctx.beginPath();ctx.arc(85,78,40,-.5,Math.PI*1.5);ctx.stroke();
  ctx.fillStyle='#111';ctx.font='900 40px "Noto Sans SC",sans-serif';ctx.textAlign='left';ctx.fillText('火柴人观点',155,95);
  ctx.fillStyle='#c81919';ctx.textAlign='center';ctx.font='900 92px "Noto Sans SC","PingFang SC",sans-serif';
  const lines=wrap(ctx,opts.title,850);lines.forEach((line,i)=>ctx.fillText(line,COVER_W/2,330+i*120));
  ctx.strokeStyle='#333';ctx.fillStyle='#333';ctx.lineWidth=12;ctx.lineCap='round';
  ctx.beginPath();ctx.arc(540,900,115,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.arc(505,875,9,0,Math.PI*2);ctx.arc(575,875,9,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.moveTo(500,935);ctx.lineTo(580,935);ctx.stroke();
  ctx.beginPath();ctx.moveTo(540,1015);ctx.lineTo(540,1260);ctx.moveTo(540,1070);ctx.lineTo(385,1160);ctx.moveTo(540,1070);ctx.lineTo(695,1160);ctx.moveTo(540,1260);ctx.lineTo(430,1390);ctx.moveTo(540,1260);ctx.lineTo(650,1390);ctx.stroke();
  ctx.fillStyle='#d62f2f';ctx.font='900 120px sans-serif';ctx.fillText('?',800,1030);
}

registerCover('stickman',drawStickmanCover);
