/*
 * Ilustraciones de línea por patrón de movimiento, siguiendo la misma receta
 * visual que rutina-movilidad: viewBox 420x400, línea de suelo tenue, una
 * elipse de acento semitransparente detrás de la figura, extremidades como
 * trazos gruesos (18) con articulaciones, torso como trazo más grueso (28),
 * cabeza como círculo macizo (r=26). El color del esqueleto es siempre
 * `currentColor` (hereda var(--fig-ink)); los acentos (elipse, cables,
 * flechas) usan var(--accent)/var(--accent2)/var(--accent3).
 *
 * Se añade un vocabulario propio para el equipamiento de gimnasio en casa,
 * que la rutina de movilidad no necesitaba: barra (bar + discos), mancuerna
 * (bar corta + discos pequeños), polea/cable (línea discontinua + torre),
 * banco (línea gruesa semitransparente bajo la figura).
 */
(function(){
  "use strict";

  function pts(arr){
    return "M" + arr[0][0] + " " + arr[0][1] + " L" + arr.slice(1).map(p => p[0]+" "+p[1]).join(" L");
  }

  function limbPath(p, strokeWidth){
    return `<path d="${pts(p)}" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  function accentColor(name){
    return name === "accent2" ? "var(--accent2)" : name === "accent3" ? "var(--accent3)" : "var(--accent)";
  }

  const POSES = {

    "press-horizontal": {
      bg:[200,205,75,55,"accent2"],
      bench:{x1:90,y:238,x2:320},
      limbs:[
        [[250,204],[295,245],[338,205]],
        [[250,210],[300,258],[352,222]],
        [[160,198],[150,100]],
        [[190,200],[210,100]]
      ],
      torso:{p:[[130,196],[250,204]]},
      head:[70,190,26],
      equipment:[{type:"barbell", x1:150,y1:100,x2:210,y2:100}]
    },

    "empuje-de-pie": {
      bg:[206,210,70,55,"accent"],
      towers:[{x:20,y1:60,y2:356}],
      cables:[[[90,140],[20,140]],[[90,150],[20,150]]],
      limbs:[
        [[210,130],[150,140],[90,140]],
        [[210,130],[150,150],[90,150]],
        [[206,230],[170,352]],
        [[206,230],[250,340]]
      ],
      torso:{p:[[210,130],[206,230]]},
      head:[210,70,26]
    },

    "flexion-pushup": {
      bg:[200,260,70,45,"accent"],
      limbs:[
        [[260,268],[360,280]],
        [[160,258],[160,340]],
        [[220,262],[220,345]]
      ],
      torso:{p:[[120,255],[260,268]]},
      head:[70,250,24]
    },

    "aperturas-de-pie": {
      bg:[206,215,70,55,"accent2"],
      towers:[{x:40,y1:60,y2:356},{x:380,y1:60,y2:356}],
      cables:[[[140,160],[40,150]],[[280,160],[380,150]]],
      limbs:[
        [[210,130],[140,160],[190,190]],
        [[210,130],[280,160],[230,190]],
        [[206,230],[176,352]],
        [[206,230],[238,352]]
      ],
      torso:{p:[[210,130],[206,230]]},
      head:[210,70,26]
    },

    "aperturas-tumbado": {
      bg:[200,205,75,55,"accent"],
      bench:{x1:90,y:238,x2:320},
      limbs:[
        [[250,204],[295,245],[338,205]],
        [[250,210],[300,258],[352,222]],
        [[160,198],[110,140],[90,170]],
        [[190,200],[250,140],[270,170]]
      ],
      torso:{p:[[130,196],[250,204]]},
      head:[70,190,26],
      equipment:[{type:"dumbbell", x1:78,y1:170,x2:90,y2:170},{type:"dumbbell", x1:270,y1:170,x2:282,y2:170}]
    },

    "triceps-pushdown": {
      bg:[206,215,70,55,"accent2"],
      cables:[[[210,240],[300,240],[300,20]]],
      limbs:[
        [[210,130],[195,185],[195,240]],
        [[210,130],[225,185],[225,240]],
        [[206,230],[176,352]],
        [[206,230],[238,352]]
      ],
      torso:{p:[[210,130],[206,230]]},
      head:[210,70,26]
    },

    "triceps-overhead": {
      bg:[206,210,70,55,"accent"],
      limbs:[
        [[210,130],[195,70],[220,95]],
        [[210,130],[225,70],[200,95]],
        [[206,230],[176,352]],
        [[206,230],[238,352]]
      ],
      torso:{p:[[210,130],[206,230]]},
      head:[210,70,26],
      equipment:[{type:"dumbbell", x1:204,y1:92,x2:216,y2:92}]
    },

    "fondos-banco": {
      bg:[260,185,60,45,"accent2"],
      bench:{x1:300,y:222,x2:380},
      limbs:[
        [[270,150],[320,195],[340,220]],
        [[220,210],[130,250],[70,260]]
      ],
      torso:{p:[[270,150],[220,210]]},
      head:[300,110,26]
    },

    "plancha-frontal": {
      bg:[200,260,70,45,"accent"],
      limbs:[
        [[260,268],[360,280]],
        [[175,258],[175,320],[215,324]]
      ],
      torso:{p:[[120,255],[260,268]]},
      head:[70,250,24]
    },

    "crunch": {
      bg:[230,290,60,40,"accent"],
      limbs:[
        [[230,306],[290,250],[340,285]],
        [[140,302],[190,275]]
      ],
      torso:{p:[[110,302],[230,306]]},
      head:[60,300,24]
    },

    "elevacion-piernas": {
      bg:[230,300,55,35,"accent2"],
      limbs:[
        [[230,304],[270,220],[300,140]],
        [[130,300],[90,320]]
      ],
      torso:{p:[[105,302],[230,304]]},
      head:[55,300,24]
    },

    "plancha-lateral": {
      bg:[220,265,65,40,"accent"],
      limbs:[
        [[150,230],[150,330]],
        [[230,255],[230,160]],
        [[300,290],[345,300]]
      ],
      torso:{p:[[110,220],[330,300]]},
      head:[60,210,24]
    },

    "crunch-giro": {
      bg:[230,295,60,38,"accent2"],
      limbs:[
        [[230,304],[310,312]],
        [[230,304],[250,230],[210,215]],
        [[140,300],[200,250]]
      ],
      torso:{p:[[110,302],[230,304]]},
      head:[60,300,24]
    },

    "press-vertical": {
      bg:[206,210,70,55,"accent"],
      limbs:[
        [[210,130],[170,70],[150,30]],
        [[210,130],[250,70],[270,30]],
        [[206,230],[176,352]],
        [[206,230],[238,352]]
      ],
      torso:{p:[[210,130],[206,230]]},
      head:[210,70,26],
      equipment:[{type:"dumbbell", x1:144,y1:30,x2:156,y2:30},{type:"dumbbell", x1:264,y1:30,x2:276,y2:30}]
    },

    "elevacion-lateral": {
      bg:[206,210,70,55,"accent2"],
      limbs:[
        [[210,130],[140,125],[70,120]],
        [[210,130],[280,125],[350,120]],
        [[206,230],[176,352]],
        [[206,230],[238,352]]
      ],
      torso:{p:[[210,130],[206,230]]},
      head:[210,70,26],
      equipment:[{type:"dumbbell", x1:64,y1:120,x2:76,y2:120},{type:"dumbbell", x1:344,y1:120,x2:356,y2:120}]
    },

    "elevacion-frontal": {
      bg:[206,210,70,55,"accent"],
      limbs:[
        [[210,130],[160,90],[130,55]],
        [[210,130],[260,90],[290,55]],
        [[206,230],[176,352]],
        [[206,230],[238,352]]
      ],
      torso:{p:[[210,130],[206,230]]},
      head:[210,70,26],
      equipment:[{type:"dumbbell", x1:124,y1:55,x2:136,y2:55},{type:"dumbbell", x1:284,y1:55,x2:296,y2:55}]
    },

    "curl-biceps": {
      bg:[206,210,70,55,"accent2"],
      limbs:[
        [[210,130],[185,195],[200,145]],
        [[210,130],[235,195],[220,145]],
        [[206,230],[176,352]],
        [[206,230],[238,352]]
      ],
      torso:{p:[[210,130],[206,230]]},
      head:[210,70,26],
      equipment:[{type:"barbell", x1:200,y1:145,x2:220,y2:145, plateR:12}]
    },

    "cardio-caminar": {
      bg:[206,230,70,55,"accent"],
      limbs:[
        [[206,230],[170,290],[150,352]],
        [[206,230],[250,300],[280,350]],
        [[210,130],[175,160],[150,190]],
        [[210,130],[250,150],[280,130]]
      ],
      torso:{p:[[210,130],[206,230]]},
      head:[210,70,26]
    },

    "cardio-bici": {
      bg:[190,230,55,40,"accent2"],
      wheels:[{cx:300,cy:330,r:40},{cx:150,cy:330,r:40}],
      limbs:[
        [[180,230],[180,270]],
        [[180,270],[300,290]],
        [[300,290],[300,175]],
        [[180,230],[230,210],[270,260]],
        [[180,230],[200,280],[230,330]],
        [[160,150],[230,170],[290,175]]
      ],
      torso:{p:[[160,150],[180,230]]},
      head:[150,100,26]
    },

    "cardio-eliptica": {
      bg:[206,230,70,55,"accent"],
      limbs:[
        [[206,230],[185,290],[175,352]],
        [[206,230],[235,295],[255,350]],
        [[210,130],[160,140],[110,150]],
        [[210,130],[260,120],[310,100]]
      ],
      torso:{p:[[210,130],[206,230]]},
      head:[210,70,26]
    },

    "remo-inclinado": {
      bg:[230,190,70,55,"accent2"],
      limbs:[
        [[200,220],[180,352]],
        [[200,220],[230,345]],
        [[260,140],[230,190],[260,200]],
        [[260,140],[290,195],[320,205]]
      ],
      torso:{p:[[260,140],[200,220]]},
      head:[290,90,26],
      equipment:[{type:"barbell", x1:260,y1:200,x2:320,y2:205}]
    },

    "remo-un-brazo": {
      bg:[230,200,65,50,"accent"],
      bench:{x1:240,y:238,x2:340},
      limbs:[
        [[205,215],[190,352]],
        [[205,215],[225,350]],
        [[270,140],[280,230]],
        [[270,140],[230,185],[255,210]]
      ],
      torso:{p:[[270,140],[205,215]]},
      head:[300,90,26],
      equipment:[{type:"dumbbell", x1:249,y1:210,x2:261,y2:210}]
    },

    "remo-sentado": {
      bg:[150,220,55,45,"accent2"],
      towers:[{x:380,y1:20,y2:356}],
      cables:[[[180,155],[380,155]]],
      limbs:[
        [[150,230],[120,232],[115,300]],
        [[150,230],[185,233],[190,300]],
        [[140,150],[190,155],[165,160]],
        [[140,150],[195,148],[168,152]]
      ],
      torso:{p:[[140,150],[150,230]]},
      head:[120,100,26]
    },

    "jalon-polea": {
      bg:[145,220,55,45,"accent"],
      towers:[{x:137,y1:10,y2:57}],
      limbs:[
        [[145,225],[115,228],[110,300]],
        [[145,225],[180,230],[185,300]],
        [[135,140],[90,60]],
        [[135,140],[185,55]]
      ],
      torso:{p:[[135,140],[145,225]]},
      head:[120,90,26],
      equipment:[{type:"barbell", x1:90,y1:60,x2:185,y2:55, plateR:0}]
    },

    "pullover": {
      bg:[200,205,75,55,"accent2"],
      bench:{x1:90,y:238,x2:320},
      limbs:[
        [[250,204],[295,245],[338,205]],
        [[250,210],[300,258],[352,222]],
        [[150,196],[90,140],[50,100]],
        [[170,198],[110,150],[70,115]]
      ],
      torso:{p:[[130,196],[250,204]]},
      head:[70,190,26],
      equipment:[{type:"dumbbell", x1:54,y1:107,x2:66,y2:107}]
    },

    "sentadilla": {
      bg:[206,260,70,50,"accent"],
      limbs:[
        [[206,255],[170,290],[175,352]],
        [[206,255],[242,290],[237,352]],
        [[210,145],[185,125]],
        [[210,145],[235,125]]
      ],
      torso:{p:[[210,145],[206,255]]},
      head:[210,80,26],
      equipment:[{type:"barbell", x1:175,y1:120,x2:245,y2:120}]
    },

    "zancada": {
      bg:[206,255,70,55,"accent2"],
      limbs:[
        [[206,225],[165,275],[150,352]],
        [[206,225],[250,290],[290,345]],
        [[210,135],[195,225]],
        [[210,135],[225,225]]
      ],
      torso:{p:[[210,135],[206,225]]},
      head:[210,75,26],
      equipment:[{type:"dumbbell", x1:189,y1:225,x2:201,y2:225},{type:"dumbbell", x1:219,y1:225,x2:231,y2:225}]
    },

    "peso-muerto": {
      bg:[235,230,70,55,"accent"],
      limbs:[
        [[205,220],[195,352]],
        [[205,220],[225,348]],
        [[265,145],[250,300]],
        [[265,145],[275,300]]
      ],
      torso:{p:[[265,145],[205,220]]},
      head:[290,95,26],
      equipment:[{type:"barbell", x1:250,y1:300,x2:275,y2:300}]
    },

    "puente-gluteo": {
      bg:[220,290,60,40,"accent2"],
      limbs:[
        [[230,260],[290,300],[320,352]],
        [[130,300],[95,330]]
      ],
      torso:{p:[[105,302],[230,260]]},
      head:[55,300,24]
    }
  };

  const FALLBACK = {
    bg:[206,210,70,55,"accent"],
    limbs:[
      [[210,130],[150,160]],
      [[210,130],[270,160]],
      [[206,230],[176,352]],
      [[206,230],[238,352]]
    ],
    torso:{p:[[210,130],[206,230]]},
    head:[210,70,26]
  };

  function buildSVG(poseKey, opts){
    const pose = POSES[poseKey] || FALLBACK;
    opts = opts || {};
    const withGround = opts.ground !== false;

    let out = "";

    if (withGround){
      out += `<path d="M26 356 H394" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" opacity="0.18"/>`;
    }

    if (pose.towers){
      pose.towers.forEach(t => {
        out += `<path d="M${t.x} ${t.y1} L${t.x} ${t.y2}" fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round" opacity="0.35"/>`;
      });
    }

    if (pose.bg){
      const [cx,cy,rx,ry,color] = pose.bg;
      out += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${accentColor(color)}" opacity="0.22"/>`;
    }

    if (pose.bench){
      out += `<path d="M${pose.bench.x1} ${pose.bench.y} H${pose.bench.x2}" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" opacity="0.4"/>`;
    }

    if (pose.cables){
      pose.cables.forEach(c => {
        out += `<path d="${pts(c)}" fill="none" stroke="${accentColor("accent")}" stroke-width="7" stroke-linecap="round" stroke-dasharray="4 16" opacity="0.85"/>`;
      });
    }

    (pose.limbs || []).forEach(p => { out += limbPath(p, 18); });

    if (pose.torso){
      out += limbPath(pose.torso.p, 28);
    }

    if (pose.wheels){
      pose.wheels.forEach(w => {
        out += `<circle cx="${w.cx}" cy="${w.cy}" r="${w.r}" fill="none" stroke="currentColor" stroke-width="10"/>`;
      });
    }

    const [hx,hy,hr] = pose.head || [210,70,26];
    out += `<circle cx="${hx}" cy="${hy}" r="${hr}" fill="currentColor"/>`;

    (pose.equipment || []).forEach(eq => {
      if (eq.type === "barbell" || eq.type === "dumbbell"){
        const plateR = eq.plateR != null ? eq.plateR : (eq.type === "barbell" ? 16 : 11);
        const barWidth = eq.type === "barbell" ? 12 : 8;
        out += `<path d="M${eq.x1} ${eq.y1} L${eq.x2} ${eq.y2}" fill="none" stroke="currentColor" stroke-width="${barWidth}" stroke-linecap="round"/>`;
        if (plateR > 0){
          out += `<circle cx="${eq.x1}" cy="${eq.y1}" r="${plateR}" fill="currentColor"/>`;
          out += `<circle cx="${eq.x2}" cy="${eq.y2}" r="${plateR}" fill="currentColor"/>`;
        }
      }
    });

    return `<svg viewBox="0 0 420 400" width="100%" height="100%" aria-hidden="true" focusable="false">${out}</svg>`;
  }

  window.ExerciseIllustrations = { buildSVG, POSES };
})();
