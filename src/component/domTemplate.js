
import { getDateByTime } from "../utils/utils";

/**
 * @name 根据单个数据创建空气系统标签
 * @param {*} data 空气系统单个标签数据
 */
const createAirStateItem = (data) => {
    return `<div class="state-view ${data.className?data.className:''}">
                <p class="label-v">${data.label}</p>
                <p class="info">${data.value}</p>
            </div>`
}

/**
 * @name 根据数据组生成dom
 * @param {array} array 空气系统数据数组
 */
const createAirStateList = (array) => {
    let result = '';

    for (const data of array) {
        result += createAirStateItem(data);
    }

    return result
}


/**
 * @name 根据单个数据生成房间项目dom
 * @param {string} roomName 房间号数据
 * @param {string} mark 房间号后缀标记
 */
const createRoomItem = (roomName, mark) => {
    return `<li><a href="#" data-index="${roomName}">${roomName}${mark}</a></li>`
}

/**
 * @name 根据数据组生成房间列表dom
 * @param {array} rooms 房间号数据数组
 * @param {boolean} hasAllRoom 是否含有所有房间的选项
 */
const createRoomList = (rooms, hasAllRoom, mark) => {
    let result = '';

    if (hasAllRoom) {
        result = `<li><a href="#" data-index="all">所有房间</a></li>`;
    }
    for (const data of rooms) {
        result += createRoomItem(data.roomName, mark);
    }

    return result
}


/**
 * @name 根据单个数据生成楼层下拉项目dom
 * @param {number|string} index 楼层在数组中的序列号+1
 * @param {string} floorName 单个楼层名
 */
const createFloorItem = (index, floorName) => {
    return `<li><a href="#" data-index="${index}">${floorName}</a></li>`
}

/**
 * @name 根据数据组生成楼层下拉列表dom
 * @param {*} firstData 下拉列表的第一条信息
 * @param {array} floors 一栋楼的楼层信息数据数组
 */
const createFloorList = (floors, firstData) => {
    let result = '';

    if (firstData) {
        result += createFloorItem(firstData.index, firstData.floorName);
    }

    const length = floors.length;

    for (let i = 0; i < length; i++) {
        const floor = floors[i];

        result += createFloorItem(i, floor.floorName);
    }

    return result
}


/**
 * @name 根据单个数据生成首页单个运维项目
 * @param {*} data 单个运维数据
 * @param {boolean} hasName 是否含有房间名
 * @param {boolean} active 是否被选中
 */
const createOperItem = (data, hasName, active) => {
    return `
    <div class="operate-item${active?' active':''}" data-id=${data.id?data.id:"new"}>
        <div class="item-left">
            ${hasName?`<span class="room-name">${data.room}</span>`:''}
            <span class="title">${data.title}</span>
        </div>
        <div class="item-right">
            <span class="state" data-state=${data.state}></span>
            <span class="date">${getDateByTime(data.time, true)}</span>
        </div>
    </div>
    `
}

/**
 * @name 根据数据组生成运维项目列表
 * @param {array} array 运维数据数组
 */
const createOperList = (array, hasName) => {
    let result = ''
    for (const data of array) {
        result += createOperItem(data, hasName);
    }

    return result
}

export {
    createAirStateItem,
    createAirStateList,
    createFloorItem,
    createFloorList,
    createOperItem,
    createOperList,
    createRoomItem,
    createRoomList
}