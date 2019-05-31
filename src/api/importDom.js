
import {
    // createAirStateItem,
    createAirStateList,
    // createFloorItem,
    // createFloorList,
    // createOperItem,
    // createOperList,
    // createRoomItem,
    createRoomList
} from '../component/domTemplate';

import {
    air_conditioner_data,
    // build_data,
    fresh_air_data,
    // home_oper_data,
    room_data
} from '../data/domData';

/**
 * @name 导入dom
 */
const importDom = (dataList) => {

    // 首页导入空调信息 dom
    const air_conditioner_dom = createAirStateList(air_conditioner_data);
    $('#tab-air-conditioner>.set').before(air_conditioner_dom);

    
    // 首页导入新风信息 dom
    const fresh_air_dom = createAirStateList(fresh_air_data);
    $('#tab-fresh-air>.set').before(fresh_air_dom);
    
    
    // 首页导入房间列表 dom
    const room_list_dom = createRoomList(room_data);
    $('#tab-home .select-wrap>.room-switch>.dropdown-menu').html(room_list_dom);


    // 导入首页运维列表
    // const $home_oper_wrap = $('#tab-home .operate-wrap .wrap-left>.content');
    // const home_oper_list_dom = createOperList(dataList, false);
    // $home_oper_wrap.html(home_oper_list_dom);

    // 导入管理页运维列表
    // const $manage_oper_wrap = $('#tab-manage .operate-wrap .wrap-left>.content');
    // const manage_oper_list_dom = createOperList(dataList, true);
    // $manage_oper_wrap.html(manage_oper_list_dom);

    return
}

export default importDom;