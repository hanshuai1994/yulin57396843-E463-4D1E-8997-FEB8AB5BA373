/**
 * @name 以mesh的name作为材质的name
 * @param {*} material 
 * @param {*} mesh 
 */
const addMaterialName = (material, mesh) => {
    let str_arr = mesh.name.split('_');
    let new_name = 'mesh_' + str_arr[0];
    material.name = new_name;
}

/**
 * @name 统一材质
 * @param {array} material_lib 材质库
 * @param {array | object} mesh 匹配的 mesh
 */
const unifyMaterial = (material_lib, mesh) => {
    const mesh_materials = mesh.material;

    if (Array.isArray(mesh_materials)) { // 若有多个材质
        const length = mesh_materials.length;
        outer:
            for (let i = 0; i < length; i++) { // 遍历自身的材质
                // 材质没有名字时，为材质附加mesh的名字
                if (mesh_materials[i].name == '') {
                    addMaterialName(mesh_materials[i], mesh);
                }

                for (const material of material_lib) { // 遍历材质库内的材质
                    if (mesh_materials[i].name == material.name) { // 当在材质库中找到相等的材质时
                        mesh_materials[i] = material; // 替换为材质库内的材质
                        continue outer // 调到下一次循环
                    }
                }
                material_lib.push(mesh_materials[i]); // 在材质库中未找到，则放入材质库
            }
    } else {
        let has_material = false;

        // 材质没有名字时，为材质附加mesh的名字
        if (mesh_materials.name == '') {
            addMaterialName(mesh_materials, mesh);
        }

        for (const material of material_lib) { // 遍历材质库内的材质
            if (mesh_materials.name == material.name) { // 当在材质库中找到相等的材质时
                mesh.material = material; // 替换为材质库内的材质
                has_material = true; // 标记已找到
                break;
            }
        }

        if (!has_material) {
            material_lib.push(mesh_materials); // 在材质库中未找到，则放入材质库
        }
    }
}

/**
 * @name  在group内新建 mesh 组与线框组，并将 mesh 添加到 mesh 组，新建线框添加到线框组
 * @param {*} group 目标容器
 * @param {*} meshes 将要被分配的 meshes
 * @param {*} line_material 线框的材质
 * @param {*} material_lib 融合材质库
 */
const divideGroup = (group, meshes, line_material, material_lib) => {
    const mesh_group = new THREE.Group();
    mesh_group.name = 'mesh组';

    const edge_group = new THREE.Group();
    edge_group.name = '线框组';

    group.add(mesh_group, edge_group);

    for (const mesh of meshes) {
        if (mesh instanceof THREE.Mesh) {
            mesh_group.add(mesh);

            if (!mesh.name.includes('窗')) {
                mesh.castShadow = true;
                mesh.receiveShadow = true;
            }
            correctUv(mesh);

            const geometry = new THREE.EdgesGeometry(mesh.geometry, 30);
            mesh.updateMatrixWorld();
            geometry.applyMatrix(mesh.matrixWorld);
            const wireframe = new THREE.LineSegments(geometry, line_material);
            unifyMaterial(material_lib, wireframe);
            edge_group.add(wireframe);
        }
    }
}

/**
 * @name 楼层划分
 * @param {*} build 楼栋 group
 * @param {string} build_name 楼栋名称
 * @param {array} material_lib_box  box 材质库
 * @param {array} material_lib_clip clip 材质库
 */
const getDividedFloor = (build, build_name, material_lib_box, progress) => {
    // 用于区分楼层的预设高度
    const preHeight = [0.00, 4.50, 9.00, 11.50]

    const result = new THREE.Group();
    result.name = build_name;

    // 将一栋楼的模型分为 clip 切割与 box 划分两个部分
    const objects = {
        clip: [],
        box: [],
        floor: [],
    }

    for (const mesh of build.children) {
        // 遍历获取所有 mesh
        if (mesh instanceof THREE.Mesh && mesh.geometry) {
            objects.box.push(mesh);
            unifyMaterial(material_lib_box, mesh);
        }
    }

    const floor_offset = build_name == '连廊' ? 300 : 120;
    outer:
        for (const mesh of objects.box) { // 遍历 box 组的所有 mesh
            progress.divided++;
            const range = `${parseInt((progress.divided / progress.all * 100))}%`
            $('#loading>.progress.handle>.progress-bar').css('width', range).text(range);
            
            const box3 = new THREE.Box3().expandByObject(mesh);
            const center = box3.getCenter(new THREE.Vector3());

            const length = preHeight.length;
            for (let i = 0; i < length - 1; i++) {

                if (!build_data[build_name][i]) {
                    build_data[build_name][i] = {
                        floorName: `${i + 1}楼`,
                        rooms: [],
                    }
                }

                if (!objects.floor[i]) {
                    objects.floor[i] = [];
                }

                const floor_height = preHeight[i] * 1000 - floor_offset;
                const next_height = preHeight[i + 1] * 1000 - floor_offset;

                if (center.y >= floor_height && center.y < next_height) {
                    objects.floor[i].push(mesh);
                    continue outer;
                }
            }

            if (!objects.floor[length - 1]) {
                objects.floor[length - 1] = [];
            }
            objects.floor[length - 1].push(mesh);
        }


    // 楼层组
    const floor_group = new THREE.Group();
    floor_group.name = '楼层组';
    result.add(floor_group);

    // let line_material = new THREE.LineBasicMaterial({
    //     color: 0x0d0d0d,
    //     transparent: true,
    //     opacity: 0.3
    // });
    // line_material.name = '附加线框材质_box';

    // 将每一层添加进楼层组
    for (let i = 0; i < objects.floor.length; i++) {
        // const floor = new THREE.Group();
        // floor.name = i + 1 + '楼';
        // floor_group.add(floor);

        const merge_result = merge_obj_children(objects.floor[i]);
        // console.log('merge_result', merge_result);
        merge_result.name = i + 1 + '楼';
        floor_group.add(merge_result);

        // divideGroup(floor, objects.floor[i], line_material, material_lib_box);
    }

    // clip组
    // const clip_group = new THREE.Group();
    // clip_group.name = 'clip组';
    // result.add(clip_group);

    // line_material = new THREE.LineBasicMaterial({
    //     color: 0x0d0d0d,
    //     transparent: true,
    //     opacity: 0.3
    // });
    // line_material.name = '附加线框材质_clip';

    // divideGroup(clip_group, objects.clip, line_material);

    return result
}


const analysisRevit = (paths, callback) => {
    // let builds = [];
    let builds = {};

    // const loader = new THREE.ObjectLoader();
    const loader = new THREE.FBXLoader();
    const promises = [];

    let total = 0;
    let loaded_map = {};
    // return

    // 使用 promise 进行多个异步处理
    let length = paths.length;
    for (let i = 0; i < length; i++) {
        const path = paths[i];
        const promise = new Promise(function (resolve, reject) {
            loader.load(
                path,
                function (object) { // onLoad
                    builds[path] = object;
                    // builds.push(object);
                    resolve(object.children);
                },
                (xhr) => { // onProgress
                    const loaded_keys = Object.keys(loaded_map);

                    loaded_map[path] = xhr.loaded;
                    if (loaded_keys.length == length) { // 全部含有数据时
                        let loaded_all = 0;

                        for (const key of loaded_keys) {
                            loaded_all += loaded_map[key];
                        }

                        let rate = loaded_all / total;
                        if (rate > 0.85) {
                            $('#loading>.text').text('处理中...');
                            $('#loading>img').attr('src', './img/loading2.gif')

                            $('#loading>.progress.load').hide();
                            $('#loading>.progress.handle').show();
                        } else {
                            rate += 0.15;
                            const range = `${parseInt(( rate * 100))}%`;
                            $('#loading>.progress.load>.progress-bar').css('width', range).text(range);
                        }
                    } else {
                        total += xhr.total;
                    }
                }
            )
        })
        promises.push(promise);
    }

    // 异步全部结束后对获取的楼进行处理
    Promise.all(promises).then(function (posts) {
        let count = 0;
        for (const array of posts) {
            const length = array.length;
            count += length;
        }

        const progress = {
            all: count - 1,
            divided: 0,
            merged: 0,
        }

        const group = new THREE.Group();
        group.name = '模型整体';

        const material_lib_box = [];

        for (const key in builds) {
            if (builds.hasOwnProperty(key)) {
                const build = builds[key];

                let build_name = '地面';
                if (key.includes("west")) {
                    build_name = "西楼";
                } else if (key.includes("lianlang")) {
                    build_name = "连廊";
                } else if (key.includes("east")) {
                    build_name = "东楼";
                }


                if (build_name == '地面') { // 地面
                    build.name = build_name;
                    build.children[0].receiveShadow = true;
                    // build.children[0].scale.set(2, 2, 1);
                    group.add(build);
                } else {
                    const result = getDividedFloor(build, build_name, material_lib_box, progress);
                    group.add(result);
                }
            }
        }

        console.log('group', group);

        callback(group, material_lib_box);
    })
}

// 下载模型
function downloadGLTF(model, fileName) {
    var link = document.createElement('a');
    link.style.display = 'none';
    document.body.appendChild(link);


    const exporter = new THREE.GLTFExporter();

    exporter.parse(model, (result) => {

        let blob;

        if (result instanceof ArrayBuffer) {
            blob = new Blob([result], {
                type: 'application/octet-stream'
            })
            link.download = fileName + '.glb';
        } else {
            const text = JSON.stringify(result);

            blob = new Blob([text], {
                type: 'text/plain'
            })

            link.download = fileName + '.gltf';
        }

        link.href = URL.createObjectURL(blob);

        link.click();
    }, {
        binary: true
    })
}

function downloadOBJ(model, fileName) {
    var link = document.createElement('a');
    link.style.display = 'none';
    document.body.appendChild(link);
    link.download = fileName + '.obj';

    const exporter = new THREE.OBJExporter();

    const result = exporter.parse(model);
    const text = JSON.stringify(result);

    const blob = new Blob([text], {
        type: 'text/plain'
    })

    link.href = URL.createObjectURL(blob);

    link.click();
}