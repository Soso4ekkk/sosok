class Canvas3D {
    constructor({WIN}) {
        this.WIN = WIN;
        //уравнение плоскости в удобном виде
        this.plane = {
            A: 0,
            B: 0,
            C: 0,
            //точки смещения
            x0: 0,
            y0: 0,
            z0: 0,
            //точки камеры
            xs0: 0,
            ys0: 0,
            zs0: 0,
        };
    }

    xs(point) {
        return point.x * (this.WIN.CAMERA.z - this.WIN.DISPLAY.z) /
            (this.WIN.CAMERA.z - point.z);
    }

    ys(point) {
        return point.y * (this.WIN.CAMERA.z - this.WIN.DISPLAY.z) /
            (this.WIN.CAMERA.z - point.z);
    }

    //зум
    zoom(delta) {
        return [
            [delta, 0, 0, 0],
            [0, delta, 0, 0],
            [0, 0, delta, 0],
            [0, 0, 0, 1]
        ];
    }

    //перенос
    move(dx, dy, dz) {
        return [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [dx, dy, dz, 1]
        ];
    }

    /****************************вращения****************************/
    rotateOx(alpha) {
        return [
            [1, 0, 0, 0],
            [0, Math.cos(alpha), Math.sin(alpha), 0],
            [0, -Math.sin(alpha), Math.cos(alpha), 0],
            [0, 0, 0, 1]
        ];
    }

    rotateOy(alpha) {
        return [
            [Math.cos(alpha), 0, -Math.sin(alpha), 0],
            [0, 1, 0, 0],
            [Math.sin(alpha), 0, Math.cos(alpha), 0],
            [0, 0, 0, 1]
        ];
    }

    rotateOz(alpha) {
        return [
            [Math.cos(alpha), Math.sin(alpha), 0, 0],
            [-Math.sin(alpha), Math.cos(alpha), 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ];
    }

    /****************************************************************/

    //преобразования матриц
    transform(matrix, point) {
        const array = this.multMatrix(matrix, [point.x, point.y, point.z, 1]);
        point.x = array[0];
        point.y = array[1];
        point.z = array[2];
    }

    /**************перемножение матриц**************/
    multMatrix(T, m) {
        const a = [0, 0, 0, 0];
        for (let i = 0; i < T.length; i++) {
            let b = 0;
            for (let j = 0; j < m.length; j++) {
                b += T[j][i] * m[j];
            }
            a[i] = b;
        }
        return a;
    }

    multMatrixes(a, b) {
        const c = [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                let s = 0;
                for (let k = 0; k < 4; k++) {
                    s += a[i][k] * b[k][j];
                }
                c[i][j] = s;
            }
        }
        return c;
    }

    /***********************************************/

    /***********************************полигоны***********************************/
    calcDistance(figure, endPoint, name) {
        figure.polygons.forEach(polygon => {
            polygon[name] = Math.sqrt(
                Math.pow(endPoint.x - polygon.center.x, 2) +
                Math.pow(endPoint.y - polygon.center.y, 2) +
                Math.pow(endPoint.z - polygon.center.z, 2));
        });
    }

    sortByArtistAlgoritm(polygons) {
        polygons.sort((a, b) => b.distance - a.distance);
    }

    /******************************************************************************/

    /******************************************тени******************************************/
    //вычисляет центр полигона
    calcCenters(figure) {
        figure.polygons.forEach(polygon => {
            const points = polygon.points;
            let x = 0,
                y = 0,
                z = 0;
            for (let j = 0; j < points.length; j++) {
                x += figure.points[points[j]].x;
                y += figure.points[points[j]].y;
                z += figure.points[points[j]].z;
            };
            polygon.center.x = x / points.length;
            polygon.center.y = y / points.length;
            polygon.center.z = z / points.length;
        });
    }

    //вычисляет радиус полигона
    calcRadius(figure) {
        const points = figure.points;
        figure.polygons.forEach(polygon => {
            const center = polygon.center;
            //точки полигона1
            const p1 = points[polygon.points[0]];
            const p2 = points[polygon.points[1]];
            const p3 = points[polygon.points[2]];
            const p4 = points[polygon.points[3]];
            //примерный радиус полигона1
            polygon.R = (
                this.calcVectorModule(this.calcVector(center, p1)) +
                this.calcVectorModule(this.calcVector(center, p2)) +
                this.calcVectorModule(this.calcVector(center, p3)) +
                this.calcVectorModule(this.calcVector(center, p4))
            ) / 4;
        });
    }

    //закрашивает полигоны в тени
    calcShadow(polygon, figures, LIGHT) {
        //центр полигона1
        const M1 = polygon.center;
        //радиус полигона1
        const r = polygon.R;
        //вектор от полигона1 до точки освещения
        const s = this.calcVector(M1, LIGHT);
        for (let i = 0; i < figures.length; i++) {
            for (let j = 0; j < figures[i].polygons.length; j++) {
                const polygon2 = figures[i].polygons[j];
                //центр полигона2
                const M0 = polygon2.center;
                if (M1.x === M0.x &&
                    M1.y === M0.y &&
                    M1.z === M0.z) {
                    continue;
                }
                if (polygon2.lumen > polygon.lumen) {
                    continue;
                }
                const dark =
                    this.calcVectorModule(
                        this.vectorProd(
                            this.calcVector(M0, M1),
                            s
                        )
                    ) /
                    this.calcVectorModule(s);
                if (dark < r) {
                    return {
                        isShadow: true,
                        dark: dark / 3
                    }
                }
            }
        }
        return {
            isShadow: false
        }
    }

    /****************************************************************************************/

    //свет и тени
    calcIllumination(distance, lumen) {
        const res = distance ? lumen / Math.pow(distance, 3) : 1;
        return res > 1 ? 1 : res;
    }

    /*************анимация солнечной системы*************/
    animateMatrix(dx, dy, dz, method, value) {
        return [
            this.move(dx, dy, dz),
            this[method](value),
            this.move(-dx, -dy, -dz)
        ].reduce(
            (S, matrix) => this.multMatrixes(S, matrix),
            this.one()
        );
    }

    one() {
        return [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ];
    }

    /****************************************************/

    /*****************************отвязка камеры*****************************/
    //уравнение плоскости и запись его в структуру
    calcPlaneEquation(point1, point2) {
        const vector = this.calcVector(point1, point2);
        this.plane.A = vector.x;
        this.plane.B = vector.y;
        this.plane.C = vector.z;
        this.plane.x0 = point2.x;
        this.plane.y0 = point2.y;
        this.plane.z0 = point2.z;
        this.plane.xs0 = point1.x;
        this.plane.ys0 = point1.y;
        this.plane.zs0 = point1.z;
    }

    //рассчет проекций точек на плоскость
    getProection(point) {
        const { A, B, C, x0, y0, z0, xs0, ys0, zs0 } = this.plane;
        const m = point.x - xs0;
        const n = point.y - ys0;
        const p = point.z - zs0;
        const t = (A * (x0 - xs0) + B * (y0 - ys0) + C * (z0 - zs0)) / (A * m + B * n + C * p);
        const ps = {
            x: x0 + m * t,
            y: y0 + n * t,
            z: z0 + p * t
        }
        const M = {
            x: ps.x - A,
            y: ps.y - B,
            z: ps.z - C
        }
        const P2M = this.calcVector(this.WIN.P2, M);
        const cosa = this.calcCorner(this.P2P3, P2M);
        const cosb = this.calcCorner(this.P1P2, P2M);
        const module = this.calcVectorModule(P2M);
        return {
            x: cosa * module,
            y: cosb * module
        };
    }

    calcWinVectors() {
        this.P1P2 = this.calcVector(this.WIN.P2, this.WIN.P1);
        this.P2P3 = this.calcVector(this.WIN.P2, this.WIN.P3);
    }

    /************************************************************************/

    /************************************сраная математика************************************/
    //вектор между 2 точками
    calcVector(a, b) {
        return {
            x: b.x - a.x,
            y: b.y - a.y,
            z: b.z - a.z
        }
    }

    //векторное произведение векторов
    vectorProd(a, b) {
        return {
            x: a.y * b.z - a.z * b.y,
            y: -a.x * b.z + a.z * b.x,
            z: a.x * b.y - a.y * b.x
        }
    }

    //скалярное произведение векторов
    scalProd(a, b) {
        return a.x * b.x + a.y * b.y + a.z * b.z;
    }

    //длина вектора
    calcVectorModule(a) {
        return Math.sqrt(Math.pow(a.x, 2) + Math.pow(a.y, 2) + Math.pow(a.z, 2));
    }

    //угол между 2 векторами
    calcCorner(a, b) {
        return this.scalProd(a, b) /
            (Math.sqrt(this.scalProd(a, a)) * (Math.sqrt(this.scalProd(b, b))));
    }

    //проверка на нулевой вектор
    isVectorZero(vector) {
        return !vector.x && !vector.y && !vector.z;
    }

    //умножение координат 2 векторов
    vectorMult(a, b) {
        return {
            x: a.x * b.x * 5,
            y: a.y * b.y * 5,
            z: a.z * b.z * 5
        }
    }

    //сложение координат 2 векторов
    vectorSum(a, b) {
        return {
            x: a.x + b.x,
            y: a.y + b.y,
            z: a.z + b.z
        }
    }

    /*****************************************************************************************/

}

export default Canvas3D;