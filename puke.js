/*
 * -- Puke Inhibitor --
 * Copyright (C) 1997 By Simon T. Kirby.
 * Released to the public domain.  No warranty!
 * Have fun. :)
 *
 * Original was from about 1994, in Turbo Pascal.
 *
 * Ported to C and svgalib in 1997.
 *
 * Ported to Javascript and Canvas, 2009/08/10.
 *
 * Refactored and fixed timestep in 2020.
 */

function dot(l, r) {
    let d = 0.0;
    for(let i=0; i<Math.min(l.length,r.length); i+=1) {
        d += l[i]*r[i];
    }
    return d;
}

function ttt(l, r) {
    const t = [];
    for(let i=0; i<Math.min(l.length,r.length); i+=1) {
        t[i] = l[i]+r[i];
    }
    return t;
}

function puke(scene, window) {
  let ctx, w, w2, h, h2, zf;
  
  const starcount = 300;
  const starbuffer = [];
  let angle = [0,0,0];
  let ofs = [0,0,0];

  const step = 1000/60>>0;
  let tock = delta = 0;

  return {
    resize: function() {
        w = scene.width = window.innerWidth;
        h = scene.height = window.innerHeight;
        w2 = w / 2;
        h2 = h / 2;
        zf = Math.hypot(w2, h2) / 2;
        ctx = scene.getContext('2d');
    },
    load: function() {
        this.resize();
        if (!!ctx) {
            for (i = 0;i < starcount;i++) {
                starbuffer[i] = [
                    (Math.random() - .5)*0xFFFF,
                    (Math.random() - .5)*0xFFFF,
                    (Math.random() - .5)*0xFFFF
                ]
            }
            requestAnimationFrame(this.loop);
        }
    },
    loop: function(tick) {
        delta = Math.min(delta+tick-tock, 250);
        while(delta>=step) {
            angle = ttt(angle, [7,5,3].map(a => a*Math.PI/4096.0));
            ofs = ttt(ofs, [7,5,3].map(a => a*-16.0));
            delta -= step;
        }
        this.draw();
        tock = tick;
        requestAnimationFrame(this.loop);
    },
    transform: function(s, c) {
        return [
            [c[1]*c[2]                 ,-s[2]     ,-s[1]*c[2]                 ],
            [s[1]*s[0] + s[2]*c[0]*c[1], c[2]*c[0], s[0]*c[1] - s[1]*s[2]*c[0]],
            [s[1]*c[0] - s[2]*s[0]*c[1],-s[0]*c[2], c[1]*c[0] + s[1]*s[2]*s[0]]
        ];
    },
    draw: function() {
        ctx.clearRect(0,0,w,h);
    
        const s = angle.map(Math.sin);
        const c = angle.map(Math.cos);
        const m = this.transform(s,c);
    
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < starcount; i+=1) {
            const a = ttt(starbuffer[i], ofs).map(t => t<<16>>16);
            const z = dot(a,m[2]) + 32768;
            if (z > 0) {
                const sx = Math.round(dot(a,m[0]) * zf / z) + w2;
                const sy = Math.round(dot(a,m[1]) * zf / z) + h2;
                if(0 <= sx && sx < w && 0 <= sy && sy < h) {
                    const sw = sh = 32768 / z;
                    ctx.fillRect(sx, sy, sw, sh);
                }
            }
        }
    }
  };
}
