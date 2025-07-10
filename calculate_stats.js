// Quick calculation of inspection stats from the data
const precisionEquipmentData = [
  { status: "合格" },
  { status: "不合格" },
  { status: "合格" }
]

const rotatingEquipmentData = [
  { status: "合格" },
  { status: "要確認" },
  { status: "合格" }
]

const electricalData = [
  { status: "合格" },
  { status: "合格" },
  { status: "不合格" }
]

const instrumentationData = [
  { status: "合格" },
  { status: "合格" },
  { status: "要確認" }
]

const allData = [
  ...precisionEquipmentData,
  ...rotatingEquipmentData,
  ...electricalData,
  ...instrumentationData
]

const passedCount = allData.filter(item => item.status === "合格").length
const failedCount = allData.filter(item => item.status === "不合格").length
const pendingCount = allData.filter(item => item.status === "要確認").length
const totalCount = allData.length

console.log("Dashboard Statistics:")
console.log("合格検査数:", passedCount)
console.log("不合格検査数:", failedCount)
console.log("保留中:", pendingCount)
console.log("総検査数:", totalCount)