
class Avatar {
    
    static from(number, options) {
        return new this(number, options);
    }

    constructor(number, options) {
        const defaults = {
            parentNode: document.body,
            isAnimated: false,
            useBezier: false,
            colors: [
                '#9200cc',
                '#1e00ff',
                '#0062cc',
                '#00b3a5',
                '#00cc3d',
                '#48ff00',
                '#ffff00',
                '#ff8400',
                '#ff1500',
                '#b3007d',
            ],
            title_fill_color: "#AAA",
            title_stroke_color: "#888",
            ring_color_size: 0.8,
            ring_dot_size: 0.85,
            ring_line_size: 0.7,
            ring_line_bezier_coeff_max: 2,
            backgroundColor: "white",
        };

        this.targetNumber = String(number);
        this.targetNumberLength = this.targetNumber.length;
        this.number = '';
        this.data = {};
        this.options = Object.assign(defaults, options);

        this.node = document.createElement('canvas');
        this.ctx = this.node.getContext('2d');

        this.width = null;
        this.height = null;
        this.center_x = null;
        this.center_y = null;
        this.radius = null;
    }
    
    updateCanvas() {
        const styles = getComputedStyle(this.node);
        const width = parseInt(styles.getPropertyValue('width'), 10);
        const height = parseInt(styles.getPropertyValue('height'), 10);
        
        this.node.width = width;
        this.node.height = height;

        this.width = width;
        this.height = height;

        this.center_x = width >> 1;
        this.center_y = height >> 1;

        this.radius = Math.min(this.center_x, this.center_y);
        this.targetNumberLength = Math.min(this.targetNumber.length, this.radius);
        
        return this;
    }

    reset() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        return this;
    }

    computeData() {
        const n = this.number.length;

        this.data = {
            count: 0,
            details: {},
        };

        for (let i=0; i<10; i++) {
            this.data.details[i] = {
                count: 0,
                previous: [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                next: [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
            };
        }

        for (let i=0; i<n; i++) {
            const previous = i==0 ? null : this.number[i-1];
            const current = this.number[i];
            const next = i==n-1 ? null : this.number[i+1];

            this.data.count += 1;
            this.data.details[current].count += 1;
            previous === null ? null : this.data.details[current].previous[previous] += 1;
            next === null ? null : this.data.details[current].previous[next] += 1;
        }

        this.computePositions();

        return this;
    }

    computePositions() {
        const coeff = Math.PI * 2 / this.data.count;

        let sum = 0;

        for (let i=0; i<10; i++) {
            this.data.details[i].previousSum = sum;
            this.data.details[i].startAngle = sum * coeff;

            sum += this.data.details[i].count
            this.data.details[i].angle = this.data.details[i].count * coeff;

            this.data.details[i].sum = sum;
            this.data.details[i].endAngle = sum * coeff;
        }

        this.resetIndexes();

        return this;
    }

    getCoordinates(index, size, radius) {
        const coeff = 2* Math.PI / size;
        const teta = index * coeff;
        const teta_cos = Math.cos(teta);
        const teta_sin = Math.sin(teta);
        const teta_x = teta_cos * radius;
        const teta_y = teta_sin * radius;

        return {
            x: teta_x + this.center_x,
            y: teta_y + this.center_y,
        }
    }

    getAverageCoordinates(index1, index2, size, radius) {
        const half = size / 2;
        let average = (index1+index2) / 2; 

        if (Math.abs(index1-index2) >= half) { 
            average += half; 
        } 
        
        if (average >= size) { 
            average -= size; 
        }

        return this.getCoordinates(average, size, radius);
    }

    resetIndexes() {
        for (let i=0; i<10; i++) {
            this.data.details[i].index = 0;
        }

        return this;
    }

    drawBackground() {
        const radius = this.options.ring_color_size * this.radius;

        this.ctx.fillStyle = this.options.backgroundColor;

        this.ctx.beginPath();
        this.ctx.arc(this.center_x, this.center_y, radius, 0, 2* Math.PI);
        this.ctx.fill();
    }

    drawTitle() {
        const previousAlpha = this.ctx.globalAlpha;
        const previousLineWidth = this.ctx.lineWidth;

        this.ctx.font = Math.round(this.radius/4) + "px mono";
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = this.options.title_stroke_color;
        this.ctx.fillStyle = this.options.title_fill_color;
        this.ctx.globalAlpha = 0.1;
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";

        this.ctx.strokeText(this.options.title, this.center_x, this.center_y);
        this.ctx.fillText(this.options.title, this.center_x, this.center_y);

        this.ctx.globalAlpha = previousAlpha;
        this.ctx.lineWidth = previousLineWidth;
    }

    drawColors() {
        const radius = this.options.ring_color_size * this.radius;

        for (let i=0; i<10; i++) {
            const part = this.data.details[i];

            this.ctx.fillStyle = this.options.colors[i];

            this.ctx.beginPath();
            this.ctx.arc(this.center_x, this.center_y, radius, part.startAngle, part.endAngle);
            this.ctx.fill();
        }

        return this;
    }

    drawDots() {
        this.resetIndexes();

        //const previousAlpha = this.ctx.globalAlpha;
        const radius = this.options.ring_dot_size * this.radius - 5;

        let i = this.number.length;
        let next = parseInt(this.number[--i]);

        while (i-->1) {
            const current = parseInt(this.number[i]);
            const previous = parseInt(this.number[i-1]);
            const details = this.data.details[current];
            const coords = this.getCoordinates(details.sum - details.index++, this.data.count, radius + next);

            this.ctx.fillStyle = this.options.colors[previous];
            //this.ctx.globalAlpha = (this.data.count - i) / this.data.count;

            if (i === this.index) {
                this.ctx.beginPath();
                this.ctx.arc(coords.x, coords.y, Math.trunc(this.radius/25), 0, 2* Math.PI);
                this.ctx.fill();
            } else {
                this.ctx.fillRect(coords.x, coords.y, 1, 1);
            }

            next = current;
        }

        //this.ctx.globalAlpha = previousAlpha;

        return this;
    }

    drawLines() {
        this.resetIndexes();

        //const previousAlpha = this.ctx.globalAlpha;
        const radius = this.options.ring_line_size * this.radius;
        const deci = this.number.length / 100;

        let i = this.number.length;
        let iDeci = i - deci;
        let current = parseInt(this.number[--i]);
        let details = this.data.details[current];

        let nextCoords = this.getCoordinates(details.sum - details.index, this.data.count, radius);
        let nextVecCoords = this.getCoordinates(details.sum - details.index, this.data.count, radius * 0);
        let nextPosition = details.sum - details.index;
        details.index++;

        this.ctx.lineCap = "round";

        if (undefined === this.options.ring_line_bezier_coeff) {
            this.options.ring_line_bezier_coeff = this.options.ring_line_bezier_coeff_max;
        }

        const bezierCoeff = this.options.ring_line_bezier_coeff;

        while (i-->0) {
            const percent = (this.data.count - i) / this.data.count;

            current = parseInt(this.number[i]);
            details = this.data.details[current];

            let coords = this.getCoordinates(details.sum - details.index, this.data.count, radius);
            let vecCoords = this.getCoordinates(details.sum - details.index, this.data.count, radius * (1.1-percent) * bezierCoeff);
            let position = details.sum - details.index;
            let avgCoords = this.getAverageCoordinates(position, nextPosition, this.data.count, radius * 0.5 * bezierCoeff);
            
            details.index++;

            this.ctx.strokeStyle = this.options.colors[current];

            this.ctx.lineWidth = Math.max(1, 5 - i);

            this.ctx.beginPath();
            this.ctx.moveTo(nextCoords.x, nextCoords.y);
            
            if (true === this.options.useBezier) {
                this.ctx.bezierCurveTo(nextVecCoords.x, nextVecCoords.y, vecCoords.x, vecCoords.y, coords.x, coords.y);
            } else {
                this.ctx.quadraticCurveTo(avgCoords.x, avgCoords.y, coords.x, coords.y);
            }
            this.ctx.stroke();

            nextCoords = coords;
            nextVecCoords = vecCoords;
            nextPosition = position;

            if (i < iDeci) {
                this.drawTitle();
                iDeci -= deci;
            }
        }

        //this.ctx.globalAlpha = previousAlpha;


        return this;
    }
    
    make() {
        this.updateCanvas();
        this.computeData();

        this.drawBackground();
        this.drawTitle();
        this.drawColors();
        this.drawDots();
        this.drawLines();
        this.drawTitle();
    }
    
    updateAnimation() {
        this.reset();

        const timeUnit = Math.trunc(Date.now() / 100);
        const i = this.number.length;

        this.index = timeUnit % i;
        
        if (i === this.targetNumberLength) {
            const loop = Math.sin(2* Math.PI * (timeUnit % 50) / 50);
            const targetBezierCoeff = 1 + loop / 12;

            if (Math.abs(this.options.ring_line_bezier_coeff - targetBezierCoeff) > 0.01) {
                const delta = (this.options.ring_line_bezier_coeff - targetBezierCoeff) / 10;
                
                this.options.ring_line_bezier_coeff -= delta;
            }
        } else {
            if (i < this.targetNumberLength) {
                this.number = this.targetNumber.slice(0, i+1);
            } else {
                this.number = this.targetNumber.slice(0, i-1);
            }
        }
    
        this.make();
        
        window.requestAnimationFrame(()=>this.updateAnimation());

        return this;
    }
    
    render() {
        if (null === this.node.parentNode) {
            this.options.parentNode.appendChild(this.node);
        }

        if (this.options.isAnimated) {
            this.updateAnimation();
        } else {
            this.number = this.targetNumber;
            this.options.ring_line_bezier_coeff = 1;
            this.make();
        }
        
        return this;
    }
}