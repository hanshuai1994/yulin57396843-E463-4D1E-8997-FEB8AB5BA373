import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min.js';

import './less/index.less';

// 基础构件
// import echarts from 'echarts';
import * as THREE from "three";
import TWEEN from '@tweenjs/tween.js';
// import laydate from './laydate/laydate';
import FBXLoader from './loaders/FBXLoader';
import OrbitControls from 'three-orbitcontrols';

// 数据信息
// import { electricMeter, waterMeter } from "./data/meterMap";
// import { selectAllYunweiData, updateYunweiData, deleteYunweiData, addYunweiData } from "./api/yunweiData";

// 补充方法
// import importDom from './api/importDom';
// import analysisRevit from './utils/analysisRevit';
import analysisFBX from './utils/analysisFBX';
// import { getDateByTime, getWeekIndexOfYear, replaceData } from './utils/utils';
import { createFloorList, createRoomList } from './component/domTemplate';



$(function () {
    // ####################### 定义 #######################
    // ======================= 定义变量 =======================
    var camera, scene, renderer, idM;
    var controls;
    let ambient, directional, pointLight;
    let container;

    let mousedown_point;
    let mouseup_point;

    let position_m = undefined; // 存储的外侧相机位置
    let target_m = undefined; // 存储的外侧控制器 target

    let selected_room = undefined; // 已选中的房间地板

    const raycaster = new THREE.Raycaster(); //射线
    const mouse = new THREE.Vector2(); //鼠标位置

    const scale_rate = 0.001;

    // 楼栋名称
    const builds = ['西楼', '连廊', '东楼'];

    // 建筑索引
    const builds_map = {};

    // merge 后的建筑组索引
    const merge_builds = {};

    // 房间划分
    const room_mesh_map = {};

    // 建筑楼层、房间信息
    const build_data = {};

    // 楼栋切换栏
    const $build_tab = $('#container>.select-wrap>.build-tab');

    // 对应赋值
    for (let i = 0; i < builds.length; i++) {
        const buildName = builds[i];
        builds_map[buildName] = undefined;
        merge_builds[buildName] = undefined;

        room_mesh_map[buildName] = [];
        build_data[buildName] = [
            { floorName: `1楼` },
            { floorName: `2楼` },
            // { floorName: `屋顶` },
        ];

        $build_tab.append(`<span class="active" data-name=${buildName}>${buildName}</span>`)
    }



    // 所有运维数据
    let allOperateData;


    let saveCallback; // 确认框的保存回调
    let continueCallback; // 确认框的继续回调

    // ======================= 日期时间 =======================
    // laydate.set({
    //     type: 'datetime',
    //     isInitValue: false,
    //     btns: ['clear', 'confirm'],
    //     theme: '#324157',
    //     calendar: true,
    // })

    // 首页左栏日历
    // laydate.render({
    //     elem: '#tab-home .operate-wrap>.wrap-left>.top-area>.calendar',
    //     done: function (value, date) {
    //         // console.log('value', value);
    //         // console.log('date', date);
    //         const data_time = Date.parse(value);
    //         $(this.elem).attr('data-time', data_time);

    //         const $operate_wrap = $('#container>.operate-mask>.operate-wrap');
    //         const $select_wrap = $('#container>.select-wrap');
    //         const $build_tab = $select_wrap.find('.build-tab');
    //         const $floor_switch = $select_wrap.find('.floor-switch');
    //         const $room_switch = $select_wrap.find('.room-switch');

    //         const build = $build_tab.find('>span.active').attr('data-name');
    //         const floor = Number($floor_switch.find('>.floor-text').attr('data-index'));
    //         const room = $room_switch.find('>.room-text').attr('data-index');

    //         if (date.year) {
    //             // 执行修改命令
    //             update_oper_list($operate_wrap, false, data_time, build, floor, room);
    //         } else {
    //             // 执行清空命令
    //             update_oper_list($operate_wrap, false, 'all', build, floor, room);
    //         }
    //         // console.log('this.elem', this.elem);
    //     }
    // });

    // 首页右栏日历
    // laydate.render({
    //     elem: '#tab-home .operate-wrap>.wrap-right>.edit-area>.time>.calendar',
    //     done: function (value, date) {
    //         // console.log('value', value);
    //         // console.log('date', date);
    //         const data_time = Date.parse(value);
    //         $(this.elem).attr('data-time', data_time);

    //         if (date.year) {
    //             // 执行修改命令
    //         } else {
    //             // 执行清空命令
    //         }
    //         // console.log('this.elem', this.elem);
    //     }
    // })

    // 管理页左栏日历
    // laydate.render({
    //     elem: '#tab-manage .operate-wrap>.wrap-left>.top-area>.calendar',
    //     done: function (value, date) {
    //         // console.log('value', value);
    //         // console.log('date', date);
    //         const data_time = Date.parse(value);
    //         $(this.elem).attr('data-time', data_time);

    //         const $operate_wrap = $(this.elem).parents('.operate-wrap');
    //         const $operate_menu = $operate_wrap.siblings('.operate-menu');
    //         const build = $operate_menu.find('>.build-tab>span.active').attr('data-name');
    //         const floor = $operate_menu.find('>.floor-switch>.floor-text').attr('data-index');
    //         const room = $operate_menu.find('>.room-switch>.room-text').attr('data-index');

    //         const hasName = room == 'all' ? true : false;

    //         if (date.year) {
    //             // 执行修改命令
    //             update_oper_list($operate_wrap, hasName, data_time, build, floor, room);
    //         } else {
    //             // 执行清空命令
    //             update_oper_list($operate_wrap, hasName, 'all', build, floor, room);
    //         }
    //         // console.log('this.elem', this.elem);
    //     }
    // })

    // 管理页右栏日历
    // laydate.render({
    //     elem: '#tab-manage .operate-wrap>.wrap-right>.edit-area>.time>.calendar',
    //     done: function (value, date) {
    //         // console.log('value', value);
    //         // console.log('date', date);
    //         const data_time = Date.parse(value);
    //         $(this.elem).attr('data-time', data_time);

    //         if (date.year) {
    //             // 执行修改命令
    //         } else {
    //             // 执行清空命令
    //         }
    //     }
    // })

    // ======================= 触发函数 =======================
    /**
     * @name 相机移动至目标
     * @param {*} start 起点指针
     * @param {*} end 终点位置
     * @param {boolean} instant 是否瞬间移动到
     */
    const walkToTarget = (start, end, instant = false) => {
        const {
            position,
            target
        } = start;

        const {
            new_position,
            new_target
        } = end;

        // 计算控制器相机移动距离和控制器 target 移动距离
        const distance_p = new_position.distanceTo(position);
        const distance_t = new_target.distanceTo(target);

        // 获取控制器相机移动距离和控制器 target 移动距离中更大的那个
        let max_distance = distance_p;
        if (distance_p < distance_t) {
            max_distance = distance_t
        }

        // 计算移动时间
        let time = max_distance / 40 / scale_rate;
        if (time > 2000) {
            time = 2000;
        }

        if (instant) {
            position.copy(new_position);
            target.copy(new_target);
        } else {
            const tween_p = new TWEEN.Tween(position);
            tween_p.to(new_position, time).start();

            // 更新控制器target
            const tween_t = new TWEEN.Tween(target);
            tween_t.to(new_target, time).start();
        }
    };

    // 添加高亮
    // const addHightLight = (mesh) => {
    //     mesh.material.opacity = 1;
    //     selected_room = mesh;
    // }

    // 清除高亮
    // const clearHightLight = () => {
    //     if (selected_room) {
    //         selected_room.material.opacity = 0;
    //         selected_room = undefined;
    //     }
    // }

    /**
     * @name 视角移动到物体的右上角
     * @param {*} group 视角目标对象
     * @param {boolean} instant 是否瞬间切换到
     */
    const walkToObjects = (group, instant = false) => {
        let box3;

        // 获取控制器当前相机位置和 target
        const position = controls.object.position;
        const target = controls.target;

        if (Array.isArray(group)) { // 存在多个楼栋时
            for (const _group of group) {
                if (box3) {
                    box3 = box3.union(new THREE.Box3().expandByObject(_group));
                } else {
                    box3 = new THREE.Box3().expandByObject(_group);
                }
            }
        } else {
            box3 = new THREE.Box3().expandByObject(group);
        }

        // 计算包围盒对角线
        const diagonal = box3.max.distanceTo(box3.min);

        // 设定镜头目标
        const new_target = box3.getCenter(new THREE.Vector3());

        // 设定镜头位置
        const new_position = new THREE.Vector3();
        new_position.x = new_target.x + diagonal * 0.5;
        new_position.y = new_target.y + diagonal * 0.5;
        new_position.z = new_target.z + diagonal * 0.5;


        const start = {
            position,
            target,
        };

        const end = {
            new_position,
            new_target,
        }

        // 记录相机位置和 target
        if (!position_m) {
            position_m = new_position.clone();
            target_m = new_target.clone();
        }

        walkToTarget(start, end, instant)
    }

    // 视角移动到 room 上
    // const walkToRoom = (mesh) => {
    //     // 记录控制器当前相机位置和 target
    //     const position = controls.object.position;
    //     const target = controls.target;

    //     if (!position_m) {
    //         position_m = position.clone();
    //         target_m = target.clone();
    //     }

    //     // 清除地板高亮
    //     clearHightLight();

    //     // 显现底板mesh
    //     addHightLight(mesh);

    //     const box3 = new THREE.Box3();
    //     box3.expandByObject(mesh);

    //     // 移动后控制器的 target
    //     const new_target = box3.getCenter(new THREE.Vector3());

    //     // 计算相机位置指向target的方向
    //     const direction = new THREE.Vector3();
    //     direction.x = position.x - target.x;
    //     direction.y = position.y - target.y;
    //     direction.z = position.z - target.z;
    //     direction.normalize();

    //     const offset = 12000 * scale_rate; // 移动后 target 与相机的距离

    //     // 移动后的相机位置
    //     const new_position = new THREE.Vector3();
    //     new_position.x = direction.x * 1 + new_target.x;
    //     new_position.y = offset + new_target.y;
    //     new_position.z = direction.z * 1 + new_target.z;


    //     const start = {
    //         position,
    //         target
    //     };

    //     const end = {
    //         new_position,
    //         new_target
    //     }

    //     walkToTarget(start, end)
    // }

    // 创建房间地面的 mesh
    // const createRoomMesh = (roomData) => {
    //     const result = [];

    //     const {
    //         roomName,
    //         roomPoints,
    //         buildName,
    //         floorIndex,
    //     } = roomData;

    //     const scale = 304.8;

    //     for (const array of roomPoints) {
    //         const shape = new THREE.Shape();
    //         const length = array.length;

    //         for (let i = 0; i < length; i++) {
    //             const point = array[i];

    //             if (i == 0) {
    //                 shape.moveTo(point.X * scale, point.Y * scale);
    //             } else {
    //                 shape.lineTo(point.X * scale, point.Y * scale)
    //             }

    //         }
    //         const firstPoint = array[0];
    //         shape.lineTo(firstPoint.X * scale, firstPoint.Y * scale);

    //         const material = new THREE.MeshPhongMaterial({
    //             color: '#324157',
    //             transparent: true,
    //             opacity: 0,
    //         });
    //         const geometry = new THREE.ShapeGeometry(shape);

    //         const mesh = new THREE.Mesh(geometry, material);
    //         mesh.rotation.x = -Math.PI / 2;

    //         // mesh.position.y = firstPoint.Z * scale + 5;
    //         mesh.position.y = floor_heights[buildName][floorIndex] * 1000 + 250;
    //         if (buildName == '南楼') {
    //             if (roomName == '107' || roomName == '108') {
    //                 mesh.position.y += 200;
    //             }
    //         }

    //         mesh.name = '房间';
    //         mesh.roomName = roomName;
    //         mesh.buildName = buildName;
    //         mesh.floorIndex = floorIndex;

    //         result.push(mesh);
    //     }

    //     return result
    // }
    // 初始化 clip 的 constant 值
    // const initClipConstant = (plane_array, build) => {
    //     // clip 划分
    //     plane_array[0].constant = 50000; // 向下
    //     plane_array[1].constant = 10000; // 向上

    //     // 显示所有楼层
    //     for (const child of build.children) {
    //         if (child.name == '楼层组') {
    //             for (const floor of child.children) {
    //                 floor.visible = true;
    //             }
    //         }
    //     }
    // }

    // 选择一个房间时，dom 匹配
    // const dom_room_select = (roomName) => {
    //     const $build_tab = $('#container>.select-wrap>.build-tab');
    //     const $room_switch = $build_tab.siblings('.room-switch');

    //     const $room_item = $room_switch.find(`>.dropdown-menu>li>a[data-index=${roomName}]`);

    //     const room_text = $room_item.text();

    //     // 更新房间显示与下拉菜单
    //     $room_switch.find('>.room-text').text(room_text).attr('data-index', roomName);

    //     if (roomName == 'all') {
    //         // 隐藏运维按钮
    //         $('.operate-btn').hide();
    //         // 隐藏机电按钮
    //         $('.equipment-btn').hide();
    //         // 更新并显示空调与新风
    //         $('.air-system').hide();
    //         // 清除地板高亮
    //         clearHightLight();
    //     } else {
    //         // 显示运维按钮
    //         $('.operate-btn').show();
    //         // 显示机电按钮
    //         $('.equipment-btn').show();
    //         // 更新并显示空调与新风
    //         $('.air-system').show();
    //     }
    // }

    // 清空选择的房间时，dom 匹配
    // const dom_room_clear = () => {
    //     // 隐藏房间显示
    //     $('.select-wrap .room-switch').hide();

    //     // 隐藏运维按钮
    //     $('.operate-btn').hide();

    //     // 隐藏机电按钮
    //     $('.equipment-btn').hide();

    //     // 隐藏空调与新风
    //     $('.air-system').hide();

    //     // 清除地板高亮
    //     clearHightLight();
    // }

    // 更新首页楼层选择下拉菜单
    const update_home_floor_dom = () => {
        const $build_tab = $('#container>.select-wrap>.build-tab');
        const $floor_switch = $build_tab.siblings('.floor-switch');

        const $active_build = $build_tab.find('>span.active');

        let floors = [];

        if ($active_build.length == 1) {
            const active_build_name = $active_build.attr('data-name');
            floors = build_data[active_build_name];
        }

        const firstData = {
            index: 'all',
            floorName: '全景'
        }
        const floors_dom = createFloorList(floors, firstData);

        $floor_switch.find('>.floor-text').text(firstData.floorName).attr('data-index', firstData.index);
        $floor_switch.find('>.dropdown-menu').html(floors_dom);

    }

    // 更新首页房间选择下拉菜单
    const update_home_room_dom = ($build_tab, $floor_switch, $room_switch) => {
        const $active_build = $build_tab.find('>span.active');

        const active_build_name = $active_build.attr('data-name');
        const active_floor_index = $floor_switch.find('>.floor-text').attr('data-index');
        const active_floors = build_data[active_build_name];

        const rooms = active_floors[active_floor_index].rooms;

        const rooms_dom = createRoomList(rooms, true, '室');
        $room_switch.find('>.room-text').text('所有房间').attr('data-index', 'all');
        $room_switch.find('>.dropdown-menu').html(rooms_dom);
    }

    // 显示首页房间选择下拉菜单
    const show_home_room_dom = () => {
        const $build_tab = $('#container>.select-wrap>.build-tab');
        const $floor_switch = $build_tab.siblings('.floor-switch');
        const $room_switch = $build_tab.siblings('.room-switch');

        // 更新下拉菜单
        update_home_room_dom($build_tab, $floor_switch, $room_switch);

        // 下拉菜单显示
        $room_switch.show();
    }

    // 选择运维单项时
    // const dom_oper_item_select = (element) => {
    //     const id = $(element).attr('data-id');

    //     const $wrap_left = $(element).parents('.wrap-left');
    //     const $wrap_right = $wrap_left.siblings('.wrap-right');

    //     const $view_area = $wrap_right.find('.view-area');
    //     const $edit_area = $wrap_right.find('.edit-area');

    //     $view_area.show();
    //     $edit_area.hide();

    //     $(element).addClass('active').siblings().removeClass('active');

    //     let this_data;
    //     for (const data of allOperateData) {
    //         if (data.id == id) {
    //             this_data = data;
    //             dom_update_oper_view($view_area, this_data);
    //             break;
    //         }
    //     }
    // }

    // 删除运维单项时
    // const dom_oper_item_delete = ($element) => {
    //     const $content = $element.parent();
    //     $element.remove();

    //     dom_oper_item_select($content.children()[0]);
    // }

    // 更新运维展示界面信息
    // const dom_update_oper_view = ($view_area, data) => {
    //     const {
    //         build,
    //         floor,
    //         room,
    //         title,
    //         time,
    //         state,
    //         content,
    //     } = data

    //     $view_area.find('>.room>.text').text(`${build}-${floor + 1}楼-${room}`); // 更新房间
    //     $view_area.find('>.title>.text').text(title); // 更新标题
    //     $view_area.find('>.time>.text').text(getDateByTime(time)); // 更新时间
    //     $view_area.find(`>.state>.text`).attr('data-state', state); // 更新状态
    //     $view_area.find('>.content>textarea').val(content); // 更新内容
    // }

    // 获取运维编辑界面信息
    // const get_oper_edit_data = ($edit_area) => {
    //     const $tab_pane = $edit_area.parents('.tab-pane');

    //     let build, floor, room;
    //     if ($tab_pane.attr('id') == 'tab-home') {
    //         const $select_wrap = $('#container>.select-wrap');
    //         const $build_tab = $select_wrap.find('>.build-tab');
    //         const $floor_switch = $select_wrap.find('>.floor-switch');
    //         const $room_switch = $select_wrap.find('>.room-switch');

    //         build = $build_tab.find('>span.active').attr('data-name');
    //         floor = Number($floor_switch.find('>.floor-text').attr('data-index'));
    //         room = $room_switch.find('>.room-text').attr('data-index');
    //     } else {
    //         build = $edit_area.parents('.operate-wrap').siblings('.operate-menu').find('>.build-tab>span.active').attr('data-name');
    //         floor = Number($edit_area.find('.floor-text').attr('data-index'));
    //         room = $edit_area.find('.room-text').attr('data-index');
    //     }

    //     const title = $edit_area.find('>.title>input').val();
    //     const time = $edit_area.find('>.time>.calendar').attr('data-time');
    //     const state = $edit_area.find('>.state>.radio-box>span.selected').attr('data-state');
    //     const content = $edit_area.find('>.content>textarea').val();

    //     return {
    //         build,
    //         floor,
    //         room,
    //         title,
    //         time,
    //         state,
    //         content,
    //     }
    // }

    // 更新楼层下拉菜单
    const update_floor_switch = ($floor_switch, active_build_name) => {
        if ($floor_switch.length > 0) {
            const floors = build_data[active_build_name];

            const floors_dom = createFloorList(floors);
            $floor_switch.find('>.dropdown-menu').html(floors_dom);
        }
    }

    // 更新房间下拉菜单
    const update_room_switch = ($room_switch, active_build_name, active_floor_index) => {
        if ($room_switch.length > 0) {
            const rooms = build_data[active_build_name][active_floor_index].rooms;

            const rooms_dom = createRoomList(rooms, false, '');
            $room_switch.find('>.dropdown-menu').html(rooms_dom);
        }
    }

    // 更新运维编辑界面信息
    // const update_oper_edit_dom = ($edit_area, data) => {
    //     const {
    //         title,
    //         time,
    //         state,
    //         floor,
    //         room,
    //         content
    //     } = data

    //     // 更新标题
    //     $edit_area.find('>.title>input').val(title);

    //     // 清空时间/设置为当前时间
    //     laydate.render({
    //         elem: $edit_area.find('>.time>.calendar')[0],
    //         value: getDateByTime(time),
    //     });
    //     $edit_area.find('>.time>.calendar').attr('data-time', time);

    //     const $floor_switch = $edit_area.find('>.room>.room-area .floor-switch');
    //     const $floor_text = $floor_switch.find('>.floor-text');
    //     const $room_switch = $edit_area.find('>.room>.room-area .room-switch');
    //     const $room_text = $room_switch.find('>.room-text');

    //     // 更新编辑页的楼层选择下拉菜单
    //     const active_build_name = $('#tab-manage>.operate-menu>.build-tab>span.active').attr('data-name');
    //     update_floor_switch($floor_switch, active_build_name);

    //     if (floor) {
    //         // 更新楼层显示
    //         $floor_text.attr('data-index', floor).text(floor + 1 + '楼');
    //         // 更新编辑页的房间选择下拉菜单
    //         update_room_switch($room_switch, active_build_name, floor);
    //     }

    //     if (room) {
    //         // 更新房间显示
    //         $room_text.attr('data-index', room).text(room);
    //     }

    //     // 更新状态
    //     $edit_area.find(`>.state>.radio-box>span[data-state=${state}]`).addClass('selected').siblings().removeClass('selected');

    //     // 更新内容
    //     $edit_area.find('>.content>textarea').val(content);
    // }

    // 更新运维列表
    // const update_oper_list = ($operate_wrap, hasName, date = 'all', build = 'all', floor = "all", room = "all") => {
    //     const list = [];

    //     for (const data of allOperateData) {
    //         if (date != 'all') {
    //             const new_date = getDateByTime(date, true);
    //             const data_date = getDateByTime(data.time, true);
    //             if (new_date != data_date) {
    //                 continue
    //             }
    //         }

    //         if (build == 'all') { // 推入所有数据
    //             list.push(data);
    //         } else if (data.build == build) { // 楼栋匹配
    //             if (floor == 'all') { // 推入所有楼层数据
    //                 list.push(data);
    //             } else if (data.floor == floor) { // 楼层匹配
    //                 if (room == 'all') { // 所有房间数据推入
    //                     list.push(data);
    //                 } else if (data.room == room) { // 房间匹配
    //                     list.push(data);
    //                 }
    //             }
    //         }
    //     }

    //     // console.log('list', list);

    //     const $content = $operate_wrap.find('>.wrap-left>.content');
    //     const $wrap_right = $operate_wrap.find('>.wrap-right');
    //     const $view_area = $wrap_right.find('.view-area');

    //     $content.html(createOperList(list, hasName));
    //     if (list.length > 0) {
    //         dom_oper_item_select($content.children()[0]);
    //     } else {
    //         $view_area.hide();
    //     }
    // }

    // 管理页切换楼栋
    // const manage_switch_build = (element) => {
    //     const build_name = $(element).attr('data-name');
    //     const floors = build_data[build_name];

    //     // 根据 build_name 向后台获取信息

    //     // 楼层下拉列表更新 ----------------------
    //     const firstData = {
    //         index: 'all',
    //         floorName: '所有楼层'
    //     }
    //     const floors_dom = createFloorList(floors, firstData);

    //     const $floor_switch = $(element).parent().siblings('.floor-switch');

    //     $floor_switch.find('>.floor-text').text(firstData.floorName).attr('data-index', firstData.index);
    //     $floor_switch.find('>.dropdown-menu').html(floors_dom);

    //     // 房间下拉列表更新 ----------------------
    //     const $room_switch = $floor_switch.siblings('.room-switch');

    //     const rooms = [];
    //     for (const floor of floors) {
    //         rooms.push(...floor.rooms);
    //     }
    //     const rooms_dom = createRoomList(rooms, true, '室');
    //     $room_switch.find('>.room-text').text('所有房间').attr('data-index', 'all');
    //     $room_switch.find('>.dropdown-menu').html(rooms_dom);

    //     // 运维管理列表更新 ----------------------
    //     const $operate_wrap = $(element).parents('.operate-menu').siblings('.operate-wrap');
    //     update_oper_list($operate_wrap, true, 'all', build_name);
    // }

    // 管理页切换楼层
    // const manage_switch_floor = (element) => {
    //     const $floor_switch = $(element).parents('.floor-switch');
    //     const $build_tab = $floor_switch.siblings('.build-tab');
    //     const $room_switch = $floor_switch.siblings('.room-switch');

    //     const $active_build = $build_tab.find('>span.active');
    //     const build_name = $active_build.attr('data-name');

    //     const active_floors = build_data[build_name];
    //     let active_floor_index = $(element).attr('data-index');

    //     const rooms = [];
    //     if (active_floor_index == 'all') {
    //         for (const floor of active_floors) {
    //             rooms.push(...floor.rooms);
    //         }
    //     } else {
    //         active_floor_index = Number(active_floor_index);

    //         // 根据 build_name active_floor_index 向后台获取信息
    //         rooms.push(...active_floors[active_floor_index].rooms);
    //     }

    //     const rooms_dom = createRoomList(rooms, true, '室');
    //     $room_switch.find('>.room-text').text('所有房间').attr('data-index', 'all');
    //     $room_switch.find('>.dropdown-menu').html(rooms_dom);

    //     // 运维管理列表更新 ----------------------
    //     const $operate_wrap = $(element).parents('.operate-menu').siblings('.operate-wrap');
    //     update_oper_list($operate_wrap, true, 'all', build_name, active_floor_index)
    // }

    // 管理页切换房间
    // const manage_switch_room = (element) => {
    //     const $room_switch = $(element).parents('.room-switch');
    //     const $build_tab = $room_switch.siblings('.build-tab');
    //     const $floor_switch = $room_switch.siblings('.floor-switch');

    //     const $active_build = $build_tab.find('>span.active');

    //     const build_name = $active_build.attr('data-name');
    //     const active_floor_index = $floor_switch.find('>.floor-text').attr('data-index');
    //     const active_room_index = $(element).attr('data-index');

    //     // 根据 build_name active_floor_index active_room_index 更新列表
    //     const $operate_wrap = $(element).parents('.operate-menu').siblings('.operate-wrap');
    //     let hasName = false;
    //     if (active_room_index == 'all') {
    //         hasName = true;
    //     }
    //     update_oper_list($operate_wrap, hasName, 'all', build_name, active_floor_index, active_room_index);
    // }

    /**
     * @name 保存执行函数
     * @param {*} $operate_wrap 运维dom包
     * @param {boolean} active 替换的dom是否为活跃
     * @param {*} callback 保存完成后的回调
     */
    // const save_operate_data = ($operate_wrap, active, callback) => {
    //     let hasName = true;
    //     const $tab_pane = $operate_wrap.parents('.tab-pane');
    //     if ($tab_pane.attr('id') == 'tab-home') {
    //         hasName = false;
    //     } else {
    //         const room = $operate_wrap.siblings('.operate-menu').find('>.room-switch>.room-text').attr('data-index');
    //         if (room != 'all') {
    //             hasName = false;
    //         }
    //     }

    //     const $edit_area = $operate_wrap.find('>.wrap-right>.edit-area');
    //     const $view_area = $operate_wrap.find('>.wrap-right>.view-area');

    //     const data = get_oper_edit_data($edit_area); // 获取编辑框内的信息

    //     const $active_item = $operate_wrap.find('>.wrap-left>.content>.operate-item.active')

    //     let this_id = $active_item.attr('data-id'); // 获取当前活跃项id

    //     if (this_id == 'new') { // 新建
    //         // 向后台发送新建的 data
    //         addYunweiData(data, function (res_id) {
    //             data.id = res_id; // id 赋值
    //             allOperateData.unshift(data); // 本地数据添加

    //             dom_update_oper_view($view_area, data); // 更新显示界面
    //             $active_item.replaceWith(createOperItem(data, hasName, active)); // 更新列表界面
    //             if (callback) callback();
    //         })
    //     } else { // 修改
    //         data.id = this_id;
    //         updateYunweiData(data, function () {
    //             replaceData(allOperateData, data); // 本地数据替换

    //             dom_update_oper_view($view_area, data); // 更新显示界面
    //             $active_item.replaceWith(createOperItem(data, hasName, active)); // 更新列表界面
    //             if (callback) callback();
    //         })
    //     }
    // }

    /**
     * @name 进入确认界面
     * @param {*} $operate_wrap 运维dom包
     * @param {*} continueCallback 将要继续执行的函数
     */
    const enter_ensure = ($operate_wrap, continueCallback) => {
        const $edit_area = $operate_wrap.find('>.wrap-right>.edit-area');

        if ($edit_area.css('display') == 'block') {
            $('#confirm-mask').addClass('active');

            saveCallback = () => {
                save_operate_data($operate_wrap, false, continueCallback);
            }
        } else {
            continueCallback();
            continueCallback = undefined;
        }
    }


    // ####################### 运行 #######################
    document.oncontextmenu = function () {
        return false;
    }

    // ======================= 插入 dom =======================
    // selectAllYunweiData(function (dataList) {
    //     allOperateData = dataList;
    //     // const new_list = [];
    //     // for (const data of dataList) {
    //     //     if (data.build == '北楼') {
    //     //         new_list.push(data);
    //     //     }
    //     // }
    //     // importDom(new_list);
    //     importDom();

    //     // 触发一次运维页的楼栋切换
    //     const manage_first_build_tab = $('#tab-manage .operate-menu .build-tab').children()[0];
    //     manage_switch_build(manage_first_build_tab);

    //     // 切换显示首页第一个运维项目
    //     const home_first_oper_item = $('#tab-home .operate-wrap .wrap-left>.content').children()[0];
    //     dom_oper_item_select(home_first_oper_item);

    //     // 切换显示管理页第一个运维项目
    //     const manage_first_oper_item = $('#tab-manage .operate-wrap .wrap-left>.content').children()[0];
    //     dom_oper_item_select(manage_first_oper_item);
    // });


    // ======================= 绑定事件 =======================
    // +++++++++++++++++++++++ 确认界面事件 +++++++++++++++++++++++
    // $('#confirm-mask').on('click', '>.confirm-box>.btns>span', function () {
    //     if ($(this).hasClass('save')) { // 是
    //         // 保存并继续
    //         if (saveCallback) saveCallback();
    //     } else if ($(this).hasClass('deny')) { // 否
    //         // 不保存，继续
    //         if (continueCallback) continueCallback();
    //     } else if ($(this).hasClass('cancel')) { // 取消
    //         // 不保存，不继续

    //     }

    //     $('#confirm-mask').removeClass('active');
    //     saveCallback = undefined;
    //     continueCallback = undefined;
    // })


    // +++++++++++++++++++++++ 运维共用事件 +++++++++++++++++++++++
    // 运维项目表单切换事件
    // $('.operate-wrap').on('click', '>.wrap-left>.content>.operate-item', function () {
    //     if (!$(this).hasClass('active')) {
    //         const $operate_wrap = $(this).parents('.operate-wrap');
    //         const $wrap_left = $(this).parents('.wrap-left');
    //         const $wrap_right = $wrap_left.siblings('.wrap-right');
    //         const $edit_area = $wrap_right.find('.edit-area');

    //         continueCallback = () => {
    //             dom_oper_item_select(this);
    //             $(this).addClass('active').siblings().removeClass('active');
    //         }

    //         enter_ensure($operate_wrap, continueCallback)
    //     }
    // });

    // 运维修改按钮
    // $('.operate-wrap .wrap-right').on('click', '.view-area .modify-btn', function () {
    //     const $wrap_right = $(this).parents('.wrap-right');
    //     const $wrap_left = $wrap_right.siblings('.wrap-left');

    //     const $view_area = $wrap_right.find('.view-area');
    //     const $edit_area = $wrap_right.find('.edit-area');

    //     $view_area.hide();
    //     $edit_area.show();

    //     const id = $wrap_left.find('>.content>.operate-item.active').attr('data-id');

    //     let this_data;
    //     for (const data of allOperateData) {
    //         if (data.id == id) {
    //             this_data = data;
    //             update_oper_edit_dom($edit_area, this_data);
    //             break;
    //         }
    //     }
    // });

    // 运维删除按钮
    // $('.operate-wrap .wrap-right').on('click', '.view-area .delete-btn', function () {
    //     const $wrap_right = $(this).parents('.wrap-right');
    //     const $wrap_left = $wrap_right.siblings('.wrap-left');

    //     // const $view_area = $wrap_right.find('.view-area');
    //     // const $edit_area = $wrap_right.find('.edit-area');

    //     const $active_item = $wrap_left.find('>.content>.operate-item.active');
    //     const this_id = $active_item.attr('data-id');

    //     // 向后台发送需要删除的数据的 id
    //     const req = {
    //         id: this_id
    //     };
    //     deleteYunweiData(req, function () {
    //         dom_oper_item_delete($active_item); // ajax成功后执行此行
    //     })
    // })

    // 修改界面状态切换
    // $('.operate-wrap .wrap-right').on('click', '.edit-area .state>.radio-box>span', function () {
    //     $(this).addClass('selected').siblings().removeClass('selected');
    // });

    // 修改界面保存/取消按钮
    // $('.operate-wrap .wrap-right').on('click', '.edit-area .btn-box>span', function () {
    //     const $operate_wrap = $(this).parents('.operate-wrap');

    //     const $edit_area = $operate_wrap.find('>.wrap-right>.edit-area');
    //     const $view_area = $operate_wrap.find('>.wrap-right>.view-area');

    //     $view_area.show();
    //     $edit_area.hide();

    //     if ($(this).hasClass('save')) {
    //         save_operate_data($operate_wrap, true);
    //     } else {
    //         const $wrap_right = $edit_area.parent();
    //         const $wrap_left = $wrap_right.siblings('.wrap-left');
    //         const $active_item = $wrap_left.find('>.content>.operate-item.active');

    //         const active_id = $active_item.attr('data-id');
    //         if (active_id == 'new') {
    //             const other_first_item = $active_item.siblings()[0];
    //             dom_oper_item_select(other_first_item);
    //             $active_item.remove();
    //         }
    //     }
    // });

    // 新建按钮
    // $('.operate-wrap .wrap-left').on('click', '.bottom-area>.add-btn', function () {
    //     // 左侧添加新建条目
    //     const newData = {
    //         title: '新建',
    //         time: new Date().getTime(),
    //         state: 'unfinished',
    //         content: '',
    //     };

    //     const newDom = createOperItem(newData);

    //     const $operate_wrap = $(this).parents('.operate-wrap');

    //     const $wrap_left = $operate_wrap.find('>.wrap-left');
    //     const $wrap_right = $operate_wrap.find('>.wrap-right');

    //     const $content = $wrap_left.find('>.content');

    //     // 右侧打开编辑区域
    //     const $view_area = $wrap_right.find('.view-area');
    //     const $edit_area = $wrap_right.find('.edit-area');

    //     continueCallback = () => {
    //         $content.prepend(newDom);
    //         $content.children().removeClass('active');
    //         $content.children(':first-child').addClass('active');

    //         $view_area.hide();
    //         $edit_area.show();

    //         // 初始化编辑区域
    //         newData.title = '';
    //         update_oper_edit_dom($edit_area, newData);
    //     }

    //     enter_ensure($operate_wrap, continueCallback)
    // })

    // +++++++++++++++++++++++ 首页页面事件 +++++++++++++++++++++++
    // ----------------------- 左侧切换事件 -----------------------
    // 房间切换按钮事件
    // $('#tab-home .select-wrap .room-switch').on('click', '.dropdown-menu a', function () {
    //     const $build_tab = $('#container>.select-wrap>.build-tab');
    //     const $floor_switch = $build_tab.siblings('.floor-switch');
    //     const $room_switch = $build_tab.siblings('.room-switch');

    //     const $room_text = $room_switch.find('>.room-text');

    //     let roomName = $(this).attr('data-index');

    //     if (roomName == $room_text.attr('data-index')) {
    //         return
    //     }

    //     dom_room_select(roomName);

    //     const build_name = $build_tab.find('>span.active').attr('data-name');
    //     const floor_index = Number($floor_switch.find('>.floor-text').attr('data-index'));

    //     if (roomName == 'all') {
    //         clearHightLight();
    //         const build = builds_map[build_name]
    //         for (const child of build.children) {
    //             if (child.name == '楼层组') {
    //                 const floors = child.children;
    //                 for (const floor of floors) { // 遍历获取每层楼
    //                     if (floor.name && floor.name == floor_index + '楼') { // 目标楼层
    //                         walkToObjects(floor);
    //                     }
    //                 }
    //             }
    //         }
    //     } else {
    //         const meshs = room_mesh_map[build_name][floor_index];
    //         for (const mesh of meshs) {
    //             if (mesh.roomName == roomName) {
    //                 walkToRoom(mesh);
    //                 break
    //             }
    //         }
    //     }
    // })

    // ----------------------- 首页运维事件 -----------------------
    // 首页运维入口按钮事件
    // $('#tab-home .operate-btn').click(function () {
    //     $('.operate-mask').show();

    //     const $operate_wrap = $('#container>.operate-mask>.operate-wrap');
    //     const $build_tab = $(this).siblings('.build-tab');
    //     const $floor_switch = $(this).siblings('.floor-switch');
    //     const $room_switch = $(this).siblings('.room-switch');

    //     const build = $build_tab.find('>span.active').attr('data-name');
    //     const floor = Number($floor_switch.find('>.floor-text').attr('data-index'));
    //     const room = $room_switch.find('>.room-text').attr('data-index');

    //     const $room_path = $operate_wrap.find('>.wrap-right>.top-area>.room-path');
    //     $room_path.text(`${build}-${floor + 1}-${room}`);

    //     update_oper_list($operate_wrap, false, 'all', build, floor, room);
    // })

    // 首页运维界面关闭
    // $('#tab-home .operate-wrap .shut').click(function () {
    //     $('#tab-home .operate-mask').hide();
    // });

    // ----------------------- 首页机电 -----------------------
    // $('#tab-home .equipment-btn').click(function () {
    //     $('.equipment-mask').show(); // 显示机电图表
    //     $('#container>.air-system').hide(); // 隐藏空调区域
    //     const seriesData = [
    //         {
    //             name: '111',
    //             value: 111,
    //         },
    //         {
    //             name: '222',
    //             value: 222,
    //         },
    //         {
    //             name: '333',
    //             value: 333,
    //         },
    //     ]
    //     const chart_1_option = createChartOption1({
    //         titleText: '耗电占比统计',
    //         seriesName: '用电区域',
    //         seriesData: seriesData,
    //         unit: 'kw·h',
    //         titleLeft: '30%',
    //         titleTop: '18 %',
    //         seriesCenter: ['35%', '50%'],
    //         legendTop: '40%',
    //         // legendLeft: '64%',
    //     });
    //     chart_equipment_1.resize();
    //     chart_equipment_1.setOption(chart_1_option);
    // });

    // $('#container>.equipment-mask>.chart-wrap').on('click', '>.shut', function () {
    //     if ($(this).parent().hasClass('chart-1')) {
    //         $('.equipment-mask').hide(); // 隐藏机电图表
    //         $('#container>.air-system').show(); // 显示空调区域
    //     } else {
    //         $(this).parent().removeClass('active').siblings('.chart-1').addClass('active');
    //     }
    // });


    // ----------------------- 空调新风 -----------------------
    // 隐藏空调/新风编辑框
    // $(document).on('mouseup', function () {
    //     $('.air-edit').hide();
    // })

    // 空调设置点击事件
    // $('#tab-air-conditioner').on('click', '>.set', function () {
    //     $('.air-edit.air-conditioner').show();
    // })

    // 阻止冒泡
    // $('.air-edit').on('mouseup', function (e) {
    //     e.stopPropagation();
    // })

    // 空调/新风编辑框关闭事件
    // $('.air-edit').on('click', '.shut', function () {
    //     $(this).parents('.air-edit').hide();
    // })

    // 新风设置点击事件
    // $('#tab-fresh-air').on('click', '>.set', function () {
    //     $('.air-edit.fresh-air').show();
    // })

    // 空调/新风编辑框内状态修改
    // $('.air-edit .set-state>.attr-set').click(function () {
    //     const state = $(this).attr('data-state');

    //     let newState;

    //     if (state == 'off') {
    //         newState = 'on';
    //     } else {
    //         newState = 'off';
    //     }

    //     $(this).attr('data-state', newState);
    //     $(this).text(newState);
    // })

    // 空调/新风的模式/风速修改
    // $('.air-edit .set-mode>.attr-set>.dropdown-menu, .air-edit .set-cloud>.attr-set>.dropdown-menu').on('click', '>li>a', function () {
    //     const text = $(this).text();

    //     const $btn_menu = $(this).parents('.dropdown-menu').siblings('.btn-menu');
    //     $btn_menu.text(text);
    // })

    // 空调/新风控制修改的确定按钮
    // $('.air-edit>.content-box>.ensure').click(function () {
    //     $(this).parents('.air-edit').hide();
    // })

    $('#tab-home .init-btn').on('click', function () {
        if (position_m && target_m) {
            const start = {
                position: controls.object.position,
                target: controls.target,
            }

            const end = {
                new_position: position_m,
                new_target: target_m,
            }
            walkToTarget(start, end);

            position_m = undefined;
            target_m = undefined;

            // dom_room_select('all')
        }

        // clearHightLight();
    })

    // 阴影开启
    $('#tab-home .shadow-btn').on('click', function () {
        $(this).toggleClass('active');

        if ($(this).hasClass('active')) {
            if (directional) directional.castShadow = true;
            if (pointLight) pointLight.castShadow = true;
        } else {
            if (directional) directional.castShadow = false;
            if (pointLight) pointLight.castShadow = false;
        }
    })

    // +++++++++++++++++++++++ 管理页面 +++++++++++++++++++++++
    // ----------------------- 上部切换 -----------------------
    // 楼栋切换
    // $('#tab-manage>.operate-menu>.build-tab>span').click(function () {
    //     if (!$(this).hasClass('active')) {
    //         const $operate_menu = $(this).parents('.operate-menu');
    //         const $operate_wrap = $operate_menu.siblings('.operate-wrap');
    //         // const $edit_area = $operate_wrap.find('>.wrap-right>.edit-area');

    //         continueCallback = () => {
    //             $(this).addClass('active').siblings().removeClass('active');
    //             manage_switch_build(this);
    //         }

    //         enter_ensure($operate_wrap, continueCallback);

    //         // if ($edit_area.css('display') == 'block') {
    //         //     $('#confirm-mask').addClass('active');
    //         // } else {
    //         //     continueCallback();
    //         //     continueCallback = undefined;
    //         // }
    //     }
    // })

    // 楼层切换
    // $('#tab-manage>.operate-menu>.floor-switch>.dropdown-menu').on('click', '>li>a', function () {
    //     const $floor_switch = $(this).parents('.floor-switch');
    //     const $floor_text = $floor_switch.find('>.floor-text');

    //     const active_index = $floor_text.attr('data-index');
    //     const this_index = $(this).attr('data-index');

    //     if (active_index != this_index) {
    //         const $operate_menu = $(this).parents('.operate-menu');
    //         const $operate_wrap = $operate_menu.siblings('.operate-wrap');
    //         // const $edit_area = $operate_wrap.find('>.wrap-right>.edit-area');

    //         continueCallback = () => {
    //             manage_switch_floor(this);
    //             $floor_text.attr('data-index', this_index);
    //             $floor_text.text($(this).text());
    //         }

    //         enter_ensure($operate_wrap, continueCallback);

    //         // if ($edit_area.css('display') == 'block') {
    //         //     $('#confirm-mask').addClass('active');
    //         // } else {
    //         //     continueCallback();
    //         //     continueCallback = undefined;
    //         // }
    //     }
    // })

    // 房间切换
    // $('#tab-manage>.operate-menu>.room-switch>.dropdown-menu').on('click', '>li>a', function () {
    //     const $room_switch = $(this).parents('.room-switch');
    //     const $room_text = $room_switch.find('>.room-text');

    //     const active_index = $room_text.attr('data-index');
    //     const this_index = $(this).attr('data-index');

    //     if (active_index != this_index) {
    //         manage_switch_room(this);
    //         $room_text.attr('data-index', this_index);
    //         $room_text.text($(this).text());
    //     }
    // })

    // 编辑界面的楼层切换
    // $('#tab-manage>.operate-wrap>.wrap-right>.edit-area>.room>.room-area .floor-switch>.dropdown-menu').on('click', '>li>a', function () {
    //     let index = $(this).attr('data-index');

    //     const $floor_text = $(this).parents('.floor-switch').find('>.floor-text');

    //     $floor_text.attr('data-index', index);
    //     $floor_text.text($(this).text());

    //     // 更新房间选择下拉菜单
    //     const $room_switch = $(this).parents('.floor-box').siblings('.room-box').find('>.room-switch')
    //     const active_build_name = $('#tab-manage>.operate-menu>.build-tab>span.active').attr('data-name');
    //     const active_floors = build_data[active_build_name];
    //     const rooms = active_floors[index].rooms;

    //     const rooms_dom = createRoomList(rooms, false, '');
    //     $room_switch.find('>.room-text').text('请选择');
    //     $room_switch.find('>.room-text').attr('data-index', 'none');
    //     $room_switch.find('>.dropdown-menu').html(rooms_dom);
    // })

    // 编辑界面的房间切换
    // $('#tab-manage>.operate-wrap>.wrap-right>.edit-area>.room>.room-area .room-switch>.dropdown-menu').on('click', '>li>a', function () {
    //     const $room_switch = $(this).parents('.room-switch');
    //     const $room_text = $room_switch.find('>.room-text');

    //     const active_index = $room_text.attr('data-index');
    //     const this_index = $(this).attr('data-index');

    //     if (active_index != this_index) {
    //         // manage_switch_floor(this);
    //         $room_text.attr('data-index', this_index);
    //         $room_text.text($(this).text());
    //     }
    // })


    // ======================= 渲染逻辑 =======================
    init();
    animate();

    function animate() {
        idM = window.requestAnimationFrame(animate);
        TWEEN.update();
        controls.update();
        render();
    }

    function render() {
        renderer.render(scene, camera);
        // console.log('renderer', renderer);
    }

    //获得射线扫描到对象
    function getRaycaster(event) {
        mouse.x = (event.offsetX / renderer.domElement.clientWidth) * 2 - 1;
        mouse.y = -(event.offsetY / renderer.domElement.clientHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        return raycaster;
    }

    function init() {
        container = document.querySelector('#container');
        const width = container.clientWidth;
        const height = container.clientHeight;
        // console.log('height', height);

        scene = new THREE.Scene();
        scene.scale.set(scale_rate, scale_rate, scale_rate);

        renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        renderer.setSize(width, height);
        renderer.localClippingEnabled = true;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        // renderer.logarithmicDepthBuffer = true;

        container.appendChild(renderer.domElement);

        camera = new THREE.PerspectiveCamera(60, width / height, 1, 20000000);
        camera.position.set(90, 75, 75);
        // scene.add(camera);

        ambient = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambient);

        // directional = new THREE.DirectionalLight(0xffffff, 0.5);
        // directional.position.set(-1000000, 10000000, 10000000);
        // directional.castShadow = true;
        // scene.add(directional);

        // directional.shadow.mapSize.width = 2048;
        // directional.shadow.mapSize.height = 2048;
        // // directional.shadow.bias = 0.0001;
        // var d = 20000000000;
        // directional.shadow.mapSize.left = -d;
        // directional.shadow.mapSize.right = d;
        // directional.shadow.mapSize.top = d;
        // directional.shadow.mapSize.bottom = -d;
        // directional.shadow.camera.near = 0.1;
        // directional.shadow.camera.far = 10000000;
        // directional.shadow.camera.zoom = 0.1;
        // directional.shadow.camera.updateProjectionMatrix();


        // var helper = new THREE.DirectionalLightHelper(directional, 40000000, '#ff0000');
        // scene.add(helper);

        // var axesHelper = new THREE.AxesHelper(50000);
        // scene.add(axesHelper);

        let lightFar = 20000
        pointLight = new THREE.PointLight(0xffffff, 0.3, lightFar);
        pointLight.position.set(100000, 50000, 50000);
        pointLight.castShadow = false; // default false
        scene.add(pointLight);

        pointLight.shadow.mapSize.width = 1024;
        pointLight.shadow.mapSize.height = 1024;
        pointLight.shadow.camera.near = 0.5;
        pointLight.shadow.camera.far = lightFar;
        // pointLight.shadow.bias = 0.0001;

        var sphereSize = 1000;
        var pointLightHelper = new THREE.PointLightHelper( pointLight, sphereSize, '#FF0000');
        scene.add( pointLightHelper );

        controls = new OrbitControls(camera, renderer.domElement);
        controls.maxPolarAngle = Math.PI / 2;
        controls.minPolarAngle = 0.1;
        controls.target.set(26, 13.5, -24.5);

        // 载入地面
        const loader = new FBXLoader();
        loader.load('./models/land.toolkipBIM', function (obj) {
            obj.name == '地面';

            obj.traverse(function (mesh) {
                if (mesh instanceof THREE.Mesh) {
                    mesh.receiveShadow = true;
                }
            })
            const box = new THREE.Box3();
            box.expandByObject(obj);
            const size = box.getSize(new THREE.Vector3());

            obj.scale.set(2, 1, 2);
            obj.position.set(-size.x / 3, 0, size.z / 2);

            scene.add(obj)
        })

        loader.load('./models/mep无土建.toolkipBIM', function (obj) {
            scene.add(obj)
        })


        const build_whole = new THREE.Group();
        build_whole.name = '建筑整体';
        scene.add(build_whole);

        for (const build_name of builds) {
            const group = new THREE.Group();;
            group.name = build_name;
            build_whole.add(group);

            builds_map[build_name] = group;
        }

        const new_paths = [
            './models/西楼1F.toolkipBIM',
            './models/西楼2F.toolkipBIM',
            './models/西楼顶.toolkipBIM',
            './models/连廊1F.toolkipBIM',
            './models/连廊2F.toolkipBIM',
            './models/连廊顶.toolkipBIM',
            './models/东楼1F.toolkipBIM',
            './models/东楼2F.toolkipBIM',
            './models/东楼顶.toolkipBIM',
        ]
        analysisFBX(new_paths, builds_map, function () {
            console.log('renderer', renderer);

            $('#loading').removeClass("active");

            // 绑定三栋楼的显示/隐藏按钮
            $('#container').on('click', '.select-wrap>.build-tab>span', function () {
                $(this).toggleClass('active');
                const key = $(this).attr('data-name');

                const $build_tab = $(this).parent();
                const $floor_switch = $build_tab.siblings('.floor-switch');

                const $active_build = $build_tab.find('>span.active');

                const active_floor_index = $floor_switch.find('>.floor-text').attr('data-index');

                update_home_floor_dom(); // 更新楼层切换下拉菜单

                if ($active_build.length == 1 && active_floor_index != 'all') {
                    // show_home_room_dom(); // 出现房间选择下拉界面
                } else {
                    // dom_room_clear(); // 收起房间下拉等多个界面
                    // 显示所有楼层
                    for (const key in builds_map) {
                        if (builds_map.hasOwnProperty(key)) {
                            const build = builds_map[key];
                            for (const floor of build.children) {
                                floor.visible = true;
                            }
                        }
                    }
                }

                if ($active_build.length > 0) {
                    const target = [];
                    for (const active_build of $active_build) {
                        const active_build_name = $(active_build).attr('data-name');
                        const build = builds_map[active_build_name];
                        target.push(build);
                    }
                    walkToObjects(target);
                }

                builds_map[key].visible = $(this).hasClass('active');
            });

            // 绑定楼层切换按钮
            $('#container>.select-wrap>.floor-switch>.dropdown-menu').on('click', '>li>a', function () {
                let index = $(this).attr('data-index');

                const $floor_text = $(this).parents('.floor-switch').find('>.floor-text');

                $floor_text.attr('data-index', index);
                $floor_text.text($(this).text());

                // dom_room_clear();

                const $active_build = $('#tab-home .select-wrap .build-tab>span.active');

                if ($active_build.length == 1) {
                    const active_build_name = $active_build.attr('data-name');
                    const build = builds_map[active_build_name];

                    if (index == 'all') {
                        walkToObjects(build);

                        for (const floor of build.children) {
                            floor.visible = true;
                        }
                    } else {
                        index = Number(index);

                        // if ($active_build.length == 1) {
                        //     show_home_room_dom(); // 出现房间选择下拉界面
                        // }

                        const floor_index = index + 1;
                        // 遍历获取每栋楼的楼层组
                        for (const floor of build.children) {
                            if (floor.name && floor.name == floor_index + 'F') { // 显示目标楼层
                                floor.visible = true;
                                walkToObjects(floor);
                            } else {
                                floor.visible = false;
                            }
                        }
                    }
                }
            })
        })

        // 解析房间信息
        // $.getJSON('./data/roomData.js', function (data) {
        //     // console.log('data', data);
        //     const roomGroup = new THREE.Group();
        //     roomGroup.name = '房间地面组';
        //     scene.add(roomGroup);

        //     for (const key in data) {
        //         if (data.hasOwnProperty(key)) {
        //             const roomPoints = data[key];

        //             const build_room = key.split(' ')[1];
        //             const split_arr = build_room.split('-');

        //             if (split_arr.length == 2 && split_arr[1] != '') { // 既有楼栋，又有房间名时

        //                 // 过滤掉空数组
        //                 const newPoints = roomPoints.filter(function (roomPoint) {
        //                     return roomPoint.length > 0
        //                 })

        //                 // 当没有有效房间点位时，进入下一轮循环
        //                 if (newPoints.length == 0) {
        //                     continue
        //                 }

        //                 const build_mark = split_arr[0]; // 值为大写的英文字母
        //                 const room_name = split_arr[1]; // 值为房间号字符串

        //                 // 房间后首位数字减 1
        //                 const index = Number(room_name.slice(0, 1)) - 1;

        //                 let build_name;
        //                 if (build_mark == 'N') {
        //                     build_name = '北楼';
        //                 } else if (build_mark == 'S') {
        //                     build_name = '南楼';
        //                 } else {
        //                     build_name = '西楼';
        //                 }

        //                 // 一个房间的数据
        //                 const roomData = {
        //                     buildName: build_name,
        //                     floorIndex: index,
        //                     roomName: room_name,
        //                     roomPoints: newPoints
        //                 };

        //                 let room_build = room_mesh_map[build_name];

        //                 // 向场景中添加房间地板的mesh
        //                 const meshs = createRoomMesh(roomData);
        //                 for (const mesh of meshs) {
        //                     roomGroup.add(mesh);

        //                     if (!room_build[index]) { // 未有该楼层
        //                         room_build[index] = [mesh]
        //                     } else {
        //                         room_build[index].push(mesh);
        //                     }
        //                 }

        //                 // 向变量放入数据
        //                 let build = build_data[build_name];
        //                 if (!build[index]) { // 未有该楼层
        //                     build[index] = {
        //                         floorName: `${index + 1}楼`,
        //                         rooms: [roomData],
        //                     }
        //                 } else { // 已有该楼层
        //                     build[index].rooms.push(roomData);
        //                 }
        //             }
        //         }
        //     }

        //     // console.log('build_data', build_data);
        //     // console.log('room_mesh_map', room_mesh_map)

        //     // 添加房间选择的射线函数绑定
        //     $(container).on('mousedown', '>canvas', function (event) {
        //         if (event.button != 0) return

        //         const $build_tab = $('#container>.select-wrap>.build-tab');
        //         const $floor_switch = $build_tab.siblings('.floor-switch');

        //         if ($build_tab.length != 1) {
        //             return
        //         }

        //         let floor_index = $floor_switch.find('>.floor-text').attr('data-index')
        //         if (floor_index == 'all') {
        //             return
        //         }

        //         const build_name = $build_tab.find('>span.active').attr('data-name');
        //         floor_index = Number(floor_index);

        //         const target_array = room_mesh_map[build_name][floor_index];

        //         const raycaster = getRaycaster(event);
        //         const intersects = raycaster.intersectObjects(target_array);

        //         if (intersects.length > 0) {
        //             mousedown_point = intersects[0].point;
        //         }
        //     })

        //     // 测试用捕捉射线
        //     // $(container).on('mousedown', '>canvas', function (event) {
        //     //     const raycaster = getRaycaster(event);
        //     //     const intersects = raycaster.intersectObjects([scene], true);

        //     //     if (intersects.length > 0) {
        //     //         mesh = intersects[0].object;
        //     //         console.log('mesh', mesh);
        //     //     }
        //     // })

        //     $(container).on('mouseup', '>canvas', function (event) {
        //         // 未在画布内按下，则返回
        //         if (!mousedown_point) {
        //             return
        //         }

        //         if (event.button != 0) {
        //             return
        //         }

        //         const $build_tab = $('#container>.select-wrap>.build-tab');
        //         const $floor_switch = $build_tab.siblings('.floor-switch');

        //         if ($build_tab.length != 1) {
        //             return
        //         }

        //         let floor_index = $floor_switch.find('>.floor-text').attr('data-index')
        //         if (floor_index == 'all') {
        //             return
        //         }

        //         const build_name = $build_tab.find('>span.active').attr('data-name');
        //         floor_index = Number(floor_index);

        //         const target_array = room_mesh_map[build_name][floor_index];

        //         const raycaster = getRaycaster(event);
        //         const intersects = raycaster.intersectObjects(target_array);

        //         if (intersects.length > 0) {
        //             mouseup_point = intersects[0].point;
        //             const mesh = intersects[0].object;

        //             // 鼠标按下时和松开时距离太远则返回
        //             if (mouseup_point.distanceTo(mousedown_point) > (5 * scale_rate)) {
        //                 mousedown_point = undefined;
        //                 mouseup_point = undefined;
        //                 return
        //             }

        //             walkToRoom(mesh);

        //             // dom 匹配所选房间
        //             dom_room_select(mesh.roomName);
        //         }
        //     })
        // })


    }

    // 适应窗口大小变化
    $(window).on('resize', function () {
        container = document.querySelector('#container');
        const width = container.clientWidth;
        const height = container.clientHeight;
        // console.log('height', height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
    })

    $('#top-menu a[data-toggle="tab"]').on('show.bs.tab', function (event) {
        // console.log('this', this);
        if ($(this).parent().hasClass('home')) {
            // console.log('首页 开启渲染');
            animate();
        } else {
            // console.log('其他页 停止渲染');
            window.cancelAnimationFrame(idM)
        }
    })
})

// ===================================== echarts =====================================
// let token;

// let waterPosts;
// let electricPosts;

// /**
//  * @name 创建饼状图配置
//  * @param {*} config 
//  */
// const createChartOption1 = (config) => {
//     const {
//         titleText,
//         seriesName,
//         seriesData,
//         unit,
//         titleLeft,
//         titleTop,
//         legendLeft,
//         legendTop,
//         seriesCenter,
//     } = config;

//     const option = {
//         title: {
//             text: titleText,
//             left: titleLeft || '38.5%',
//             top: titleTop || '14%',
//             textStyle: {
//                 color: '#484848',
//                 fontSize: 14,
//                 fontWeight: 'normal',
//             }
//         },
//         tooltip: {
//             trigger: 'item',
//             formatter: `{a} <br/>{b}: {c}${unit} ({d}%)`
//         },
//         legend: {
//             orient: 'vertical',
//             left: legendLeft || '60%',
//             top: legendTop || '31%',
//             icon: 'circle',
//             formatter: function (name) {
//                 const datas = seriesData;

//                 let value = datas[0].value
//                 let total = 0;

//                 for (const data of datas) {
//                     total += data.value;
//                     if (data.name == name) {
//                         value = data.value;
//                     }
//                 }

//                 const rate = value / total * 100;
//                 return `${name}: ${value}${unit} / ${rate.toFixed(2)}%`
//             }
//         },
//         series: [{
//             name: seriesName,
//             type: 'pie',
//             radius: ['26%', '40%'],
//             center: seriesCenter || ['42%', '40%'],
//             avoidLabelOverlap: false,
//             label: {
//                 normal: {
//                     show: false,
//                     position: 'center'
//                 },
//                 emphasis: {
//                     show: true,
//                     textStyle: {
//                         fontSize: '20',
//                         fontWeight: 'bold'
//                     }
//                 }
//             },
//             labelLine: {
//                 normal: {
//                     show: false
//                 }
//             },
//             data: seriesData
//         }],
//         color: ['#985ef9', '#ffc742', '#ff6e42', '#ff5886', '#00c4aa', '#00a3fb'],
//     };

//     return option
// }

// /**
//  * @name 创建柱状图配置
//  * @param {*} config 
//  */
// const createChartOption2 = (config) => {
//     const {
//         titleText,
//         xAxisData,
//         seriesData,
//     } = config;

//     const option = {
//         title: {
//             text: titleText,
//             top: '8%',
//             left: 'center',
//             textStyle: {
//                 color: '#484848',
//                 fontSize: 14,
//                 fontWeight: 'normal',
//             }
//         },
//         grid: {
//             left: 'center',
//             top: '20%',
//             height: '50%',
//             width: '75%',
//         },
//         xAxis: {
//             type: 'category',
//             axisLine: {
//                 show: false,
//             },
//             axisTick: {
//                 show: false,
//             },
//             axisLabel: {
//                 // rotate: -20,
//                 color: '#999999',
//                 lineHeight: 14,
//                 // margin: 60,
//                 margin: 15,
//                 formatter: function (value) {
//                     return value.split("").join("\n");
//                 },
//             },
//             data: xAxisData,
//         },
//         yAxis: {
//             type: 'value',
//             axisLine: {
//                 show: false,
//             },
//             axisTick: {
//                 show: false,
//             },
//             axisLabel: {
//                 color: '#999999',
//             },
//         },
//         series: [{
//             data: seriesData,
//             type: 'bar',
//             barCategoryGap: '50%',
//             itemStyle: {
//                 color: '#cccccc'
//             },
//             barMaxWidth: 80,
//             emphasis: {
//                 itemStyle: {
//                     color: {
//                         type: 'linear',
//                         x: 0,
//                         y: 0,
//                         x2: 0,
//                         y2: 1,
//                         colorStops: [{
//                             offset: 1,
//                             color: '#ffc742' // 0% 处的颜色
//                         }, {
//                             offset: 0,
//                             color: '#fbe072' // 100% 处的颜色
//                         }],
//                     }
//                 },
//                 label: {
//                     show: true,
//                     position: 'top',
//                     backgroundColor: '#324157',
//                     color: '#ffff',
//                     padding: [10, 20],
//                     distance: 10,
//                     borderRadius: 5,
//                     fontSize: 14,
//                 }
//             }
//         }],
//     };

//     return option
// }

// /**
//  * @name 创建折线图配置
//  * @param {*} config 
//  */
// const createChartOption3 = (config) => {
//     let {
//         titleText,
//         seriesData,
//         xAxisData,
//     } = config;

//     if (!xAxisData) {
//         xAxisData = [
//             '一月',
//             '二月',
//             '三月',
//             '四月',
//             '五月',
//             '六月',
//             '七月',
//             '八月',
//             '九月',
//             '十月',
//             '十一月',
//             '十二月',
//         ];
//     }

//     const option = {
//         title: {
//             text: titleText,
//             top: '8%',
//             left: 'center',
//             textStyle: {
//                 color: '#484848',
//                 fontSize: 14,
//                 fontWeight: 'normal',
//             }
//         },
//         grid: {
//             left: 'center',
//             top: '20%',
//             height: '50%',
//             width: '60%',
//         },
//         xAxis: {
//             type: 'category',
//             axisLine: {
//                 show: false,
//             },
//             axisTick: {
//                 show: false,
//             },
//             axisLabel: {
//                 color: '#999999',
//                 margin: 20,
//             },
//             data: xAxisData,
//         },
//         yAxis: {
//             type: 'value',
//             axisLine: {
//                 show: false,
//             },
//             axisTick: {
//                 show: false,
//             },
//             axisLabel: {
//                 color: '#999999',
//             },
//         },
//         series: [{
//             data: seriesData,
//             type: 'line',
//             areaStyle: {
//                 color: {
//                     type: 'linear',
//                     x: 0,
//                     y: 0,
//                     x2: 0,
//                     y2: 1,
//                     colorStops: [{
//                         offset: 1,
//                         color: '#ffffff' // 0% 处的颜色
//                     }, {
//                         offset: 0,
//                         color: '#babfc4' // 100% 处的颜色
//                     }],
//                 }
//             },
//             lineStyle: {
//                 color: '#4b5054',
//             },
//             symbol: 'circle',
//             symbolSize: 6,
//             itemStyle: {
//                 color: '#1f2d3d',
//             },
//             emphasis: {
//                 label: {
//                     show: true,
//                     position: 'top',
//                     backgroundColor: '#324157',
//                     color: '#ffff',
//                     padding: [10, 20],
//                     distance: 10,
//                     borderRadius: 5,
//                     fontSize: 14,
//                 }
//             }
//         }],
//     };

//     return option
// }

// // 柱状图x轴标签原型
// const xAxisFloors = [
//     '北楼一层',
//     '北楼二层',
//     '北楼三层',
//     '北楼四层',
//     '北楼五层',
//     '北楼六层',
//     '南楼一层',
//     '南楼二层',
//     '南楼三层',
//     '南楼四层',
//     '南楼五层',
//     '南楼六层',
//     '南楼七层',
// ];

// /**
//  * @name 创建楼层列表
//  * @param {string} typeName 耗能类型名称
//  */
// const createXAxisData = (typeName) => {
//     return xAxisFloors.map(floor => {
//         return floor += typeName;
//     })
// }

// /**
//  * @name 根据表映射与token创建promise
//  * @param {array} meterArray 表映射
//  * @param {string} token 登录token
//  * @return 表对应数据
//  */
// const createPromisesByMeter = (meterArray, token) => {
//     return meterArray.map(function (meterData) {
//         const {
//             id,
//             type,
//             detail,
//         } = meterData;


//         const promise = new Promise(function (resolve, reject) {
//             // 当前抄表数据
//             $.ajax({
//                 type: 'POST',
//                 url: 'http://39.108.12.65:5713/DefaultAPI.asmx/ReadMeter',
//                 data: {
//                     LoginInfo: `{"Code":"admin","Token":"${token}"}`,
//                     ParamList: `{"MeterAddr":"${id}","ReadType":"1","FreezeDate":""}`
//                 },
//                 success: function (res) {
//                     // console.log('res', res);
//                     const text = $(res).find('string').text();
//                     const data = JSON.parse(text);
//                     // console.log('当前抄表数据data', data);
//                     if (data.Data[0]) {
//                         const value = Number(data.Data[0].MeterNumber);
//                         const result = {
//                             id,
//                             type,
//                             value,
//                             detail,
//                         };

//                         resolve(result);
//                     } else {
//                         const result = {
//                             id,
//                             type,
//                             detail,
//                         };

//                         resolve(result);
//                     }
//                 },
//                 error: function (err) {
//                     console.log('err', err);
//                     reject(err);
//                 }
//             })
//         })

//         return promise
//     })
// }

// // 获取饼图信息
// const getPipSeriesData = posts => {
//     // 遍历获取的数据，根据 type 类型进行数值累加
//     const meterMap = {};
//     for (const meterData of posts) {
//         const {
//             type,
//             value
//         } = meterData;

//         if (value) {
//             if (meterMap[type]) {
//                 meterMap[type] += value;
//             } else {
//                 meterMap[type] = value;
//             }
//         }
//     }

//     // console.log('meterMap', meterMap);

//     // 根据计算后的数据，生成饼图信息
//     const seriesData = [];
//     for (const key in meterMap) {
//         if (meterMap.hasOwnProperty(key)) {
//             const data = {
//                 name: key,
//                 value: Number(meterMap[key].toFixed(2)),
//             };
//             seriesData.push(data);
//         }
//     }

//     return seriesData
// }

// /**
//  * @name 获取月份序列
//  * @param {*} data 数据库中单个表的数据
//  */
// const getMonthIndex = (data) => {
//     return Number(data.FreezeDate.split('-')[1]) - 1
// }

// /**
//  * @name 根据返回的数据生成折线图数据
//  * @param {*} Data 基础数据
//  * @param {string} interval 显示间隔（monthly/weekly/daily）
//  */
// const get_chart_3_data = (Data, interval = "monthly") => {
//     const tempArray = []; // 临时数组
//     const startData = Data[0]; // 返回数组中首个数据

//     if (interval == "monthly") {
//         let preMonth = getMonthIndex(Data[1]);

//         const length = Data.length;
//         for (let i = 1; i < length; i++) {
//             const item = Data[i];
//             const month_index = getMonthIndex(item);

//             if ((month_index != preMonth) || (i == length - 1)) { // 切到下一个月
//                 tempArray[preMonth] = Number(item.MeterNumber); // 记录数据
//                 preMonth = month_index; // 记录当前月的序列
//             }
//         }

//         const result = [];
//         const start_month_index = getMonthIndex(startData);

//         let next_month = 0;
//         if (start_month_index != 11) { // 数组中首个数据的月数不是12月
//             next_month = start_month_index + 1;
//         }

//         for (let i = 0; i < 12; i++) {
//             if (tempArray[i]) {
//                 if (i == next_month) {
//                     result[i] = Number(Number(tempArray[i] - Number(startData.MeterNumber)).toFixed(2));
//                 } else {
//                     result[i] = Number(Number(tempArray[i] - tempArray[i - 1]).toFixed(2));
//                 }
//             } else {
//                 result[i] = 0;
//             }
//         }

//         // console.log('result', result);

//         return result
//     } else if (interval == "weekly") {
//         const result = [];

//         const tempObject = {};
//         const length = Data.length;
//         for (let i = 1; i < length; i++) {
//             const data = Data[i];

//             const dayIndex = new Date(data.FreezeDate).getDay();
//             if (dayIndex == 0) { // 周日
//                 const weekIndex = getWeekIndexOfYear(data.FreezeDate);
//                 tempObject[weekIndex] = data.MeterNumber;
//             }
//         }

//         // 遍历一年的周数
//         for (let i = 1; i < 55; i++) {
//             if (tempObject[i] && tempObject[i - 1]) {
//                 result[i - 1] = Number((Number(tempObject[i]) - Number(tempObject[i - 1])).toFixed(2));
//             } else {
//                 result[i - 1] = 0;
//             }
//         }

//         return result
//     } else if (interval == "daily") {
//         const result = [];

//         const length = Data.length;
//         for (let i = 1; i < length; i++) {
//             result[i - 1] = Number(Number(Data[i].MeterNumber - Data[i - 1].MeterNumber).toFixed(2));
//         }

//         return result
//     }
// }

// /**
//  * @name 更新折线图
//  * @param {*} opts 
//  * @param {dom} opts.chart 将要更新的图表
//  * @param {string} opts.id 将要更新的电/水表的id
//  * @param {number} opts.year 将要更新的电/水表的年份
//  * @param {string} opts.type 将要更新的电/水表的类型（water/electric）
//  * @param {string} opts.interval 将要更新的电/水表的间隔(monthly/weekly/daily)
//  * @param {string} opts.name 将要更新的电/水表的名称
//  */
// const update_chart_3 = (opts) => {
//     const {
//         chart,
//         id,
//         year,
//         type,
//         interval,
//         name,
//     } = opts

//     $.ajax({
//         type: 'POST',
//         url: 'http://39.108.12.65:5713/DefaultAPI.asmx/GetData',
//         data: {
//             LoginInfo: `{"Code":"admin","Token":"${token}"}`,
//             ParamList: `{"MeterAddr":"${id}","DataType":"2","BeginDate":"${year - 1}-12-31","EndDate":"${year}-12-31","PageSize":"100000"}`
//         },
//         success: function (res) {
//             const text = $(res).find('string').text();
//             const data = JSON.parse(text);
//             // console.log('当前抄表数据data', data);
//             if (data.Data.length == 0) {
//                 return
//             }
//             const result = get_chart_3_data(data.Data, interval);
//             // console.log('result', result);
//             let xAxisData;
//             if (interval == 'daily') {
//                 xAxisData = [];

//                 const Data = data.Data;
//                 const length = Data.length;

//                 for (let i = 1; i < length; i++) {
//                     const item = Data[i];
//                     xAxisData.push(item.FreezeDate);
//                 }
//             } else if (interval == 'weekly') {
//                 xAxisData = [];

//                 const length = result.length;
//                 for (let i = 0; i < length; i++) {
//                     xAxisData.push(`${i + 1}周`)
//                 }
//             }

//             // 生成折线图配置
//             const chart_3_option = createChartOption3({
//                 titleText: type == 'water' ? `${name}每月耗水(kWh)` : `${name}每月能耗(kWh)`,
//                 seriesData: result,
//                 xAxisData: xAxisData || undefined,
//             });

//             chart.resize();
//             chart.setOption(chart_3_option);
//         },
//         error: function (err) {
//             console.log('err', err);
//         }
//     })
// }

// // 初始化echarts图表
// const chart_electric_1 = echarts.init(document.querySelector('#tab-electric>.chart-1'));
// const chart_electric_2 = echarts.init(document.querySelector('#tab-electric>.chart-2'));
// const chart_electric_3 = echarts.init(document.querySelector('#tab-electric>.chart-3'));
// const chart_water_1 = echarts.init(document.querySelector('#tab-water>.chart-1'));
// const chart_water_2 = echarts.init(document.querySelector('#tab-water>.chart-2'));
// const chart_water_3 = echarts.init(document.querySelector('#tab-water>.chart-3'));

// const chart_equipment_1 = echarts.init(document.querySelector('#container>.equipment-mask>.chart-1'));
// const chart_equipment_2 = echarts.init(document.querySelector('#container>.equipment-mask>.chart-2'));

// // 在图表中插入dom与绑定事件
// const shut_dom = `<span class="shut"></span>`;
// $('#container>.equipment-mask>.chart-1').append(shut_dom);
// $('#container>.equipment-mask>.chart-2').append(shut_dom);

// const back_dom = `<span class="back"></span>`;
// $('#tab-water>.chart-2').append(back_dom);
// $('#tab-water>.chart-3').append(back_dom);
// $('#tab-electric>.chart-2').append(back_dom);
// $('#tab-electric>.chart-3').append(back_dom);

// $('#tab-electric, #tab-water').on('click', '>div>.back', function () {
//     const $chart = $(this).parent();

//     $chart.removeClass('active');

//     if ($chart.hasClass('chart-2')) {
//         $chart.siblings('.chart-1').addClass('active');
//     } else if ($chart.hasClass('chart-3')) {
//         $chart.siblings('.chart-2').addClass('active');
//     }
// });

// const edit_box = `
//     <div class="edit-box">
//         <div class="year-switch">2019</div>
//         <div class="radio-box">
//             <span class='active' data-key="monthly">月</span>
//             <span data-key="weekly">周</span>
//             <span data-key="daily">日</span>
//         </div>
//     </div>
// `;
// $('#tab-electric>.chart-3').append(edit_box);
// $('#tab-water>.chart-3').append(edit_box);
// $('#container>.equipment-mask>.chart-2').append(edit_box);

// $('.chart-wrap').on('click', '>.edit-box>.radio-box>span', function () {
//     if (!$(this).hasClass('active')) {
//         $(this).addClass('active').siblings().removeClass('active');

//         const interval = $(this).attr('data-key');
//         const type = $(this).parents('.chart-box').attr('data-type');

//         if (type == 'electric') {
//             electric_chart_opts.interval = interval;
//             update_chart_3(electric_chart_opts);
//         } else if (type == 'water') {
//             water_chart_opts.interval = interval;
//             update_chart_3(water_chart_opts);
//         } else if (type == 'equipment') {
//             equipment_chart_opts.interval = interval;
//             update_chart_3(equipment_chart_opts);
//         }
//     }
// })

// // 登录
// $.ajax({
//     type: 'POST',
//     url: 'http://39.108.12.65:5713/DefaultAPI.asmx/Login',
//     data: {
//         LoginInfo: '{"Code":"admin","Pwd":"6F92A645713538DD97BE"}',
//         ParamList: ''
//     },
//     success: function (res) {
//         const text = $(res).find('string').text();
//         const data = JSON.parse(text);
//         // console.log('data', data);
//         token = data.Data[0].Token;
//         // console.log('token', token);

//         const water_promises = createPromisesByMeter(waterMeter, token);

//         Promise.all(water_promises).then(function (posts) {
//             // console.log('water posts', posts);
//             waterPosts = posts;

//             const seriesData = getPipSeriesData(posts);
//             // console.log('water seriesData', seriesData);

//             // 生成水表饼状图配置
//             const water_chart_1_option = createChartOption1({
//                 titleText: '耗水占比统计',
//                 seriesName: '用水区域',
//                 seriesData: seriesData,
//                 unit: 't',
//             });

//             chart_water_1.setOption(water_chart_1_option);
//         }).catch(function (reason) {
//             console.log('reason', reason);
//         });

//         const electric_promises = createPromisesByMeter(electricMeter, token);

//         Promise.all(electric_promises).then(function (posts) {
//             // console.log('electric posts', posts);
//             electricPosts = posts;

//             const seriesData = getPipSeriesData(posts);
//             // console.log('electric seriesData', seriesData);

//             // 生成电表饼状图配置
//             const electric_chart_1_option = createChartOption1({
//                 titleText: '耗电占比统计',
//                 seriesName: '用电区域',
//                 seriesData: seriesData,
//                 unit: 'kw·h',
//             });

//             chart_electric_1.setOption(electric_chart_1_option);
//         }).catch(function (reason) {
//             console.log('reason', reason);
//         });
//     },
//     error: function (err) {
//         console.log('err', err);
//     }
// })


// // 绑定水表饼图点击
// chart_water_1.on('click', function (event) {
//     // console.log('event', event);
//     $(this._dom).removeClass('active').siblings('.chart-2').addClass('active');

//     const name = event.name;

//     const xAxisData = [];
//     const seriesData = [];

//     for (const meterData of waterPosts) {
//         const {
//             type,
//             value,
//             detail
//         } = meterData
//         if (type == name) {
//             xAxisData.push(detail);
//             seriesData.push(value);
//         }
//     }

//     // 生成水表柱状图配置
//     const water_chart_2_option = createChartOption2({
//         titleText: `${name}耗水(t)`,
//         xAxisData: xAxisData,
//         seriesData: seriesData,
//     });

//     chart_water_2.resize();
//     chart_water_2.setOption(water_chart_2_option);
// });

// // 绑定电表饼图点击
// chart_electric_1.on('click', function (event) {
//     // console.log('event', event);
//     $(this._dom).removeClass('active').siblings('.chart-2').addClass('active');

//     const name = event.name;

//     const xAxisData = [];
//     const seriesData = [];

//     for (const meterData of electricPosts) {
//         const {
//             type,
//             value,
//             detail
//         } = meterData
//         if (type == name) {
//             xAxisData.push(detail);
//             seriesData.push(value);
//         }
//     }

//     // 生成电表柱状图配置
//     const electric_chart_2_option = createChartOption2({
//         titleText: `${name}能耗(kWh)`,
//         xAxisData: xAxisData,
//         seriesData: seriesData,
//     })

//     chart_electric_2.resize();
//     chart_electric_2.setOption(electric_chart_2_option);
// });

// const equipment_chart_opts = {
//     chart: chart_equipment_2,
//     id: 402019124810 || undefined,
//     year: undefined,
//     type: 'equipment',
//     interval: 'monthly',
//     name: undefined,
// }
// // 绑定机电图表饼状图点击
// chart_equipment_1.on('click', function (event) {
//     // console.log('this', this);
//     $(this._dom).removeClass('active').siblings('.chart-2').addClass('active');
//     const name = event.name;

//     equipment_chart_opts.year = new Date().getFullYear();
//     equipment_chart_opts.name = name;
//     equipment_chart_opts.interval = $(this._dom).siblings('.chart-2').find('>.edit-box>.radio-box>span.active').attr('data-key');
//     update_chart_3(equipment_chart_opts);
// })


// const water_chart_opts = {
//     chart: chart_water_3,
//     id: undefined,
//     year: undefined,
//     type: 'water',
//     interval: 'monthly',
//     name: undefined,
// }
// chart_water_2.on('click', function (event) {
//     // return
//     // console.log('event', event);
//     $(this._dom).removeClass('active').siblings('.chart-3').addClass('active');

//     const name = event.name;

//     // let id;
//     for (const waterData of waterMeter) {
//         if (waterData.detail == name) {
//             water_chart_opts.id = waterData.id;
//             break
//         }
//     }

//     if (water_chart_opts.id) {
//         water_chart_opts.year = new Date().getFullYear();
//         water_chart_opts.name = name;
//         water_chart_opts.interval = $(this._dom).siblings('.chart-3').find('>.edit-box>.radio-box>span.active').attr('data-key');
//         update_chart_3(water_chart_opts);
//     }
// })

// const electric_chart_opts = {
//     chart: chart_electric_3,
//     id: undefined,
//     year: undefined,
//     type: 'electric',
//     interval: 'monthly',
//     name: undefined,
// }
// chart_electric_2.on('click', function (event) {
//     // return
//     // console.log('event', event);
//     $(this._dom).removeClass('active').siblings('.chart-3').addClass('active');

//     const name = event.name;

//     // let id;
//     for (const electricData of electricMeter) {
//         if (electricData.detail == name) {
//             electric_chart_opts.id = electricData.id;
//             break
//         }
//     }

//     if (electric_chart_opts.id) {
//         electric_chart_opts.year = new Date().getFullYear();
//         electric_chart_opts.name = name;
//         electric_chart_opts.interval = $(this._dom).siblings('.chart-3').find('>.edit-box>.radio-box>span.active').attr('data-key');
//         update_chart_3(electric_chart_opts);
//     }
// });

// laydate.set({
//     type: 'datetime',
//     isInitValue: false,
//     btns: ['clear', 'confirm'],
//     theme: '#324157',
//     calendar: true,
// })

// // 能耗折线图内的日历事件
// laydate.render({
//     elem: '#tab-electric>.chart-3>.edit-box>.year-switch',
//     type: 'year',
//     isInitValue: true,
//     done: function (value, date) {
//         // console.log('value', value);
//         // console.log('date', date);
//         let year;
//         if (date.year) {
//             // 执行修改命令
//             year = date.year;
//         } else {
//             // 执行清空命令
//             year = new Date().getFullYear();
//             $(this.elem).text(year);
//         }

//         $(this.elem).attr('data-year', year);

//         electric_chart_opts.year = year;
//         update_chart_3(electric_chart_opts);

//         // console.log('this.elem', this.elem);
//     }
// })

// // 水耗折线图内的日历事件
// laydate.render({
//     elem: '#tab-water>.chart-3>.edit-box>.year-switch',
//     type: 'year',
//     isInitValue: true,
//     done: function (value, date) {
//         // console.log('value', value);
//         // console.log('date', date);
//         let year;
//         if (date.year) {
//             // 执行修改命令
//             year = date.year;
//         } else {
//             // 执行清空命令
//             year = new Date().getFullYear();
//             $(this.elem).text(year);
//         }

//         $(this.elem).attr('data-year', year);

//         water_chart_opts.year = year;
//         update_chart_3(water_chart_opts);

//         // console.log('this.elem', this.elem);
//     }
// })

// $('#top-menu>.statistics>a').one('click', function () {
//     setTimeout(function () {
//         chart_electric_1.resize();
//     })
// })

// $('#tab-statistics>.tab-menu>.water>a').one('click', function () {
//     setTimeout(function () {
//         chart_water_1.resize();
//     })
// })

// if (module.hot) {
//     module.hot.accept();
// }