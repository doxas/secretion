// geometory

/* tiledPlanePoint
 * @param {number} res - resolution
 * @return {object}
 *  {vec3} position,
 *  {vec2} texCoord,
 *  {vec4} type
 */
function tiledPlanePoint(res){
    var i, j, k, l, m;
    var s, c;
    var x, y, z;
    var pos = [];
    var tex = [];
    var type = [];
    for(i = 0; i <= res; ++i){
        k = (i / res * 2.0 - 1.0);
        m = 1.0 - i / res;
        for(j = 0; j <= res; ++j){
            l = (j / res * 2.0 - 1.0);
            pos.push(l, k, 0.0);
            tex.push(j / res, m);
            type.push(0.0, 0.0, 0.0, 1.0);
        }
    }
    return {
        position: pos,
        texCoord: tex,
        type: type
    };
}

