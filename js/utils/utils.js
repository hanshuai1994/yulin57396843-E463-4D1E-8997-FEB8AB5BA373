// 融合材质
function merge_obj_children(array) { //merge外部导入模型的同材质到一个数组
    var material_array = [];
    var geometry_array = [];
    const name_array = [];

    for (const object of array) { // 遍历所有object
        const geometry = object.geometry;
        const material = object.material;

        const new_geometry = new THREE.BufferGeometry().fromGeometry(geometry);

        var index = material_array.indexOf(material); // 进行一次基于指针的存在判断
        if (index == -1) {
            material_array.push(material);
            geometry_array.push([new_geometry]);
        } else { // 已经出现过的材质
            geometry_array[index].push(new_geometry);
        }
    }


    //开始进行合并
    for (var i = 0; i < geometry_array.length; i++) {
        geometry_array[i] = THREE.BufferGeometryUtils.mergeBufferGeometries(geometry_array[i]);
    }

    //合并完成，进行分组
    const group = new THREE.Group();

    const group_mesh = new THREE.Group();
    group_mesh.name = '融合后的mesh'

    const group_edge = new THREE.Group();
    group_edge.name = '融合后的线框'

    group.add(group_mesh, group_edge);

    for (var i = 0; i < geometry_array.length; i++) {
        const mesh = new THREE.Mesh(geometry_array[i], material_array[i]);
        var geo = new THREE.EdgesGeometry(geometry_array[i], 30); // or WireframeGeometry( geometry )
        var mat = new THREE.LineBasicMaterial({
            color: 0x0d0d0d,
            transparent: true,
            opacity: 0.3
        });
        var wireframe = new THREE.LineSegments(geo, mat);
        group_mesh.add(mesh);
        group_edge.add(wireframe);

    }

    return group;
}

/**
 * @name 修正uv
 * @param {*} mesh 
 */
const correctUv = (mesh) => {
    let g = mesh.geometry;

    // 抽离出旋转矩阵
    const matrix = new THREE.Matrix4();
    mesh.updateMatrixWorld();
    matrix.extractRotation(mesh.matrixWorld);

    // 对顶点进行旋转矩阵变换，并将旋转归零
    g.applyMatrix(matrix);
    mesh.rotation.set(0, 0, 0);


    if (!g.faceVertexUvs) {
        g = new THREE.Geometry().fromBufferGeometry(g)
    }

    // console.log(g)
    g.computeBoundingBox();
    var box = g.boundingBox;
    var detaX = box.max.x - box.min.x;
    var detaY = box.max.y - box.min.y;
    var detaZ = box.max.z - box.min.z;

    let shortest;
    if (detaZ < detaX && detaZ < detaY)
        shortest = 'z'
    if (detaY < detaX && detaY < detaZ)
        shortest = 'y'
    if (detaX < detaZ && detaX < detaY)
        shortest = 'x'

    var faceLength = g.faces.length; //面数
    var v = g.vertices; //顶点数组
    //核心部分，修正uv坐标
    g.faceVertexUvs = [
        []
    ]

    const imageSize = 300;

    for (var i = 0; i < faceLength; i++) { //遍历每个面
        for (var z = 0; z < 3; z++) { //三角形
            var a = "";
            if (z == 0) a = "a";
            if (z == 1) a = "b";
            if (z == 2) a = "c";

            g.faceVertexUvs[0].push([
                new THREE.Vector2(), 
                new THREE.Vector2(),
                new THREE.Vector2()
            ])
            switch (shortest) {
                case 'x':
                    g.faceVertexUvs[0][i][z].x = (v[g.faces[i][a]].z - box.min.z) / imageSize;
                    // g.faceVertexUvs[0][i][z].y = 1 - ((v[g.faces[i][a]].z - box.min.z) / (detaZ));
                    g.faceVertexUvs[0][i][z].y = 1 - ((v[g.faces[i][a]].y - box.min.y) / imageSize);
                    break;
                // case 'y':
                //     g.faceVertexUvs[0][i][z].x = (v[g.faces[i][a]].x - box.min.x) / (detaX);
                //     g.faceVertexUvs[0][i][z].y = 1 - ((v[g.faces[i][a]].z - box.min.z) / (detaZ));
                //     break;
                default:
                    console.log()
                    g.faceVertexUvs[0][i][z].x = (v[g.faces[i][a]].x - box.min.x) / imageSize;
                    g.faceVertexUvs[0][i][z].y = 1 - ((v[g.faces[i][a]].y - box.min.y) / imageSize);

            }
        }
    }
    g.uvsNeedUpdate = true;
    g.needsUpdate = true;
    mesh.geometry = g;
}

// 补全时间
const fixTime = (num) => {
    if (num < 10) {
        return '0' + num
    } else {
        return num
    }
}

// 根据距离1970的时间数字获得日期时间字符串
const getDateByTime = (time, onlyDate) => {
    let new_time = new Date();
    new_time.setTime(time);

    let year = new_time.getFullYear();
    let month = new_time.getMonth();
    let day = new_time.getDate();
    let hour = new_time.getHours();
    let minute = new_time.getMinutes();
    let second = new_time.getSeconds();

    hour = fixTime(hour);
    minute = fixTime(minute);
    second = fixTime(second);

    let result = `${year}-${month}-${day} ${hour}:${minute}:${second}`;

    if (onlyDate) {
        result = `${year}-${month}-${day}`;
    }

    return result
}