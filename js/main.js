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

    // merge 后的建筑组索引
    const merge_builds = {
        '北楼': undefined,
        '亭廊': undefined,
        '南楼': undefined,
    };

    // 建筑索引
    const builds_map = {
        '西楼': undefined,
        '连廊': undefined,
        '东楼': undefined,
    }

    // 房间划分
    const room_mesh_map = {
        '北楼': [],
        '亭廊': [],
        '南楼': [],
    }

    // 楼层高度
    const floor_heights = {
        '北楼': [-0.45, 4.2, 7.8, 11.4, 15, 18.6, 22.2],
        '亭廊': [-0.45, 4.5, 7.8],
        '南楼': [-0.45, 3.82, 7.02, 10.22, 13.42, 16.62, 19.82, 23.02, 26.62],
    }

    // clip 材质索引
    const clip_material_map = {
        '北楼': [],
        '亭廊': [],
        '南楼': [],
    }

    let saveCallback; // 确认框的保存回调
    let continueCallback; // 确认框的继续回调

    // ======================= 日期时间 =======================
    laydate.set({
        type: 'datetime',
        isInitValue: false,
        btns: ['clear', 'confirm'],
        theme: '#324157',
        calendar: true,
    })

    // 首页左栏日历
    laydate.render({
        elem: '#tab-home .operate-wrap>.wrap-left>.top-area>.calendar',
        done: function (value, date) {
            // console.log('value', value);
            // console.log('date', date);
            if (date.year) {
                // 执行修改命令
            } else {
                // 执行清空命令
            }
            // console.log('this.elem', this.elem);
        }
    });

    // 首页右栏日历
    laydate.render({
        elem: '#tab-home .operate-wrap>.wrap-right>.edit-area>.time>.calendar',
        done: function (value, date) {
            // console.log('value', value);
            // console.log('date', date);
            if (date.year) {
                // 执行修改命令
            } else {
                // 执行清空命令
            }
            // console.log('this.elem', this.elem);
        }
    })

    // 管理页左栏日历
    laydate.render({
        elem: '#tab-manage .operate-wrap>.wrap-left>.top-area>.calendar',
        done: function (value, date) {
            // console.log('value', value);
            // console.log('date', date);
            if (date.year) {
                // 执行修改命令
            } else {
                // 执行清空命令
            }
            // console.log('this.elem', this.elem);
        }
    })

    // 管理页右栏日历
    laydate.render({
        elem: '#tab-manage .operate-wrap>.wrap-right>.edit-area>.time>.calendar',
        done: function (value, date) {
            // console.log('value', value);
            // console.log('date', date);

            if (date.year) {
                // 执行修改命令

            } else {
                // 执行清空命令
            }

            $(this.elem).attr('data-time', Date.parse(value));
        }
    })

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

        if (instant) {
            position.copy(new_position);
            target.copy(new_target);
        } else {
            let time = max_distance / 40 / scale_rate;

            if (time > 3) {
                time = 3;
            }
            const tween_p = new TWEEN.Tween(position);
            tween_p.to(new_position, ).start();

            // 更新控制器target
            const tween_t = new TWEEN.Tween(target);
            tween_t.to(new_target, time).start();
        }

        position_m = new_position.clone();
        target_m = new_target.clone();
    };

    // 添加高亮
    const addHightLight = (mesh) => {
        mesh.material.opacity = 1;
        selected_room = mesh;
    }

    // 清除高亮
    const clearHightLight = () => {
        if (selected_room) {
            selected_room.material.opacity = 0;
            selected_room = undefined;
        }
    }

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

        walkToTarget(start, end, instant)
    }

    // 视角移动到 room 上
    const walkToRoom = (mesh) => {
        // 记录控制器当前相机位置和 target
        const position = controls.object.position;
        const target = controls.target;

        if (!position_m) {
            position_m = position.clone();
            target_m = target.clone();
        }

        // 清除地板高亮
        clearHightLight();

        // 显现底板mesh
        addHightLight(mesh);

        const box3 = new THREE.Box3();
        box3.expandByObject(mesh);

        // 移动后控制器的 target
        const new_target = box3.getCenter(new THREE.Vector3());

        // 计算相机位置指向target的方向
        const direction = new THREE.Vector3();
        direction.x = position.x - target.x;
        direction.y = position.y - target.y;
        direction.z = position.z - target.z;
        direction.normalize();

        const offset = 12000 * scale_rate; // 移动后 target 与相机的距离

        // 移动后的相机位置
        const new_position = new THREE.Vector3();
        new_position.x = direction.x * 1 + new_target.x;
        new_position.y = offset + new_target.y;
        new_position.z = direction.z * 1 + new_target.z;


        const start = {
            position,
            target
        };

        const end = {
            new_position,
            new_target
        }

        walkToTarget(start, end)
    }

    // 创建房间地面的 mesh
    const createRoomMesh = (roomData) => {
        const result = [];

        const {
            roomName,
            roomPoints,
            buildName,
            floorIndex,
        } = roomData;

        const scale = 304.8;

        for (const array of roomPoints) {
            const shape = new THREE.Shape();
            const length = array.length;

            for (let i = 0; i < length; i++) {
                const point = array[i];

                if (i == 0) {
                    shape.moveTo(point.X * scale, point.Y * scale);
                } else {
                    shape.lineTo(point.X * scale, point.Y * scale)
                }

            }
            const firstPoint = array[0];
            shape.lineTo(firstPoint.X * scale, firstPoint.Y * scale);

            const material = new THREE.MeshPhongMaterial({
                color: '#324157',
                transparent: true,
                opacity: 0,
            });
            const geometry = new THREE.ShapeGeometry(shape);

            const mesh = new THREE.Mesh(geometry, material);
            mesh.rotation.x = -Math.PI / 2;

            // mesh.position.y = firstPoint.Z * scale + 5;
            mesh.position.y = floor_heights[buildName][floorIndex] * 1000 + 250;
            if (buildName == '南楼') {
                if (roomName == '107' || roomName == '108') {
                    mesh.position.y += 200;
                }
            }

            mesh.name = '房间';
            mesh.roomName = roomName;
            mesh.buildName = buildName;
            mesh.floorIndex = floorIndex;

            result.push(mesh);
        }

        return result
    }
    // 初始化 clip 的 constant 值
    const initClipConstant = (plane_array, build) => {
        // clip 划分
        plane_array[0].constant = 50000; // 向下
        plane_array[1].constant = 10000; // 向上

        // 显示所有楼层
        for (const child of build.children) {
            if (child.name == '楼层组') {
                for (const floor of child.children) {
                    floor.visible = true;
                }
            }
        }
    }

    // 选择一个房间时，dom 匹配
    const dom_room_select = (roomName) => {
        const $build_tab = $('#container>.select-wrap>.build-tab');
        const $room_switch = $build_tab.siblings('.room-switch');

        const $room_item = $room_switch.find(`>.dropdown-menu>li>a[data-index=${roomName}]`);

        const room_text = $room_item.text();

        // 更新房间显示与下拉菜单
        $room_switch.find('>.room-text').text(room_text).attr('data-index', roomName);

        if (roomName == 'all') {
            // 显示运维按钮
            $('.operate-btn').hide();
            // 更新并显示空调与新风
            $('.air-system').hide();
            // 清除地板高亮
            clearHightLight();
        } else {
            // 显示运维按钮
            $('.operate-btn').show();
            // 更新并显示空调与新风
            $('.air-system').show();
        }
    }

    // 清空选择的房间时，dom 匹配
    const dom_room_clear = () => {
        // 隐藏房间显示
        $('.select-wrap .room-switch').hide();

        // 隐藏运维按钮
        $('.operate-btn').hide();

        // 隐藏空调与新风
        $('.air-system').hide();

        // 清除地板高亮
        clearHightLight();
    }

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
    const dom_oper_item_select = (element) => {
        const id = Number($(element).attr('data-id'));

        const $wrap_left = $(element).parents('.wrap-left');
        const $wrap_right = $wrap_left.siblings('.wrap-right');

        const $view_area = $wrap_right.find('.view-area');
        const $edit_area = $wrap_right.find('.edit-area');

        $view_area.show();
        $edit_area.hide();

        $(element).addClass('active').siblings().removeClass('active');

        let this_data;
        for (const data of home_oper_data) {
            if (data.id == id) {
                this_data = data;
                dom_update_oper_view($view_area, this_data);
                break;
            }
        }
    }

    // 删除运维单项时
    const dom_oper_item_delete = (element) => {
        const $content = $(element).parent();
        $(element).remove();

        dom_oper_item_select($content.children()[0]);
    }

    // 更新运维展示界面信息
    const dom_update_oper_view = ($view_area, data) => {
        const {
            title,
            time,
            state,
            content
        } = data

        $view_area.find('>.title>.text').text(title); // 更新标题
        $view_area.find('>.time>.text').text(getDateByTime(time)); // 更新时间
        $view_area.find(`>.state>.text`).attr('data-state', state); // 更新状态
        $view_area.find('>.content>textarea').val(content); // 更新内容
    }

    // 获取运维编辑界面信息
    const get_oper_edit_data = ($edit_area) => {
        const title = $edit_area.find('>.title>input').val();
        const time = Number($edit_area.find('>.time>.calendar').attr('data-time'));
        const state = $edit_area.find('>.state>.radio-box>span.selected').attr('date-state');
        const content = $edit_area.find('>.content>textarea').val();

        return {
            title,
            time,
            state,
            content,
        }
    }

    // 更新运维编辑界面信息
    const update_oper_edit_dom = ($edit_area, data) => {
        const {
            title,
            time,
            state,
            content
        } = data

        $edit_area.find('>.title>input').val(title); // 更新标题
        laydate.render({
            elem: $edit_area.find('>.time>.calendar')[0],
            value: getDateByTime(time),
        }); // 清空时间/设置为当前时间
        $edit_area.find(`>.state>.radio-box>span[data-state=${state}]`).addClass('selected').siblings().removeClass('selected'); // 更新状态
        $edit_area.find('>.content>textarea').val(content); // 更新内容
    }

    // 管理页切换楼栋
    const manage_switch_build = (element) => {
        const build_name = $(element).attr('data-name');
        const floors = build_data[build_name];

        // 根据 build_name 向后台获取信息

        // 楼层下拉列表更新 ----------------------
        const firstData = {
            index: 'all',
            floorName: '所有楼层'
        }
        const floors_dom = createFloorList(floors, firstData);

        const $floor_switch = $(element).parent().siblings('.floor-switch');

        $floor_switch.find('>.floor-text').text(firstData.floorName).attr('data-index', firstData.index);
        $floor_switch.find('>.dropdown-menu').html(floors_dom);

        // 房间下拉列表更新 ----------------------
        const $room_switch = $floor_switch.siblings('.room-switch');

        const rooms = [];
        for (const floor of floors) {
            rooms.push(...floor.rooms);
        }
        const rooms_dom = createRoomList(rooms, true, '室');
        $room_switch.find('>.room-text').text('所有房间').attr('data-index', 'all');
        $room_switch.find('>.dropdown-menu').html(rooms_dom);
    }

    // 管理页切换楼层
    const manage_switch_floor = (element) => {
        const $floor_switch = $(element).parents('.floor-switch');
        const $build_tab = $floor_switch.siblings('.build-tab');
        const $room_switch = $floor_switch.siblings('.room-switch');

        const $active_build = $build_tab.find('>span.active');
        const build_name = $active_build.attr('data-name');

        const active_floors = build_data[build_name];
        let active_floor_index = $(element).attr('data-index');

        const rooms = [];
        if (active_floor_index == 'all') {
            for (const floor of active_floors) {
                rooms.push(...floor.rooms);
            }
        } else {
            active_floor_index = Number(active_floor_index);

            // 根据 build_name active_floor_index 向后台获取信息
            rooms.push(...active_floors[active_floor_index].rooms);
        }

        const rooms_dom = createRoomList(rooms, true, '室');
        $room_switch.find('>.room-text').text('所有房间').attr('data-index', 'all');
        $room_switch.find('>.dropdown-menu').html(rooms_dom);
    }

    // 管理页切换房间
    const manage_switch_room = (element) => {
        const $room_switch = $(element).parents('.room-switch');
        const $build_tab = $room_switch.siblings('.build-tab');
        const $floor_switch = $room_switch.siblings('.room-switch');

        const $active_build = $build_tab.find('>span.active');

        const build_name = $active_build.attr('data-name');
        const active_floor_index = $floor_switch.find('>.floor-text').attr('data-index');
        const active_room_index = $(element).attr('data-index');

        // 根据 build_name active_floor_index active_room_index 向后台获取信息

    }


    // ####################### 运行 #######################
    document.oncontextmenu = function () {
        return false;
    }

    // ======================= 插入 dom =======================
    importDom();

    // 切换显示首页第一个运维项目
    const home_first_oper_item = $('#tab-home .operate-wrap .wrap-left>.content').children()[0];
    dom_oper_item_select(home_first_oper_item);

    // 切换显示管理页第一个运维项目
    const manage_first_oper_item = $('#tab-manage .operate-wrap .wrap-left>.content').children()[0];
    dom_oper_item_select(manage_first_oper_item);


    // ======================= 绑定事件 =======================
    // +++++++++++++++++++++++ 确认界面事件 +++++++++++++++++++++++
    $('#confirm-mask').on('click', '>.confirm-box>.btns>span', function () {
        if ($(this).hasClass('save')) { // 是
            // 保存并继续
            if (saveCallback) saveCallback();
            if (continueCallback) continueCallback();
        } else if ($(this).hasClass('deny')) { // 否
            // 不保存，继续
            if (continueCallback) continueCallback();
        } else if ($(this).hasClass('cancel')) { // 取消
            // 不保存，不继续

        }

        $('#confirm-mask').removeClass('active');
        saveCallback = undefined;
        continueCallback = undefined;
    })


    // +++++++++++++++++++++++ 运维共用事件 +++++++++++++++++++++++
    // 运维项目表单切换事件
    $('.operate-wrap').on('click', '>.wrap-left>.content>.operate-item', function () {
        if (!$(this).hasClass('active')) {
            const $wrap_left = $(this).parents('.wrap-left');
            const $wrap_right = $wrap_left.siblings('.wrap-right');
            const $edit_area = $wrap_right.find('.edit-area');

            const display = $edit_area.css('display');

            if (display == 'block') {
                $('#confirm-mask').addClass('active');
                continueCallback = () => {
                    dom_oper_item_select(this);
                    $(this).addClass('active').siblings().removeClass('active');
                }
            } else {
                dom_oper_item_select(this);
                $(this).addClass('active').siblings().removeClass('active');
            }
        }
    });

    // 运维修改按钮
    $('.operate-wrap .wrap-right').on('click', '.view-area .modify-btn', function () {
        const $wrap_right = $(this).parents('.wrap-right');
        const $wrap_left = $wrap_right.siblings('.wrap-left');

        const $view_area = $wrap_right.find('.view-area');
        const $edit_area = $wrap_right.find('.edit-area');

        $view_area.hide();
        $edit_area.show();

        // 更新编辑页的楼层选择下拉菜单
        const $floor_switch = $edit_area.find('>.room>.room-area .floor-switch');
        if ($floor_switch.length > 0) {
            const active_build_name = $('#tab-manage>.operate-menu>.build-tab>span.active').attr('data-name');
            const floors = build_data[active_build_name];

            const floors_dom = createFloorList(floors);
            $floor_switch.find('>.dropdown-menu').html(floors_dom);
        }

        const id = Number($wrap_left.find('>.content>.operate-item.active').attr('data-id'));

        let this_data;
        for (const data of home_oper_data) {
            if (data.id == id) {
                this_data = data;
                update_oper_edit_dom($edit_area, this_data);
                break;
            }
        }
    });

    // 运维删除按钮
    $('.operate-wrap .wrap-right').on('click', '.view-area .delete-btn', function () {
        const $wrap_right = $(this).parents('.wrap-right');
        const $wrap_left = $wrap_right.siblings('.wrap-left');

        const $view_area = $wrap_right.find('.view-area');
        const $edit_area = $wrap_right.find('.edit-area');

        const $active_item = $wrap_left.find('>.content>.operate-item.active');
        const this_id = Number($active_item.attr('data-id'));

        // 向后台发送需要删除的数据的 id
        dom_oper_item_delete($active_item[0]); // ajax成功后执行此行
    })

    // 修改界面状态切换
    $('.operate-wrap .wrap-right').on('click', '.edit-area .state>.radio-box>span', function () {
        $(this).addClass('selected').siblings().removeClass('selected');
    });

    // 修改界面保存/取消按钮
    $('.operate-wrap .wrap-right').on('click', '.edit-area .btn-box>span', function () {
        const $edit_area = $(this).parents('.edit-area');
        const $view_area = $edit_area.siblings('.view-area');

        $view_area.show();
        $edit_area.hide();

        if ($(this).hasClass('save')) {
            const data = get_oper_edit_data($edit_area); // 获取编辑框内的信息

            const $operate_wrap = $(this).parents('.operate-wrap');
            const $active_item = $operate_wrap.find('>.wrap-left>.content>.operate-item.active')

            let this_id = $active_item.attr('data-id');
            if (this_id == 'new') {
                // 向后台发送新建的 data
                const dom = createOperItem(newData, true);
                $active_item.html(dom);
            } else {
                this_id = Number(this_id);
                // 向后台发送修改后的 data
            }
        } else {
            const $wrap_right = $edit_area.parent();
            const $wrap_left = $wrap_right.siblings('.wrap-left');
            const $active_item = $wrap_left.find('>.content>.operate-item.active');

            const active_id = $active_item.attr('data-id');
            if (active_id == 'new') {
                const other_first_item = $active_item.siblings()[0];
                dom_oper_item_select(other_first_item);
                $active_item.remove();
            }
        }
    });

    // 新建按钮
    $('.operate-wrap .wrap-left').on('click', '.bottom-area>.add-btn', function () {
        // 左侧添加新建条目
        const newData = {
            title: '新建',
            time: new Date().getTime(),
            state: 'unfinished',
            content: '',
        };

        const newDom = createOperItem(newData);

        const $wrap_left = $(this).parents('.wrap-left');
        const $wrap_right = $wrap_left.siblings('.wrap-right');

        const $content = $wrap_left.find('>.content');

        // 右侧打开编辑区域
        const $view_area = $wrap_right.find('.view-area');
        const $edit_area = $wrap_right.find('.edit-area');

        const newFunc = () => {
            $content.prepend(newDom);
            $content.children().removeClass('active');
            $content.children(':first-child').addClass('active');

            $view_area.hide();
            $edit_area.show();

            // 初始化编辑区域
            newData.title = '';
            update_oper_edit_dom($edit_area, newData);
        }

        const display = $edit_area.css('display');

        if (display == 'block') {
            $('#confirm-mask').addClass('active');
            continueCallback = () => {
                newFunc()
            }
        } else {
            newFunc();
        }

    })

    // +++++++++++++++++++++++ 首页页面事件 +++++++++++++++++++++++
    // ----------------------- 左侧切换事件 -----------------------
    // 房间切换按钮事件
    $('#tab-home .select-wrap .room-switch').on('click', '.dropdown-menu a', function () {
        const $build_tab = $('#container>.select-wrap>.build-tab');
        const $floor_switch = $build_tab.siblings('.floor-switch');
        const $room_switch = $build_tab.siblings('.room-switch');

        const $room_text = $room_switch.find('>.room-text');

        let roomName = $(this).attr('data-index');

        if (roomName == $room_text.attr('data-index')) {
            return
        }

        dom_room_select(roomName);

        const build_name = $build_tab.find('>span.active').attr('data-name');
        const floor_index = Number($floor_switch.find('>.floor-text').attr('data-index'));

        if (roomName == 'all') {
            clearHightLight();
            const build = builds_map[build_name]
            for (const child of build.children) {
                if (child.name == '楼层组') {
                    const floors = child.children;
                    for (const floor of floors) { // 遍历获取每层楼
                        if (floor.name && floor.name == floor_index + '楼') { // 目标楼层
                            walkToObjects(floor);
                        }
                    }
                }
            }
        } else {
            const meshs = room_mesh_map[build_name][floor_index];
            for (const mesh of meshs) {
                if (mesh.roomName == roomName) {
                    walkToRoom(mesh);
                    break
                }
            }
        }
    })

    // ----------------------- 首页运维事件 -----------------------
    // 首页运维入口按钮事件
    $('#tab-home .operate-btn').click(function () {
        $('.operate-mask').show();
    })

    // 首页运维界面关闭
    $('#tab-home .operate-wrap .shut').click(function () {
        $('#tab-home .operate-mask').hide();
    });

    // ----------------------- 空调新风 -----------------------
    // 隐藏空调/新风编辑框
    $(document).on('mouseup', function () {
        $('.air-edit').hide();
    })

    // 空调设置点击事件
    $('#tab-air-conditioner').on('click', '>.set', function () {
        $('.air-edit.air-conditioner').show();
    })

    // 阻止冒泡
    $('.air-edit').on('mouseup', function (e) {
        e.stopPropagation();
    })

    // 空调/新风编辑框关闭事件
    $('.air-edit').on('click', '.shut', function () {
        $(this).parents('.air-edit').hide();
    })

    // 新风设置点击事件
    $('#tab-fresh-air').on('click', '>.set', function () {
        $('.air-edit.fresh-air').show();
    })

    // 空调/新风编辑框内状态修改
    $('.air-edit .set-state>.attr-set').click(function () {
        const state = $(this).attr('data-state');

        let newState;

        if (state == 'off') {
            newState = 'on';
        } else {
            newState = 'off';
        }

        $(this).attr('data-state', newState);
        $(this).text(newState);
    })

    // 空调/新风的模式/风速修改
    $('.air-edit .set-mode>.attr-set>.dropdown-menu, .air-edit .set-cloud>.attr-set>.dropdown-menu').on('click', '>li>a', function () {
        const text = $(this).text();

        const $btn_menu = $(this).parents('.dropdown-menu').siblings('.btn-menu');
        $btn_menu.text(text);
    })

    // 空调/新风控制修改的确定按钮
    $('.air-edit>.content-box>.ensure').click(function () {
        $(this).parents('.air-edit').hide();
    })

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

            // position_m = undefined;
            // target_m = undefined;

            dom_room_select('all')
        }

        clearHightLight();
    })

    // 阴影开启
    $('#tab-home .shadow-btn').on('click', function () {
        $(this).toggleClass('active');

        if ($(this).hasClass('active')) {
            pointLight.castShadow = true;
        } else {
            pointLight.castShadow = false;
        }
    })

    // +++++++++++++++++++++++ 管理页面 +++++++++++++++++++++++
    // ----------------------- 上部切换 -----------------------
    // 楼栋切换
    $('#tab-manage>.operate-menu>.build-tab>span').click(function () {
        if (!$(this).hasClass('active')) {
            $(this).addClass('active').siblings().removeClass('active');
            manage_switch_build(this);
        }
    })

    // 楼层切换
    $('#tab-manage>.operate-menu>.floor-switch>.dropdown-menu').on('click', '>li>a', function () {
        const $floor_switch = $(this).parents('.floor-switch');
        const $floor_text = $floor_switch.find('>.floor-text');

        const active_index = $floor_text.attr('data-index');
        const this_index = $(this).attr('data-index');

        if (active_index != this_index) {
            manage_switch_floor(this);
            $floor_text.attr('data-index', this_index);
            $floor_text.text($(this).text());
        }
    })

    // 房间切换
    $('#tab-manage>.operate-menu>.room-switch>.dropdown-menu').on('click', '>li>a', function () {
        const $room_switch = $(this).parents('.room-switch');
        const $room_text = $room_switch.find('>.room-text');

        const active_index = $room_text.attr('data-index');
        const this_index = $(this).attr('data-index');

        if (active_index != this_index) {
            manage_switch_room(this);
            $room_text.attr('data-index', this_index);
            $room_text.text($(this).text());
        }
    })

    // 编辑界面的楼层切换
    $('#tab-manage>.operate-wrap>.wrap-right>.edit-area>.room>.room-area .floor-switch>.dropdown-menu').on('click', '>li>a', function () {
        let index = $(this).attr('data-index');

        const $floor_text = $(this).parents('.floor-switch').find('>.floor-text');

        $floor_text.attr('data-index', index);
        $floor_text.text($(this).text());

        // 更新房间选择下拉菜单
        const $room_switch = $(this).parents('.floor-box').siblings('.room-box').find('>.room-switch')
        const active_build_name = $('#tab-manage>.operate-menu>.build-tab>span.active').attr('data-name');
        const active_floors = build_data[active_build_name];
        const rooms = active_floors[index].rooms;

        const rooms_dom = createRoomList(rooms, false, '');
        $room_switch.find('>.room-text').text('请选择');
        $room_switch.find('>.room-text').attr('data-index', 'none');
        $room_switch.find('>.dropdown-menu').html(rooms_dom);
    })

    // 编辑界面的房间切换
    $('#tab-manage>.operate-wrap>.wrap-right>.edit-area>.room>.room-area .room-switch>.dropdown-menu').on('click', '>li>a', function () {
        const $room_switch = $(this).parents('.room-switch');
        const $room_text = $room_switch.find('>.room-text');

        const active_index = $room_text.attr('data-index');
        const this_index = $(this).attr('data-index');

        if (active_index != this_index) {
            // manage_switch_floor(this);
            $room_text.attr('data-index', this_index);
            $room_text.text($(this).text());
        }
    })


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
        camera.position.set(-80000.0, 40000.0, 75000.0);

        ambient = new THREE.AmbientLight(0xffffff);
        scene.add(ambient);
        // directional = new THREE.DirectionalLight(0xffffff, 0.5);
        // directional.position.set(0, 1, 0);
        // directional.castShadow = true;
        // directional.shadow.mapSize.width = 2048;
        // directional.shadow.mapSize.height = 2048;
        // // directional.shadow.bias = 0.0001;
        // var d = 500;
        // directional.shadow.mapSize.left = -d;
        // directional.shadow.mapSize.right = d;
        // directional.shadow.mapSize.top = d;
        // directional.shadow.mapSize.bottom = -d;
        // directional.shadow.camera.near = 1;
        // directional.shadow.camera.far = 1000;
        // directional.shadow.camera.zoom = 0.1;
        // // directional.shadow.camera.updateProjectionMatrix();
        // scene.add(directional);

        // var helper = new THREE.DirectionalLightHelper( directional, 50 );

        // scene.add( helper );
        let lightFar = 200000
        pointLight = new THREE.PointLight(0xffffff, 0.1, lightFar);
        pointLight.position.set(-10000, 100000, 10000);
        pointLight.castShadow = false; // default false
        scene.add(pointLight);

        // var sphereSize = 100;
        // var pointLightHelper = new THREE.PointLightHelper( pointLight, sphereSize, '#FF0000');
        // scene.add( pointLightHelper );

        pointLight.shadow.mapSize.width = 1024;
        pointLight.shadow.mapSize.height = 1024;
        pointLight.shadow.camera.near = 0.5;
        pointLight.shadow.camera.far = lightFar;

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.maxPolarAngle = Math.PI / 2;
        controls.minPolarAngle = 0.1;

        // clip平面
        const clipPlanes = [
            new THREE.Plane(new THREE.Vector3(0, -1, 0), 50000), // 向下
            new THREE.Plane(new THREE.Vector3(0, 1, 0), 10000), // 向上
        ]


        const helpers = new THREE.Group();
        helpers.name = 'clip helpers'
        helpers.add(new THREE.AxesHelper(20));
        helpers.add(new THREE.PlaneHelper(clipPlanes[0], 150000, 0xff0000));
        helpers.add(new THREE.PlaneHelper(clipPlanes[1], 150000, 0x00ff00));
        helpers.visible = true;
        // scene.add(helpers);

        // 待解析的 revit 文件路径数组
        // const paths = ['./models/land.js'];
        // const paths = [
        //     './models/north.js',
        //     './models/south.js',
        //     './models/tinglang.js',
        //     './models/land.js',
        // ];

        const loader = new THREE.FBXLoader();
        loader.load('./models/mep无土建.FBX', function(object) {
            console.log('object', object);
            scene.add(object);
        })

        const paths = [
            // './models/north.toolkipBIM',
            // './models/south.toolkipBIM',
            // './models/west.toolkipBIM',
            // './models/land.toolkipBIM',
            // './models/yulin.FBX',
            './models/east.toolkipBIM',
            './models/west.toolkipBIM',
            './models/lianlang.toolkipBIM',
            './models/floor.toolkipBIM',
        ];

        // 解析 revit 文件
        analysisRevit(paths, function (group, material_lib_box) {
            scene.add(group);

            // for (const material of material_lib_clip) {
            //     material.clippingPlanes = clipPlanes;
            //     material.clipIntersection = false;
            // }

            // const all_material = material_lib_box.concat(material_lib_clip);
            // // console.log('all_material', all_material);

            // const texture_loader = new THREE.TextureLoader();
            // for (const material of all_material) {
            //     if (material.name == "住建局外墙贴面（白）") {
            //         texture_loader.load('./img/brick.png', function (texture) {
            //             texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            //             texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            //             material.map = texture;
            //             material.needsUpdate = true;
            //         })
            //     } else if (material.name.includes('玻璃') || material.name == 'boli' || material.name == 'mesh_系统嵌板1') {
            //         material.transparent = true;
            //         material.opacity = 0.3;
            //         material.color.set('rgb(34, 34, 100)');
            //     } else if (material.name == '30厚SF-IIID底层防水砂浆' || material.name == '默认楼板') {
            //         material.color.setRGB(0.9, 0.9, 0.9);
            //     } else if (material.name == '默认墙') {
            //         material.color.setRGB(0.7, 0.7, 0.7);
            //     } else if (material.name == '松散-石膏板') {
            //         material.color.set('rgb(239, 239, 239)');
            //     } else if (material.name == 'BIAD_金属-钢-深灰色') {
            //         material.color.set('rgb(239, 239, 239)');
            //     } else if (material.name == '木材') {
            //         material.color.set('rgb(200, 162, 126)');
            //     } else if (material.name == 'Generic') {

            //     } else if (material.name == '金属') {
            //         material.color.set('rgb(200, 200, 200)');
            //     } else if (material.name == '金属-铝合金窗框') {
            //         material.color.set('rgb(34, 34, 34)');
            //     } else if (material.name == 'BIAD_金属_钢') {

            //     } else if (material.name == 'Concrete - Cast-in-Place Concrete') {

            //     } else if (material.name == '混凝土 - 现场浇注混凝土') {

            //     } else if (material.name == '电梯门') {

            //     } else if (material.name == '门 - 框架') {

            //     } else if (material.name == '12-20厚DS砂浆抹面，每3mx3m分缝，缝宽10-15，缝内填密封膏') {

            //     } else if (material.name == '金属-铝-白色') {

            //     } else if (material.name == 'mesh_Basic') {

            //     } else if (material.name == 'mesh_矩形钢管柱1') {
            //         material.color.set('rgb(160, 167, 173)');
            //     }
            // }

            // // 遍历最外层 group, 获取三栋楼
            for (const child of group.children) {
                const key = child.name;
                builds_map[key] = child;
            }

            walkToObjects(group, true);
            // walkToObjects(scene, true);
            // console.log(scene);

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
                    show_home_room_dom(); // 出现房间选择下拉界面
                } else {
                    dom_room_clear(); // 收起房间下拉等多个界面
                    for (const key in builds_map) {
                        if (builds_map.hasOwnProperty(key)) {
                            initClipConstant(clipPlanes, builds_map[key]);
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
                // $(this).addClass('active').siblings().removeClass('active');
                let index = $(this).attr('data-index');

                const $floor_text = $(this).parents('.floor-switch').find('>.floor-text');

                $floor_text.attr('data-index', index);
                $floor_text.text($(this).text());

                dom_room_clear();

                const $active_build = $('#tab-home .select-wrap .build-tab>span.active');

                if ($active_build.length == 1) {
                    const active_build_name = $active_build.attr('data-name');
                    const build = builds_map[active_build_name];

                    if (index == 'all') {
                        initClipConstant(clipPlanes, build);
                        walkToObjects(build);
                    } else {
                        index = Number(index);

                        if ($active_build.length == 1) {
                            // show_home_room_dom(); // 出现房间选择下拉界面
                        }

                        // 进行 clip 位置调整
                        // const build_constant = floor_heights[active_build_name];
                        // if (!build_constant[index]) {
                        //     clipPlanes[0].constant = -10000 * scale_rate // 向下
                        // } else {
                        //     const y_0 = build_constant[index + 1] * 1000 * scale_rate;
                        //     const y_1 = build_constant[index] * 1000 * scale_rate;

                        //     clipPlanes[0].constant = y_0 // 向下
                        //     clipPlanes[1].constant = -y_1 // 向上
                        // }


                        const floor_index = index + 1;
                        // 遍历获取每栋楼的楼层组
                        for (const child of build.children) {
                            if (child.name == '楼层组') {

                                const floors = child.children;
                                for (const floor of floors) { // 遍历获取每层楼
                                    if (floor.name && floor.name == floor_index + '楼') { // 显示目标楼层
                                        console.log('floor', floor);
                                        floor.visible = true;
                                        walkToObjects(floor);
                                    } else {
                                        floor.visible = false;
                                    }
                                }
                            }
                        }
                    }
                }
            })
        })

        // 解析房间信息
        /*
        $.getJSON('./js/data/roomData.js', function (data) {
            // console.log('data', data);
            return
            const roomGroup = new THREE.Group();
            roomGroup.name = '房间地面组';
            scene.add(roomGroup);

            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    const roomPoints = data[key];

                    const build_room = key.split(' ')[1];
                    const split_arr = build_room.split('-');

                    if (split_arr.length == 2 && split_arr[1] != '') { // 既有楼栋，又有房间名时

                        // 过滤掉空数组
                        const newPoints = roomPoints.filter(function (roomPoint) {
                            return roomPoint.length > 0
                        })

                        // 当没有有效房间点位时，进入下一轮循环
                        if (newPoints.length == 0) {
                            continue
                        }

                        const build_mark = split_arr[0]; // 值为大写的英文字母
                        const room_name = split_arr[1]; // 值为房间号字符串

                        // 房间后首位数字减 1
                        const index = Number(room_name.slice(0, 1)) - 1;

                        let build_name;
                        if (build_mark == 'N') {
                            build_name = '北楼';
                        } else if (build_mark == 'S') {
                            build_name = '南楼';
                        } else {
                            build_name = '亭廊';
                        }

                        // 一个房间的数据
                        const roomData = {
                            buildName: build_name,
                            floorIndex: index,
                            roomName: room_name,
                            roomPoints: newPoints
                        };

                        let room_build = room_mesh_map[build_name];

                        // 向场景中添加房间地板的mesh
                        const meshs = createRoomMesh(roomData);
                        for (const mesh of meshs) {
                            roomGroup.add(mesh);

                            if (!room_build[index]) { // 未有该楼层
                                room_build[index] = [mesh]
                            } else {
                                room_build[index].push(mesh);
                            }
                        }

                        // 向变量放入数据
                        let build = build_data[build_name];
                        if (!build[index]) { // 未有该楼层
                            build[index] = {
                                floorName: `${index + 1}楼`,
                                rooms: [roomData],
                            }
                        } else { // 已有该楼层
                            build[index].rooms.push(roomData);
                        }
                    }
                }
            }

            // console.log('build_data', build_data);
            // console.log('room_mesh_map', room_mesh_map)

            // 触发一次运维页的楼栋切换
            // const manage_first_build_tab = $('#tab-manage .operate-menu .build-tab').children()[0];
            // manage_switch_build(manage_first_build_tab);

            // 添加房间选择的射线函数绑定
            $(container).on('mousedown', '>canvas', function (event) {
                if (event.button != 0) return

                const $build_tab = $('#container>.select-wrap>.build-tab');
                const $floor_switch = $build_tab.siblings('.floor-switch');

                if ($build_tab.length != 1) {
                    return
                }

                let floor_index = $floor_switch.find('>.floor-text').attr('data-index')
                if (floor_index == 'all') {
                    return
                }

                const build_name = $build_tab.find('>span.active').attr('data-name');
                floor_index = Number(floor_index);

                const target_array = room_mesh_map[build_name][floor_index];

                const raycaster = getRaycaster(event);
                const intersects = raycaster.intersectObjects(target_array);

                if (intersects.length > 0) {
                    mousedown_point = intersects[0].point;
                }
            })

            $(container).on('mouseup', '>canvas', function (event) {
                // 未在画布内按下，则返回
                if (!mousedown_point) {
                    return
                }

                if (event.button != 0) {
                    return
                }

                const $build_tab = $('#container>.select-wrap>.build-tab');
                const $floor_switch = $build_tab.siblings('.floor-switch');

                if ($build_tab.length != 1) {
                    return
                }

                let floor_index = $floor_switch.find('>.floor-text').attr('data-index')
                if (floor_index == 'all') {
                    return
                }

                const build_name = $build_tab.find('>span.active').attr('data-name');
                floor_index = Number(floor_index);

                const target_array = room_mesh_map[build_name][floor_index];

                const raycaster = getRaycaster(event);
                const intersects = raycaster.intersectObjects(target_array);

                if (intersects.length > 0) {
                    mouseup_point = intersects[0].point;
                    const mesh = intersects[0].object;

                    // 鼠标按下时和松开时距离太远则返回
                    if (mouseup_point.distanceTo(mousedown_point) > (5 * scale_rate)) {
                        mousedown_point = undefined;
                        mouseup_point = undefined;
                        return
                    }

                    walkToRoom(mesh);

                    // dom 匹配所选房间
                    dom_room_select(mesh.roomName);
                }
            })
        })
        */

        // 测试用捕捉射线
        $(container).on('mousedown', '>canvas', function (event) {
            const raycaster = getRaycaster(event);
            const intersects = raycaster.intersectObjects([scene], true);

            if (intersects.length > 0) {
                mesh = intersects[0].object;
                // console.log('mesh', mesh);
            }
        })
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


    // 登录
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
    //         console.log('data', data);
    //         const token = data.Data[0].Token;
    //         console.log('token', token);

    //         // 当前抄表数据
    //         $.ajax({
    //             type: 'POST',
    //             url: 'http://39.108.12.65:5713/DefaultAPI.asmx/ReadMeter',
    //             data: {
    //                 LoginInfo: `{"Code":"admin","Token":"${token}"}`,
    //                 ParamList: '{"MeterAddr":"101902174225","ReadType":"1","FreezeDate":""}'
    //             },
    //             success: function(res) {
    //                 console.log('res', res);
    //                 const text = $(res).find('string').text();
    //                 const data = JSON.parse(text);
    //                 console.log('当前抄表数据data', data);
    //             },
    //             error: function (err) {
    //                 console.log('err', err);
    //             }
    //         })

    //         // 历史抄表数据
    //         $.ajax({
    //             type: 'POST',
    //             url: 'http://39.108.12.65:5713/DefaultAPI.asmx/GetData',
    //             data: {
    //                 LoginInfo: `{"Code":"admin","Token":"${token}"}`,
    //                 ParamList: '{"DataType":"2","MeterAddr":"101811200913","BeginDate":"2019-4-1","EndDate":"2019-4-26","PageSize":"100000"}'
    //             },
    //             success: function (res) {
    //                 console.log('res', res);
    //                 const text = $(res).find('string').text();
    //                 const data = JSON.parse(text);
    //                 console.log('历史抄表数据data', data);
    //             },
    //             error: function (err) {
    //                 console.log('err', err);
    //             }
    //         })
    //     },
    //     error: function (err) {
    //         console.log('err', err);
    //     }
    // })

    // 当前抄表数据
    // $.ajax({
    //     type: 'POST',
    //     url: 'http://39.108.12.65:5713/DefaultAPI.asmx/ReadMeter',
    //     data: {
    //         LoginInfo: `{"Code":"admin","Token":"3G6NfyQ2+2nZKTSrZFxZ5Q=="}`,
    //         // ParamList: '{"MeterAddr":"101902174225","ReadType":"1","FreezeDate":""}'
    //         ParamList: '{"MeterAddr":"101902174225","ReadType":"2","FreezeDate":"2019-04-25"}'
    //     },
    //     success: function (res) {
    //         console.log('当前抄表数据res', res);
    //         const text = $(res).find('string').text();
    //         const data = JSON.parse(text);
    //         console.log('当前抄表数据data', data);
    //     },
    //     error: function (err) {
    //         console.log('err', err);
    //     }
    // })

    // 历史抄表数据
    // $.ajax({
    //     type: 'POST',
    //     url: 'http://39.108.12.65:5713/DefaultAPI.asmx/GetData',
    //     data: {
    //         LoginInfo: `{"Code":"admin","Token":"3G6NfyQ2+2nZKTSrZFxZ5Q=="}`,
    //         ParamList: '{"DataType":"2","MeterAddr":"","BeginDate":"2019-04-01","EndDate":"2019-04-26","PageSize":"100000"}'
    //     },
    //     success: function (res) {
    //         console.log('历史抄表数据res', res);
    //         const text = $(res).find('string').text();
    //         const data = JSON.parse(text);
    //         console.log('历史抄表数据data', data);
    //     },
    //     error: function (err) {
    //         console.log('err', err);
    //     }
    // })
    console.log('renderer', renderer);
})