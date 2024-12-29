<template>
    <div class="phone-number">

        <div class="container">
            <div class="card">
                <h1>手机号码补全工具</h1>
                <h3>运营商输入</h3>
                <div class="input-section operator-section">
                    <input type="text" v-model="operatorPhone" placeholder="手机号前三位" class="phone-input" maxlength="3"
                        @input="queryOperator">
                    <span class="operator-result" v-if="operatorResult">
                        {{ operatorResult }}
                    </span>
                </div>

                <h3>地区输入</h3>
                <div class="region-section">
                    <select v-model="selectedProvince" @change="handleProvinceChange" class="region-select">
                        <option value="">选择省份</option>
                        <option v-for="province in provinces" :key="province.code" :value="province.code">
                            {{ province.name }}
                        </option>
                    </select>
                    <select v-model="selectedCity" @change="handleCityChange" class="region-select"
                        :disabled="!selectedProvince">
                        <option value="">选择城市</option>
                        <option v-for="city in cities" :key="city.code" :value="city.code">
                            {{ city.name }}
                        </option>
                    </select>
                    <select v-model="selectedArea" class="region-select" :disabled="!selectedCity">
                        <option value="">选择区县</option>
                        <option v-for="area in areas" :key="area.code" :value="area.code">
                            {{ area.name }}
                        </option>
                    </select>
                </div>
                <div class="zipcode-section" v-if="currentZipCode">
                    <span class="label">邮政编码：</span>
                    <span class="value">{{ currentZipCode }}</span>
                </div>
                <div class="button-wrapper">
                    <button class="query-button" @click="queryPhoneNumber" :disabled="isLoading">
                        {{ isLoading ? '查询中...' : '查询' }}
                    </button>
                </div>

                <div class="result-section" v-if="queryResults.length">
                    <h4>查询结果：</h4>
                    <div class="result-list">
                        <div v-for="(result, index) in queryResults" :key="index" class="result-item">
                            {{ result }}
                        </div>
                    </div>
                </div>
            </div>
            <div class="card">
                <h1>手机号码查询工具</h1>
                <div class="input-section">
                    <input type="text" v-model="searchPhone" placeholder="请输入手机号码" class="phone-input" maxlength="11">
                    <button @click="searchPhoneNumber" :disabled="!isValidPhone(searchPhone)">
                        查询
                    </button>
                </div>

                <div class="result-section" v-if="searchResult">
                    <div class="result-item">
                        <span class="label">运营商：</span>
                        <span class="value">{{ searchResult.operator }}</span>
                    </div>
                    <div class="result-item">
                        <span class="label">归属地：</span>
                        <span class="value">{{ searchResult.location }}</span>
                    </div>
                    <div class="result-item">
                        <span class="label">区号：</span>
                        <span class="value">{{ searchResult.areaCode }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

interface Region {
    code: string
    name: string
}

interface QueryResult {
    province: string
    city: string
    carrier: string
}

interface RegionData {
    region_id: string
    region_name: string
    zip_code: string
}

// 状态管理
const phoneNumber = ref('')
const isLoading = ref(false)
const queryResult = ref<QueryResult | null>(null)
const regionData = ref<RegionData[]>([])
const selectedProvince = ref('')
const selectedCity = ref('')
const selectedArea = ref('')

// 添加运营商查询相关的状态
const operatorPhone = ref('')
const operatorResult = ref('')
const operatorData = ref<Record<string, string>>({})

// 计算属性
const provinces = computed(() => {
    const provinceMap = new Map<string, string>()
    regionData.value.forEach(item => {
        const provinceCode = item.region_id.substring(0, 2) + '0000'
        if (provinceCode !== '000000' && item.region_id.endsWith('0000')) {
            provinceMap.set(provinceCode, item.region_name)
        }
    })
    return Array.from(provinceMap).map(([code, name]) => ({ code, name }))
})

const cities = computed(() => {
    if (!selectedProvince.value) return []
    const cityMap = new Map<string, string>()
    const provincePrefix = selectedProvince.value.substring(0, 2)
    regionData.value.forEach(item => {
        if (item.region_id.startsWith(provincePrefix) &&
            item.region_id.substring(2, 6) !== '0000' &&
            item.region_id.endsWith('00') &&
            item.region_id !== selectedProvince.value) {  // 排除省级代码
            cityMap.set(item.region_id, item.region_name)
        }
    })
    return Array.from(cityMap).map(([code, name]) => ({ code, name }))
})

const areas = computed(() => {
    if (!selectedCity.value) return []
    const areaMap = new Map<string, string>()
    const cityPrefix = selectedCity.value.substring(0, 4)
    regionData.value.forEach(item => {
        if (item.region_id.startsWith(cityPrefix) &&
            !item.region_id.endsWith('00') &&
            item.region_id !== selectedCity.value) {  // 排除市级代码
            areaMap.set(item.region_id, item.region_name)
        }
    })
    return Array.from(areaMap).map(([code, name]) => ({ code, name }))
})

const currentZipCode = computed(() => {
    if (!selectedArea.value && !selectedCity.value && !selectedProvince.value) return ''

    // 优先使用区县的邮编
    if (selectedArea.value) {
        const areaData = regionData.value.find(item => item.region_id === selectedArea.value)
        if (areaData?.zip_code) return areaData.zip_code
    }

    // 如果区县没有邮编，使用城市的邮编
    if (selectedCity.value) {
        const cityData = regionData.value.find(item => item.region_id === selectedCity.value)
        if (cityData?.zip_code) return cityData.zip_code
    }

    // 如果城市没有邮编，使用省份的邮编
    if (selectedProvince.value) {
        const provinceData = regionData.value.find(item => item.region_id === selectedProvince.value)
        if (provinceData?.zip_code) return provinceData.zip_code
    }

    return ''
})

// 事件处理
const handleProvinceChange = () => {
    selectedCity.value = ''
    selectedArea.value = ''
    // 如果有市选项，自动选择第一个
    if (cities.value.length > 0) {
        selectedCity.value = cities.value[0].code
        // 如果有区县选项，自动选择第一个
        if (areas.value.length > 0) {
            selectedArea.value = areas.value[0].code
        }
    }
}

const handleCityChange = () => {
    selectedArea.value = ''
    // 如果有区县选项，自动选择第一个
    if (areas.value.length > 0) {
        selectedArea.value = areas.value[0].code
    }
}

// 加载数据
const loadRegionData = async () => {
    try {
        const response = await fetch('/region.csv')
        const text = await response.text()
        const rows = text.split('\n').slice(1) // 跳过表头
        regionData.value = rows
            .filter(row => row.trim())
            .map(row => {
                const [region_id, region_name, zip_code] = row.split(',')
                return {
                    region_id,
                    region_name,
                    zip_code: zip_code?.trim() || ''
                }
            })
    } catch (e) {
        console.error('Failed to load region data:', e)
    }
}

// 加载运营商数据
const loadOperatorData = async () => {
    try {
        const response = await fetch('/operator.json')
        operatorData.value = await response.json()
    } catch (e) {
        console.error('Failed to load operator data:', e)
    }
}

// 验证手机号
const isValidPhone = (phone: string) => {
    return /^1[3-9]\d{9}$/.test(phone)
}

// 查询运营商
const queryOperator = () => {
    if (operatorPhone.value.length === 3) {
        operatorResult.value = operatorData.value[operatorPhone.value] || '未知运营商'
    } else {
        operatorResult.value = ''
    }
}

// 添加查询结果状态
const queryResults = ref<string[]>([])

// 加载号段数据
const phoneLocationData = ref<Record<string, Record<string, number[]>>>({})

const loadPhoneLocationData = async () => {
    try {
        const response = await fetch('/phone_location.json')
        phoneLocationData.value = await response.json()
    } catch (e) {
        console.error('Failed to load phone location data:', e)
    }
}

// 修改查询函数
const queryPhoneNumber = async () => {
    if (!currentZipCode.value || !operatorPhone.value) {
        alert('请输入手机号前三位并选择地区')
        return
    }

    isLoading.value = true
    try {
        const results: string[] = []
        const cityData = phoneLocationData.value[currentZipCode.value]

        if (cityData && cityData[operatorPhone.value]) {
            const suffixes = cityData[operatorPhone.value]
            suffixes.forEach(suffix => {
                // 确保后缀是4位数
                const paddedSuffix = suffix.toString().padStart(4, '0')
                results.push(`${operatorPhone.value}${paddedSuffix}`)
            })
        }

        queryResults.value = results

        if (results.length === 0) {
            alert('未找到匹配的号码')
        }
    } catch (e) {
        console.error('Query failed:', e)
        alert('查询失败')
    } finally {
        isLoading.value = false
    }
}

// 添加查询相关的状态
const searchPhone = ref('')
const searchResult = ref<{
    operator: string;
    location: string;
    areaCode: string;
} | null>(null)

// 查询手机号码信息
const searchPhoneNumber = async () => {
    if (!isValidPhone(searchPhone.value)) {
        alert('请输入正确的手机号码')
        return
    }

    const prefix = searchPhone.value.substring(0, 3)
    const operator = operatorData.value[prefix] || '未知运营商'

    // 查找归属地
    let location = ''
    let areaCode = ''

    for (const [code, prefixes] of Object.entries(phoneLocationData.value)) {
        if (prefixes[prefix] && prefixes[prefix].includes(parseInt(searchPhone.value.substring(3, 7)))) {
            areaCode = code
            // 从 regionData 中查找城市名称
            const cityData = regionData.value.find(item => {
                // 检查是否是地级市
                return item.zip_code === code &&
                    item.region_id.length === 6 &&
                    item.region_id.endsWith('00')
            })
            if (cityData) {
                // 获取省份名称
                const provinceCode = cityData.region_id.substring(0, 2) + '0000'
                const provinceData = regionData.value.find(item => item.region_id === provinceCode)
                const provinceName = provinceData ? provinceData.region_name : ''

                // 组合省份和城市名称
                location = provinceName ? `${provinceName} ${cityData.region_name}` : cityData.region_name
            }
            break
        }
    }

    searchResult.value = {
        operator,
        location: location || '未知',
        areaCode: areaCode || '未知'
    }
}

// 在组件挂载时加载数据
onMounted(() => {
    loadOperatorData()
    loadRegionData()
    loadPhoneLocationData()
})
</script>

<style scoped>
.phone-number {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

h1 {
    text-align: center;
    color: var(--c-text-1);
    margin-bottom: 20px;
    font-size: 1.8em;
}

.container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
}

/* 在窄屏幕上切换为单列 */
@media (max-width: 900px) {
    .container {
        grid-template-columns: 1fr;
    }
}

.card {
    background: var(--c-bg);
    padding: 20px;
    border-radius: 15px;
    box-shadow: var(--vt-shadow-2);
    border: 1px solid var(--c-divider);
    height: fit-content;
}

h3 {
    color: var(--c-text-1);
    margin-bottom: 15px;
    font-size: 1.3em;
}

.input-section {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
}

.phone-input {
    flex: 1;
    padding: 12px;
    border: 1px solid var(--c-divider);
    max-width: 150px;
    border-radius: 8px;
    font-size: 1em;
    background: var(--c-bg);
    color: var(--c-text-1);
}

.phone-input:focus {
    border-color: var(--c-blue);
    outline: none;
}

button {
    padding: 12px 25px;
    background: var(--c-blue);
    color: var(--c-white);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
}

button:hover {
    background: var(--c-blue-dark);
}

button:disabled {
    background: var(--c-gray-3);
    cursor: not-allowed;
}

.result-section {
    background: var(--c-bg-soft);
    padding: 15px;
    border-radius: 8px;
    border: 1px solid var(--c-divider);
}

.result-item {
    margin-bottom: 10px;
    display: flex;
    gap: 10px;
}

.result-item:last-child {
    margin-bottom: 0;
}

.label {
    color: var(--c-text-2);
    min-width: 70px;
}

.value {
    color: var(--c-text-1);
}

.region-section {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
}

.region-select {
    flex: 1;
    padding: 12px;
    border: 1px solid var(--c-divider);
    border-radius: 8px;
    font-size: 1em;
    background: var(--c-bg);
    color: var(--c-text-1);
    cursor: pointer;
}

.region-select:focus {
    border-color: var(--c-blue);
    outline: none;
}

.region-select:disabled {
    background: var(--c-bg-soft);
    cursor: not-allowed;
}

.zipcode-section {
    background: var(--c-bg-soft);
    padding: 12px;
    border-radius: 8px;
    border: 1px solid var(--c-divider);
    margin-bottom: 20px;
    display: flex;
    gap: 10px;
}

.zipcode-section .label {
    color: var(--c-text-2);
    min-width: 70px;
}

.zipcode-section .value {
    color: var(--c-text-1);
    font-weight: 500;
}

/* 添加一些新的样式 */
.card h3:not(:first-child) {
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid var(--c-divider);
}

.result-section {
    margin-top: 15px;
}

.operator-section {
    display: flex;
    align-items: center;
    gap: 15px;
}

.operator-section .phone-input {
    width: 120px;
}

.operator-result {
    color: var(--c-text-1);
    flex: 1;
}

.button-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
}

.query-button {
    width: auto;
    /* 覆盖原来的 width: 100% */
    min-width: 120px;
}

.result-section {
    margin-top: 20px;
    padding: 15px;
    background: var(--c-bg-soft);
    border-radius: 8px;
    border: 1px solid var(--c-divider);
}

.result-section h4 {
    color: var(--c-text-1);
    margin-bottom: 10px;
    font-size: 1.1em;
}

.result-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 10px;
    max-height: 300px;
    overflow-y: auto;
}

.result-item {
    padding: 8px;
    background: var(--c-bg);
    border: 1px solid var(--c-divider);
    border-radius: 4px;
    text-align: center;
    color: var(--c-text-1);
}
</style>