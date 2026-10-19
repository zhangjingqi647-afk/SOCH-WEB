
const profilePagePath = '/wp-json/university/v1/profilePage';
let hub = 'SOCIHUB'
let departmentMap = {
    "FTEC": "10011A10000000000H2S",//
    "IPE": "10011A10000000000H2U",//
    "UGOD": "10011A10000000000H2Y",//
    "CNCC": "10011A100000000259HQ"
}


let facultyData = {
    'allPageData': null,
    // 'pageNum': 1,
    // 'pageSize': 10,
    // 'currentPageIndex': 0,
    'currentParam': {
        'code': '',
        'keyword': ''
    },
    'reloadData': function (department = '', keyword = '') {

        let code = '';
        if (department) {
            code = departmentMap[department]
        }
        let pageIndex = '1', allPageSize = '100'

        let allPromise = []
        if (code) {
            allPromise.push($.ajax({
                'url': profilePagePath,
                'data': 'affiliatedUnits=' + hub + '&languageType=en&departmentPkCode=' + code
                    + '&personName=' + keyword + '&pages=' + pageIndex + '&size=' + allPageSize,
                'type': 'GET',
                'dataType': 'json',
            }))
        } else {
            // for (let key in departmentMap) {
            //     allPromise.push($.ajax({
            //         'url': apiServer + '/facultyprofile/external/profile/page',
            //         'data': 'affiliatedUnits=' + hub + '&languageType=en&departmentPkCode=' + departmentMap[key]
            //             + '&personName=' + keyword + '&pages=' + pageIndex + '&size=' + allPageSize,
            //         'type': 'GET',
            //         'dataType': 'json',
            //     }))
            // }
            allPromise.push($.ajax({
                'url': profilePagePath,
                'data': 'affiliatedUnits=' + hub + '&languageType=en&dataSourcesCodes=OUTSIDE_NC'
                    + '&personName=' + keyword + '&pages=' + pageIndex + '&size=' + allPageSize,
                'type': 'GET',
                'dataType': 'json',
            }))
        }

        this.allPageData = [];
        return Promise.all(allPromise).then((result) => {
            for (let pi = 0; pi < result.length; pi++) {
                this.currentParam.code = code;
                this.currentParam.keyword = keyword;
                if ((result[pi].data instanceof Object)
                    && (result[pi].data.list instanceof Array)) {

                    for (let i = 0; i < result[pi].data.list.length; i++) {
                        let item = result[pi].data.list[i];
                        let photo = '';
                        if (item.photo && item.photo.length > 0 && item.photo[0].urlHost) {
                            photo = item.photo[0].urlHost
                        } else {
                            photo = 'https://hrapi.hkust-gz.edu.cn/photo/img?key=' + item.pkPsndoc;
                        }

                        // let title='';
                        // let thrust='';
                        // if(item.funcTitle&&item.funcTitle.length>0&&item.funcTitle[0].content){
                        //     let arr=item.funcTitle[0].content.split(',')

                        //     title=arr[0];
                        //     if(arr.length>1){
                        //         thrust=arr[1];
                        //     }
                        // }

                        let title, thrust, thrustList = [];
                        if (item.jobs) {
                            item.jobs.map(d => {
                                if (d.campus == 'gz'
                                    // && d.jobEnName.indexOf("Head") < 0
                                    && d.departmentEnName.indexOf("MBA+") < 0) {
                                    title = d.jobEnName;
                                    thrust = d.departmentEnName;
                                    thrustList.push(d.departmentEnName);
                                }
                            })
                            item.photoUrl = photo;
                            item.title = title ? title : item.jobs[0].jobEnName
                            item.thrust = thrust ? thrust : item.jobs[0].departmentEnName
                            item.thrustList = thrustList;
                        }
                        if (thrustList.length == 0) {
                            // item.thrustList.push(item.jobs[0].departmentEnName)
                            continue;
                        }
                        // console.log(item)

                        this.allPageData.push(item)
                    }
                }
            }
            this.allPageData.sort(function (a, b) {
                let aLastName = a.lastName || '';
                let bLastName = b.lastName || '';
                //console.log(_a, _b);
                if (aLastName == '') {
                    return 1;
                }
                if (bLastName == '') {
                    return -1;
                }
                return aLastName.localeCompare(bLastName)
            })
            return this.allPageData
        })


    },
    // 'getPagedList': function (pageIndex = '0') {
    //     this.currentPageIndex = pageIndex
    //
    //     // console.log(this.allPageData, (pageIndex) * this.pageSize, (pageIndex + 1) * this.pageSize)
    //     let result = this.allPageData.slice((pageIndex) * this.pageSize, (pageIndex + 1) * this.pageSize);
    //     console.log(result)
    //     return result
    // },

}







