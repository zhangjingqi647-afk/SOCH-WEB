
const getOfficialThrustListPath = '/wp-json/university/v1/getOfficialThrustList';
const profilePagePath = '/wp-json/university/v1/profilePage';
let hub = "SOCIHUB";
let departmentMap = {
  FTEC: "10011A10000000000H2S", //
  IPE: "10011A10000000000H2U", //
  UGOD: "10011A10000000000H2Y", //
  CNCC: "10011A100000000259HQ",
};

let titleCategory = {};

let thrustFacultyData = {
  allThrustData: [
    {
      name: "Faculty",
      titles: [
        "Chair Professor",
        "Professor",
        "Associate Professor",
        "Assistant Professor",
        "Research Associate Professor",
        "Research Assistant Professor",
      ],
      list: [],
    },
    {
      name: "Adjunct/Visiting Faculty",
      titles: [
        "Adjunct Chair Professor",
        "Adjunct Professor",
        "Adjunct Associate Professor",
        "Adjunct Assistant Professor",
        "Visiting Professor",
        "Visiting Associate Professor",
        "Visiting Assistant Professor",
      ],

      list: [],
    },
    {
      name: "Professor of Practice",
      titles: [
        "Professor of Practice",
        "Associate Professor of Practice",
        "Assistant Professor of Practice",
      ],
      list: [],
    },
    {
      name: "Affiliated Faculty",
      titles: [
        "Affiliate Chair Professor",
        "Affiliate Professor",
        "Affiliate Associate Professor",
        "Affiliate Assistant Professor",
      ],
      list: [],
    },
    {
      name: "Others",
      list: [],
    },
  ],

  // 'thrustData':[
  //     {
  //
  //     }
  // ],/

  // 'pageNum': 1,
  // 'pageSize': 10,
  // 'currentPageIndex': 0,
  // 'currentParam': {
  //     'code': '',
  //     'keyword': ''
  // },
  reloadData: function (department = "") {
    // let allPromise = [];

    return $.ajax({
      url: getOfficialThrustListPath,
      data:
        "affiliatedUnits=" +
        hub +
        "&departmentPkCode=" +
        departmentMap[department],
      type: "GET",
      dataType: "json",
    }).then((result) => {
      let item = result.data.ACTING_HEAD;
      let photo = "";
      // console.log(item, "528");
      if (item.photo && item.photo.length > 0 && item.photo[0].urlHost) {
        photo = item.photo[0].urlHost;
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
      item.photoUrl = photo;
      if (item.jobs&&item.jobs.length>0) {
        item.jobs.map((d) => {
          if (!title && d.campus == "gz" && d.jobEnName.indexOf("Head") < 0) {
            title = d.jobEnName;
            thrust = d.departmentEnName;
            thrustList.push(d.departmentEnName);
          }
        });
        item.title = title ? title : item.jobs[0].jobEnName;
        item.title = item.title.replace(/^\s+|\s+$/g, "");
        item.thrust = thrust ? thrust : item.jobs[0].departmentEnName;
        item.thrustList = thrustList;
        if (thrustList.length == 0) {
          item.thrustList.push(item.jobs[0].departmentEnName)
        }
      }else{
        item.title='';
        item.thrust='';
        item.thrustList=[];
      }

      // console.log(item)
      this.allThrustData[0].list.push(item);

      for (let i = 0; i < result.data.CURRENT_FACULTY_ADVISORS.length; i++) {
        let item = result.data.CURRENT_FACULTY_ADVISORS[i];
        let photo = "";
        if (item.photo && item.photo.length > 0 && item.photo[0].urlHost) {
          photo = item.photo[0].urlHost;
        } else {
          photo = 'https://hrapi.hkust-gz.edu.cn/photo/img?key=' + item.pkPsndoc;
        }

        item.photoUrl = photo;
        let title, thrust, thrustList = [];
        if (item.jobs&&item.jobs.length>0) {
          item.jobs.map((d) => {
            if (!title && d.campus == "gz" && d.jobEnName.indexOf("Head") < 0) {
              title = d.jobEnName;
              thrust = d.departmentEnName;
              thrustList.push(d.departmentEnName);
            }
          });

          item.title = title ? title : item.jobs[0].jobEnName;
          item.title = item.title.replace(/^\s+|\s+$/g, "");
          item.thrust = thrust ? thrust : item.jobs[0].departmentEnName;
          item.thrustList = thrustList;
          if (thrustList.length == 0) {
            item.thrustList.push(item.jobs[0].departmentEnName)

          }
        }else{
          item.title='';
          item.thrust='';
          item.thrustList=[];
        }
        let noCategory = true;
        for (let j = 0; j < this.allThrustData.length - 1; j++) {
          if (this.allThrustData[j].titles.indexOf(item.title) >= 0) {
            this.allThrustData[j].list.push(item);
            noCategory = false;
            break;
          }
        }
        if (noCategory) {
          this.allThrustData[this.allThrustData.length - 1].list.push(item);
        }
      }

      for (let i = 0; i < this.allThrustData.length; i++) {
        let dataList = this.allThrustData[i].list;
        let titleList = this.allThrustData[i].titles || [];
        dataList.sort((a, b) => {
          let aLastName = a.lastName || "";
          let bLastName = b.lastName || "";

          if (a == this.allThrustData[0].list[0]) {
            return -1;
          }
          if (b == this.allThrustData[0].list[0]) {
            return 1;
          }

          let titleCompare =
            titleList.indexOf(a.title) - titleList.indexOf(b.title);
          if (titleCompare) {
            return titleCompare;
          }

          //console.log(aLastName, bLastName);
          if (aLastName == "") {
            return 1;
          }
          if (bLastName == "") {
            return -1;
          }
          return aLastName.localeCompare(bLastName);
        });
      }

      // console.log(this.allThrustData.actingHead)
      // this.allThrustData.actingHead.sort(function (a, b) {
      //     return a.lastName.localeCompare(b.lastName)
      // })
      // this.allThrustData.currentFacultyAdvisors.sort(function (a, b) {
      //     let _a = a.lastName || '';
      //     let _b = b.lastName || '';
      //     console.log(_a, _b);
      //     return _a.localeCompare(_b)
      // })
      // let titleList=[];
      // for(let i=0;i<this.allThrustData.currentFacultyAdvisors.length;i++){
      //     let item=this.allThrustData.currentFacultyAdvisors[i];
      //     //console.log(item.funcTitle)
      //     if(item.funcTitle&&item.funcTitle.length>0){
      //         let title=item.funcTitle[0].content.split(', ')[0];
      //         if(titleList.find(function(v){
      //                 return v==title;
      //             })){
      //
      //         }else{
      //             titleList.push(title)
      //
      //         }
      //     }else{
      //
      //     }
      //
      // }

      // console.log(titleList.toString())

      console.log(this.allThrustData, "allThrustData");
      return this.allThrustData;
    });
  },
  searchData: function (department = "", keyword = "") {
    let code = "";
    if (department) {
      code = departmentMap[department];
    }
    let pageIndex = "1",
      allPageSize = "100";
    this.allThrustData.actingHead = [];
    this.allThrustData.currentFacultyAdvisors = [];
    return $.ajax({
      url: profilePagePath,
      data:
        "affiliatedUnits=INFOHUB&languageType=en&departmentPkCode=" +
        code +
        "&personName=" +
        keyword +
        "&pages=" +
        pageIndex +
        "&size=" +
        allPageSize,
      type: "GET",
      dataType: "json",
    }).then((resData) => {
      if (typeof resData.data === "object") {
        this.allThrustData.currentFacultyAdvisors = resData.data.list;
        this.allThrustData.currentFacultyAdvisors.sort(function (a, b) {
          let _a = a.lastName || "";
          let _b = b.lastName || "";
          console.log(_a, _b);
          return _a.localeCompare(_b);
        });
      }
      return this.allThrustData;
      // console.log(resData)
      // this.currentParam.code = code;
      // this.currentParam.keyword = keyword;

      // this.currentPageIndex = 0
      // if(typeof resData.data === 'object'){
      //     this.allPageData = resData.data.list;
      //     this.pageNum = Math.ceil(resData.data.list.length / this.pageSize);
      // }else{
      //     this.allPageData=[]
      //     this.pageNum=1;
      // }
    });
  },
  // 'getPagedList': function (pageIndex = '0') {
  //     this.currentPageIndex = pageIndex
  //
  //     // console.log(this.allPageData, (pageIndex) * this.pageSize, (pageIndex + 1) * this.pageSize)
  //     let result = this.allPageData.slice((pageIndex) * this.pageSize, (pageIndex + 1) * this.pageSize);
  //     console.log(result)
  //     return result
  // },
};
