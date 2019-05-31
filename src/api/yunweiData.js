let Http;
const server = "aliyun_win";

switch (server) {
	case "localhost":
		Http = "http://localhost:8080/buildingManagement/"; //本地
		break;
	case "aliyun_win":
		Http = "http://121.40.174.117:8080/buildingManagement/"; //aliyun win
		break;
	default:
		break;
}

//新增运维数据
function addYunweiData(requestData, callback) {
	$.ajax({
		type: "POST",
		url: Http + 'addYunweiData.do',
		ansyc: false,
		data: requestData,
		// {
		// 	build: build,
		// 	floor: floor,
		// 	room: room,
		// 	title: title,
		// 	time: time,
		// 	state: state,
		// 	content: content
		// }
		dataType: "json",
		success: function (res) {
			console.log("运维数据成功插入数据库！", res);
			const id = res[0].newId;
			callback(id);
		}
	})
}

//根据id删除对应运维数据
function deleteYunweiData(requestData, callback) {
	$.ajax({
		type: "POST",
		url: Http + 'deleteYunweiData.do',
		ansyc: false,
		data: requestData,
		// {
		// 	id: id
		// },
		dataType: "json",
		success: function (res) {
			console.log("当前运维数据删除成功！", res);
			// resp = eval(data);
			if (res[0].data == 100) {
				callback();
			}
		}
	})
}

//根据id修改运维数据
function updateYunweiData(requestData, callback) {
	const data = {
		id: requestData.id,
		newBuild: requestData.build,
		newFloor: requestData.floor,
		newRoom: requestData.room,
		newTitle: requestData.title,
		newTime: requestData.time,
		newState: requestData.state,
		newContent: requestData.content
	};

	$.ajax({
		type: "POST",
		url: Http + 'updateYunweiData.do',
		ansyc: false,
		data: data,
		dataType: "json",
		success: function (res) {
			// resp = eval(data);
			if (res[0].data == 100) {
				console.log("当前运维数据修改成功！");
				callback()
			}
		}
	})
}

//查询所有运维数据
function selectAllYunweiData(callback) {
	$.ajax({
		type: "POST",
		url: Http + 'selectAllYunweiData.do',
		ansyc: false,
		data: {},
		dataType: "json",
		success: function (res) {
			// resp = eval(data);
			// console.log('所有运维数据', res);
			callback(res);
		}
	})
}

export {
	selectAllYunweiData,
	updateYunweiData,
	deleteYunweiData,
	addYunweiData,
};