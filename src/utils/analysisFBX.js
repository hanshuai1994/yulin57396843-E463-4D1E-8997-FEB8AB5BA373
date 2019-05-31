// import * as THREE from "three";
import FBXLoader from '../loaders/FBXLoader';

const loader = new FBXLoader();

const loadModel = (path, builds_map, length, index) => {
    const key = path.substr(9, 2);
    const name = path.split('.')[1].split('/')[2];
    const floor = name.slice(2);

    return new Promise(function (resolve, reject) {
        $('#loading>.text').text(`正在加载 ${name}`);

        loader.load(
            path, // path
            object => { // onLoad
                const range = `${parseInt((index / length * 100))}%`
                $('#loading>.progress-range').text(range);
                $('#loading>.progress-wrap>.progress-box').eq(index).addClass('active');
                object.name = floor;
                builds_map[key].add(object);
                resolve(object);

                object.traverse(function(obj) {
                    if (obj instanceof THREE.Mesh && obj.geometry) {
                        // 缩放部分结构，避免闪烁
                        // if (
                        //     obj.name.includes('ZJKJ_结构柱_矩形_C30_') ||
                        //     obj.name.includes('ZJKJ_结构梁_矩形_C30_') ||
                        //     obj.name.includes('ZJKJ_结构柱_异型__C30_') ||
                        //     obj.name.includes('Floor_ZJKJ_楼地面_钢筋混凝土') ||
                        //     obj.name.includes('Basic_Roof_住建局_-_150mm-平屋顶')
                        // ) {
                        //     obj.scale.set(0.99, 0.99, 0.99);
                        // }

                        if (!obj.name.includes('窗')) {
                            obj.castShadow = true;
                            obj.receiveShadow = true;
                        }

                        const line_material = new THREE.LineBasicMaterial({
                            color: 0x0d0d0d,
                            transparent: true,
                            opacity: 0.2,
                        });
                        line_material.name = '附加线框材质_box';
                        const geometry = new THREE.EdgesGeometry(obj.geometry, 30);
                        const wireframe = new THREE.LineSegments(geometry, line_material);
                        obj.add(wireframe);
                    }
                })
                
            },
            xhr => {
                // const range = `${parseInt((xhr.loaded / xhr.total * 100))}%`
                // $('#loading>.progress-wrap>.progress-box').eq(index).find('>.range').text(range);
            },// onProgress
            error => { // onError
                console.log('error', error);
                reject(error);
            }
        )
    })
}

// 
const analysisFBX = (paths, builds_map, callback) => {
    let promise = Promise.resolve();

    let length = paths.length;
    for (let i = 0; i < length; i++) {
        const box = `<span class="progress-box"></span>`
        $('#loading>.progress-wrap').append(box);

        const path = paths[i];
        
        promise = promise.then(function () {
            return loadModel(path, builds_map, length, i);
        })

    }

    promise.then(function () {
        callback();
    })
}

export default analysisFBX;
