function floormod(x,y) {
    return ((x % y) + y) % y;
}

class Grid {
    constructor(height,width) {
        this.height = height;
        this.width = width;
        this.head = new Array(width*height);
        this.head.fill(false);
        this.tail = new Array(width*height);
        this.tail.fill(false);
    }

    flip() {
        [this.head, this.tail] = [this.tail, this.head];
    }

    generate(rule) {
        for(let i=0; i<this.height; i+=1)
            for(let j=0; j<this.width; j+=1)
                this.set(i,j,rule(i,j,this));
        this.flip();
    }

    get(i,j) {
        return this.head[floormod(i,this.height)*this.width + floormod(j,this.width)]
    }

    set(i,j,v) {
        this.tail[floormod(i,this.height)*this.width + floormod(j,this.width)] = v;
    }
}

const fav = document.createElement("canvas");
fav.style.imageRendering = 'pixelated';
fav.width = 16;
fav.height = 16;
const gol = fav.getContext('2d');
const rule = (i,j,g) => {
    let sum = 0;
    for(let y=-1; y<=1; y+=1) {
        for(let x=-1; x<=1; x+=1) {
            if(y != 0 || x != 0) {
                sum += g.get(i+y,j+x);
            }
        }
    }
    return sum == 3 || sum == 2 && g.get(i,j);
}

if(!!gol) {
    let grid = new Grid(5,5);
    grid.set(1,2,1);
    grid.set(2,3,1);
    grid.set(3,1,1);
    grid.set(3,2,1);
    grid.set(3,3,1);
    grid.flip();

    const fw = fav.width/grid.width<<0;
    const fh = fav.height/grid.height<<0;
    const callback = () => {
        gol.clearRect(0,0,fav.width,fav.height);
        for(let y=0; y<grid.height; y+=1) {
            for(let x=0; x<grid.width; x+=1) {
                gol.fillStyle = `rgb(${grid.get(y,x)?255:0},${grid.get(y,x)?255:0},${grid.get(y,x)?255:0})`;
                const big = x==2 || y==2 ? 1 : 0;
                gol.fillRect(x*fw + (x>2?1:0),y*fh + (y>2?1:0),fw+big,fh+big);
            }
        }
        document.querySelector("link[rel='icon']").href = fav.toDataURL('image/png');
        grid.generate(rule);
    };
    callback();
    setInterval(callback, 250);
}
