const option = {
    grid: {
        left: 42,
        top: 23,
        right: 10,
        bottom: 48,
    },
    xAxis: {
        type: 'category',
        data: [
            '01:00',
            '02:00',
            '03:00',
            '04:00',
            '05:00',
            '06:00',
            '07:00',
            '08:00',
            '09:00',
            '10:00',
            '11:00',
            '12:00',
            '13:00',
            '14:00',
        ],
        axisLine: {
            show: false,
        },
        axisTick: {
            show: false,
        },
        axisLabel: {
            color: '#999999',
            margin: 14,
            align: 'center',
        },
    },
    yAxis: {
        type: 'value',
        interval: 50,
        axisLine: {
            show: false,
        },
        axisTick: {
            show: false,
        },
        axisLabel: {
            color: '#999999',
            margin: 20,
            align: 'center',
        },
    },
    series: [{
        type: 'bar',
        data: [
            120,
            200,
            150,
            80,
            70,
            110,
            130,
            120,
            200,
            150,
            80,
            70,
            110,
            130,
        ],
        itemStyle: {
            color: '#324157',
            borderColor: '#324157',
        },
        barWidth: '100%',
    }]
};


// const waterChart = echarts.init(document.querySelector('#tab-statistics>.water-box>.content>.chart'));
// const electricChart = echarts.init(document.querySelector('#tab-statistics>.electric-box>.content>.chart'));
// const lightChart = echarts.init(document.querySelector('#tab-statistics>.light-box>.content>.chart'));

// waterChart.setOption(option);
// electricChart.setOption(option);
// lightChart.setOption(option);

const chart_electric_1 = echarts.init(document.querySelector('#tab-electric>.chart-1'));
const chart_electric_2 = echarts.init(document.querySelector('#tab-electric>.chart-2'));
const chart_electric_3 = echarts.init(document.querySelector('#tab-electric>.chart-3'));
const chart_water_1 = echarts.init(document.querySelector('#tab-water>.chart-1'));
const chart_water_2 = echarts.init(document.querySelector('#tab-water>.chart-2'));
const chart_water_3 = echarts.init(document.querySelector('#tab-water>.chart-3'));

/**
 * @name 创建饼状图配置
 * @param {*} config 
 */
const createChartOption1 = (config) => {
    const {
        titleText,
        seriesName,
        seriesData,
        unit,
    } = config;

    const option = {
        title: {
            text: titleText,
            left: '38.5%',
            top: '14%',
            textStyle: {
                color: '#484848',
                fontSize: 14,
                fontWeight: 'normal',
            }
        },
        tooltip: {
            trigger: 'item',
            formatter: `{a} <br/>{b}: {c}${unit} ({d}%)`
        },
        legend: {
            orient: 'vertical',
            left: '60%',
            top: '31%',
            icon: 'circle',
            formatter: function (name) {
                const datas = seriesData;

                let value = datas[0].value
                let total = 0;

                for (const data of datas) {
                    total += data.value;
                    if (data.name == name) {
                        value = data.value;
                    }
                }

                const rate = value / total * 100;
                return `${name}: ${value}${unit} / ${rate.toFixed(2)}%`
            }
        },
        series: [{
            name: seriesName,
            type: 'pie',
            radius: ['26%', '40%'],
            center: ['42%', '40%'],
            avoidLabelOverlap: false,
            label: {
                normal: {
                    show: false,
                    position: 'center'
                },
                emphasis: {
                    show: true,
                    textStyle: {
                        fontSize: '20',
                        fontWeight: 'bold'
                    }
                }
            },
            labelLine: {
                normal: {
                    show: false
                }
            },
            data: seriesData
        }],
        color: ['#985ef9', '#ffc742', '#ff6e42', '#ff5886', '#00c4aa', '#00a3fb'],
    };

    return option
}

/**
 * @name 创建柱状图配置
 * @param {*} config 
 */
const createChartOption2 = (config) => {
    const {
        titleText,
        xAxisData,
        seriesData,
    } = config;

    const option = {
        title: {
            text: titleText,
            top: '8%',
            left: 'center',
            textStyle: {
                color: '#484848',
                fontSize: 14,
                fontWeight: 'normal',
            }
        },
        grid: {
            left: 'center',
            top: '20%',
            height: '50%',
            width: '75%',
        },
        xAxis: {
            type: 'category',
            axisLine: {
                show: false,
            },
            axisTick: {
                show: false,
            },
            axisLabel: {
                // rotate: -20,
                color: '#999999',
                lineHeight: 14,
                // margin: 60,
                margin: 15,
                formatter: function (value) {
                    return value.split("").join("\n");
                },
            },
            data: xAxisData,
        },
        yAxis: {
            type: 'value',
            axisLine: {
                show: false,
            },
            axisTick: {
                show: false,
            },
            axisLabel: {
                color: '#999999',
            },
        },
        series: [{
            data: seriesData,
            type: 'bar',
            barCategoryGap: '50%',
            itemStyle: {
                color: '#cccccc'
            },
            barMaxWidth: 80,
            emphasis: {
                itemStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [{
                            offset: 1,
                            color: '#ffc742' // 0% 处的颜色
                        }, {
                            offset: 0,
                            color: '#fbe072' // 100% 处的颜色
                        }],
                    }
                },
                label: {
                    show: true,
                    position: 'top',
                    backgroundColor: '#324157',
                    color: '#ffff',
                    padding: [10, 20],
                    distance: 10,
                    borderRadius: 5,
                    fontSize: 14,
                }
            }
        }],
        // toolbox: {
        //     show: true,
        //     top: 30,
        //     right: 30,
        //     itemSize: 72,
        //     feature: {
        //         myBack: {
        //             show: true,
        //             title: '回到饼图',
        //             icon: `image://./img/icon/btn_back.png`,
        //             onclick: function (event, event2) {
        //                 const wrap = event2.getDom();
        //                 $(wrap).removeClass('active').siblings('.chart-1').addClass('active')
        //             }
        //         }
        //     }
        // }
    };

    return option
}


/**
 * @name 创建折线图配置
 * @param {*} config 
 */
const createChartOption3 = (config) => {
    const {
        titleText,
        seriesData,
    } = config;

    const option = {
        title: {
            text: titleText,
            top: '8%',
            left: 'center',
            textStyle: {
                color: '#484848',
                fontSize: 14,
                fontWeight: 'normal',
            }
        },
        grid: {
            left: 'center',
            top: '20%',
            height: '50%',
            width: '60%',
        },
        xAxis: {
            type: 'category',
            axisLine: {
                show: false,
            },
            axisTick: {
                show: false,
            },
            axisLabel: {
                color: '#999999',
                margin: 20,
            },
            data: [
                '一月',
                '二月',
                '三月',
                '四月',
                '五月',
                '六月',
                '七月',
                '八月',
                '九月',
                '十月',
                '十一月',
                '十二月',
            ],
        },
        yAxis: {
            type: 'value',
            axisLine: {
                show: false,
            },
            axisTick: {
                show: false,
            },
            axisLabel: {
                color: '#999999',
            },
        },
        series: [{
            data: seriesData,
            type: 'line',
            areaStyle: {
                color: {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [{
                        offset: 1,
                        color: '#ffffff' // 0% 处的颜色
                    }, {
                        offset: 0,
                        color: '#babfc4' // 100% 处的颜色
                    }],
                }
            },
            lineStyle: {
                color: '#4b5054',
            },
            symbol: 'circle',
            symbolSize: 6,
            itemStyle: {
                color: '#1f2d3d',
            },
            emphasis: {
                label: {
                    show: true,
                    position: 'top',
                    backgroundColor: '#324157',
                    color: '#ffff',
                    padding: [10, 20],
                    distance: 10,
                    borderRadius: 5,
                    fontSize: 14,
                }
            }
        }],
        // toolbox: {
        //     show: true,
        //     top: 30,
        //     right: 30,
        //     itemSize: 72,
        //     feature: {
        //         myBack: {
        //             show: true,
        //             title: '回到柱图',
        //             icon: 'image://./img/icon/btn_back.png',
        //             width: 72,
        //             height: 32,
        //             onclick: function (event, event2) {
        //                 const wrap = event2.getDom();
        //                 $(wrap).removeClass('active').siblings('.chart-2').addClass('active')
        //             }
        //         }
        //     }
        // }
    };

    return option
}


// 柱状图x轴标签原型
const xAxisFloors = [
    '北楼一层',
    '北楼二层',
    '北楼三层',
    '北楼四层',
    '北楼五层',
    '北楼六层',
    '南楼一层',
    '南楼二层',
    '南楼三层',
    '南楼四层',
    '南楼五层',
    '南楼六层',
    '南楼七层',
];
/**
 * @name 创建楼层列表
 * @param {string} typeName 耗能类型名称
 */
const createXAxisData = (typeName) => {
    return xAxisFloors.map(floor => {
        return floor += typeName;
    })
}

let token;

let waterPosts;
let electricPosts;

const createPromisesByMeter = (meterArray, token) => {
    return meterArray.map(function (meterData) {
        const {
            id,
            type,
            detail,
        } = meterData;


        const promise = new Promise(function (resolve, reject) {
            // 当前抄表数据
            $.ajax({
                type: 'POST',
                url: 'http://39.108.12.65:5713/DefaultAPI.asmx/ReadMeter',
                data: {
                    LoginInfo: `{"Code":"admin","Token":"${token}"}`,
                    ParamList: `{"MeterAddr":"${id}","ReadType":"1","FreezeDate":""}`
                },
                success: function (res) {
                    // console.log('res', res);
                    const text = $(res).find('string').text();
                    const data = JSON.parse(text);
                    // console.log('当前抄表数据data', data);
                    if (data.Data[0]) {
                        const value = Number(data.Data[0].MeterNumber);
                        const result = {
                            id,
                            type,
                            value,
                            detail,
                        };

                        resolve(result);
                    } else {
                        const result = {
                            id,
                            type,
                            detail,
                        };

                        resolve(result);
                    }
                },
                error: function (err) {
                    console.log('err', err);
                    reject(err);
                }
            })
        })

        return promise
    })
}

// 获取饼图信息
const getPipSeriesData = posts => {
    // 遍历获取的数据，根据 type 类型进行数值累加
    const meterMap = {};
    for (const meterData of posts) {
        const {
            type,
            value
        } = meterData;

        if (value) {
            if (meterMap[type]) {
                meterMap[type] += value;
            } else {
                meterMap[type] = value;
            }
        }
    }

    // console.log('meterMap', meterMap);

    // 根据计算后的数据，生成饼图信息
    const seriesData = [];
    for (const key in meterMap) {
        if (meterMap.hasOwnProperty(key)) {
            const data = {
                name: key,
                value: Number(meterMap[key].toFixed(2)),
            };
            seriesData.push(data);
        }
    }

    return seriesData
}

// 登录
$.ajax({
    type: 'POST',
    url: 'http://39.108.12.65:5713/DefaultAPI.asmx/Login',
    data: {
        LoginInfo: '{"Code":"admin","Pwd":"6F92A645713538DD97BE"}',
        ParamList: ''
    },
    success: function (res) {
        const text = $(res).find('string').text();
        const data = JSON.parse(text);
        // console.log('data', data);
        token = data.Data[0].Token;
        // console.log('token', token);

        const water_promises = createPromisesByMeter(waterMeter, token);

        Promise.all(water_promises).then(function (posts) {
            // console.log('water posts', posts);
            waterPosts = posts;

            const seriesData = getPipSeriesData(posts);
            // console.log('water seriesData', seriesData);

            // 生成水表饼状图配置
            const water_chart_1_option = createChartOption1({
                titleText: '耗水占比统计',
                seriesName: '用水区域',
                seriesData: seriesData,
                unit: 't',
            });

            chart_water_1.setOption(water_chart_1_option);
        }).catch(function (reason) {
            console.log('reason', reason);
        });

        const electric_promises = createPromisesByMeter(electricMeter, token);

        Promise.all(electric_promises).then(function (posts) {
            // console.log('electric posts', posts);
            electricPosts = posts;

            const seriesData = getPipSeriesData(posts);
            // console.log('electric seriesData', seriesData);

            // 生成电表饼状图配置
            const electric_chart_1_option = createChartOption1({
                titleText: '耗电占比统计',
                seriesName: '用电区域',
                seriesData: seriesData,
                unit: 'kw·h',
            });

            chart_electric_1.setOption(electric_chart_1_option);
        }).catch(function (reason) {
            console.log('reason', reason);
        });
    },
    error: function (err) {
        console.log('err', err);
    }
})


// 绑定水表饼图点击
chart_water_1.on('click', function (event) {
    console.log('event', event);
    $('#tab-water').find('>.chart-1').removeClass('active');
    $('#tab-water').find('>.chart-2').addClass('active');

    const name = event.name;

    const xAxisData = [];
    const seriesData = [];

    for (const meterData of waterPosts) {
        const {
            type,
            value,
            detail
        } = meterData
        if (type == name) {
            xAxisData.push(detail);
            seriesData.push(value);
        }
    }

    // 生成水表柱状图配置
    const water_chart_2_option = createChartOption2({
        titleText: `${name}耗水(t)`,
        xAxisData: xAxisData,
        seriesData: seriesData,
    });

    chart_water_2.resize();
    chart_water_2.setOption(water_chart_2_option);
});

// 绑定电表饼图点击
chart_electric_1.on('click', function (event) {
    console.log('event', event);
    $('#tab-electric').find('>.chart-1').removeClass('active');
    $('#tab-electric').find('>.chart-2').addClass('active');

    const name = event.name;

    const xAxisData = [];
    const seriesData = [];

    for (const meterData of electricPosts) {
        const {
            type,
            value,
            detail
        } = meterData
        if (type == name) {
            xAxisData.push(detail);
            seriesData.push(value);
        }
    }

    // 生成电表柱状图配置
    const electric_chart_2_option = createChartOption2({
        titleText: `${name}能耗(kWh)`,
        xAxisData: xAxisData,
        seriesData: seriesData,
    })

    chart_electric_2.resize();
    chart_electric_2.setOption(electric_chart_2_option);
});



chart_water_2.on('click', function (event) {
    // return
    console.log('event', event);
    $('#tab-water').find('>.chart-2').removeClass('active');
    $('#tab-water').find('>.chart-3').addClass('active');

    const name = event.name;

    let id;
    for (const waterData of waterMeter) {
        if (waterData.detail == name) {
            id = waterData.id;
            break
        }
    }

    if (id) {
        // 历史抄表数据
        $.ajax({
            type: 'POST',
            url: 'http://39.108.12.65:5713/DefaultAPI.asmx/GetData',
            data: {
                LoginInfo: `{"Code":"admin","Token":"${token}"}`,
                ParamList: `{"MeterAddr":"${id}","DataType":"3","BeginDate":"2019-01-01","EndDate":"2019-12-31","PageSize":"100000"}`
            },
            success: function (res) {
                console.log('res', res);
                const text = $(res).find('string').text();
                const data = JSON.parse(text);
                console.log('历史抄表数据data', data);
                // if (data.Data[0]) {
                //     const value = Number(data.Data[0].MeterNumber);
                //     const result = {
                //         id,
                //         type,
                //         value,
                //         detail,
                //     };

                // } else {

                // }

                // 生成水表折线图配置
                // const water_chart_3_option = createChartOption3({
                //     titleText: `${name}每月耗水(kWh)`,
                //     seriesData: [120, 190, 150, 80, 70, 110, 120, 180, 150, 80, 70, 110],
                // });

                // chart_water_3.resize();
                // chart_water_3.setOption(water_chart_3_option);
            },
            error: function (err) {
                console.log('err', err);
            }
        })
    }
})

chart_electric_2.on('click', function (event) {
    // return
    console.log('event', event);
    $('#tab-electric').find('>.chart-2').removeClass('active');
    $('#tab-electric').find('>.chart-3').addClass('active');

    const name = event.name;

    let id;
    for (const electricData of electricMeter) {
        if (electricData.detail == name) {
            id = electricData.id;
            break
        }
    }

    if (id) {
        // 历史抄表数据
        $.ajax({
            type: 'POST',
            url: 'http://39.108.12.65:5713/DefaultAPI.asmx/ReadMeter',
            data: {
                LoginInfo: `{"Code":"admin","Token":"${token}"}`,
                ParamList: `{"MeterAddr":"${id}","ReadType":"2","FreezeDate":"2019-05-05"}`
            },
            success: function (res) {
                console.log('res', res);
                const text = $(res).find('string').text();
                const data = JSON.parse(text);
                console.log('历史抄表数据data', data);
                // if (data.Data[0]) {
                //     const value = Number(data.Data[0].MeterNumber);
                //     const result = {
                //         id,
                //         type,
                //         value,
                //         detail,
                //     };

                // } else {

                // }

                // 生成电表折线图配置
                // const electric_chart_3_option = createChartOption3({
                //     titleText: `${name}每月能耗(kWh)`,
                //     seriesData: [120, 190, 150, 80, 70, 110, 120, 180, 150, 80, 70, 110],
                // })

                // chart_electric_3.resize();
                // chart_electric_3.setOption(electric_chart_3_option);
            },
            error: function (err) {
                console.log('err', err);
            }
        })
    }
});

const back_dom = `
    <span class="back"></span>
`

$('#tab-water>.chart-2').append(back_dom);
$('#tab-water>.chart-3').append(back_dom);

$('#tab-electric>.chart-2').append(back_dom);
$('#tab-electric>.chart-3').append(back_dom);

$('#tab-electric, #tab-water').on('click', '>div>.back', function () {
    const $chart = $(this).parent();

    $chart.removeClass('active');

    if ($chart.hasClass('chart-2')) {
        $chart.siblings('.chart-1').addClass('active');
    } else if ($chart.hasClass('chart-3')) {
        $chart.siblings('.chart-2').addClass('active');
    }
});


const year_switch = `<span class="year-switch">2019</span>`;
$('#tab-electric>.chart-3').append(year_switch);
$('#tab-water>.chart-3').append(year_switch);

laydate.set({
    type: 'datetime',
    isInitValue: false,
    btns: ['clear', 'confirm'],
    theme: '#324157',
    calendar: true,
})

laydate.render({
    elem: '#tab-electric>.chart-3>.year-switch',
    type: 'year',
    isInitValue: true,
})

laydate.render({
    elem: '#tab-water>.chart-3>.year-switch',
    type: 'year',
    isInitValue: true,
})

$('#top-menu>.statistics>a').one('click', function () {
    setTimeout(function () {
        chart_electric_1.resize();
    })
})

$('#tab-statistics>.tab-menu>.water>a').one('click', function () {
    setTimeout(function () {
        chart_water_1.resize();
    })
})